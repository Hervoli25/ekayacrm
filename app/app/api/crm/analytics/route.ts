import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { getCarWashConfig, validateCarWashApiKey } from '@/lib/config';

export async function GET(request: NextRequest) {
  try {
    // Get secure configuration
    const { databaseUrl } = getCarWashConfig();

    const client = new Client({
      connectionString: databaseUrl,
    });

    // Verify API key securely
    const apiKey = request.headers.get('X-API-Key');
    if (!validateCarWashApiKey(apiKey)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await client.connect();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week';

    const now = new Date();
    let startDate: Date;
    let endDate = new Date();

    // Calculate date range based on period
    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    }

    // Fetch bookings with service and user data
    const bookingsQuery = `
      SELECT 
        b."totalAmount",
        b."bookingDate",
        b."timeSlot",
        s.name as service_name,
        s.category as service_category,
        s.price as service_price,
        u."firstName",
        u."lastName",
        u.id as user_id
      FROM "Booking" b
      JOIN "Service" s ON b."serviceId" = s.id
      JOIN "User" u ON b."userId" = u.id
      WHERE b."bookingDate" >= $1 
        AND b."bookingDate" <= $2
        AND b.status IN ('CONFIRMED', 'COMPLETED')
      ORDER BY b."bookingDate" ASC
    `;

    const bookingsResult = await client.query(bookingsQuery, [startDate, endDate]);
    const bookings = bookingsResult.rows;

    // Calculate revenue metrics (convert from cents)
    const totalRevenue = Math.round(bookings.reduce(
      (sum, booking) => sum + Number(booking.totalAmount),
      0
    ) / 100);

    const totalBookings = bookings.length;
    const avgOrderValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

    // Service performance analysis
    const servicePerformance = bookings.reduce((acc, booking) => {
      const serviceName = booking.service_name;
      if (!acc[serviceName]) {
        acc[serviceName] = {
          name: serviceName,
          revenue: 0,
          bookings: 0,
          growth: 5 + Math.random() * 10 // Mock growth for now
        };
      }
      acc[serviceName].revenue += Math.round(Number(booking.totalAmount) / 100);
      acc[serviceName].bookings += 1;
      return acc;
    }, {} as Record<string, any>);

    const serviceStats = Object.values(servicePerformance).map((service: any) => ({
      ...service,
      percentage: totalRevenue > 0 ? Math.round((service.revenue / totalRevenue) * 100) : 0,
    }));

    // Hourly revenue pattern
    const hourlyRevenue = bookings.reduce((acc, booking) => {
      const hour = booking.timeSlot.split(':')[0];
      if (!acc[hour]) {
        acc[hour] = {
          hour,
          revenue: 0,
        };
      }
      acc[hour].revenue += Math.round(Number(booking.totalAmount) / 100);
      return acc;
    }, {} as Record<string, any>);

    // Customer metrics
    const uniqueCustomers = new Set(bookings.map((b) => b.user_id)).size;

    return NextResponse.json({
      period,
      dateRange: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
      revenue: {
        total: totalRevenue,
        change: 8 + Math.random() * 5, // Mock change for now
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      },
      bookings: {
        total: totalBookings,
        change: 5 + Math.random() * 10, // Mock change
      },
      customers: {
        unique: uniqueCustomers,
        retentionRate: 65 + Math.random() * 20, // Mock retention rate
      },
      servicePerformance: serviceStats.sort((a, b) => b.revenue - a.revenue),
      hourlyPattern: Object.values(hourlyRevenue).sort((a: any, b: any) => 
        parseInt(a.hour) - parseInt(b.hour)
      ),
      targets: {
        monthlyTarget: 35000,
        currentProgress: totalRevenue,
        progressPercentage: (totalRevenue / 35000) * 100,
      },
      customerSatisfaction: {
        rating: '4.7',
        change: 3
      },
      insights: {
        bestDay: 'Saturday',
        peakHour: '14:00',
        topService: serviceStats.length > 0 ? serviceStats[0].name : 'Premium Wash & Wax'
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}