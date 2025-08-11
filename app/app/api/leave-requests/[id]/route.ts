

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: params.id },
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

    if (!leaveRequest) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    // Check if user can view this request
    if (
      leaveRequest.userId !== session.user.id && 
      !['SUPER_ADMIN', 'ADMIN', 'HR_DIRECTOR', 'MANAGER'].includes(session.user.role)
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(leaveRequest);
  } catch (error) {
    console.error('Get leave request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, startDate, endDate, leaveType, reason, adminNotes, isHalfDay } = await request.json();

    const existingRequest = await prisma.leaveRequest.findUnique({
      where: { id: params.id },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    let updateData: any = {};

    switch (action) {
      case 'approve':
        // Only admins/managers can approve
        if (!['SUPER_ADMIN', 'ADMIN', 'HR_DIRECTOR', 'MANAGER'].includes(session.user.role)) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
        updateData = {
          status: 'APPROVED',
          approvedBy: session.user.id,
          approvedAt: new Date(),
          adminNotes: adminNotes || null,
        };
        break;

      case 'reject':
        // Only admins/managers can reject
        if (!['SUPER_ADMIN', 'ADMIN', 'HR_DIRECTOR', 'MANAGER'].includes(session.user.role)) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
        updateData = {
          status: 'REJECTED',
          approvedBy: session.user.id,
          rejectedAt: new Date(),
          adminNotes: adminNotes || null,
        };
        break;

      case 'modify':
        // Employee can modify their own pending requests, admins can modify any
        if (
          existingRequest.userId !== session.user.id && 
          !['SUPER_ADMIN', 'ADMIN', 'HR_DIRECTOR', 'MANAGER'].includes(session.user.role)
        ) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        if (existingRequest.status !== 'PENDING') {
          return NextResponse.json(
            { error: 'Can only modify pending requests' },
            { status: 400 }
          );
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const totalDays = isHalfDay ? 0.5 : Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        updateData = {
          startDate: start,
          endDate: end,
          leaveType: leaveType.toUpperCase(),
          reason,
          status: 'MODIFIED',
          totalDays,
          isHalfDay: isHalfDay || false,
          updatedAt: new Date(),
        };
        break;

      case 'cancel':
        // Employee can cancel their own request, admins can cancel any
        if (
          existingRequest.userId !== session.user.id && 
          !['SUPER_ADMIN', 'ADMIN', 'HR_DIRECTOR', 'MANAGER'].includes(session.user.role)
        ) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
        updateData = {
          status: 'CANCELLED',
          updatedAt: new Date(),
        };
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updatedRequest = await prisma.leaveRequest.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Update leave request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete
    if (!['SUPER_ADMIN', 'ADMIN', 'HR_DIRECTOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const existingRequest = await prisma.leaveRequest.findUnique({
      where: { id: params.id },
    });

    if (!existingRequest) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    await prisma.leaveRequest.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Leave request deleted successfully' });
  } catch (error) {
    console.error('Delete leave request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
