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

    // Get user statistics
    const totalUsers = await prisma.user.count();
    
    const activeUsers = await prisma.user.count({
      where: { isActive: true }
    });

    const lockedUsers = await prisma.user.count({
      where: {
        lockoutUntil: {
          gt: new Date()
        }
      }
    });

    const adminUsers = await prisma.user.count({
      where: {
        role: {
          in: ['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER']
        }
      }
    });

    // Recent logins (last 24 hours)
    const recentLogins = await prisma.user.count({
      where: {
        lastLogin: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });

    // Users by role
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        id: true
      }
    });

    const usersByRoleFormatted = usersByRole.reduce((acc, item) => {
      acc[item.role] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Users by department (from employee records)
    const usersByDepartment = await prisma.employee.groupBy({
      by: ['department'],
      _count: {
        id: true
      }
    });

    const usersByDepartmentFormatted = usersByDepartment.reduce((acc, item) => {
      acc[item.department] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      totalUsers,
      activeUsers,
      lockedUsers,
      adminUsers,
      recentLogins,
      usersByRole: usersByRoleFormatted,
      usersByDepartment: usersByDepartmentFormatted
    });

  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}