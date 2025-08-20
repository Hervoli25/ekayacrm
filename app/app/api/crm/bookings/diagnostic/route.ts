import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const API_KEY = 'ekhaya-car-wash-secret-key-2024';
const CAR_WASH_DB_URL = 'postgresql://neondb_owner:npg_Ku1tsfTV4qze@ep-odd-feather-ab7njs2z-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

export async function GET(request: NextRequest) {
  const client = new Client({
    connectionString: CAR_WASH_DB_URL,
  });

  try {
    // Verify API key
    const apiKey = request.headers.get('X-API-Key');
    if (apiKey !== API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await client.connect();

    // Get unique status values and their counts
    const statusDistributionQuery = `
      SELECT 
        status,
        COUNT(*) as count,
        COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() as percentage
      FROM "Booking"
      GROUP BY status
      ORDER BY count DESC
    `;

    const statusResult = await client.query(statusDistributionQuery);

    // Get bookings by date for recent bookings (last 7 days)
    const recentBookingsQuery = `
      SELECT 
        DATE("bookingDate") as booking_date,
        status,
        COUNT(*) as count
      FROM "Booking"
      WHERE "bookingDate" >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE("bookingDate"), status
      ORDER BY booking_date DESC, status
    `;

    const recentBookingsResult = await client.query(recentBookingsQuery);

    // Get specific analysis of yesterday's bookings
    const yesterdayAnalysisQuery = `
      SELECT 
        b.id,
        b."bookingDate",
        b."timeSlot",
        b.status,
        b."createdAt",
        b."updatedAt",
        u."firstName",
        u."lastName",
        s.name as service_name,
        CASE 
          WHEN b."bookingDate" < CURRENT_DATE THEN 'overdue'
          WHEN b."bookingDate" = CURRENT_DATE THEN 'today'
          ELSE 'future'
        END as date_category
      FROM "Booking" b
      JOIN "User" u ON b."userId" = u.id
      JOIN "Service" s ON b."serviceId" = s.id
      WHERE DATE(b."bookingDate") = CURRENT_DATE - INTERVAL '1 day'
        OR (DATE(b."bookingDate") < CURRENT_DATE AND b.status IN ('CONFIRMED', 'IN_PROGRESS'))
      ORDER BY b."bookingDate" DESC, b."timeSlot"
    `;

    const yesterdayBookingsResult = await client.query(yesterdayAnalysisQuery);

    // Get total booking counts
    const totalBookingsQuery = `
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN "bookingDate" >= CURRENT_DATE THEN 1 END) as future_bookings,
        COUNT(CASE WHEN "bookingDate" < CURRENT_DATE THEN 1 END) as past_bookings,
        COUNT(CASE WHEN DATE("bookingDate") = CURRENT_DATE - INTERVAL '1 day' THEN 1 END) as yesterday_bookings
      FROM "Booking"
    `;

    const totalCountsResult = await client.query(totalBookingsQuery);

    // Get status transition recommendations
    const statusTransitionAnalysis = `
      SELECT 
        status,
        COUNT(*) as count,
        COUNT(CASE WHEN "bookingDate" < CURRENT_DATE THEN 1 END) as past_date_count,
        COUNT(CASE WHEN "bookingDate" < CURRENT_DATE - INTERVAL '1 day' THEN 1 END) as very_old_count,
        array_agg(DISTINCT 
          CASE 
            WHEN "bookingDate" < CURRENT_DATE THEN 
              CONCAT(DATE("bookingDate"), ' (', "timeSlot", ')')
          END
        ) FILTER (WHERE "bookingDate" < CURRENT_DATE) as sample_old_dates
      FROM "Booking"
      GROUP BY status
      ORDER BY count DESC
    `;

    const statusTransitionResult = await client.query(statusTransitionAnalysis);

    // Build diagnostic report
    const diagnosticReport = {
      summary: {
        total_bookings: parseInt(totalCountsResult.rows[0].total_bookings),
        future_bookings: parseInt(totalCountsResult.rows[0].future_bookings),
        past_bookings: parseInt(totalCountsResult.rows[0].past_bookings),
        yesterday_bookings: parseInt(totalCountsResult.rows[0].yesterday_bookings),
      },
      status_distribution: statusResult.rows.map(row => ({
        status: row.status,
        count: parseInt(row.count),
        percentage: parseFloat(row.percentage).toFixed(1) + '%'
      })),
      recent_bookings_by_date: recentBookingsResult.rows.map(row => ({
        date: row.booking_date.toISOString().split('T')[0],
        status: row.status,
        count: parseInt(row.count)
      })),
      yesterday_analysis: {
        bookings: yesterdayBookingsResult.rows.map(row => ({
          id: row.id,
          booking_date: row.bookingDate.toISOString().split('T')[0],
          time_slot: row.timeSlot,
          status: row.status,
          customer: `${row.firstName} ${row.lastName}`,
          service: row.service_name,
          created_at: row.createdAt,
          updated_at: row.updatedAt,
          date_category: row.date_category,
          should_be_completed: row.date_category === 'overdue' && ['CONFIRMED', 'IN_PROGRESS'].includes(row.status)
        }))
      },
      status_transition_analysis: statusTransitionResult.rows.map(row => ({
        status: row.status,
        total_count: parseInt(row.count),
        past_date_count: parseInt(row.past_date_count || 0),
        very_old_count: parseInt(row.very_old_count || 0),
        needs_attention: parseInt(row.past_date_count || 0) > 0 && ['CONFIRMED', 'IN_PROGRESS'].includes(row.status),
        sample_old_dates: row.sample_old_dates?.filter(date => date !== null).slice(0, 5) || []
      })),
      business_logic_recommendations: {
        confirmed_to_in_progress: "Bookings should move from CONFIRMED to IN_PROGRESS when service starts",
        in_progress_to_completed: "Bookings should move from IN_PROGRESS to COMPLETED when service finishes", 
        auto_complete_overdue: "Consider auto-completing bookings that are past their scheduled date + duration",
        status_workflow: [
          "CONFIRMED → IN_PROGRESS (when service starts)",
          "IN_PROGRESS → COMPLETED (when service finishes)",
          "Any → CANCELLED (if cancelled by customer/staff)",
          "CONFIRMED → NO_SHOW (if customer doesn't arrive)"
        ]
      },
      issues_found: []
    };

    // Add issues to report
    statusTransitionResult.rows.forEach(row => {
      if (['CONFIRMED', 'IN_PROGRESS'].includes(row.status) && parseInt(row.past_date_count || 0) > 0) {
        diagnosticReport.issues_found.push({
          issue: `${row.status} bookings with past dates`,
          count: parseInt(row.past_date_count),
          severity: 'HIGH',
          recommendation: row.status === 'CONFIRMED' 
            ? 'These bookings should be marked as COMPLETED, NO_SHOW, or CANCELLED'
            : 'These IN_PROGRESS bookings should be marked as COMPLETED'
        });
      }
    });

    return NextResponse.json(diagnosticReport);
  } catch (error) {
    console.error('Error running booking diagnostic:', error);
    return NextResponse.json(
      { error: 'Failed to run diagnostic', details: error.message },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}

// Helper endpoint to bulk update old bookings
export async function POST(request: NextRequest) {
  const client = new Client({
    connectionString: CAR_WASH_DB_URL,
  });

  try {
    // Verify API key
    const apiKey = request.headers.get('X-API-Key');
    if (apiKey !== API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, booking_ids } = await request.json();

    if (action !== 'bulk_complete_old') {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    await client.connect();

    // Update old confirmed/in_progress bookings to completed
    const updateQuery = `
      UPDATE "Booking"
      SET status = 'COMPLETED', "updatedAt" = NOW()
      WHERE "bookingDate" < CURRENT_DATE
        AND status IN ('CONFIRMED', 'IN_PROGRESS')
        ${booking_ids?.length > 0 ? `AND id = ANY($1)` : ''}
      RETURNING id, status, "bookingDate", "timeSlot"
    `;

    const queryParams = booking_ids?.length > 0 ? [booking_ids] : [];
    const result = await client.query(updateQuery, queryParams);

    return NextResponse.json({
      message: `Successfully updated ${result.rows.length} bookings to COMPLETED`,
      updated_bookings: result.rows
    });
  } catch (error) {
    console.error('Error bulk updating bookings:', error);
    return NextResponse.json(
      { error: 'Failed to update bookings', details: error.message },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}