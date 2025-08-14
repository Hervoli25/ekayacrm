
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

    // Filter out SUPER_ADMIN users for non-super-admin users
    let userFilter = {};
    if (session.user.role !== 'SUPER_ADMIN') {
      userFilter = {
        user: {
          role: {
            not: 'SUPER_ADMIN'
          }
        }
      };
    }

    // Combine where conditions
    const finalWhere = Object.keys(where).length > 0 
      ? { AND: [where, userFilter] }
      : userFilter;

    const employees = await prisma.employee.findMany({
      where: finalWhere,
      orderBy: {
        [sortBy]: sortOrder,
      },
      include: {
        user: {
          select: {
            id: true,
            role: true,
            lastLogin: true,
          },
        },
      },
    });

    // Get real leave request data
    const userIds = employees.map(emp => emp.userId);
    const pendingLeaveRequests = await prisma.leaveRequest.findMany({
      where: {
        userId: { in: userIds },
        status: 'PENDING'
      },
      select: {
        userId: true
      }
    });

    // Count pending leave requests per user
    const pendingLeaveByUser = pendingLeaveRequests.reduce((acc, request) => {
      acc[request.userId] = (acc[request.userId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Transform data to include additional fields expected by frontend
    const transformedEmployees = employees.map(emp => ({
      id: emp.id,
      userId: emp.userId, // Include userId for performance APIs
      employeeId: emp.employeeId,
      name: emp.name,
      email: emp.email,
      title: emp.title,
      department: emp.department,
      role: emp.user?.role || 'EMPLOYEE',
      status: emp.status,
      salary: emp.salary ? Number(emp.salary) : undefined,
      hireDate: emp.hireDate.toISOString(),
      phone: emp.phone,
      lastLogin: emp.user?.lastLogin?.toISOString(),
      performanceScore: Math.random() * 2 + 3.0, // Mock data for now
      pendingLeave: pendingLeaveByUser[emp.userId] || 0, // Real leave request data
      clearanceLevel: 'NONE', // Would be fetched from EmployeeProfile in real implementation
      reportsTo: null // Would be fetched from EmployeeHierarchy in real implementation
    }));

    return NextResponse.json({ 
      employees: transformedEmployees,
      total: transformedEmployees.length 
    });
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

    // Use transaction to ensure both user and employee are created together or both fail
    const employee = await prisma.$transaction(async (tx) => {
      console.log('Starting transaction for employee creation...');
      
      // Create user account for the employee
      const hashedPassword = await require('bcryptjs').hash('password123', 12);
      
      const user = await tx.user.create({
        data: {
          email,
          name,
          password: hashedPassword,
          role: 'EMPLOYEE'
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
      console.log('Employee created successfully:', employee.id);

      return employee;
    });

    console.log('Transaction completed successfully');
    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error('Create employee error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
