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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '100');

    await client.connect();

    let usersQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        u."isActive",
        u."createdAt",
        COUNT(b.id) as total_bookings,
        MAX(b."createdAt") as last_booking_date
      FROM "User" u
      LEFT JOIN "Booking" b ON b."userId" = u.id
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (search.trim()) {
      usersQuery += ` WHERE (
        UPPER(u.name) LIKE UPPER($${paramIndex}) OR
        UPPER(u.email) LIKE UPPER($${paramIndex + 1})
      )`;
      
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern);
      paramIndex += 2;
    }

    usersQuery += `
      GROUP BY u.id, u.name, u.email, u."isActive", u."createdAt"
      ORDER BY u."createdAt" DESC
      LIMIT $${paramIndex}
    `;
    
    queryParams.push(limit);

    const result = await client.query(usersQuery, queryParams);

    const users = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      fullName: row.name || 'Unknown User',
      email: row.email,
      isActive: row.isActive,
      totalBookings: parseInt(row.total_bookings) || 0,
      lastBookingDate: row.last_booking_date,
      customerType: parseInt(row.total_bookings) >= 5 ? 'VIP' : 
                   parseInt(row.total_bookings) >= 2 ? 'Regular' : 'New'
    }));

    return NextResponse.json({ users });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}