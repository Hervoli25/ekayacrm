import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { getCarWashConfig, validateCarWashApiKey } from '@/lib/config';

export async function GET(request: NextRequest) {
  let client: Client;
  
  try {
    // Get secure configuration
    const { databaseUrl } = getCarWashConfig();
    client = new Client({ connectionString: databaseUrl });

    // Verify API key securely (optional for internal requests)
    const apiKey = request.headers.get('X-API-Key');
    if (apiKey && !validateCarWashApiKey(apiKey)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await client.connect();

    // Get current date ranges
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Query today's bookings count
    const todayBookingsResult = await client.query(
      'SELECT COUNT(*) as count FROM "Booking" WHERE "bookingDate" >= $1 AND "bookingDate" < $2',
      [startOfToday, new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)]
    );

    // Query week's revenue (convert from cents to rands)
    const weekRevenueResult = await client.query(
      'SELECT SUM("totalAmount") as total FROM "Booking" WHERE "bookingDate" >= $1 AND status IN ($2, $3)',
      [startOfWeek, 'CONFIRMED', 'COMPLETED']
    );

    // Query booking status counts
    const statusCountsResult = await client.query(`
      SELECT 
        status,
        COUNT(*) as count 
      FROM "Booking" 
      WHERE status IN ('CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW')
      GROUP BY status
    `);

    // Query average rating
    const ratingResult = await client.query(
      'SELECT AVG(rating) as avg_rating FROM "Review" WHERE "isVisible" = true'
    );

    // Query active waitlist (confirmed future bookings that haven't started)
    const waitlistResult = await client.query(
      'SELECT COUNT(*) as count FROM "Booking" WHERE status = $1 AND "bookingDate" >= $2',
      ['CONFIRMED', today]
    );

    // Process results
    const todayBookings = parseInt(todayBookingsResult.rows[0]?.count || 0);
    const weekRevenue = Math.round((parseInt(weekRevenueResult.rows[0]?.total || 0)) / 100); // Convert from cents

    // Process status counts
    const statusCounts = { 
      confirmed: 0, 
      in_progress: 0, 
      completed: 0, 
      cancelled: 0, 
      no_show: 0 
    };
    statusCountsResult.rows.forEach(row => {
      const status = row.status.toLowerCase().replace(' ', '_');
      if (statusCounts.hasOwnProperty(status)) {
        statusCounts[status] = parseInt(row.count);
      }
    });

    const averageRating = parseFloat(ratingResult.rows[0]?.avg_rating || 0);
    const activeWaitlist = parseInt(waitlistResult.rows[0]?.count || 0);

    const stats = {
      todayBookings,
      weekRevenue,
      pendingBookings: statusCounts.confirmed, // Confirmed bookings as "pending" completion
      confirmedBookings: statusCounts.confirmed,
      completedBookings: statusCounts.completed,
      inProgressBookings: statusCounts.in_progress,
      cancelledBookings: statusCounts.cancelled,
      averageRating: Math.round(averageRating * 10) / 10,
      activeWaitlist,
    };

    return NextResponse.json(stats);
    
  } catch (error) {
    console.error('Error fetching CRM stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch CRM statistics' },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.end();
    }
  }
}