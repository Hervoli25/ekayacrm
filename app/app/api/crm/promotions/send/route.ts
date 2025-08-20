import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const API_KEY = 'ekhaya-car-wash-secret-key-2024';
const CAR_WASH_DB_URL = 'postgresql://neondb_owner:npg_Ku1tsfTV4qze@ep-odd-feather-ab7njs2z-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

export async function POST(request: NextRequest) {
  const client = new Client({
    connectionString: CAR_WASH_DB_URL,
  });

  try {
    const apiKey = request.headers.get('X-API-Key');
    if (apiKey !== API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { promotionId, userIds, sendMethod = 'email' } = body;

    if (!promotionId || !userIds || userIds.length === 0) {
      return NextResponse.json({ 
        error: 'Promotion ID and user IDs are required' 
      }, { status: 400 });
    }

    await client.connect();

    // Get promotion details
    const promotionQuery = `
      SELECT * FROM "Promotion" WHERE id = $1
    `;
    const promotionResult = await client.query(promotionQuery, [promotionId]);

    if (promotionResult.rows.length === 0) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 });
    }

    const promotion = promotionResult.rows[0];

    // Get user details
    const usersQuery = `
      SELECT id, "firstName", "lastName", email, phone 
      FROM "User" 
      WHERE id = ANY($1)
    `;
    const usersResult = await client.query(usersQuery, [userIds]);
    const users = usersResult.rows;

    // Create promotion tracking records
    const trackingPromises = users.map(async (user) => {
      const trackingQuery = `
        INSERT INTO "PromotionTracking" (
          "promotionId",
          "userId", 
          "sentAt",
          "sentVia",
          "status"
        ) VALUES ($1, $2, NOW(), $3, 'SENT')
        ON CONFLICT ("promotionId", "userId") 
        DO UPDATE SET "sentAt" = NOW(), "sentVia" = $3, "status" = 'SENT'
      `;
      
      try {
        await client.query(trackingQuery, [promotionId, user.id, sendMethod]);
      } catch (error) {
        // Create table if it doesn't exist
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS "PromotionTracking" (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
            "promotionId" TEXT REFERENCES "Promotion"(id),
            "userId" TEXT REFERENCES "User"(id),
            "sentAt" TIMESTAMP DEFAULT NOW(),
            "sentVia" TEXT DEFAULT 'email',
            "status" TEXT DEFAULT 'SENT',
            "openedAt" TIMESTAMP,
            "clickedAt" TIMESTAMP,
            "usedAt" TIMESTAMP,
            "createdAt" TIMESTAMP DEFAULT NOW(),
            UNIQUE("promotionId", "userId")
          )
        `;
        
        await client.query(createTableQuery);
        await client.query(trackingQuery, [promotionId, user.id, sendMethod]);
      }
    });

    await Promise.all(trackingPromises);

    // Generate promotion link
    const promotionLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/promotions/${promotionId}?code=${promotion.promoCode || ''}`;

    // Create email content
    const emailContent = {
      subject: `🎉 Special Offer: ${promotion.title}`,
      html: generatePromotionEmailHTML(promotion, promotionLink),
      text: generatePromotionEmailText(promotion, promotionLink)
    };

    // In a real implementation, you would integrate with an email service like:
    // - SendGrid
    // - AWS SES
    // - Nodemailer
    // For now, we'll simulate the email sending

    const emailResults = users.map(user => ({
      userId: user.id,
      email: user.email,
      status: 'sent', // In real implementation, this would be the actual send status
      sentAt: new Date().toISOString()
    }));

    // Update promotion sent count
    await client.query(
      'UPDATE "Promotion" SET "usedCount" = "usedCount" + $1 WHERE id = $2',
      [users.length, promotionId]
    );

    return NextResponse.json({
      success: true,
      message: `Promotion sent to ${users.length} customers`,
      results: emailResults,
      promotionLink,
      emailContent: {
        subject: emailContent.subject,
        preview: emailContent.text.substring(0, 100) + '...'
      }
    });

  } catch (error) {
    console.error('Error sending promotion:', error);
    return NextResponse.json(
      { error: 'Failed to send promotion' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}

function generatePromotionEmailHTML(promotion: any, link: string): string {
  const discountText = promotion.discountType === 'PERCENTAGE' 
    ? `${promotion.discountValue}% OFF`
    : `R${promotion.discountValue} OFF`;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .discount-badge { background: #ff4757; color: white; padding: 15px 25px; border-radius: 50px; font-size: 24px; font-weight: bold; display: inline-block; margin: 20px 0; }
        .cta-button { background: #2ed573; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block; margin: 20px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; }
        .promo-image { width: 100%; max-width: 400px; height: 200px; object-fit: cover; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🚗 Ekhaya Car Wash</h1>
          <h2>${promotion.title}</h2>
        </div>
        <div class="content">
          ${promotion.mediaUrl ? `<img src="${promotion.mediaUrl}" alt="${promotion.title}" class="promo-image">` : ''}
          <div class="discount-badge">${discountText}</div>
          <p style="font-size: 18px; line-height: 1.6;">${promotion.description || 'Amazing savings on our premium car wash services!'}</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Offer Details:</h3>
            <ul>
              <li><strong>Discount:</strong> ${discountText}</li>
              ${promotion.minPurchaseAmount > 0 ? `<li><strong>Minimum Purchase:</strong> R${promotion.minPurchaseAmount}</li>` : ''}
              <li><strong>Valid Until:</strong> ${new Date(promotion.endDate).toLocaleDateString()}</li>
              ${promotion.promoCode ? `<li><strong>Promo Code:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px;">${promotion.promoCode}</code></li>` : ''}
            </ul>
          </div>
          
          <div style="text-align: center;">
            <a href="${link}" class="cta-button">BOOK NOW & SAVE!</a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Don't miss out on this limited-time offer! Book your car wash service today and enjoy premium cleaning at unbeatable prices.
          </p>
        </div>
        <div class="footer">
          <p>© 2024 Ekhaya Car Wash. All rights reserved.</p>
          <p>Visit us at our location or book online for convenience!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generatePromotionEmailText(promotion: any, link: string): string {
  const discountText = promotion.discountType === 'PERCENTAGE' 
    ? `${promotion.discountValue}% OFF`
    : `R${promotion.discountValue} OFF`;

  return `
🚗 EKHAYA CAR WASH - SPECIAL OFFER!

${promotion.title}

${discountText}

${promotion.description || 'Amazing savings on our premium car wash services!'}

OFFER DETAILS:
- Discount: ${discountText}
${promotion.minPurchaseAmount > 0 ? `- Minimum Purchase: R${promotion.minPurchaseAmount}` : ''}
- Valid Until: ${new Date(promotion.endDate).toLocaleDateString()}
${promotion.promoCode ? `- Promo Code: ${promotion.promoCode}` : ''}

BOOK NOW: ${link}

Don't miss out on this limited-time offer! Book your car wash service today.

© 2024 Ekhaya Car Wash
  `;
}