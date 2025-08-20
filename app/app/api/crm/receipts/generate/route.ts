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
    const { receiptData } = body;

    if (!receiptData) {
      return NextResponse.json({ 
        error: 'Receipt data is required' 
      }, { status: 400 });
    }

    // Generate PDF content as base64 (simplified HTML-to-PDF approach)
    const pdfContent = generateReceiptHTML(receiptData);
    
    // In a real implementation, you would use a PDF library like puppeteer, jsPDF, or PDFKit
    // For now, we'll return the HTML content and a simulated PDF base64
    const pdfBase64 = Buffer.from(pdfContent).toString('base64');

    await client.connect();

    // Store receipt record in database
    const createReceiptTableQuery = `
      CREATE TABLE IF NOT EXISTS "Receipt" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "receiptId" TEXT UNIQUE NOT NULL,
        "bookingId" TEXT REFERENCES "Booking"(id),
        "paymentId" TEXT,
        "customerEmail" TEXT,
        "pdfContent" TEXT,
        "emailSent" BOOLEAN DEFAULT false,
        "emailSentAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW()
      )
    `;

    await client.query(createReceiptTableQuery);

    const insertReceiptQuery = `
      INSERT INTO "Receipt" (
        "receiptId",
        "bookingId", 
        "paymentId",
        "customerEmail",
        "pdfContent"
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const receiptResult = await client.query(insertReceiptQuery, [
      receiptData.receiptId,
      receiptData.bookingId,
      receiptData.paymentId,
      receiptData.customerEmail,
      pdfBase64
    ]);

    const receipt = receiptResult.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Receipt generated successfully',
      receipt: {
        id: receipt.id,
        receiptId: receipt.receiptId,
        pdfBase64: pdfBase64,
        downloadUrl: `/api/crm/receipts/download/${receipt.receiptId}`,
        htmlContent: pdfContent
      },
      receiptData
    });

  } catch (error) {
    console.error('Error generating receipt:', error);
    return NextResponse.json(
      { error: 'Failed to generate receipt' },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.end();
    }
  }
}

function generateReceiptHTML(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Receipt - ${data.receiptId}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Arial', sans-serif; 
          line-height: 1.6; 
          color: #333; 
          max-width: 600px; 
          margin: 0 auto; 
          padding: 20px;
          background: white;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px; 
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
        }
        .company-name { 
          font-size: 28px; 
          font-weight: bold; 
          color: #2563eb; 
          margin-bottom: 5px;
        }
        .company-tagline { 
          color: #666; 
          font-size: 14px;
        }
        .receipt-info { 
          background: #f8fafc; 
          padding: 15px; 
          border-radius: 8px; 
          margin-bottom: 20px;
          border-left: 4px solid #2563eb;
        }
        .receipt-id { 
          font-size: 18px; 
          font-weight: bold; 
          color: #2563eb; 
          margin-bottom: 5px;
        }
        .section { 
          margin-bottom: 25px; 
        }
        .section-title { 
          font-size: 16px; 
          font-weight: bold; 
          color: #374151; 
          margin-bottom: 10px;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 5px;
        }
        .info-row { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 8px;
          padding: 5px 0;
        }
        .info-row:nth-child(even) { 
          background: #f9fafb; 
          margin: 0 -10px; 
          padding: 5px 10px;
          border-radius: 4px;
        }
        .label { 
          font-weight: 600; 
          color: #4b5563;
          min-width: 140px;
        }
        .value { 
          color: #111827;
          text-align: right;
          font-weight: 500;
        }
        .amount { 
          font-size: 20px; 
          font-weight: bold; 
          color: #059669;
        }
        .payment-method { 
          background: #dcfce7; 
          color: #166534; 
          padding: 4px 8px; 
          border-radius: 4px; 
          font-size: 12px;
          font-weight: 600;
        }
        .footer { 
          text-align: center; 
          margin-top: 40px; 
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          color: #6b7280;
          font-size: 12px;
        }
        .thank-you { 
          font-size: 18px; 
          color: #2563eb; 
          font-weight: bold; 
          margin-bottom: 10px;
        }
        .status-badge {
          background: #dcfce7;
          color: #166534;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          display: inline-block;
        }
        @media print {
          body { margin: 0; padding: 15px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">🚗 EKHAYA CAR WASH</div>
        <div class="company-tagline">Premium Car Care Services</div>
      </div>

      <div class="receipt-info">
        <div class="receipt-id">Receipt #${data.receiptId}</div>
        <div style="color: #666; font-size: 14px;">
          Generated: ${new Date(data.paymentDate).toLocaleString()}
        </div>
        <div style="margin-top: 8px;">
          <span class="status-badge">✓ PAID</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Customer Information</div>
        <div class="info-row">
          <span class="label">Name:</span>
          <span class="value">${data.customerName}</span>
        </div>
        <div class="info-row">
          <span class="label">Email:</span>
          <span class="value">${data.customerEmail}</span>
        </div>
        <div class="info-row">
          <span class="label">Phone:</span>
          <span class="value">${data.customerPhone || 'N/A'}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Service Details</div>
        <div class="info-row">
          <span class="label">Service:</span>
          <span class="value">${data.serviceName}</span>
        </div>
        <div class="info-row">
          <span class="label">Vehicle:</span>
          <span class="value">${data.vehicleInfo}</span>
        </div>
        <div class="info-row">
          <span class="label">Service Date:</span>
          <span class="value">${new Date(data.serviceDate).toLocaleDateString()}</span>
        </div>
        <div class="info-row">
          <span class="label">Service Time:</span>
          <span class="value">${data.serviceTime}</span>
        </div>
        <div class="info-row">
          <span class="label">Location:</span>
          <span class="value">${data.location}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Payment Information</div>
        <div class="info-row">
          <span class="label">Service Amount:</span>
          <span class="value">R${data.originalAmount.toFixed(2)}</span>
        </div>
        <div class="info-row">
          <span class="label">Amount Paid:</span>
          <span class="value amount">R${data.amountPaid.toFixed(2)}</span>
        </div>
        <div class="info-row">
          <span class="label">Payment Method:</span>
          <span class="value">
            <span class="payment-method">${data.paymentMethod}</span>
          </span>
        </div>
        ${data.paymentReference ? `
        <div class="info-row">
          <span class="label">Reference:</span>
          <span class="value">${data.paymentReference}</span>
        </div>
        ` : ''}
        <div class="info-row">
          <span class="label">Payment Date:</span>
          <span class="value">${new Date(data.paymentDate).toLocaleString()}</span>
        </div>
        <div class="info-row">
          <span class="label">Confirmed By:</span>
          <span class="value">${data.confirmedBy}</span>
        </div>
      </div>

      ${data.notes ? `
      <div class="section">
        <div class="section-title">Notes</div>
        <div style="background: #f9fafb; padding: 10px; border-radius: 4px; font-style: italic;">
          ${data.notes}
        </div>
      </div>
      ` : ''}

      <div class="footer">
        <div class="thank-you">Thank You for Choosing Ekhaya Car Wash!</div>
        <div>We appreciate your business and look forward to serving you again.</div>
        <div style="margin-top: 15px;">
          <strong>Contact Us:</strong><br>
          📍 Main Branch Location<br>
          📞 Phone: +27 XXX XXX XXXX<br>
          📧 Email: info@ekhayacarwash.co.za<br>
          🌐 Website: www.ekhayacarwash.co.za
        </div>
        <div style="margin-top: 15px; font-size: 10px; color: #9ca3af;">
          This is an electronically generated receipt. For any queries, please contact us with receipt #${data.receiptId}
        </div>
      </div>
    </body>
    </html>
  `;
}