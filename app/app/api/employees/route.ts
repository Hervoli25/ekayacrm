
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';

    let where = {};
    if (search) {
      where = {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } },
          { department: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    const employees = await prisma.employee.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        user: {
          select: {
            role: true,
          },
        },
      },
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN', 'HR_DIRECTOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      name, 
      title, 
      department, 
      email, 
      phone, 
      address, 
      emergencyContact,
      emergencyPhone,
      salary,
      hireDate,
      employeeId
    } = await request.json();

    if (!name || !title || !department || !email || !employeeId) {
      return NextResponse.json(
        { error: 'Name, title, department, email, and employee ID are required' },
        { status: 400 }
      );
    }

    // Check if email or employee ID already exists
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        OR: [
          { email },
          { employeeId }
        ]
      }
    });

    if (existingEmployee) {
      return NextResponse.json(
        { error: 'Employee with this email or ID already exists' },
        { status: 400 }
      );
    }

    // Create user account for the employee
    const hashedPassword = await require('bcryptjs').hash('password123', 12);
    
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: 'EMPLOYEE'
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
        address: address || null,
        emergencyContact: emergencyContact || null,
        emergencyPhone: emergencyPhone || null,
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

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error('Create employee error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
