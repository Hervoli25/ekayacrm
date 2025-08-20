import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const API_KEY = 'ekhaya-car-wash-secret-key-2024';
const CAR_WASH_DB_URL = 'postgresql://neondb_owner:npg_Ku1tsfTV4qze@ep-odd-feather-ab7njs2z-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

export async function GET(request: NextRequest) {
  const client = new Client({
    connectionString: CAR_WASH_DB_URL,
  });

  try {
    const apiKey = request.headers.get('X-API-Key');
    if (apiKey !== API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '100');

    await client.connect();

    let usersQuery = `
      SELECT 
        u.id,
        u."firstName",
        u."lastName",
        u.email,
        u.phone,
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
        UPPER(u."firstName") LIKE UPPER($${paramIndex}) OR
        UPPER(u."lastName") LIKE UPPER($${paramIndex + 1}) OR
        UPPER(CONCAT(u."firstName", ' ', u."lastName")) LIKE UPPER($${paramIndex + 2}) OR
        UPPER(u.email) LIKE UPPER($${paramIndex + 3})
      )`;
      
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern, searchPattern);
      paramIndex += 4;
    }

    usersQuery += `
      GROUP BY u.id, u."firstName", u."lastName", u.email, u.phone, u."isActive", u."createdAt"
      ORDER BY u."createdAt" DESC
      LIMIT $${paramIndex}
    `;
    
    queryParams.push(limit);

    const result = await client.query(usersQuery, queryParams);

    const users = result.rows.map(row => ({
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      fullName: `${row.firstName} ${row.lastName}`,
      email: row.email,
      phone: row.phone || 'N/A',
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