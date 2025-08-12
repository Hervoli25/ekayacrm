import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/enterprise-permissions';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create employees
    if (!hasPermission(session.user.role, 'EMPLOYEE_CREATE')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
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
    } = await req.json();

    if (!name || !email || !title || !department || !role) {
      return NextResponse.json(
        { error: 'Name, email, title, department, and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['HR_MANAGER', 'DEPARTMENT_MANAGER', 'SUPERVISOR', 'SENIOR_EMPLOYEE', 'EMPLOYEE', 'INTERN'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role selected' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Generate temporary password
    const tempPassword = `${role.toLowerCase()}${Math.random().toString(36).substring(2, 8)}!`;
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Create user account
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as any,
      },
    });

    // Generate employee ID based on role
    const rolePrefix = {
      'HR_MANAGER': 'HRM',
      'DEPARTMENT_MANAGER': 'DM',
      'SUPERVISOR': 'SUP',
      'SENIOR_EMPLOYEE': 'SE',
      'EMPLOYEE': 'EMP',
      'INTERN': 'INT'
    };

    const employeeId = `${rolePrefix[role as keyof typeof rolePrefix]}${String(Date.now()).slice(-3)}`;

    // Create employee record
    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        employeeId,
        name,
        title,
        department,
        email,
        phone: phone || '',
        salary: salary ? parseFloat(salary) : null,
        hireDate: hireDate ? new Date(hireDate) : new Date(),
        reportsTo: reportsTo || null,
        securityClearance: securityClearance || 'NONE',
        status: 'ACTIVE',
      },
    });

    // Log the creation for audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE_EMPLOYEE',
        entityType: 'Employee',
        entityId: employee.id,
        details: JSON.stringify({
          employeeName: name,
          employeeEmail: email,
          employeeRole: role,
          department,
          title,
        }),
      },
    }).catch(() => {
      // Audit log is optional, don't fail if it doesn't work
    });

    return NextResponse.json({
      success: true,
      employee: {
        id: employee.id,
        userId: user.id,
        name,
        email,
        title,
        department,
        role,
        employeeId,
        tempPassword, // Only returned once for setup
        hireDate: employee.hireDate,
        salary: employee.salary,
      },
    });

  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { error: 'Failed to create employee' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}