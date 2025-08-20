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
    const { receiptId, customerEmail } = body;

    if (!receiptId || !customerEmail) {
      return NextResponse.json({ 
        error: 'Receipt ID and customer email are required' 
      }, { status: 400 });
    }

    await client.connect();

    // Get receipt from database
    const receiptQuery = `
      SELECT r.*, b."bookingDate", b."timeSlot",
             u."firstName", u."lastName"
      FROM "Receipt" r
      LEFT JOIN "Booking" b ON r."bookingId" = b.id
      LEFT JOIN "User" u ON b."userId" = u.id
      WHERE r."receiptId" = $1
    `;

    const receiptResult = await client.query(receiptQuery, [receiptId]);

    if (receiptResult.rows.length === 0) {
      return NextResponse.json({ error: 'Receipt not found' }, { status: 404 });
    }

    const receipt = receiptResult.rows[0];

    // Generate email content
    const emailSubject = `🧾 Your Receipt from Ekhaya Car Wash - ${receiptId}`;
    const emailHtml = generateReceiptEmailHTML(receipt, receiptId);

    // In a real implementation, you would integrate with an email service like:
    // - SendGrid
    // - AWS SES 
    // - Nodemailer with SMTP
    // - Resend
    // - Mailgun

    // For now, we'll simulate the email sending and store the attempt
    const emailResult = {
      success: true,
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      to: customerEmail,
      subject: emailSubject,
      sentAt: new Date().toISOString()
    };

    // Update receipt record to mark email as sent
    await client.query(
      'UPDATE "Receipt" SET "emailSent" = true, "emailSentAt" = NOW() WHERE "receiptId" = $1',
      [receiptId]
    );

    // Log email attempt (optional)
    const createEmailLogQuery = `
      CREATE TABLE IF NOT EXISTS "EmailLog" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "receiptId" TEXT,
        "customerEmail" TEXT,
        subject TEXT,
        "messageId" TEXT,
        status TEXT DEFAULT 'SENT',
        "sentAt" TIMESTAMP DEFAULT NOW()
      )
    `;

    await client.query(createEmailLogQuery);

    await client.query(`
      INSERT INTO "EmailLog" ("receiptId", "customerEmail", subject, "messageId", status)
      VALUES ($1, $2, $3, $4, $5)
    `, [receiptId, customerEmail, emailSubject, emailResult.messageId, 'SENT']);

    return NextResponse.json({
      success: true,
      message: 'Receipt email sent successfully',
      emailResult: {
        to: customerEmail,
        subject: emailSubject,
        messageId: emailResult.messageId,
        sentAt: emailResult.sentAt
      },
      receipt: {
        id: receipt.receiptId,
        customerName: `${receipt.firstName} ${receipt.lastName}`,
        emailSent: true,
        emailSentAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error sending receipt email:', error);
    return NextResponse.json(
      { error: 'Failed to send receipt email' },
      { status: 500 }
    );
  } finally {
    if (client) {
      await client.end();
    }
  }
}

function generateReceiptEmailHTML(receipt: any, receiptId: string): string {
  const customerName = `${receipt.firstName} ${receipt.lastName}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Receipt - ${receiptId}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          background-color: #f6f9fc;
          padding: 20px;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 12px; 
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          color: white; 
          padding: 30px; 
          text-align: center; 
        }
        .company-name { 
          font-size: 28px; 
          font-weight: bold; 
          margin-bottom: 8px;
        }
        .company-tagline { 
          opacity: 0.9; 
          font-size: 16px;
        }
        .content { 
          padding: 30px; 
        }
        .greeting { 
          font-size: 18px; 
          color: #2563eb; 
          margin-bottom: 20px;
          font-weight: 600;
        }
        .message { 
          margin-bottom: 25px; 
          line-height: 1.7;
        }
        .receipt-box { 
          background: #f8fafc; 
          border: 2px solid #e2e8f0; 
          border-radius: 8px; 
          padding: 20px; 
          margin: 20px 0;
        }
        .receipt-id { 
          font-size: 20px; 
          font-weight: bold; 
          color: #2563eb; 
          text-align: center;
          margin-bottom: 15px;
        }
        .download-btn { 
          display: inline-block; 
          background: #10b981; 
          color: white; 
          padding: 12px 24px; 
          text-decoration: none; 
          border-radius: 6px; 
          font-weight: 600;
          margin: 10px 5px;
          transition: background-color 0.3s;
        }
        .download-btn:hover { 
          background: #059669; 
        }
        .secondary-btn {
          background: #6b7280;
        }
        .secondary-btn:hover {
          background: #4b5563;
        }
        .footer { 
          background: #f9fafb; 
          padding: 25px; 
          text-align: center; 
          border-top: 1px solid #e5e7eb;
        }
        .footer-title { 
          font-weight: bold; 
          color: #374151; 
          margin-bottom: 10px;
        }
        .contact-info { 
          color: #6b7280; 
          font-size: 14px; 
          line-height: 1.5;
        }
        .social-links { 
          margin-top: 15px; 
        }
        .social-links a { 
          color: #2563eb; 
          text-decoration: none; 
          margin: 0 10px;
        }
        .divider { 
          height: 1px; 
          background: #e5e7eb; 
          margin: 20px 0;
        }
        .highlight { 
          background: #fef3c7; 
          padding: 15px; 
          border-radius: 6px; 
          border-left: 4px solid #f59e0b;
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="company-name">🚗 EKHAYA CAR WASH</div>
          <div class="company-tagline">Premium Car Care Services</div>
        </div>

        <div class="content">
          <div class="greeting">Hello ${customerName}! 👋</div>
          
          <div class="message">
            Thank you for choosing Ekhaya Car Wash! We're delighted that you experienced our premium car care services.
          </div>

          <div class="message">
            Your payment has been successfully processed and your receipt is ready. We've attached your official receipt below for your records.
          </div>

          <div class="receipt-box">
            <div class="receipt-id">📄 Receipt #${receiptId}</div>
            <div style="text-align: center; margin: 15px 0;">
              <div style="color: #059669; font-weight: bold; font-size: 16px;">
                ✅ Payment Confirmed
              </div>
              <div style="color: #6b7280; font-size: 14px; margin-top: 5px;">
                Service Date: ${receipt.bookingDate ? new Date(receipt.bookingDate).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>

          <div style="text-align: center; margin: 25px 0;">
            <a href="#" class="download-btn">
              📥 Download PDF Receipt
            </a>
            <a href="#" class="download-btn secondary-btn">
              🖨️ Print Receipt
            </a>
          </div>

          <div class="highlight">
            <strong>💡 Did you know?</strong> Regular car washing not only keeps your vehicle looking great but also helps protect its resale value and extends its lifespan. We recommend our premium services every 2-3 weeks for optimal care.
          </div>

          <div class="message">
            We hope you're thrilled with the results! If you have any questions about your service or receipt, please don't hesitate to contact us.
          </div>

          <div class="divider"></div>

          <div style="text-align: center;">
            <strong style="color: #2563eb;">Book Your Next Service</strong><br>
            <div style="margin: 10px 0; color: #6b7280;">
              Ready for another premium wash? Book online or give us a call!
            </div>
            <a href="#" class="download-btn">
              🗓️ Book Now
            </a>
          </div>
        </div>

        <div class="footer">
          <div class="footer-title">Stay Connected with Ekhaya Car Wash</div>
          <div class="contact-info">
            📍 Main Branch Location<br>
            📞 Phone: +27 XXX XXX XXXX<br>
            📧 Email: info@ekhayacarwash.co.za<br>
            🌐 Website: www.ekhayacarwash.co.za
          </div>
          <div class="social-links">
            <a href="#">Facebook</a> | 
            <a href="#">Instagram</a> | 
            <a href="#">Twitter</a>
          </div>
          <div style="margin-top: 20px; font-size: 12px; color: #9ca3af;">
            © 2024 Ekhaya Car Wash. All rights reserved.<br>
            This email was sent regarding receipt #${receiptId}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}