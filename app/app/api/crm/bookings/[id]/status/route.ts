import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { getCarWashConfig, validateCarWashApiKey } from '@/lib/config';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { status } = await request.json();
    const bookingId = params.id;

    // Validate status
    const validStatuses = ['CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'];
    const upperStatus = status.toUpperCase().replace('_', '_').replace('-', '_');
    
    let finalStatus = upperStatus;
    if (upperStatus === 'PENDING') finalStatus = 'CONFIRMED';
    if (upperStatus === 'IN_PROGRESS') finalStatus = 'IN_PROGRESS';
    
    if (!validStatuses.includes(finalStatus)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: confirmed, in_progress, completed, cancelled, no_show' },
        { status: 400 }
      );
    }

    // Update booking status
    const updateQuery = `
      UPDATE "Booking" 
      SET status = $1, "updatedAt" = NOW()
      WHERE id = $2
      RETURNING id, status, "updatedAt"
    `;

    const result = await client.query(updateQuery, [finalStatus, bookingId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const updatedBooking = result.rows[0];

    return NextResponse.json({
      message: 'Booking status updated successfully',
      booking: {
        id: updatedBooking.id,
        status: updatedBooking.status.toLowerCase(),
        updatedAt: updatedBooking.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    return NextResponse.json(
      { error: 'Failed to update booking status' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}