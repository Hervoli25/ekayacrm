import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(
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

    const payrollPeriod = await prisma.payrollPeriod.findUnique({
      where: { id: params.id },
      include: {
        processor: {
          select: { name: true, email: true }
        },
        approver: {
          select: { name: true, email: true }
        },
        payslips: {
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
            }
          }
        }
      }
    });

    if (!payrollPeriod) {
      return NextResponse.json({ error: 'Payroll period not found' }, { status: 404 });
    }

    return NextResponse.json(payrollPeriod);
  } catch (error) {
    console.error('Error fetching payroll period:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
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

    const body = await request.json();
    const { action } = body;

    const payrollPeriod = await prisma.payrollPeriod.findUnique({
      where: { id: params.id }
    });

    if (!payrollPeriod) {
      return NextResponse.json({ error: 'Payroll period not found' }, { status: 404 });
    }

    let updatedPeriod;

    switch (action) {
      case 'process':
        if (payrollPeriod.status !== 'DRAFT') {
          return NextResponse.json({ 
            error: 'Can only process draft payroll periods' 
          }, { status: 400 });
        }
        
        updatedPeriod = await prisma.payrollPeriod.update({
          where: { id: params.id },
          data: { 
            status: 'PROCESSING',
            processedBy: session.user.id
          }
        });
        break;

      case 'approve':
        if (payrollPeriod.status !== 'PROCESSING') {
          return NextResponse.json({ 
            error: 'Can only approve processing payroll periods' 
          }, { status: 400 });
        }
        
        updatedPeriod = await prisma.$transaction(async (tx) => {
          // Update payroll period
          const period = await tx.payrollPeriod.update({
            where: { id: params.id },
            data: { 
              status: 'COMPLETED',
              approvedBy: session.user.id
            }
          });

          // Update all payslips to approved
          await tx.payslip.updateMany({
            where: { payrollPeriodId: params.id },
            data: { 
              status: 'APPROVED',
              approvedBy: session.user.id,
              payDate: new Date()
            }
          });

          return period;
        });
        break;

      case 'cancel':
        if (payrollPeriod.status === 'COMPLETED') {
          return NextResponse.json({ 
            error: 'Cannot cancel completed payroll periods' 
          }, { status: 400 });
        }
        
        updatedPeriod = await prisma.payrollPeriod.update({
          where: { id: params.id },
          data: { status: 'CANCELLED' }
        });
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json(updatedPeriod);
  } catch (error) {
    console.error('Error updating payroll period:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}