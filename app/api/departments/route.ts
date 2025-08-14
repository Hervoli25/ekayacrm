import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createDepartmentSchema = z.object({
  name: z.string().min(2).max(100),
  code: z.string().min(2).max(10).toUpperCase(),
  description: z.string().optional(),
  budget: z.number().optional(),
  location: z.string().optional(),
  managerId: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const departments = await prisma.department.findMany({
      include: {
        managers: {
          where: { isActive: true },
          include: {
            manager: {
              select: { name: true, email: true }
            }
          }
        },
        employees: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            employee: {
              select: {
                employeeId: true,
                title: true,
                salary: true
              }
            }
          }
        },
        _count: {
          select: { employees: { where: { isActive: true } } }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Calculate additional metrics
    const departmentsWithMetrics = departments.map(dept => {
      const totalSalary = dept.employees.reduce((sum, emp) => 
        sum + Number(emp.employee?.salary || 0), 0
      );
      
      const avgSalary = dept.employees.length > 0 
        ? totalSalary / dept.employees.length 
        : 0;

      const roleDistribution = dept.employees.reduce((acc, emp) => {
        acc[emp.role] = (acc[emp.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        ...dept,
        metrics: {
          totalSalary,
          avgSalary,
          roleDistribution,
          budgetUtilization: dept.budget ? (totalSalary / Number(dept.budget)) * 100 : 0
        }
      };
    });

    return NextResponse.json(departmentsWithMetrics);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has department creation permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || !['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { name, code, description, budget, location, managerId } = createDepartmentSchema.parse(body);

    // Check if department with same name or code exists
    const existingDept = await prisma.department.findFirst({
      where: {
        OR: [
          { name: { equals: name, mode: 'insensitive' } },
          { code: { equals: code, mode: 'insensitive' } }
        ]
      }
    });

    if (existingDept) {
      return NextResponse.json({ 
        error: 'Department with this name or code already exists' 
      }, { status: 400 });
    }

    const department = await prisma.$transaction(async (tx) => {
      // Create department
      const newDept = await tx.department.create({
        data: {
          name,
          code,
          description,
          budget: budget ? Number(budget) : null,
          location,
        },
        include: {
          _count: {
            select: { employees: true }
          }
        }
      });

      // Assign manager if provided
      if (managerId) {
        await tx.departmentManager.create({
          data: {
            userId: managerId,
            departmentId: newDept.id,
            assignedBy: session.user.id,
            isActive: true
          }
        });
      }

      return newDept;
    });

    return NextResponse.json(department);
  } catch (error) {
    console.error('Error creating department:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}