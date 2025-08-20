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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');

    await client.connect();

    // Fetch all bookings with related user, vehicle, and service data
    let bookingsQuery = `
      SELECT 
        b.id,
        b."bookingDate",
        b."timeSlot",
        b.status,
        b."totalAmount",
        b."createdAt",
        b.notes,
        u."firstName",
        u."lastName",
        u.email,
        u.phone,
        v."licensePlate",
        v.make,
        v.model,
        v.year,
        v.color,
        s.name as service_name,
        s.price as service_price,
        s.duration,
        p.status as payment_status,
        r.rating,
        r.comment as feedback
      FROM "Booking" b
      JOIN "User" u ON b."userId" = u.id
      JOIN "Vehicle" v ON b."vehicleId" = v.id
      JOIN "Service" s ON b."serviceId" = s.id
      LEFT JOIN "Payment" p ON p."bookingId" = b.id
      LEFT JOIN "Review" r ON r."userId" = b."userId" AND r."serviceId" = b."serviceId"
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      bookingsQuery += ` WHERE UPPER(b.status) = UPPER($${paramIndex})`;
      queryParams.push(status);
      paramIndex++;
    }

    bookingsQuery += ` ORDER BY b."createdAt" DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const result = await client.query(bookingsQuery, queryParams);

    // Transform the results to match CRM format
    const bookings = result.rows.map((row) => ({
      id: row.id,
      bookingReference: row.id.slice(-8).toUpperCase(),
      customerName: `${row.firstName} ${row.lastName}`,
      customerEmail: row.email,
      customerPhone: row.phone || 'N/A',
      licensePlate: row.licensePlate,
      serviceName: row.service_name,
      scheduledDate: row.bookingDate.toISOString().split('T')[0],
      scheduledTime: row.timeSlot,
      status: row.status.toLowerCase(),
      totalAmount: Math.round(Number(row.totalAmount) / 100),
      paymentStatus: row.payment_status?.toLowerCase() || 'pending',
      vehicleDetails: `${row.year} ${row.make} ${row.model}`,
      vehicleColor: row.color,
      servicePrice: Math.round(Number(row.service_price) / 100),
      serviceDuration: row.duration,
      createdAt: row.createdAt.toISOString(),
      rating: row.rating ? Number(row.rating) : undefined,
      feedback: row.feedback || undefined,
      notes: row.notes || undefined,
      location: 'Main Branch' // Default location
    }));

    // Get total count for pagination
    const countQuery = status && status !== 'all' 
      ? `SELECT COUNT(*) FROM "Booking" WHERE UPPER(status) = UPPER($1)`
      : `SELECT COUNT(*) FROM "Booking"`;
    
    const countParams = status && status !== 'all' ? [status] : [];
    const countResult = await client.query(countQuery, countParams);
    const totalCount = parseInt(countResult.rows[0].count);

    return NextResponse.json({ 
      bookings,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}