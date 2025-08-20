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
    const query = searchParams.get('q') || '';

    if (query.length < 3) {
      return NextResponse.json({ receipts: [] });
    }

    await client.connect();

    // Search for receipt IDs that match the query
    const searchQuery = `
      SELECT 
        r."receiptId",
        r."customerEmail",
        r."createdAt",
        b.id as "bookingId",
        CONCAT(u."firstName", ' ', u."lastName") as "customerName",
        s.name as "serviceName",
        b."totalAmount"
      FROM "Receipt" r
      LEFT JOIN "Booking" b ON r."bookingId" = b.id
      LEFT JOIN "User" u ON b."userId" = u.id  
      LEFT JOIN "Service" s ON b."serviceId" = s.id
      WHERE UPPER(r."receiptId") LIKE UPPER($1)
        OR UPPER(r."customerEmail") LIKE UPPER($1)
        OR UPPER(CONCAT(u."firstName", ' ', u."lastName")) LIKE UPPER($1)
      ORDER BY r."createdAt" DESC
      LIMIT 10
    `;

    const searchPattern = `%${query}%`;
    const result = await client.query(searchQuery, [searchPattern]);

    const receipts = result.rows.map(row => ({
      receiptId: row.receiptId,
      customerEmail: row.customerEmail,
      customerName: row.customerName || 'Unknown',
      serviceName: row.serviceName || 'Unknown',
      amount: row.totalAmount ? parseFloat(row.totalAmount) / 100 : 0,
      createdAt: row.createdAt,
      bookingId: row.bookingId
    }));

    return NextResponse.json({ receipts });

  } catch (error) {
    console.error('Error searching receipts:', error);
    return NextResponse.json(
      { error: 'Failed to search receipts' },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.end();
    }
  }
}