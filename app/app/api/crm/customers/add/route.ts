import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { getCarWashConfig, validateCarWashApiKey } from '@/lib/config';

export async function POST(request: NextRequest) {
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

    const { firstName, lastName, email, phone } = await request.json();

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUserQuery = 'SELECT id FROM "User" WHERE email = $1';
    const existingUser = await client.query(existingUserQuery, [email]);

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Customer with this email already exists' },
        { status: 409 }
      );
    }

    // Create new customer
    const createUserQuery = `
      INSERT INTO "User" (
        id, 
        "firstName", 
        "lastName", 
        email, 
        phone, 
        "emailVerified", 
        "createdAt", 
        "updatedAt"
      )
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW())
      RETURNING id, "firstName", "lastName", email, phone, "createdAt"
    `;

    const userId = `cust_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const result = await client.query(createUserQuery, [
      userId,
      firstName,
      lastName,
      email,
      phone || null
    ]);

    const newCustomer = result.rows[0];

    return NextResponse.json({
      message: 'Customer added successfully',
      customer: {
        id: newCustomer.id,
        name: `${newCustomer.firstName} ${newCustomer.lastName}`,
        email: newCustomer.email,
        phone: newCustomer.phone || 'N/A',
        totalBookings: 0,
        totalSpent: 0,
        averageRating: 0,
        lastVisit: null,
        loyaltyTier: 'basic',
        status: 'active',
        customerSince: new Date(newCustomer.createdAt).toISOString().split('T')[0],
      }
    });

  } catch (error) {
    console.error('Error adding customer:', error);
    return NextResponse.json(
      { error: 'Failed to add customer' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}