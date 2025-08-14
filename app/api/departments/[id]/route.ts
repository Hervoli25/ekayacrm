import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const updateDepartmentSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  code: z.string().min(2).max(10).optional(),
  description: z.string().optional(),
  budget: z.number().optional(),
  location: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const department = await prisma.department.findUnique({
      where: { id: params.id },
      include: {
        managers: {
          where: { isActive: true },
          include: {
            manager: {
              select: { 
                id: true,
                name: true, 
                email: true,
                role: true
              }
            },
            assigner: {
              select: { name: true, email: true }
            }
          }
        },
        employees: {
          where: { isActive: true },
          include: {
            employee: {
              select: {
                employeeId: true,
                title: true,
                salary: true,
                hireDate: true
              }
            },
            timeEntries: {
              where: {
                clockIn: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                }
              },
              select: {
                totalHours: true,
                clockIn: true
              }
            },
            leaveRequests: {
              where: {
                status: 'APPROVED',
                startDate: {
                  gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
              },
              select: {
                totalDays: true,
                leaveType: true
              }
            }
          }
        },
        employeeHierarchy: {
          include: {
            employee: {
              select: { name: true, email: true }
            },
            supervisor: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    // Calculate department analytics
    const analytics = {
      totalEmployees: department.employees.length,
      totalSalaryBudget: department.employees.reduce((sum, emp) => 
        sum + Number(emp.employee?.salary || 0), 0
      ),
      avgSalary: department.employees.length > 0 
        ? department.employees.reduce((sum, emp) => sum + Number(emp.employee?.salary || 0), 0) / department.employees.length
        : 0,
      budgetUtilization: department.budget 
        ? (department.employees.reduce((sum, emp) => sum + Number(emp.employee?.salary || 0), 0) / Number(department.budget)) * 100
        : 0,
      roleDistribution: department.employees.reduce((acc, emp) => {
        acc[emp.role] = (acc[emp.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      avgHoursWorked: department.employees.reduce((sum, emp) => {
        const totalHours = emp.timeEntries.reduce((h, entry) => h + Number(entry.totalHours || 0), 0);
        return sum + totalHours;
      }, 0) / Math.max(department.employees.length, 1),
      totalLeavesTaken: department.employees.reduce((sum, emp) => {
        return sum + emp.leaveRequests.reduce((leaves, req) => leaves + (req.totalDays || 0), 0);
      }, 0)
    };

    return NextResponse.json({
      ...department,
      analytics
    });
  } catch (error) {
    console.error('Error fetching department:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || !['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const updateData = updateDepartmentSchema.parse(body);

    // If updating name or code, check for conflicts
    if (updateData.name || updateData.code) {
      const conflictWhere = [];
      if (updateData.name) {
        conflictWhere.push({ name: { equals: updateData.name, mode: 'insensitive' } });
      }
      if (updateData.code) {
        conflictWhere.push({ code: { equals: updateData.code, mode: 'insensitive' } });
      }

      const existingDept = await prisma.department.findFirst({
        where: {
          AND: [
            { id: { not: params.id } },
            { OR: conflictWhere }
          ]
        }
      });

      if (existingDept) {
        return NextResponse.json({ 
          error: 'Department with this name or code already exists' 
        }, { status: 400 });
      }
    }

    const department = await prisma.department.update({
      where: { id: params.id },
      data: {
        ...updateData,
        budget: updateData.budget ? Number(updateData.budget) : undefined,
        code: updateData.code?.toUpperCase(),
        updatedAt: new Date()
      },
      include: {
        managers: {
          include: {
            manager: {
              select: { name: true, email: true }
            }
          }
        },
        _count: {
          select: { employees: true }
        }
      }
    });

    return NextResponse.json(department);
  } catch (error) {
    console.error('Error updating department:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || !['SUPER_ADMIN', 'DIRECTOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check if department has employees
    const department = await prisma.department.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { employees: { where: { isActive: true } } }
        }
      }
    });

    if (!department) {
      return NextResponse.json({ error: 'Department not found' }, { status: 404 });
    }

    if (department._count.employees > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete department with active employees. Transfer employees first.' 
      }, { status: 400 });
    }

    await prisma.department.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}