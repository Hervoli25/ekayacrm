import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user has permission to create employees
    if (!session || !['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      name, 
      email, 
      title, 
      department, 
      role, 
      phone, 
      salary, 
      hireDate, 
      reportsTo, 
      securityClearance 
    } = await request.json();

    // Validate required fields
    if (!name || !email || !title || !department || !role) {
      return NextResponse.json(
        { error: 'Name, email, title, department, and role are required' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Use transaction to ensure all operations complete or all fail
    const result = await prisma.$transaction(async (tx) => {
      console.log('Starting employee creation transaction...');

      // Generate employee ID within transaction
      const existingEmployees = await tx.employee.findMany({
        select: { employeeId: true },
        orderBy: { employeeId: 'desc' }
      });

      let employeeId = 'EMP001';
      if (existingEmployees.length > 0) {
        // Filter out any non-EMP prefixed IDs and find the highest number
        const empIds = existingEmployees
          .map(emp => emp.employeeId)
          .filter(id => typeof id === 'string' && id.startsWith('EMP') && id.length === 6) // EMP001 format
          .map(id => {
            const numberPart = id.replace('EMP', '');
            const parsed = parseInt(numberPart, 10);
            return isNaN(parsed) ? 0 : parsed;
          })
          .filter(num => num > 0);
        
        if (empIds.length > 0) {
          const lastNumber = Math.max(...empIds);
          const nextNumber = lastNumber + 1;
          employeeId = `EMP${nextNumber.toString().padStart(3, '0')}`;
          console.log(`Generated next employee ID: ${employeeId} (last was: ${lastNumber})`);
        } else {
          console.log('No valid EMP IDs found, starting with EMP001');
        }
      }

      console.log('Generated employee ID:', employeeId);

      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      // Create user account
      const user = await tx.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: role as any
        }
      });
      console.log('User created successfully:', user.id);

      // Create employee record
      const employee = await tx.employee.create({
        data: {
          userId: user.id,
          employeeId,
          name,
          title,
          department,
          email,
          phone: phone || null,
          salary: salary ? parseFloat(salary) : null,
          hireDate: hireDate ? new Date(hireDate) : new Date(),
          status: 'ACTIVE'
        },
        include: {
          user: {
            select: {
              role: true,
            },
          },
        },
      });
      console.log('Employee created successfully:', employee.id);

      // Create employee profile with security clearance if provided
      let profile = null;
      if (securityClearance && securityClearance !== 'NONE') {
        profile = await tx.employeeProfile.create({
          data: {
            employeeId: user.id,
            clearanceLevel: securityClearance as any
          }
        });
        console.log('Employee profile created successfully');
      }

      // Log temporary credentials for SUPER_ADMIN access
      await tx.temporaryCredential.create({
        data: {
          employeeId: user.id,
          employeeName: name,
          email,
          tempPassword,
          role: role as any,
          createdBy: session.user.id,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          notes: `Employee created by ${session.user.name || session.user.email}`
        }
      });
      console.log('Temporary credentials logged successfully');

      return { employee, user, tempPassword };
    });

    console.log('Transaction completed successfully');
    return NextResponse.json({
      success: true,
      employee: {
        ...result.employee,
        tempPassword: result.tempPassword,
        role: result.user.role
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Create employee error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}