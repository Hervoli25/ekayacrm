import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const payrollPeriodId = searchParams.get('payrollPeriodId');

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    const isHRRole = ['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER'].includes(user?.role || '');

    // Build where clause
    let whereClause: any = {};
    
    if (!isHRRole) {
      // Non-HR users can only see their own payslips
      whereClause.employeeId = session.user.id;
    } else if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    if (payrollPeriodId) {
      whereClause.payrollPeriodId = payrollPeriodId;
    }

    const payslips = await prisma.payslip.findMany({
      where: whereClause,
      include: {
        employee: {
          select: { 
            name: true, 
            email: true,
            employee: {
              select: {
                employeeId: true,
                department: true,
                title: true
              }
            }
          }
        },
        payrollPeriod: {
          select: {
            startDate: true,
            endDate: true,
            status: true
          }
        },
        approver: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(payslips);
  } catch (error) {
    console.error('Error fetching payslips:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
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
    const { payslipId, updates } = body;

    const payslip = await prisma.payslip.update({
      where: { id: payslipId },
      data: updates,
      include: {
        employee: {
          select: { name: true, email: true }
        }
      }
    });

    return NextResponse.json(payslip);
  } catch (error) {
    console.error('Error updating payslip:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}