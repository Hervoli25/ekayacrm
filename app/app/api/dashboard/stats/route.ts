

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || 'thisMonth';

    // Calculate date range
    const now = new Date();
    let startDate: Date, endDate: Date;

    switch (range) {
      case 'lastMonth':
        startDate = startOfMonth(subMonths(now, 1));
        endDate = endOfMonth(subMonths(now, 1));
        break;
      case 'last3Months':
        startDate = startOfMonth(subMonths(now, 3));
        endDate = endOfMonth(now);
        break;
      case 'thisYear':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      default: // thisMonth
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
    }

    // Basic employee counts
    const totalEmployees = await prisma.employee.count();
    const activeEmployees = await prisma.employee.count({
      where: { status: 'ACTIVE' }
    });

    const newHiresThisMonth = await prisma.employee.count({
      where: {
        hireDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const terminatedThisMonth = await prisma.employee.count({
      where: {
        status: 'TERMINATED',
        terminationDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Leave request stats
    const pendingLeaveRequests = await prisma.leaveRequest.count({
      where: { status: 'PENDING' }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count employees currently on leave (approved leaves that are active today)
    const employeesOnLeaveToday = await prisma.leaveRequest.count({
      where: {
        status: 'APPROVED',
        startDate: {
          lte: today,
        },
        endDate: {
          gte: today,
        },
      },
    });

    // Employee breakdown by department
    const employeesByDepartment = await prisma.employee.groupBy({
      by: ['department'],
      _count: {
        department: true,
      },
      orderBy: {
        _count: {
          department: 'desc',
        },
      },
    });

    // Employee breakdown by status
    const employeesByStatus = await prisma.employee.groupBy({
      by: ['status'],
      _count: {
        status: true,
      },
      orderBy: {
        _count: {
          status: 'desc',
        },
      },
    });

    // Leave requests by type (for the selected time range)
    const leaveRequestsByType = await prisma.leaveRequest.groupBy({
      by: ['leaveType'],
      _count: {
        leaveType: true,
      },
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        _count: {
          leaveType: 'desc',
        },
      },
    });

    // Recent activity
    const recentLeaveRequests = await prisma.leaveRequest.findMany({
      where: {
        createdAt: {
          gte: subMonths(now, 1),
        },
      },
      include: {
        user: {
          include: {
            employee: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    const recentEmployees = await prisma.employee.findMany({
      where: {
        hireDate: {
          gte: subMonths(now, 1),
        },
      },
      orderBy: {
        hireDate: 'desc',
      },
      take: 5,
    });

    // Format recent activity
    const recentActivity = [
      ...recentLeaveRequests.map(req => ({
        id: `leave-${req.id}`,
        type: req.status === 'PENDING' ? 'leave_request' : 
              req.status === 'APPROVED' ? 'leave_approved' : 
              req.status === 'REJECTED' ? 'leave_rejected' : 'leave_updated',
        description: `${req.user.employee?.name || req.user.name} ${
          req.status === 'PENDING' ? 'requested leave' : 
          req.status === 'APPROVED' ? 'leave approved' : 
          req.status === 'REJECTED' ? 'leave rejected' : 'leave updated'
        } (${req.leaveType.replace('_', ' ')})`,
        date: req.createdAt.toISOString(),
        employeeName: req.user.employee?.name || req.user.name,
      })),
      ...recentEmployees.map(emp => ({
        id: `employee-${emp.id}`,
        type: 'new_employee',
        description: `${emp.name} joined as ${emp.title}`,
        date: emp.hireDate.toISOString(),
        employeeName: emp.name,
      })),
    ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 15);

    const stats = {
      totalEmployees,
      activeEmployees,
      newHiresThisMonth,
      terminatedThisMonth,
      pendingLeaveRequests,
      employeesOnLeave: employeesOnLeaveToday,
      employeesByDepartment: employeesByDepartment.map(dept => ({
        department: dept.department,
        count: dept._count.department,
      })),
      employeesByStatus: employeesByStatus.map(status => ({
        status: status.status,
        count: status._count.status,
      })),
      leaveRequestsByType: leaveRequestsByType.map(type => ({
        type: type.leaveType,
        count: type._count.leaveType,
      })),
      recentActivity,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
