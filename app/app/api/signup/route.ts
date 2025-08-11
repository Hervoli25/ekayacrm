
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName, role, department, title, phone } = await request.json();

    // Validate required fields
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, password, and full name are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Validate role
    const validRoles = ['SUPER_ADMIN', 'ADMIN', 'HR_DIRECTOR', 'MANAGER', 'EMPLOYEE'];
    const userRole = role && validRoles.includes(role) ? role : 'EMPLOYEE';

    // Create user with role
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: fullName,
        role: userRole as any,
      },
    });

    // Create employee record if needed
    if (role === 'EMPLOYEE' || role === 'MANAGER' || !role) {
      // Generate unique employee ID
      const employeeCount = await prisma.employee.count();
      const employeeId = `EI${(employeeCount + 1).toString().padStart(3, '0')}`;
      
      await prisma.employee.create({
        data: {
          userId: user.id,
          employeeId,
          name: fullName,
          title: title || 'Employee',
          department: department || 'General',
          email: email,
          phone: phone || null,
        },
      });
    }

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
