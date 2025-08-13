import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || session.user.id;
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    // Get employee data
    const employee = await prisma.employee.findFirst({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            role: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Verify leave balance calculations
    const verification = await verifyLeaveBalance(employee, year);

    return NextResponse.json({
      employee: {
        id: employee.id,
        name: employee.name,
        employeeId: employee.employeeId,
        role: employee.user.role,
        hireDate: employee.hireDate
      },
      year,
      verification,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error verifying leave balance:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

async function verifyLeaveBalance(employee: any, year: number) {
  const hireDate = new Date(employee.hireDate);
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31);
  const currentDate = new Date();

  // Calculate expected entitlements
  const expectedEntitlements = calculateExpectedEntitlements(employee, year);
  
  // Get actual leave requests
  const leaveRequests = await prisma.leaveRequest.findMany({
    where: {
      userId: employee.userId,
      startDate: {
        gte: yearStart,
        lte: yearEnd
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  // Categorize leave requests
  const approved = leaveRequests.filter(req => req.status === 'APPROVED');
  const pending = leaveRequests.filter(req => req.status === 'PENDING');
  const rejected = leaveRequests.filter(req => req.status === 'REJECTED');
  const cancelled = leaveRequests.filter(req => req.status === 'CANCELLED');

  // Calculate totals by type
  const approvedByType = groupByLeaveType(approved);
  const pendingByType = groupByLeaveType(pending);

  // Calculate accrued amounts
  const accruedAmounts = calculateAccruedAmounts(employee, year, currentDate);

  // Verify calculations
  const verificationResults = {
    entitlements: {
      expected: expectedEntitlements,
      calculated: accruedAmounts,
      match: compareObjects(expectedEntitlements, accruedAmounts, 0.1) // Allow 0.1 day tolerance
    },
    usage: {
      approved: approvedByType,
      pending: pendingByType,
      rejected: rejected.length,
      cancelled: cancelled.length,
      totalApproved: approved.reduce((sum, req) => sum + (req.totalDays || 0), 0),
      totalPending: pending.reduce((sum, req) => sum + (req.totalDays || 0), 0)
    },
    balances: {},
    issues: [],
    recommendations: []
  };

  // Calculate remaining balances
  Object.keys(expectedEntitlements).forEach(leaveType => {
    const entitled = expectedEntitlements[leaveType] || 0;
    const accrued = accruedAmounts[leaveType] || entitled;
    const used = approvedByType[leaveType] || 0;
    const pendingAmount = pendingByType[leaveType] || 0;
    const remaining = Math.max(0, accrued - used - pendingAmount);

    verificationResults.balances[leaveType] = {
      entitled,
      accrued,
      used,
      pending: pendingAmount,
      remaining,
      utilizationRate: entitled > 0 ? Math.round((used / entitled) * 100) : 0
    };

    // Check for issues
    if (used > accrued) {
      verificationResults.issues.push({
        type: 'OVERUSE',
        leaveType,
        message: `${leaveType}: Used ${used} days but only accrued ${accrued} days`,
        severity: 'HIGH'
      });
    }

    if (remaining < 0) {
      verificationResults.issues.push({
        type: 'NEGATIVE_BALANCE',
        leaveType,
        message: `${leaveType}: Negative balance of ${remaining} days`,
        severity: 'HIGH'
      });
    }

    if (entitled > 0 && used === 0 && currentDate.getMonth() > 6) {
      verificationResults.recommendations.push({
        type: 'UNUSED_LEAVE',
        leaveType,
        message: `${leaveType}: No leave used this year, consider taking time off`,
        priority: 'MEDIUM'
      });
    }
  });

  // Check for mid-year hire adjustments
  if (hireDate > yearStart) {
    const monthsWorked = Math.ceil((currentDate.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    verificationResults.recommendations.push({
      type: 'MID_YEAR_HIRE',
      message: `Employee hired mid-year (${hireDate.toLocaleDateString()}), leave pro-rated for ${monthsWorked} months`,
      priority: 'INFO'
    });
  }

  return verificationResults;
}

function calculateExpectedEntitlements(employee: any, year: number) {
  const hireDate = new Date(employee.hireDate);
  const currentDate = new Date();
  const yearsOfService = Math.floor((currentDate.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  const userRole = employee.user.role;

  let entitlements = {
    VACATION: 21,
    SICK_LEAVE: 30,
    PERSONAL: 3,
    EMERGENCY: 0,
    MATERNITY: 120,
    PATERNITY: 10,
    BEREAVEMENT: 3,
    STUDY_LEAVE: 0,
    UNPAID_LEAVE: 0
  };

  // Apply role-based adjustments
  const managerialRoles = ['DIRECTOR', 'HR_DIRECTOR', 'DEPARTMENT_MANAGER', 'HR_MANAGER', 'SUPERVISOR'];
  const isManagerial = managerialRoles.includes(userRole);

  if (isManagerial) {
    switch (userRole) {
      case 'DIRECTOR':
      case 'HR_DIRECTOR':
        entitlements.VACATION = 30;
        entitlements.PERSONAL = 5;
        entitlements.STUDY_LEAVE = 15;
        break;
      case 'DEPARTMENT_MANAGER':
      case 'HR_MANAGER':
        entitlements.VACATION = 27;
        entitlements.PERSONAL = 4;
        entitlements.STUDY_LEAVE = 10;
        break;
      case 'SUPERVISOR':
        entitlements.VACATION = 25;
        entitlements.PERSONAL = 3;
        entitlements.STUDY_LEAVE = 5;
        break;
    }
  } else {
    // Non-managerial progression
    if (yearsOfService >= 1) entitlements.VACATION = 21;
    if (yearsOfService >= 5) entitlements.VACATION = 25;
    if (yearsOfService >= 10) entitlements.VACATION = 30;
    if (yearsOfService >= 15) entitlements.VACATION = 32;
    if (yearsOfService >= 20) entitlements.VACATION = 35;
  }

  // Special adjustments
  if (userRole === 'SUPER_ADMIN') {
    entitlements.VACATION = 35;
    entitlements.PERSONAL = 7;
    entitlements.STUDY_LEAVE = 20;
  }
  if (userRole === 'SENIOR_EMPLOYEE') {
    entitlements.VACATION += 2;
    entitlements.STUDY_LEAVE = 3;
  }
  if (userRole === 'INTERN') {
    entitlements.VACATION = Math.max(15, entitlements.VACATION - 6);
    entitlements.SICK_LEAVE = 10;
  }

  return entitlements;
}

function calculateAccruedAmounts(employee: any, year: number, currentDate: Date) {
  const hireDate = new Date(employee.hireDate);
  const yearStart = new Date(year, 0, 1);
  const startOfAccrual = hireDate > yearStart ? hireDate : yearStart;
  
  const monthsWorked = Math.max(0, 
    ((currentDate.getTime() - startOfAccrual.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
  );

  const entitlements = calculateExpectedEntitlements(employee, year);
  const accrued = {};

  Object.keys(entitlements).forEach(leaveType => {
    if (['VACATION', 'SICK_LEAVE', 'PERSONAL', 'STUDY_LEAVE'].includes(leaveType)) {
      // These accrue monthly
      const monthlyRate = entitlements[leaveType] / 12;
      accrued[leaveType] = Math.round(monthlyRate * Math.min(12, monthsWorked) * 10) / 10;
    } else {
      // These are available immediately
      accrued[leaveType] = entitlements[leaveType];
    }
  });

  return accrued;
}

function groupByLeaveType(requests: any[]) {
  return requests.reduce((acc, req) => {
    const type = req.leaveType || 'OTHER';
    acc[type] = (acc[type] || 0) + (req.totalDays || 0);
    return acc;
  }, {});
}

function compareObjects(obj1: any, obj2: any, tolerance: number = 0) {
  const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
  
  for (const key of keys) {
    const val1 = obj1[key] || 0;
    const val2 = obj2[key] || 0;
    
    if (Math.abs(val1 - val2) > tolerance) {
      return false;
    }
  }
  
  return true;
}
