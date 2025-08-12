import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/enterprise-permissions';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const department = searchParams.get('department');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Check permissions
    const canViewAll = hasPermission(session.user.role, 'EMPLOYEE_VIEW_ALL');
    const canViewDepartment = hasPermission(session.user.role, 'EMPLOYEE_VIEW_DEPARTMENT');
    const canViewSalary = hasPermission(session.user.role, 'EMPLOYEE_VIEW_SALARY');

    // Build query based on role permissions
    let whereClause: any = {};

    if (!canViewAll) {
      if (canViewDepartment && session.user.department) {
        // Department managers and supervisors see their department only
        whereClause.department = session.user.department;
      } else if (session.user.role === 'SUPERVISOR') {
        // Supervisors see their direct reports
        whereClause.reportsTo = session.user.name;
      } else if (['EMPLOYEE', 'SENIOR_EMPLOYEE', 'INTERN'].includes(session.user.role)) {
        // Regular employees see limited colleague info
        whereClause.department = session.user.department;
      }
    }

    // Apply additional filters
    if (department && department !== 'all') {
      whereClause.department = department;
    }

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch employees from database
    const employees = await prisma.employee.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            role: true,
            lastLogin: true,
          },
        },
      },
      orderBy: [
        { name: 'asc' },
      ],
    });

    // Transform data and apply permission-based filtering
    const transformedEmployees = employees.map(employee => {
      const transformed: any = {
        id: employee.id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        title: employee.title,
        department: employee.department,
        role: employee.user?.role || 'EMPLOYEE',
        status: employee.status,
        hireDate: employee.hireDate?.toISOString(),
        phone: employee.phone,
        clearanceLevel: employee.securityClearance || 'NONE',
        reportsTo: employee.reportsTo,
        lastLogin: employee.user?.lastLogin?.toISOString(),
        performanceScore: employee.performanceScore,
        pendingLeave: 0, // TODO: Calculate from leave requests
      };

      // Only include salary if user has permission
      if (canViewSalary && employee.salary) {
        transformed.salary = employee.salary;
      }

      return transformed;
    });

    return NextResponse.json({
      employees: transformedEmployees,
      total: transformedEmployees.length,
    });

  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['DIRECTOR', 'HR_MANAGER', 'DEPARTMENT_MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      employeeId,
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
      role,
      status = 'ACTIVE'
    } = await request.json();

    if (!employeeId || !name || !title || !department || !email || !role || !hireDate) {
      return NextResponse.json(
        { error: 'Employee ID, name, title, department, email, role, and hire date are required' },
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
        { error: 'Employee with this email or employee ID already exists' },
        { status: 400 }
      );
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create user account first
    const hashedPassword = await bcrypt.hash('TempPass2024!', 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        role: role as any,
        password: hashedPassword,
        isActive: status === 'ACTIVE',
      }
    });

    // Create employee record
    const employee = await prisma.employee.create({
      data: {
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
        hireDate: new Date(hireDate),
        status: status as any,
        userId: user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            role: true,
            createdAt: true,
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Employee created successfully',
      employee: {
        id: employee.id,
        employeeId: employee.employeeId,
        name: employee.name,
        email: employee.email,
        title: employee.title,
        department: employee.department,
        role: employee.user.role,
        status: employee.status,
        hireDate: employee.hireDate.toISOString(),
      }
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