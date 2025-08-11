
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let where: any = {};

    // If user is not admin/manager, only show their own requests
    if (!['SUPER_ADMIN', 'ADMIN', 'HR_DIRECTOR', 'MANAGER'].includes(session.user.role)) {
      where.userId = session.user.id;
    }

    // Filter by status if provided
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    const leaveRequests = await prisma.leaveRequest.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            employee: {
              select: {
                name: true,
                employeeId: true,
                department: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate total days for each request
    const requestsWithDays = leaveRequests.map(request => ({
      ...request,
      totalDays: Math.ceil((request.endDate.getTime() - request.startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
    }));

    return NextResponse.json(requestsWithDays);
  } catch (error) {
    console.error('Get leave requests error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { startDate, endDate, leaveType, reason, employeeId, isHalfDay } = await request.json();

    if (!startDate || !endDate || !leaveType || !reason) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (!isHalfDay && start >= end) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Calculate total days
    const totalDays = isHalfDay ? 0.5 : Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Determine which user to create the request for
    let targetUserId = session.user.id;
    if (employeeId && ['SUPER_ADMIN', 'ADMIN', 'HR_DIRECTOR', 'MANAGER'].includes(session.user.role)) {
      // Admin creating request for another employee
      const employee = await prisma.employee.findUnique({
        where: { employeeId },
        include: { user: true }
      });
      if (!employee) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
      }
      targetUserId = employee.userId;
    }

    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId: targetUserId,
        employeeId: employeeId || null,
        startDate: start,
        endDate: end,
        leaveType: leaveType.toUpperCase(),
        reason,
        status: 'PENDING',
        totalDays,
        isHalfDay: isHalfDay || false,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            employee: {
              select: {
                name: true,
                employeeId: true,
                department: true,
                title: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(leaveRequest, { status: 201 });
  } catch (error) {
    console.error('Create leave request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
