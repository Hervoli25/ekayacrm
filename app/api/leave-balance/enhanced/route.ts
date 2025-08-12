import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || session.user.id;

    // Get employee details
    const employee = await prisma.employee.findFirst({
      where: { userId },
      include: { user: true }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const currentYear = new Date().getFullYear();
    const hireDate = new Date(employee.hireDate);

    // Calculate leave entitlements based on comprehensive rules
    const entitlements = await calculateLeaveEntitlements(employee, currentYear);
    
    // Get used leave by type for current year
    const usedLeave = await getUsedLeaveByType(userId, currentYear);
    
    // Get pending leave by type
    const pendingLeave = await getPendingLeaveByType(userId, currentYear);
    
    // Calculate carry-over from previous year
    const carryOver = await calculateCarryOverLeave(userId, currentYear - 1);
    
    // Calculate accruals (monthly/quarterly accrual for certain leave types)
    const accruals = await calculateAccruedLeave(employee, currentYear);

    // Calculate remaining balances
    const balances = calculateRemainingBalances(entitlements, usedLeave, pendingLeave, carryOver, accruals);
    
    // Get leave history and trends
    const history = await getLeaveHistory(userId, 3); // Last 3 years
    
    return NextResponse.json({
      employee: {
        id: employee.id,
        name: employee.name,
        employeeId: employee.employeeId,
        department: employee.department,
        hireDate: employee.hireDate,
        yearsOfService: Math.floor((Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
      },
      entitlements,
      used: usedLeave,
      pending: pendingLeave,
      carryOver,
      accruals,
      balances,
      history,
      currentYear,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching enhanced leave balance:', error);
    return NextResponse.json({ error: 'Failed to fetch leave balance' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

async function calculateLeaveEntitlements(employee: any, year: number) {
  const hireDate = new Date(employee.hireDate);
  const currentDate = new Date();
  const yearsOfService = Math.floor((currentDate.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  
  // Base entitlements by leave type
  let entitlements = {
    VACATION: 21, // Standard annual leave
    SICK_LEAVE: 30, // As per South African Basic Conditions of Employment Act
    PERSONAL: 3, // Personal/family responsibility days
    EMERGENCY: 0, // No fixed allocation
    MATERNITY: 120, // 4 months (South African law)
    PATERNITY: 10, // South African paternity leave
    BEREAVEMENT: 3, // Compassionate leave
    STUDY_LEAVE: 0, // Negotiated based on company policy
    UNPAID_LEAVE: 0 // No limit but unpaid
  };

  // Adjust vacation days based on years of service
  if (yearsOfService >= 1) entitlements.VACATION = 21;
  if (yearsOfService >= 5) entitlements.VACATION = 25;
  if (yearsOfService >= 10) entitlements.VACATION = 30;
  if (yearsOfService >= 15) entitlements.VACATION = 32;
  if (yearsOfService >= 20) entitlements.VACATION = 35;

  // Role-based adjustments
  const roleAdjustments = {
    'SUPER_ADMIN': { VACATION: 15, PERSONAL: 5 },
    'DIRECTOR': { VACATION: 10, PERSONAL: 3, STUDY_LEAVE: 15 },
    'HR_MANAGER': { VACATION: 5, PERSONAL: 2, STUDY_LEAVE: 10 },
    'DEPARTMENT_MANAGER': { VACATION: 3, PERSONAL: 1, STUDY_LEAVE: 5 },
    'SUPERVISOR': { VACATION: 2, STUDY_LEAVE: 3 },
    'SENIOR_EMPLOYEE': { VACATION: 1, STUDY_LEAVE: 2 },
    'EMPLOYEE': {},
    'INTERN': { VACATION: -6, SICK_LEAVE: 10 } // Interns get reduced entitlements
  };

  const adjustments = roleAdjustments[employee.user.role] || {};
  Object.keys(adjustments).forEach(leaveType => {
    entitlements[leaveType] += adjustments[leaveType];
  });

  // Ensure no negative values
  Object.keys(entitlements).forEach(key => {
    if (entitlements[key] < 0) entitlements[key] = 0;
  });

  return entitlements;
}

async function getUsedLeaveByType(userId: string, year: number) {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59);

  const usedLeave = await prisma.leaveRequest.groupBy({
    by: ['leaveType'],
    where: {
      userId,
      status: 'APPROVED',
      startDate: { gte: yearStart, lte: yearEnd }
    },
    _sum: { totalDays: true }
  });

  const result = {};
  usedLeave.forEach(item => {
    result[item.leaveType] = item._sum.totalDays || 0;
  });

  return result;
}

async function getPendingLeaveByType(userId: string, year: number) {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59);

  const pendingLeave = await prisma.leaveRequest.groupBy({
    by: ['leaveType'],
    where: {
      userId,
      status: 'PENDING',
      startDate: { gte: yearStart, lte: yearEnd }
    },
    _sum: { totalDays: true }
  });

  const result = {};
  pendingLeave.forEach(item => {
    result[item.leaveType] = item._sum.totalDays || 0;
  });

  return result;
}

async function calculateCarryOverLeave(userId: string, previousYear: number) {
  // Get unused vacation leave from previous year
  const yearStart = new Date(previousYear, 0, 1);
  const yearEnd = new Date(previousYear, 11, 31, 23, 59, 59);

  const employee = await prisma.employee.findFirst({
    where: { userId },
    include: { user: true }
  });

  if (!employee) return { VACATION: 0 };

  const entitlements = await calculateLeaveEntitlements(employee, previousYear);
  const used = await getUsedLeaveByType(userId, previousYear);

  const unusedVacation = (entitlements.VACATION || 0) - (used.VACATION || 0);
  
  // Maximum carry-over is typically 5 days or 1/3 of annual entitlement
  const maxCarryOver = Math.min(5, Math.floor(entitlements.VACATION / 3));
  
  return {
    VACATION: Math.max(0, Math.min(unusedVacation, maxCarryOver))
  };
}

async function calculateAccruedLeave(employee: any, year: number) {
  const hireDate = new Date(employee.hireDate);
  const currentDate = new Date();
  const yearStart = new Date(year, 0, 1);
  
  // If employee started this year, calculate pro-rated entitlement
  const startOfAccrual = hireDate > yearStart ? hireDate : yearStart;
  const monthsWorked = Math.max(1, 
    ((currentDate.getTime() - startOfAccrual.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
  );

  const entitlements = await calculateLeaveEntitlements(employee, year);
  
  // Calculate monthly accrual rates
  const accrualRates = {
    VACATION: entitlements.VACATION / 12,
    SICK_LEAVE: entitlements.SICK_LEAVE / 12,
    PERSONAL: entitlements.PERSONAL / 12
  };

  const accrued = {};
  Object.keys(accrualRates).forEach(leaveType => {
    accrued[leaveType] = Math.floor(accrualRates[leaveType] * monthsWorked);
  });

  return accrued;
}

function calculateRemainingBalances(entitlements: any, used: any, pending: any, carryOver: any, accruals: any) {
  const balances = {};
  
  Object.keys(entitlements).forEach(leaveType => {
    const entitled = entitlements[leaveType] || 0;
    const usedDays = used[leaveType] || 0;
    const pendingDays = pending[leaveType] || 0;
    const carriedOver = carryOver[leaveType] || 0;
    const accrued = accruals[leaveType] || entitled; // Use accrued if available, otherwise full entitlement

    const totalAvailable = Math.max(accrued, entitled) + carriedOver;
    const remaining = totalAvailable - usedDays - pendingDays;

    balances[leaveType] = {
      entitled,
      accrued: accrued,
      carriedOver,
      used: usedDays,
      pending: pendingDays,
      available: totalAvailable,
      remaining: Math.max(0, remaining)
    };
  });

  return balances;
}

async function getLeaveHistory(userId: string, years: number) {
  const history = [];
  
  for (let i = 0; i < years; i++) {
    const year = new Date().getFullYear() - i;
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59);

    const yearData = await prisma.leaveRequest.groupBy({
      by: ['leaveType'],
      where: {
        userId,
        status: 'APPROVED',
        startDate: { gte: yearStart, lte: yearEnd }
      },
      _sum: { totalDays: true }
    });

    const yearSummary = { year, total: 0, byType: {} };
    yearData.forEach(item => {
      const days = item._sum.totalDays || 0;
      yearSummary.byType[item.leaveType] = days;
      yearSummary.total += days;
    });

    history.push(yearSummary);
  }

  return history;
}