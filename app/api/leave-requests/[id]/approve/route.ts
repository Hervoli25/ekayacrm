import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { canApprove, getNextApprovalStep } from '@/lib/enterprise-permissions';

const prisma = new PrismaClient();

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, notes } = await req.json();
    const leaveRequestId = params.id;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Get leave request with current approvals
    const leaveRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId },
      include: {
        user: {
          include: {
            employee: true
          }
        },
        approvals: {
          where: { status: 'PENDING' },
          orderBy: { step: 'asc' }
        }
      }
    });

    if (!leaveRequest) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 });
    }

    if (leaveRequest.status !== 'PENDING') {
      return NextResponse.json({ 
        error: 'Leave request is not pending approval' 
      }, { status: 400 });
    }

    // Get current pending approval
    const currentApproval = leaveRequest.approvals[0];
    if (!currentApproval) {
      return NextResponse.json({ error: 'No pending approvals found' }, { status: 400 });
    }

    // Check if current user can approve this step
    if (currentApproval.approverId !== session.user.id) {
      return NextResponse.json({ 
        error: 'You are not authorized to approve this request' 
      }, { status: 403 });
    }

    const requesterRole = leaveRequest.user.role;
    const approverRole = session.user.role;

    if (!canApprove(approverRole, 'LEAVE_REQUEST', requesterRole, currentApproval.step)) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to approve this request' 
      }, { status: 403 });
    }

    // Update current approval
    await prisma.leaveApproval.update({
      where: { id: currentApproval.id },
      data: {
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
        approvedAt: action === 'approve' ? new Date() : null,
        rejectedAt: action === 'reject' ? new Date() : null,
        notes: notes || null
      }
    });

    if (action === 'reject') {
      // If rejected, update leave request status
      await prisma.leaveRequest.update({
        where: { id: leaveRequestId },
        data: {
          status: 'REJECTED',
          adminNotes: notes || null,
          rejectedAt: new Date()
        }
      });

      // Log the rejection
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'REJECT_LEAVE_REQUEST',
          entityType: 'LeaveRequest',
          entityId: leaveRequestId,
          details: JSON.stringify({
            reason: notes,
            step: currentApproval.step
          })
        }
      }).catch(() => {});

    } else {
      // If approved, check if there are more approval steps needed
      const nextApproval = getNextApprovalStep('LEAVE_REQUEST', requesterRole, currentApproval.step);

      if (nextApproval) {
        // Find next approver
        const userEmployee = leaveRequest.user.employee;
        const nextApprover = await prisma.user.findFirst({
          where: {
            role: nextApproval.requiredRole,
            employee: {
              department: userEmployee?.department
            }
          }
        });

        if (nextApprover) {
          // Create next approval step
          await prisma.leaveApproval.create({
            data: {
              leaveRequestId,
              approverId: nextApprover.id,
              step: nextApproval.step,
              status: 'PENDING',
              requiredRole: nextApproval.requiredRole
            }
          });
        }
      } else {
        // No more approvals needed, fully approve the request
        await prisma.leaveRequest.update({
          where: { id: leaveRequestId },
          data: {
            status: 'APPROVED',
            approvedBy: session.user.name || session.user.email,
            approvedAt: new Date(),
            adminNotes: notes || null
          }
        });
      }

      // Log the approval
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'APPROVE_LEAVE_REQUEST',
          entityType: 'LeaveRequest',
          entityId: leaveRequestId,
          details: JSON.stringify({
            step: currentApproval.step,
            notes: notes,
            finalApproval: !nextApproval
          })
        }
      }).catch(() => {});
    }

    // Get updated leave request
    const updatedRequest = await prisma.leaveRequest.findUnique({
      where: { id: leaveRequestId },
      include: {
        user: {
          include: {
            employee: {
              select: {
                name: true,
                employeeId: true,
                department: true
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
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: `Leave request ${action}d successfully`,
      leaveRequest: updatedRequest
    });

  } catch (error) {
    console.error('Error processing leave approval:', error);
    return NextResponse.json({ error: 'Failed to process approval' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}