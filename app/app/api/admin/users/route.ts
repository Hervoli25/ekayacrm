import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Filter out SUPER_ADMIN users for non-super-admin users
    let whereClause = {};
    if (session.user.role !== 'SUPER_ADMIN') {
      whereClause = {
        role: {
          not: 'SUPER_ADMIN'
        }
      };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        failedLoginAttempts: true,
        lockoutUntil: true,
        createdAt: true,
        employee: {
          select: {
            name: true,
            employeeId: true,
            department: true,
            title: true,
            hireDate: true,
            phone: true,
            address: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ users });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}