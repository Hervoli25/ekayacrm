import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const API_KEY = 'ekhaya-car-wash-secret-key-2024';
const CAR_WASH_DB_URL = 'postgresql://neondb_owner:npg_Ku1tsfTV4qze@ep-odd-feather-ab7njs2z-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

// GET - Fetch all promotions
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
    const status = searchParams.get('status'); // active, expired, scheduled
    const limit = parseInt(searchParams.get('limit') || '50');

    await client.connect();

    // Create promotions table if it doesn't exist
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS "Promotion" (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        "discountType" TEXT NOT NULL CHECK ("discountType" IN ('PERCENTAGE', 'FIXED_AMOUNT')),
        "discountValue" DECIMAL(10,2) NOT NULL,
        "minPurchaseAmount" DECIMAL(10,2) DEFAULT 0,
        "maxDiscountAmount" DECIMAL(10,2),
        "startDate" DATE NOT NULL,
        "endDate" DATE NOT NULL,
        "isActive" BOOLEAN DEFAULT true,
        "usageLimit" INTEGER,
        "usedCount" INTEGER DEFAULT 0,
        "applicableServices" TEXT[], -- Array of service IDs
        "targetCustomers" TEXT[], -- Array of customer IDs (empty = all customers)
        "promoCode" TEXT UNIQUE,
        "mediaUrl" TEXT, -- URL to uploaded image
        "mediaType" TEXT, -- jpg, png, etc
        "createdBy" TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `;

    await client.query(createTableQuery);

    let promotionsQuery = `
      SELECT 
        p.*,
        CASE 
          WHEN p."endDate" < CURRENT_DATE THEN 'EXPIRED'
          WHEN p."startDate" > CURRENT_DATE THEN 'SCHEDULED'
          WHEN p."isActive" = true THEN 'ACTIVE'
          ELSE 'INACTIVE'
        END as status,
        CASE 
          WHEN p."usageLimit" IS NOT NULL THEN 
            (p."usageLimit" - p."usedCount") 
          ELSE NULL 
        END as remaining_uses
      FROM "Promotion" p
    `;

    const queryParams = [];
    let paramIndex = 1;

    if (status) {
      if (status === 'active') {
        promotionsQuery += ` WHERE p."isActive" = true AND p."startDate" <= CURRENT_DATE AND p."endDate" >= CURRENT_DATE`;
      } else if (status === 'expired') {
        promotionsQuery += ` WHERE p."endDate" < CURRENT_DATE`;
      } else if (status === 'scheduled') {
        promotionsQuery += ` WHERE p."startDate" > CURRENT_DATE`;
      } else if (status === 'inactive') {
        promotionsQuery += ` WHERE p."isActive" = false`;
      }
    }

    promotionsQuery += ` ORDER BY p."createdAt" DESC LIMIT $${paramIndex}`;
    queryParams.push(limit);

    const result = await client.query(promotionsQuery, queryParams);

    const promotions = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      discountType: row.discountType,
      discountValue: parseFloat(row.discountValue),
      minPurchaseAmount: parseFloat(row.minPurchaseAmount || 0),
      maxDiscountAmount: row.maxDiscountAmount ? parseFloat(row.maxDiscountAmount) : null,
      startDate: row.startDate,
      endDate: row.endDate,
      isActive: row.isActive,
      status: row.status,
      usageLimit: row.usageLimit,
      usedCount: row.usedCount,
      remainingUses: row.remaining_uses,
      applicableServices: row.applicableServices || [],
      targetCustomers: row.targetCustomers || [],
      promoCode: row.promoCode,
      mediaUrl: row.mediaUrl,
      mediaType: row.mediaType,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));

    return NextResponse.json({ promotions });

  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promotions' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}

// POST - Create new promotion
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
    const {
      title,
      description,
      discountType,
      discountValue,
      minPurchaseAmount = 0,
      maxDiscountAmount,
      startDate,
      endDate,
      isActive = true,
      usageLimit,
      applicableServices = [],
      targetCustomers = [],
      promoCode,
      mediaUrl,
      mediaType,
      createdBy
    } = body;

    // Validation
    if (!title || !discountType || !discountValue || !startDate || !endDate || !createdBy) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, discountType, discountValue, startDate, endDate, createdBy' 
      }, { status: 400 });
    }

    if (new Date(endDate) <= new Date(startDate)) {
      return NextResponse.json({ 
        error: 'End date must be after start date' 
      }, { status: 400 });
    }

    await client.connect();

    const insertQuery = `
      INSERT INTO "Promotion" (
        title, description, "discountType", "discountValue", 
        "minPurchaseAmount", "maxDiscountAmount", "startDate", "endDate",
        "isActive", "usageLimit", "applicableServices", "targetCustomers",
        "promoCode", "mediaUrl", "mediaType", "createdBy"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;

    const result = await client.query(insertQuery, [
      title,
      description,
      discountType,
      discountValue,
      minPurchaseAmount,
      maxDiscountAmount,
      startDate,
      endDate,
      isActive,
      usageLimit,
      applicableServices,
      targetCustomers,
      promoCode,
      mediaUrl,
      mediaType,
      createdBy
    ]);

    const promotion = result.rows[0];

    return NextResponse.json({
      success: true,
      message: 'Promotion created successfully',
      promotion: {
        id: promotion.id,
        title: promotion.title,
        description: promotion.description,
        discountType: promotion.discountType,
        discountValue: parseFloat(promotion.discountValue),
        startDate: promotion.startDate,
        endDate: promotion.endDate,
        promoCode: promotion.promoCode,
        mediaUrl: promotion.mediaUrl,
        createdAt: promotion.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating promotion:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return NextResponse.json(
        { error: 'Promo code already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create promotion' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}