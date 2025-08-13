import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only SUPER_ADMIN can perform cascade deletions
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, entityType } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: true,
        profile: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log(`Starting cascade deletion for user: ${userId}`);
    let deletedRecords: string[] = [];

    // Perform cascade deletion in transaction
    await prisma.$transaction(async (tx) => {
      try {
        // 1. Delete employee profile first (if exists)
        if (user.profile) {
          await tx.employeeProfile.delete({
            where: { employeeId: userId }
          });
          deletedRecords.push('employee_profiles');
          console.log('Deleted employee profile');
        }

        // 2. Delete employee skills and certifications
        await tx.employeeSkill.deleteMany({
          where: { 
            profile: { 
              employeeId: userId 
            }
          }
        });
        
        await tx.certification.deleteMany({
          where: { 
            profile: { 
              employeeId: userId 
            }
          }
        });

        // 3. Delete time entries
        const timeEntries = await tx.timeEntry.deleteMany({
          where: { employeeId: userId }
        });
        if (timeEntries.count > 0) {
          deletedRecords.push(`time_entries (${timeEntries.count})`);
        }

        // 4. Delete leave requests
        const leaveRequests = await tx.leaveRequest.deleteMany({
          where: { userId }
        });
        if (leaveRequests.count > 0) {
          deletedRecords.push(`leave_requests (${leaveRequests.count})`);
        }

        // 5. Delete enhanced leave requests and approvals
        const enhancedLeaveRequests = await tx.enhancedLeaveRequest.deleteMany({
          where: { userId }
        });
        if (enhancedLeaveRequests.count > 0) {
          deletedRecords.push(`enhanced_leave_requests (${enhancedLeaveRequests.count})`);
        }

        // 6. Delete performance-related records
        const performanceRecords = await tx.employeePerformance.deleteMany({
          where: { employeeId: userId }
        });
        if (performanceRecords.count > 0) {
          deletedRecords.push(`employee_performance (${performanceRecords.count})`);
        }

        // 7. Delete receipts
        const receipts = await tx.receipt.deleteMany({
          where: { employeeId: userId }
        });
        if (receipts.count > 0) {
          deletedRecords.push(`receipts (${receipts.count})`);
        }

        // 8. Delete notifications
        const notifications = await tx.notification.deleteMany({
          where: { userId }
        });
        if (notifications.count > 0) {
          deletedRecords.push(`notifications (${notifications.count})`);
        }

        // 9. Delete temporary credentials
        const tempCredentials = await tx.temporaryCredential.deleteMany({
          where: { employeeId: userId }
        });
        if (tempCredentials.count > 0) {
          deletedRecords.push(`temporary_credentials (${tempCredentials.count})`);
        }

        // 10. Delete other user-related records
        await tx.account.deleteMany({ where: { userId } });
        await tx.session.deleteMany({ where: { userId } });

        // 11. Delete employee record (if exists)
        if (user.employee) {
          await tx.employee.delete({
            where: { userId }
          });
          deletedRecords.push('employees');
          console.log('Deleted employee record');
        }

        // 12. Finally delete the user
        await tx.user.delete({
          where: { id: userId }
        });
        deletedRecords.push('users');
        console.log('Deleted user record');

      } catch (error) {
        console.error('Transaction error:', error);
        throw error;
      }
    });

    // Log the cascade deletion
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CASCADE_DELETE_USER',
        resource: 'users',
        resourceId: userId,
        details: {
          deletedUser: {
            id: userId,
            name: user.name,
            email: user.email,
            role: user.role
          },
          deletedRecords,
          performedBy: session.user.email
        },
        riskLevel: 'HIGH'
      }
    }).catch(() => {
      // Audit log is optional for this case since we're deleting the user
    });

    return NextResponse.json({
      success: true,
      message: 'User and all related records deleted successfully',
      deletedRecords,
      deletedUser: {
        id: userId,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Cascade deletion error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete user',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check what records would be deleted (dry run)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: true,
        profile: true,
        _count: {
          select: {
            leaveRequests: true,
            timeEntries: true,
            notifications: true,
            receipts: true,
            performanceRecords: true,
            enhancedLeaveRequests: true,
            temporaryCredentials: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const relatedRecords = {
      employee_profiles: user.profile ? 1 : 0,
      employees: user.employee ? 1 : 0,
      leave_requests: user._count.leaveRequests,
      time_entries: user._count.timeEntries,
      notifications: user._count.notifications,
      receipts: user._count.receipts,
      employee_performance: user._count.performanceRecords,
      enhanced_leave_requests: user._count.enhancedLeaveRequests,
      temporary_credentials: user._count.temporaryCredentials
    };

    const totalRecords = Object.values(relatedRecords).reduce((sum, count) => sum + count, 1); // +1 for user

    return NextResponse.json({
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role
      },
      relatedRecords,
      totalRecords,
      message: `This will delete ${totalRecords} records across multiple tables`
    });

  } catch (error) {
    console.error('Error checking cascade deletion:', error);
    return NextResponse.json(
      { error: 'Failed to check deletion impact' },
      { status: 500 }
    );
  }
}