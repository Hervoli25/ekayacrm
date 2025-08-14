import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createPayrollPeriodSchema = z.object({
  startDate: z.string().transform(str => new Date(str)),
  endDate: z.string().transform(str => new Date(str)),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has payroll permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || !['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const payrollPeriods = await prisma.payrollPeriod.findMany({
      include: {
        processor: {
          select: { name: true, email: true }
        },
        approver: {
          select: { name: true, email: true }
        },
        payslips: {
          select: {
            id: true,
            employee: {
              select: { name: true, email: true }
            },
            grossPay: true,
            netPay: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(payrollPeriods);
  } catch (error) {
    console.error('Error fetching payroll periods:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has payroll creation permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || !['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { startDate, endDate } = createPayrollPeriodSchema.parse(body);

    // Check for overlapping periods
    const overlappingPeriod = await prisma.payrollPeriod.findFirst({
      where: {
        OR: [
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gte: startDate } }
            ]
          },
          {
            AND: [
              { startDate: { lte: endDate } },
              { endDate: { gte: endDate } }
            ]
          },
          {
            AND: [
              { startDate: { gte: startDate } },
              { endDate: { lte: endDate } }
            ]
          }
        ]
      }
    });

    if (overlappingPeriod) {
      return NextResponse.json({ 
        error: 'Payroll period overlaps with existing period' 
      }, { status: 400 });
    }

    // Create the payroll period
    const payrollPeriod = await prisma.payrollPeriod.create({
      data: {
        startDate,
        endDate,
        status: 'DRAFT',
        processedBy: session.user.id
      },
      include: {
        processor: {
          select: { name: true, email: true }
        }
      }
    });

    // Get all active employees to generate payslips
    const employees = await prisma.user.findMany({
      where: {
        isActive: true,
        employee: {
          isNot: null
        }
      },
      include: {
        employee: true,
        timeEntries: {
          where: {
            clockIn: {
              gte: startDate,
              lte: endDate
            },
            status: 'COMPLETED'
          }
        }
      }
    });

    // Generate payslips for all employees
    const payslips = await Promise.all(
      employees.map(async (employee) => {
        const baseSalary = employee.employee?.salary || 0;
        
        // Calculate total hours worked
        const totalHours = employee.timeEntries.reduce((sum, entry) => {
          return sum + (Number(entry.totalHours) || 0);
        }, 0);

        // Simple overtime calculation (hours over 160 per month)
        const standardHours = 160; // Standard monthly hours
        const overtimeHours = Math.max(0, totalHours - standardHours);
        const overtime = overtimeHours * (Number(baseSalary) / standardHours) * 1.5;

        const grossPay = Number(baseSalary) + overtime;
        const taxDeductions = grossPay * 0.2; // 20% tax
        const netPay = grossPay - taxDeductions;

        return prisma.payslip.create({
          data: {
            employeeId: employee.id,
            payrollPeriodId: payrollPeriod.id,
            baseSalary: Number(baseSalary),
            overtime,
            bonuses: 0,
            commission: 0,
            allowances: 0,
            grossPay,
            taxDeductions,
            otherDeductions: 0,
            netPay,
            status: 'GENERATED'
          }
        });
      })
    );

    return NextResponse.json({
      payrollPeriod,
      payslipsGenerated: payslips.length
    });
  } catch (error) {
    console.error('Error creating payroll period:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}