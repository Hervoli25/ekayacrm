
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Revenue Analytics
    const revenueData = await prisma.dailyReport.findMany({
      where: {
        date: {
          gte: startDate,
        },
      },
      select: {
        date: true,
        totalRevenue: true,
        totalBookings: true,
        cashPayments: true,
        cardPayments: true,
        digitalPayments: true,
      },
      orderBy: {
        date: 'asc',
      },
    });

    // Top Performing Services
    const serviceRevenue = await prisma.serviceRevenue.findMany({
      where: {
        dailyReport: {
          date: {
            gte: startDate,
          },
        },
      },
      select: {
        serviceName: true,
        revenue: true,
        bookingCount: true,
      },
    });

    // Aggregate service data
    const serviceAggregates = serviceRevenue.reduce((acc, service) => {
      if (!acc[service.serviceName]) {
        acc[service.serviceName] = {
          serviceName: service.serviceName,
          totalRevenue: 0,
          totalBookings: 0,
        };
      }
      acc[service.serviceName].totalRevenue += Number(service.revenue);
      acc[service.serviceName].totalBookings += service.bookingCount;
      return acc;
    }, {} as Record<string, any>);

    const topServices = Object.values(serviceAggregates)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    // Employee Performance Summary
    const employeePerformance = await prisma.employeePerformance.findMany({
      where: {
        dailyReport: {
          date: {
            gte: startDate,
          },
        },
      },
      include: {
        employee: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    const employeeAggregates = employeePerformance.reduce((acc, perf) => {
      const employeeId = perf.employeeId;
      if (!acc[employeeId]) {
        acc[employeeId] = {
          employeeId,
          employeeName: perf.employee.name,
          employeeEmail: perf.employee.email,
          totalRevenue: 0,
          totalServices: 0,
          totalCommission: 0,
          totalTips: 0,
          avgRating: 0,
          ratingCount: 0,
        };
      }
      acc[employeeId].totalRevenue += Number(perf.revenue);
      acc[employeeId].totalServices += perf.servicesCompleted;
      acc[employeeId].totalCommission += Number(perf.commission);
      acc[employeeId].totalTips += Number(perf.tips);
      
      if (perf.customerRating) {
        acc[employeeId].avgRating += Number(perf.customerRating);
        acc[employeeId].ratingCount++;
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate average ratings
    Object.values(employeeAggregates).forEach((emp: any) => {
      if (emp.ratingCount > 0) {
        emp.avgRating = emp.avgRating / emp.ratingCount;
      }
    });

    const topEmployees = Object.values(employeeAggregates)
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Summary Statistics
    const totalRevenue = revenueData.reduce((sum, day) => sum + Number(day.totalRevenue), 0);
    const totalBookings = revenueData.reduce((sum, day) => sum + day.totalBookings, 0);
    const avgDailyRevenue = totalRevenue / Math.max(revenueData.length, 1);

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalBookings,
        avgDailyRevenue,
        daysAnalyzed: revenueData.length,
      },
      revenueData,
      topServices,
      topEmployees,
      paymentMethodBreakdown: {
        cash: revenueData.reduce((sum, day) => sum + Number(day.cashPayments), 0),
        card: revenueData.reduce((sum, day) => sum + Number(day.cardPayments), 0),
        digital: revenueData.reduce((sum, day) => sum + Number(day.digitalPayments), 0),
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
