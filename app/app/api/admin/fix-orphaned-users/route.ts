import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only SUPER_ADMIN can fix database issues
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('=== Starting orphaned user fix ===');
    
    const results = await prisma.$transaction(async (tx) => {
      // Find orphaned users (users without employee records)
      const orphanedUsers = await tx.user.findMany({
        where: {
          employee: null,
          role: {
            not: 'SUPER_ADMIN' // Don't create employee records for super admins
          }
        }
      });

      console.log('Found orphaned users:', orphanedUsers.length);

      const createdEmployees = [];
      const errors = [];

      // Generate proper sequential employee IDs
      const existingEmployees = await tx.employee.findMany({
        select: { employeeId: true },
        orderBy: { createdAt: 'asc' }
      });

      // Extract valid EMP numbers
      const empNumbers = existingEmployees
        .map(emp => emp.employeeId)
        .filter(id => id.startsWith('EMP') && id.length === 6) // EMP001 format
        .map(id => parseInt(id.replace('EMP', '')))
        .filter(num => !isNaN(num))
        .sort((a, b) => a - b);

      let nextEmpNumber = 1;
      if (empNumbers.length > 0) {
        nextEmpNumber = Math.max(...empNumbers) + 1;
      }

      for (const user of orphanedUsers) {
        try {
          // Generate employee ID
          const employeeId = `EMP${nextEmpNumber.toString().padStart(3, '0')}`;
          console.log(`Creating employee record for ${user.name} with ID: ${employeeId}`);

          // Create employee record
          const employee = await tx.employee.create({
            data: {
              userId: user.id,
              employeeId,
              name: user.name || 'Unknown',
              title: 'Employee', // Default title
              department: 'General', // Default department
              email: user.email,
              phone: null,
              salary: null,
              hireDate: user.createdAt, // Use user creation date as hire date
              status: 'ACTIVE'
            }
          });

          createdEmployees.push({
            userId: user.id,
            employeeId,
            name: user.name,
            email: user.email
          });

          nextEmpNumber++;
        } catch (error) {
          console.error(`Failed to create employee for user ${user.id}:`, error);
          errors.push({
            userId: user.id,
            name: user.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return { createdEmployees, errors };
    });

    console.log('=== Orphaned user fix completed ===');
    console.log('Created employees:', results.createdEmployees.length);
    console.log('Errors:', results.errors.length);

    return NextResponse.json({
      success: true,
      message: `Fixed ${results.createdEmployees.length} orphaned users`,
      createdEmployees: results.createdEmployees,
      errors: results.errors
    });

  } catch (error) {
    console.error('Fix orphaned users error:', error);
    return NextResponse.json(
      { error: 'Failed to fix orphaned users' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Just return the orphaned users without fixing
    const orphanedUsers = await prisma.user.findMany({
      where: {
        employee: null,
        role: {
          not: 'SUPER_ADMIN'
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    return NextResponse.json({
      orphanedUsers,
      count: orphanedUsers.length
    });

  } catch (error) {
    console.error('Get orphaned users error:', error);
    return NextResponse.json(
      { error: 'Failed to get orphaned users' },
      { status: 500 }
    );
  }
}