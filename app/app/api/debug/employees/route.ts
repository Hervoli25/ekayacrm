import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only SUPER_ADMIN can access debug endpoints
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('=== DEBUG: Fetching raw employee data ===');

    // Get all users
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log('Users found:', users.length);

    // Get all employees
    const employees = await prisma.employee.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log('Employees found:', employees.length);

    // Get orphaned users (users without employee records)
    const orphanedUsers = await prisma.user.findMany({
      where: {
        employee: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });
    console.log('Orphaned users found:', orphanedUsers.length);

    // Get temporary credentials
    const tempCredentials = await prisma.temporaryCredential.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    return NextResponse.json({
      summary: {
        totalUsers: users.length,
        totalEmployees: employees.length,
        orphanedUsers: orphanedUsers.length,
        tempCredentials: tempCredentials.length
      },
      users,
      employees,
      orphanedUsers,
      tempCredentials
    });

  } catch (error) {
    console.error('Debug employees error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}