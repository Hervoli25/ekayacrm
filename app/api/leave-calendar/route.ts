import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/enterprise-permissions';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const month = searchParams.get('month') || new Date().getMonth().toString();
    const year = searchParams.get('year') || new Date().getFullYear().toString();
    const department = searchParams.get('department');

    // Create date range for the requested month
    const startDate = new Date(parseInt(year), parseInt(month), 1);
    const endDate = new Date(parseInt(year), parseInt(month) + 1, 0);

    // Get user's department for filtering
    const userEmployee = await prisma.employee.findFirst({
      where: { userId: session.user.id }
    });

    let whereClause: any = {
      startDate: {
        lte: endDate
      },
      endDate: {
        gte: startDate
      },
      status: {
        in: ['APPROVED', 'PENDING']
      }
    };

    // Apply role-based filtering
    if (hasPermission(session.user.role, 'LEAVE_VIEW_ALL')) {
      // SUPER_ADMIN, DIRECTOR, HR_MANAGER can see all
      if (department && department !== 'all') {
        whereClause.user = {
          employee: {
            department: department
          }
        };
      }
    } else if (hasPermission(session.user.role, 'LEAVE_VIEW_TEAM')) {
      // DEPARTMENT_MANAGER, SUPERVISOR see their department/team
      whereClause.user = {
        employee: {
          department: userEmployee?.department
        }
      };
    } else {
      // Regular employees see only own requests
      whereClause.userId = session.user.id;
    }

    // Fetch leave requests for the calendar
    const leaveRequests = await prisma.leaveRequest.findMany({
      where: whereClause,
      include: {
        user: {
          include: {
            employee: {
              select: {
                name: true,
                employeeId: true,
                department: true,
                title: true
              }
            }
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    });

    // Transform data for calendar display
    const calendarEvents = leaveRequests.map(request => {
      const startDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      return {
        id: request.id,
        title: `${request.user.employee?.name || 'Unknown'} - ${request.leaveType.replace('_', ' ')}`,
        start: startDate.toISOString().split('T')[0],
        end: new Date(endDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Add 1 day for full-day display
        employee: {
          name: request.user.employee?.name || 'Unknown',
          employeeId: request.user.employee?.employeeId || '',
          department: request.user.employee?.department || '',
          title: request.user.employee?.title || ''
        },
        leaveType: request.leaveType,
        status: request.status,
        isHalfDay: request.isHalfDay,
        totalDays: request.totalDays,
        backgroundColor: getLeaveTypeColor(request.leaveType, request.status),
        borderColor: getLeaveTypeColor(request.leaveType, request.status),
        textColor: '#ffffff',
        allDay: true
      };
    });

    // Get team statistics
    const teamStats = await getTeamStats(userEmployee?.department || '', startDate, endDate);

    return NextResponse.json({
      events: calendarEvents,
      stats: teamStats,
      month: parseInt(month),
      year: parseInt(year)
    });

  } catch (error) {
    console.error('Error fetching leave calendar data:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar data' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

function getLeaveTypeColor(leaveType: string, status: string) {
  if (status === 'PENDING') {
    return '#f59e0b'; // amber
  }

  const colors = {
    'ANNUAL': '#3b82f6',      // blue
    'SICK': '#ef4444',        // red  
    'MATERNITY': '#ec4899',   // pink
    'PATERNITY': '#8b5cf6',   // purple
    'COMPASSIONATE': '#6b7280', // gray
    'STUDY': '#6366f1',       // indigo
    'UNPAID': '#f97316',      // orange
    'OTHER': '#14b8a6'        // teal
  };

  return colors[leaveType as keyof typeof colors] || '#6b7280';
}

async function getTeamStats(department: string, startDate: Date, endDate: Date) {
  if (!department) return null;

  // Get total team members
  const totalTeamMembers = await prisma.employee.count({
    where: {
      department,
      status: 'ACTIVE'
    }
  });

  // Get approved leave requests for the period
  const approvedLeave = await prisma.leaveRequest.findMany({
    where: {
      status: 'APPROVED',
      startDate: { lte: endDate },
      endDate: { gte: startDate },
      user: {
        employee: {
          department
        }
      }
    },
    include: {
      user: {
        include: {
          employee: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  // Calculate unique employees on leave
  const employeesOnLeave = new Set();
  approvedLeave.forEach(request => {
    const start = new Date(Math.max(request.startDate.getTime(), startDate.getTime()));
    const end = new Date(Math.min(request.endDate.getTime(), endDate.getTime()));
    
    if (start <= end) {
      employeesOnLeave.add(request.userId);
    }
  });

  return {
    totalTeamMembers,
    employeesOnLeave: employeesOnLeave.size,
    availableMembers: totalTeamMembers - employeesOnLeave.size,
    utilizationRate: totalTeamMembers > 0 ? Math.round((employeesOnLeave.size / totalTeamMembers) * 100) : 0
  };
}