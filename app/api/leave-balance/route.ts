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

    // Use enhanced leave calculation for consistency
    const hireDate = new Date(employee.hireDate);
    const now = new Date();
    const yearsOfService = Math.floor((now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    const userRole = employee.user.role;

    // Calculate annual leave based on role and tenure (South African compliant)
    let annualLeave = 21; // BCEA minimum

    // Managerial positions get enhanced leave
    const managerialRoles = ['DIRECTOR', 'HR_DIRECTOR', 'DEPARTMENT_MANAGER', 'HR_MANAGER', 'SUPERVISOR'];
    const isManagerial = managerialRoles.includes(userRole);

    if (isManagerial) {
      switch (userRole) {
        case 'DIRECTOR':
        case 'HR_DIRECTOR':
          annualLeave = 30; // Senior management
          break;
        case 'DEPARTMENT_MANAGER':
        case 'HR_MANAGER':
          annualLeave = 27; // Middle management
          break;
        case 'SUPERVISOR':
          annualLeave = 25; // First-line management
          break;
      }
    } else {
      // Non-managerial progression
      if (yearsOfService >= 1) annualLeave = 21;
      if (yearsOfService >= 5) annualLeave = 25;
      if (yearsOfService >= 10) annualLeave = 30;
      if (yearsOfService >= 15) annualLeave = 32;
      if (yearsOfService >= 20) annualLeave = 35;
    }

    // Special role adjustments
    if (userRole === 'SUPER_ADMIN') annualLeave = 35;
    if (userRole === 'SENIOR_EMPLOYEE') annualLeave += 2;
    if (userRole === 'INTERN') annualLeave = Math.max(15, annualLeave - 6);

    // Calculate used leave for current year
    const currentYear = now.getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const yearEnd = new Date(currentYear, 11, 31);

    const usedLeave = await prisma.leaveRequest.aggregate({
      where: {
        userId,
        status: 'APPROVED',
        startDate: {
          gte: yearStart,
          lte: yearEnd
        }
      },
      _sum: {
        totalDays: true
      }
    });

    const totalUsed = usedLeave._sum.totalDays || 0;

    // Pending leave
    const pendingLeave = await prisma.leaveRequest.aggregate({
      where: {
        userId,
        status: 'PENDING',
        startDate: {
          gte: yearStart,
          lte: yearEnd
        }
      },
      _sum: {
        totalDays: true
      }
    });

    const totalPending = pendingLeave._sum.totalDays || 0;

    // Calculate remaining balance
    const remainingBalance = annualLeave - totalUsed - totalPending;

    // Get leave history by type
    const leaveHistory = await prisma.leaveRequest.groupBy({
      by: ['leaveType'],
      where: {
        userId,
        status: 'APPROVED',
        startDate: {
          gte: yearStart,
          lte: yearEnd
        }
      },
      _sum: {
        totalDays: true
      }
    });

    const leaveByType = leaveHistory.reduce((acc, item) => {
      acc[item.leaveType] = item._sum.totalDays || 0;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      employee: {
        id: employee.id,
        name: employee.name,
        employeeId: employee.employeeId,
        department: employee.department,
        hireDate: employee.hireDate,
        yearsOfService
      },
      balance: {
        annualAllocation: annualLeave,
        used: totalUsed,
        pending: totalPending,
        remaining: remainingBalance,
        carryOver: 0, // TODO: Implement carry-over logic
      },
      breakdown: {
        annual: leaveByType['ANNUAL'] || 0,
        sick: leaveByType['SICK'] || 0,
        maternity: leaveByType['MATERNITY'] || 0,
        paternity: leaveByType['PATERNITY'] || 0,
        compassionate: leaveByType['COMPASSIONATE'] || 0,
        study: leaveByType['STUDY'] || 0,
        unpaid: leaveByType['UNPAID'] || 0,
        other: leaveByType['OTHER'] || 0
      },
      currentYear
    });

  } catch (error) {
    console.error('Error fetching leave balance:', error);
    return NextResponse.json({ error: 'Failed to fetch leave balance' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}