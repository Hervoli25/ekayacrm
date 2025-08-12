import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; action: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, action } = params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    switch (action) {
      case 'activate':
        await prisma.user.update({
          where: { id },
          data: { 
            isActive: true,
            lockoutUntil: null,
            failedLoginAttempts: 0
          }
        });
        break;

      case 'deactivate':
        await prisma.user.update({
          where: { id },
          data: { isActive: false }
        });
        break;

      case 'unlock':
        await prisma.user.update({
          where: { id },
          data: { 
            lockoutUntil: null,
            failedLoginAttempts: 0
          }
        });
        break;

      case 'reset-password':
        // Generate new temporary password
        const tempPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(tempPassword, 12);
        
        await prisma.user.update({
          where: { id },
          data: { password: hashedPassword }
        });

        return NextResponse.json({ 
          success: true,
          message: `Password reset successfully. New password: ${tempPassword}`,
          tempPassword
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `User ${action}d successfully` });

  } catch (error) {
    console.error(`Error performing ${params.action} on user:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}