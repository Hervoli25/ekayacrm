import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { hasPermission, getNextApprovalStep, canApprove } from '@/lib/enterprise-permissions';

const prisma = new PrismaClient();

// GET - Fetch leave requests based on user role and permissions
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    let whereClause: any = {};

    // Role-based filtering
    if (hasPermission(session.user.role, 'LEAVE_VIEW_ALL')) {
      // SUPER_ADMIN, DIRECTOR, HR_MANAGER can see all requests
      if (status && status !== 'all') {
        whereClause.status = status;
      }
      if (userId) {
        whereClause.userId = userId;
      }
    } else if (hasPermission(session.user.role, 'LEAVE_VIEW_TEAM')) {
      // DEPARTMENT_MANAGER, SUPERVISOR can see team requests + own
      const userEmployee = await prisma.employee.findFirst({
        where: { userId: session.user.id }
      });
      
      whereClause.OR = [
        { userId: session.user.id }, // Own requests
        { 
          user: {
            employee: {
              department: userEmployee?.department,
              reportsTo: userEmployee?.name
            }
          }
        }
      ];
    } else {
      // Regular employees see only their own requests
      whereClause.userId = session.user.id;
    }

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
        },
        approvals: {
          include: {
            approver: {
              select: {
                name: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      leaveRequests: leaveRequests.map(request => ({
        id: request.id,
        userId: request.userId,
        employee: request.user.employee,
        startDate: request.startDate,
        endDate: request.endDate,
        leaveType: request.leaveType,
        reason: request.reason,
        status: request.status,
        totalDays: request.totalDays,
        isHalfDay: request.isHalfDay,
        attachmentUrl: request.attachmentUrl,
        adminNotes: request.adminNotes,
        approvals: request.approvals,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching leave requests:', error);
    return NextResponse.json({ error: 'Failed to fetch leave requests' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create new leave request
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'LEAVE_CREATE')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { startDate, endDate, leaveType, isHalfDay, attachmentUrl } = await req.json();

    if (!startDate || !endDate || !leaveType) {
      return NextResponse.json({
        error: 'Start date, end date, and leave type are required'
      }, { status: 400 });
    }

    // Calculate total days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const totalDays = isHalfDay ? 0.5 : Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    // Get user's employee record for department context
    const userEmployee = await prisma.employee.findFirst({
      where: { userId: session.user.id }
    });

    if (!userEmployee) {
      return NextResponse.json({ error: 'Employee record not found' }, { status: 404 });
    }

    // Create leave request
    const leaveRequest = await prisma.leaveRequest.create({
      data: {
        userId: session.user.id,
        employeeId: userEmployee.employeeId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        leaveType: leaveType as any,
        reason: leaveType.replace('_', ' '), // Use leave type as reason for privacy
        status: 'PENDING',
        totalDays,
        isHalfDay: isHalfDay || false,
        attachmentUrl: attachmentUrl || null
      }
    });

    // Create initial approval workflow based on user role
    const nextApproval = getNextApprovalStep('LEAVE_REQUEST', session.user.role, 0);
    
    if (nextApproval) {
      // Find approver by role in the same department
      const approver = await prisma.user.findFirst({
        where: {
          role: nextApproval.requiredRole,
          employee: {
            department: userEmployee.department
          }
        }
      });

      if (approver) {
        await prisma.leaveApproval.create({
          data: {
            leaveRequestId: leaveRequest.id,
            approverId: approver.id,
            step: nextApproval.step,
            status: 'PENDING',
            requiredRole: nextApproval.requiredRole
          }
        });
      }
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE_LEAVE_REQUEST',
        entityType: 'LeaveRequest',
        entityId: leaveRequest.id,
        details: JSON.stringify({
          startDate,
          endDate,
          leaveType,
          totalDays
        })
      }
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      leaveRequest: {
        id: leaveRequest.id,
        startDate: leaveRequest.startDate,
        endDate: leaveRequest.endDate,
        leaveType: leaveRequest.leaveType,
        reason: leaveRequest.reason,
        status: leaveRequest.status,
        totalDays: leaveRequest.totalDays
      }
    });

  } catch (error) {
    console.error('Error creating leave request:', error);
    return NextResponse.json({ error: 'Failed to create leave request' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}