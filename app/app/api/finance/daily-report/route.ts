
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const dailyReportSchema = z.object({
  date: z.string(),
  totalRevenue: z.number(),
  totalBookings: z.number(),
  newCustomers: z.number(),
  returningCustomers: z.number(),
  cashPayments: z.number(),
  cardPayments: z.number(),
  digitalPayments: z.number(),
  topPerformingService: z.string().optional(),
  peakHour: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = dailyReportSchema.parse(body);

    const report = await prisma.dailyReport.create({
      data: {
        date: new Date(data.date),
        totalRevenue: data.totalRevenue,
        totalBookings: data.totalBookings,
        newCustomers: data.newCustomers,
        returningCustomers: data.returningCustomers,
        cashPayments: data.cashPayments,
        cardPayments: data.cardPayments,
        digitalPayments: data.digitalPayments,
        topPerformingService: data.topPerformingService,
        peakHour: data.peakHour,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error creating daily report:', error);
    return NextResponse.json(
      { error: 'Failed to create daily report' },
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const reports = await prisma.dailyReport.findMany({
      where: {
        ...(startDate && endDate ? {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        } : {}),
      },
      include: {
        services: true,
        employeePerformance: {
          include: {
            employee: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(reports);
  } catch (error) {
    console.error('Error fetching daily reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily reports' },
      { status: 500 }
    );
  }
}
