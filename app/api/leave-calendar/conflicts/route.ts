import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/enterprise-permissions';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { startDate, endDate, employeeId, excludeRequestId } = body;

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Start date and end date are required' }, { status: 400 });
    }

    const requestStartDate = new Date(startDate);
    const requestEndDate = new Date(endDate);

    // Get user's department for team conflict checking
    const userEmployee = await prisma.employee.findFirst({
      where: { userId: session.user.id }
    });

    // Check for various types of conflicts
    const conflicts = await checkLeaveConflicts({
      startDate: requestStartDate,
      endDate: requestEndDate,
      employeeId: employeeId || session.user.id,
      userDepartment: userEmployee?.department,
      userRole: session.user.role,
      excludeRequestId
    });

    return NextResponse.json({
      success: true,
      hasConflicts: conflicts.length > 0,
      conflicts,
      recommendations: generateRecommendations(conflicts, requestStartDate, requestEndDate)
    });

  } catch (error) {
    console.error('Error checking leave conflicts:', error);
    return NextResponse.json({ error: 'Failed to check conflicts' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

async function checkLeaveConflicts({
  startDate,
  endDate,
  employeeId,
  userDepartment,
  userRole,
  excludeRequestId
}: {
  startDate: Date;
  endDate: Date;
  employeeId: string;
  userDepartment?: string;
  userRole: string;
  excludeRequestId?: string;
}) {
  const conflicts = [];

  // 1. Check for overlapping personal leave
  const overlappingLeave = await prisma.leaveRequest.findMany({
    where: {
      userId: employeeId,
      status: { in: ['APPROVED', 'PENDING'] },
      ...(excludeRequestId && { id: { not: excludeRequestId } }),
      OR: [
        // Request starts during existing leave
        {
          startDate: { lte: startDate },
          endDate: { gte: startDate }
        },
        // Request ends during existing leave
        {
          startDate: { lte: endDate },
          endDate: { gte: endDate }
        },
        // Request encompasses existing leave
        {
          startDate: { gte: startDate },
          endDate: { lte: endDate }
        }
      ]
    },
    include: {
      user: {
        include: {
          employee: {
            select: { name: true, employeeId: true }
          }
        }
      }
    }
  });

  if (overlappingLeave.length > 0) {
    conflicts.push({
      type: 'OVERLAPPING_LEAVE',
      severity: 'HIGH',
      message: 'You already have approved or pending leave during this period',
      details: overlappingLeave.map(leave => ({
        id: leave.id,
        startDate: leave.startDate,
        endDate: leave.endDate,
        leaveType: leave.leaveType,
        status: leave.status
      }))
    });
  }

  // 2. Check for insufficient leave balance
  const leaveBalance = await checkLeaveBalance(employeeId, startDate, endDate);
  if (!leaveBalance.sufficient) {
    conflicts.push({
      type: 'INSUFFICIENT_BALANCE',
      severity: 'HIGH',
      message: `Insufficient ${leaveBalance.leaveType} balance. You have ${leaveBalance.available} days available, but requested ${leaveBalance.requested} days`,
      details: leaveBalance
    });
  }

  // 3. Check for team coverage conflicts (department level)
  if (userDepartment) {
    const teamConflicts = await checkTeamCoverage({
      department: userDepartment,
      startDate,
      endDate,
      excludeUserId: employeeId
    });
    
    if (teamConflicts.length > 0) {
      conflicts.push({
        type: 'TEAM_COVERAGE',
        severity: 'MEDIUM',
        message: `${teamConflicts.length} team member(s) will also be on leave during this period`,
        details: teamConflicts
      });
    }
  }

  // 4. Check for blackout periods
  const blackoutConflicts = await checkBlackoutPeriods(startDate, endDate, userDepartment);
  if (blackoutConflicts.length > 0) {
    conflicts.push({
      type: 'BLACKOUT_PERIOD',
      severity: 'HIGH',
      message: 'Leave request falls during a blackout period',
      details: blackoutConflicts
    });
  }

  // 5. Check for minimum notice requirements
  const noticeConflict = checkNoticeRequirement(startDate, userRole);
  if (noticeConflict) {
    conflicts.push({
      type: 'INSUFFICIENT_NOTICE',
      severity: 'MEDIUM',
      message: noticeConflict.message,
      details: noticeConflict
    });
  }

  // 6. Check for maximum consecutive leave limits
  const consecutiveConflict = await checkConsecutiveLeaveLimit(employeeId, startDate, endDate, excludeRequestId);
  if (consecutiveConflict) {
    conflicts.push({
      type: 'CONSECUTIVE_LEAVE_LIMIT',
      severity: 'MEDIUM',
      message: consecutiveConflict.message,
      details: consecutiveConflict
    });
  }

  // 7. Check for public holidays and weekends optimization
  const holidayOptimization = await checkHolidayOptimization(startDate, endDate);
  if (holidayOptimization.suggestions.length > 0) {
    conflicts.push({
      type: 'HOLIDAY_OPTIMIZATION',
      severity: 'LOW',
      message: 'Consider adjusting dates to optimize around public holidays',
      details: holidayOptimization
    });
  }

  return conflicts;
}

async function checkLeaveBalance(employeeId: string, startDate: Date, endDate: Date) {
  // Calculate requested days
  const requestedDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  
  // Get current year balance (simplified - in practice, use the enhanced leave balance API)
  const currentYear = new Date().getFullYear();
  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear, 11, 31);

  const usedLeave = await prisma.leaveRequest.aggregate({
    where: {
      userId: employeeId,
      status: 'APPROVED',
      startDate: { gte: yearStart, lte: yearEnd }
    },
    _sum: { totalDays: true }
  });

  const pendingLeave = await prisma.leaveRequest.aggregate({
    where: {
      userId: employeeId,
      status: 'PENDING',
      startDate: { gte: yearStart, lte: yearEnd }
    },
    _sum: { totalDays: true }
  });

  // Simplified entitlement calculation (use enhanced API for full calculation)
  const annualEntitlement = 21; // Base entitlement
  const used = usedLeave._sum.totalDays || 0;
  const pending = pendingLeave._sum.totalDays || 0;
  const available = Math.max(0, annualEntitlement - used - pending);

  return {
    sufficient: available >= requestedDays,
    leaveType: 'VACATION', // Simplified
    available,
    requested: requestedDays,
    used,
    pending,
    entitlement: annualEntitlement
  };
}

async function checkTeamCoverage({
  department,
  startDate,
  endDate,
  excludeUserId
}: {
  department: string;
  startDate: Date;
  endDate: Date;
  excludeUserId: string;
}) {
  const teamLeave = await prisma.leaveRequest.findMany({
    where: {
      status: 'APPROVED',
      userId: { not: excludeUserId },
      user: {
        employee: { department }
      },
      OR: [
        {
          startDate: { lte: startDate },
          endDate: { gte: startDate }
        },
        {
          startDate: { lte: endDate },
          endDate: { gte: endDate }
        },
        {
          startDate: { gte: startDate },
          endDate: { lte: endDate }
        }
      ]
    },
    include: {
      user: {
        include: {
          employee: {
            select: {
              name: true,
              employeeId: true,
              title: true
            }
          }
        }
      }
    }
  });

  return teamLeave.map(leave => ({
    employeeName: leave.user.employee?.name,
    employeeId: leave.user.employee?.employeeId,
    title: leave.user.employee?.title,
    startDate: leave.startDate,
    endDate: leave.endDate,
    leaveType: leave.leaveType,
    overlapDays: calculateOverlapDays(
      { start: startDate, end: endDate },
      { start: leave.startDate, end: leave.endDate }
    )
  }));
}

async function checkBlackoutPeriods(startDate: Date, endDate: Date, department?: string) {
  // Simplified blackout period check - in practice, you'd have a blackout_periods table
  const blackoutPeriods = [
    {
      name: 'Year-end Financial Close',
      startDate: new Date(startDate.getFullYear(), 11, 20), // Dec 20
      endDate: new Date(startDate.getFullYear() + 1, 0, 10), // Jan 10
      departments: ['Finance', 'Accounting'],
      severity: 'HIGH'
    },
    {
      name: 'Peak Season',
      startDate: new Date(startDate.getFullYear(), 10, 15), // Nov 15
      endDate: new Date(startDate.getFullYear(), 11, 31), // Dec 31
      departments: ['Trading', 'Operations'],
      severity: 'MEDIUM'
    }
  ];

  const conflicts = [];
  
  for (const period of blackoutPeriods) {
    const hasOverlap = !(endDate < period.startDate || startDate > period.endDate);
    const appliesToDepartment = !department || period.departments.includes(department);
    
    if (hasOverlap && appliesToDepartment) {
      conflicts.push({
        name: period.name,
        startDate: period.startDate,
        endDate: period.endDate,
        severity: period.severity,
        overlapDays: calculateOverlapDays(
          { start: startDate, end: endDate },
          { start: period.startDate, end: period.endDate }
        )
      });
    }
  }

  return conflicts;
}

function checkNoticeRequirement(startDate: Date, userRole: string) {
  const now = new Date();
  const daysNotice = Math.ceil((startDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Notice requirements by role
  const noticeRequirements = {
    'SUPER_ADMIN': 1,
    'DIRECTOR': 3,
    'HR_MANAGER': 5,
    'DEPARTMENT_MANAGER': 7,
    'SUPERVISOR': 10,
    'SENIOR_EMPLOYEE': 14,
    'EMPLOYEE': 21,
    'INTERN': 14
  };

  const requiredNotice = noticeRequirements[userRole] || 14;
  
  if (daysNotice < requiredNotice) {
    return {
      message: `Minimum ${requiredNotice} days notice required for your role. You have provided ${daysNotice} days notice.`,
      required: requiredNotice,
      provided: daysNotice,
      severity: daysNotice < requiredNotice / 2 ? 'HIGH' : 'MEDIUM'
    };
  }

  return null;
}

async function checkConsecutiveLeaveLimit(employeeId: string, startDate: Date, endDate: Date, excludeRequestId?: string) {
  const requestedDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const maxConsecutiveDays = 21; // 3 weeks maximum

  if (requestedDays > maxConsecutiveDays) {
    return {
      message: `Leave request exceeds maximum consecutive leave limit of ${maxConsecutiveDays} days`,
      requested: requestedDays,
      maximum: maxConsecutiveDays,
      excess: requestedDays - maxConsecutiveDays
    };
  }

  return null;
}

async function checkHolidayOptimization(startDate: Date, endDate: Date) {
  // Simplified public holidays for South Africa 2024
  const publicHolidays = [
    { name: "New Year's Day", date: new Date(2024, 0, 1) },
    { name: "Human Rights Day", date: new Date(2024, 2, 21) },
    { name: "Good Friday", date: new Date(2024, 2, 29) },
    { name: "Family Day", date: new Date(2024, 3, 1) },
    { name: "Freedom Day", date: new Date(2024, 3, 27) },
    { name: "Workers' Day", date: new Date(2024, 4, 1) },
    { name: "Youth Day", date: new Date(2024, 5, 16) },
    { name: "Women's Day", date: new Date(2024, 7, 9) },
    { name: "Heritage Day", date: new Date(2024, 8, 24) },
    { name: "Day of Reconciliation", date: new Date(2024, 11, 16) },
    { name: "Christmas Day", date: new Date(2024, 11, 25) },
    { name: "Day of Goodwill", date: new Date(2024, 11, 26) }
  ];

  const suggestions = [];
  
  // Check for holidays just before or after the requested period
  const beforeStart = new Date(startDate.getTime() - 3 * 24 * 60 * 60 * 1000); // 3 days before
  const afterEnd = new Date(endDate.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days after

  publicHolidays.forEach(holiday => {
    if (holiday.date >= beforeStart && holiday.date < startDate) {
      suggestions.push({
        type: 'EXTEND_START',
        message: `Consider starting leave on ${holiday.date.toDateString()} (${holiday.name}) to maximize your time off`,
        holiday: holiday.name,
        originalStart: startDate,
        suggestedStart: holiday.date,
        daysSaved: Math.ceil((startDate.getTime() - holiday.date.getTime()) / (1000 * 60 * 60 * 24))
      });
    }
    
    if (holiday.date > endDate && holiday.date <= afterEnd) {
      suggestions.push({
        type: 'EXTEND_END',
        message: `Consider extending leave until ${holiday.date.toDateString()} (${holiday.name}) to maximize your time off`,
        holiday: holiday.name,
        originalEnd: endDate,
        suggestedEnd: holiday.date,
        daysSaved: Math.ceil((holiday.date.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))
      });
    }
  });

  return { suggestions };
}

function calculateOverlapDays(period1: { start: Date; end: Date }, period2: { start: Date; end: Date }) {
  const overlapStart = new Date(Math.max(period1.start.getTime(), period2.start.getTime()));
  const overlapEnd = new Date(Math.min(period1.end.getTime(), period2.end.getTime()));
  
  if (overlapStart > overlapEnd) return 0;
  
  return Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

function generateRecommendations(conflicts: any[], startDate: Date, endDate: Date) {
  const recommendations = [];

  conflicts.forEach(conflict => {
    switch (conflict.type) {
      case 'TEAM_COVERAGE':
        recommendations.push({
          type: 'RESCHEDULE',
          priority: 'MEDIUM',
          message: 'Consider rescheduling to avoid team coverage issues',
          action: 'Review team calendar and select alternative dates'
        });
        break;
        
      case 'INSUFFICIENT_BALANCE':
        recommendations.push({
          type: 'REDUCE_DURATION',
          priority: 'HIGH',
          message: 'Reduce leave duration or change leave type',
          action: `Reduce request by ${conflict.details.requested - conflict.details.available} days`
        });
        break;
        
      case 'BLACKOUT_PERIOD':
        recommendations.push({
          type: 'AVOID_BLACKOUT',
          priority: 'HIGH',
          message: 'Schedule leave outside blackout period',
          action: 'Select dates before or after the restricted period'
        });
        break;
        
      case 'INSUFFICIENT_NOTICE':
        recommendations.push({
          type: 'EMERGENCY_APPROVAL',
          priority: 'MEDIUM',
          message: 'Request emergency approval due to short notice',
          action: 'Contact your manager for special consideration'
        });
        break;
    }
  });

  return recommendations;
}