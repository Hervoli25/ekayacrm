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

    // Calculate leave balance based on role and tenure
    const hireDate = new Date(employee.hireDate);
    const now = new Date();
    const yearsOfService = Math.floor((now.getTime() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365));

    // Base annual leave allocation
    let annualLeave = 21; // Standard 21 days
    if (yearsOfService >= 5) annualLeave = 25; // Senior employees get more
    if (yearsOfService >= 10) annualLeave = 30; // Long service bonus
    
    // Role-based bonuses
    const roleBonuses = {
      'DIRECTOR': 10,
      'HR_MANAGER': 5,
      'DEPARTMENT_MANAGER': 3,
      'SUPERVISOR': 1,
      'SENIOR_EMPLOYEE': 1,
      'EMPLOYEE': 0,
      'INTERN': -6 // Interns get less
    };

    annualLeave += roleBonuses[employee.user.role] || 0;

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