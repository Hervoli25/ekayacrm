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

    // Generate employee ID
    const existingEmployees = await prisma.employee.findMany({
      select: { employeeId: true },
      orderBy: { employeeId: 'desc' }
    });

    let employeeId = 'EMP001';
    if (existingEmployees.length > 0) {
      const lastEmployeeId = existingEmployees[0].employeeId;
      const lastNumber = parseInt(lastEmployeeId.replace('EMP', ''));
      const nextNumber = lastNumber + 1;
      employeeId = `EMP${nextNumber.toString().padStart(3, '0')}`;
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Create user account
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: role as any
      }
    });

    // Create employee record
    const employee = await prisma.employee.create({
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

    // Create employee profile with security clearance if provided
    if (securityClearance && securityClearance !== 'NONE') {
      await prisma.employeeProfile.create({
        data: {
          employeeId: user.id,
          clearanceLevel: securityClearance as any
        }
      });
    }

    // Log temporary credentials for SUPER_ADMIN access
    await prisma.temporaryCredential.create({
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

    return NextResponse.json({
      success: true,
      employee: {
        ...employee,
        tempPassword,
        role: user.role
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