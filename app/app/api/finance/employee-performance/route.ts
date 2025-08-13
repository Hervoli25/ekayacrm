
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const performanceSchema = z.object({
  dailyReportId: z.string(),
  employeeId: z.string(),
  servicesCompleted: z.number().int().default(0),
  revenue: z.number().default(0),
  commission: z.number().default(0),
  tips: z.number().default(0),
  customerRating: z.number().min(1).max(5).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = performanceSchema.parse(body);

    const performance = await prisma.employeePerformance.upsert({
      where: {
        dailyReportId_employeeId: {
          dailyReportId: data.dailyReportId,
          employeeId: data.employeeId,
        },
      },
      update: {
        servicesCompleted: data.servicesCompleted,
        revenue: data.revenue,
        commission: data.commission,
        tips: data.tips,
        customerRating: data.customerRating,
      },
      create: {
        dailyReportId: data.dailyReportId,
        employeeId: data.employeeId,
        servicesCompleted: data.servicesCompleted,
        revenue: data.revenue,
        commission: data.commission,
        tips: data.tips,
        customerRating: data.customerRating,
      },
      include: {
        employee: {
          select: {
            name: true,
            email: true,
          },
        },
        dailyReport: {
          select: {
            date: true,
          },
        },
      },
    });

    return NextResponse.json(performance);
  } catch (error) {
    console.error('Error creating/updating employee performance:', error);
    return NextResponse.json(
      { error: 'Failed to update employee performance' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build the where clause with super admin filtering
    let whereClause: any = {};
    
    // Filter by employee ID based on role
    if (employeeId && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      whereClause.employeeId = employeeId;
    } else if (session.user.role === 'EMPLOYEE') {
      whereClause.employeeId = session.user.id;
    }
    
    // Add date filtering if provided
    if (startDate && endDate) {
      whereClause.dailyReport = {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      };
    }
    
    // Filter out SUPER_ADMIN performance data for non-super-admin users
    if (session.user.role !== 'SUPER_ADMIN') {
      whereClause.employee = {
        user: {
          role: {
            not: 'SUPER_ADMIN'
          }
        }
      };
    }

    const performances = await prisma.employeePerformance.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            name: true,
            email: true,
            user: {
              select: {
                role: true
              }
            }
          },
        },
        dailyReport: {
          select: {
            date: true,
            totalRevenue: true,
          },
        },
      },
      orderBy: {
        dailyReport: {
          date: 'desc',
        },
      },
    });

    return NextResponse.json(performances);
  } catch (error) {
    console.error('Error fetching employee performance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee performance' },
      { status: 500 }
    );
  }
}
