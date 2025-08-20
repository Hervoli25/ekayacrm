import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { getCarWashConfig, validateCarWashApiKey } from '@/lib/config';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      bookingId,
      paymentMethod = 'CASH',
      amountPaid,
      paymentReference,
      notes,
      confirmedBy
    } = body;

    if (!bookingId || !amountPaid || !confirmedBy) {
      return NextResponse.json({ 
        error: 'Missing required fields: bookingId, amountPaid, confirmedBy' 
      }, { status: 400 });
    }

    await client.connect();

    // Get booking details
    const bookingQuery = `
      SELECT 
        b.*,
        u."firstName",
        u."lastName",
        u.email,
        u.phone,
        s.name as service_name,
        s.price as service_price,
        v."licensePlate",
        v.make,
        v.model,
        v.year
      FROM "Booking" b
      JOIN "User" u ON b."userId" = u.id
      JOIN "Service" s ON b."serviceId" = s.id
      JOIN "Vehicle" v ON b."vehicleId" = v.id
      WHERE b.id = $1
    `;

    const bookingResult = await client.query(bookingQuery, [bookingId]);

    if (bookingResult.rows.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = bookingResult.rows[0];

    // Create or update payment record
    const paymentQuery = `
      INSERT INTO "Payment" (
        id,
        "bookingId",
        amount,
        "paymentMethod",
        status,
        "paymentReference",
        "paidAt",
        "confirmedBy",
        notes,
        "createdAt",
        "updatedAt"
      ) VALUES (
        gen_random_uuid(),
        $1, $2, $3, 'COMPLETED', $4, NOW(), $5, $6, NOW(), NOW()
      )
      ON CONFLICT ("bookingId") 
      DO UPDATE SET
        amount = EXCLUDED.amount,
        "paymentMethod" = EXCLUDED."paymentMethod",
        status = EXCLUDED.status,
        "paymentReference" = EXCLUDED."paymentReference",
        "paidAt" = EXCLUDED."paidAt",
        "confirmedBy" = EXCLUDED."confirmedBy",
        notes = EXCLUDED.notes,
        "updatedAt" = NOW()
      RETURNING *
    `;

    // First check if Payment table exists and get its structure
    const checkTableQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Payment' AND table_schema = 'public'
    `;
    
    const tableCheck = await client.query(checkTableQuery);
    const existingColumns = tableCheck.rows.map(row => row.column_name);

    // Create or update Payment table with correct structure
    if (existingColumns.length === 0) {
      // Table doesn't exist, create it
      const createPaymentTableQuery = `
        CREATE TABLE IF NOT EXISTS "Payment" (
          id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
          "bookingId" TEXT UNIQUE REFERENCES "Booking"(id),
          amount DECIMAL(10,2) NOT NULL,
          "paymentMethod" TEXT DEFAULT 'CASH',
          status TEXT DEFAULT 'PENDING',
          "paymentReference" TEXT,
          "paidAt" TIMESTAMP,
          "confirmedBy" TEXT,
          notes TEXT,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        )
      `;
      await client.query(createPaymentTableQuery);
    } else {
      // Table exists, add missing columns if needed
      const requiredColumns = [
        { name: 'paymentMethod', type: 'TEXT', default: "'CASH'" },
        { name: 'paymentReference', type: 'TEXT', default: null },
        { name: 'confirmedBy', type: 'TEXT', default: null },
        { name: 'notes', type: 'TEXT', default: null },
        { name: 'paidAt', type: 'TIMESTAMP', default: null }
      ];

      for (const col of requiredColumns) {
        if (!existingColumns.includes(col.name)) {
          const alterQuery = col.default 
            ? `ALTER TABLE "Payment" ADD COLUMN "${col.name}" ${col.type} DEFAULT ${col.default}`
            : `ALTER TABLE "Payment" ADD COLUMN "${col.name}" ${col.type}`;
          
          try {
            await client.query(alterQuery);
            console.log(`Added column ${col.name} to Payment table`);
          } catch (error) {
            console.log(`Column ${col.name} may already exist:`, error.message);
          }
        }
      }
    }

    const paymentResult = await client.query(paymentQuery, [
      bookingId,
      amountPaid,
      paymentMethod,
      paymentReference,
      confirmedBy,
      notes
    ]);

    const payment = paymentResult.rows[0];

    // Update booking status to completed
    await client.query(
      'UPDATE "Booking" SET status = $1, "updatedAt" = NOW() WHERE id = $2',
      ['COMPLETED', bookingId]
    );

    // Generate receipt data
    const receiptData = {
      receiptId: `RCP-${Date.now()}-${bookingId.slice(-6).toUpperCase()}`,
      paymentId: payment.id,
      bookingId: bookingId,
      customerName: `${booking.firstName} ${booking.lastName}`,
      customerEmail: booking.email,
      customerPhone: booking.phone,
      serviceName: booking.service_name,
      vehicleInfo: `${booking.year} ${booking.make} ${booking.model} (${booking.licensePlate})`,
      serviceDate: booking.bookingDate,
      serviceTime: booking.timeSlot,
      originalAmount: parseFloat(booking.totalAmount) / 100,
      amountPaid: parseFloat(amountPaid),
      paymentMethod: paymentMethod,
      paymentReference: paymentReference,
      paymentDate: new Date().toISOString(),
      confirmedBy: confirmedBy,
      location: 'Ekhaya Car Wash - Main Branch',
      notes: notes
    };

    return NextResponse.json({
      success: true,
      message: 'Payment confirmed successfully',
      payment: {
        id: payment.id,
        status: payment.status,
        amount: parseFloat(payment.amount),
        method: payment.paymentMethod,
        paidAt: payment.paidAt,
        confirmedBy: payment.confirmedBy
      },
      receipt: receiptData,
      booking: {
        id: booking.id,
        status: 'COMPLETED',
        customer: `${booking.firstName} ${booking.lastName}`,
        service: booking.service_name,
        vehicle: `${booking.year} ${booking.make} ${booking.model}`
      }
    });

  } catch (error) {
    console.error('Error confirming payment:', error);
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.end();
    }
  }
}