import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { getCRMApiKey, getCRMDatabaseUrl } from '@/lib/env';

export async function GET(request: NextRequest) {
  const client = new Client({
    connectionString: getCRMDatabaseUrl(),
  });

  try {
    // Verify API key
    const apiKey = request.headers.get('X-API-Key');
    if (apiKey !== getCRMApiKey()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length < 1) {
      return NextResponse.json({ bookings: [] });
    }

    await client.connect();

    const searchTerm = query.trim();

    // Search bookings with related user, vehicle, and service data
    const searchQuery = `
      SELECT 
        b.id,
        b."bookingDate",
        b."timeSlot",
        b.status,
        b."totalAmount",
        b."createdAt",
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
        p.status as payment_status
      FROM "Booking" b
      JOIN "User" u ON b."userId" = u.id
      JOIN "Vehicle" v ON b."vehicleId" = v.id
      JOIN "Service" s ON b."serviceId" = s.id
      LEFT JOIN "Payment" p ON p."bookingId" = b.id
      WHERE 
        UPPER(b.id) LIKE UPPER($1) OR
        UPPER(CONCAT(u."firstName", ' ', u."lastName")) LIKE UPPER($2) OR
        UPPER(u."firstName") LIKE UPPER($3) OR
        UPPER(u."lastName") LIKE UPPER($4) OR
        UPPER(u.email) LIKE UPPER($5) OR
        u.phone LIKE $6 OR
        UPPER(v."licensePlate") LIKE UPPER($7)
      ORDER BY b."createdAt" DESC
      LIMIT 50
    `;

    const searchPattern = `%${searchTerm}%`;
    const result = await client.query(searchQuery, [
      searchPattern, // booking ID
      searchPattern, // full name
      searchPattern, // first name
      searchPattern, // last name
      searchPattern, // email
      searchPattern, // phone
      searchPattern, // license plate
    ]);

    // Transform the results to match CRM format
    const bookings = result.rows.map((row) => ({
      id: row.id,
      bookingReference: row.id.slice(-8).toUpperCase(), // Generate display reference
      customerName: `${row.firstName} ${row.lastName}`,
      customerEmail: row.email,
      customerPhone: row.phone || 'N/A',
      licensePlate: row.licensePlate,
      serviceName: row.service_name,
      scheduledDate: row.bookingDate.toISOString().split('T')[0],
      scheduledTime: row.timeSlot,
      status: row.status.toLowerCase(),
      totalAmount: Math.round(Number(row.totalAmount) / 100), // Convert from cents
      paymentStatus: row.payment_status?.toLowerCase() || 'pending',
      vehicleDetails: `${row.year} ${row.make} ${row.model}`,
      vehicleColor: row.color,
      servicePrice: Math.round(Number(row.service_price) / 100),
      serviceDuration: row.duration,
      createdAt: row.createdAt.toISOString(),
    }));

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Error searching bookings:', error);
    return NextResponse.json(
      { error: 'Failed to search bookings' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}