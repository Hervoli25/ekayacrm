import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

const API_KEY = 'ekhaya-car-wash-secret-key-2024';
const CAR_WASH_DB_URL = 'postgresql://neondb_owner:npg_Ku1tsfTV4qze@ep-odd-feather-ab7njs2z-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require';

export async function GET(request: NextRequest) {
  const client = new Client({
    connectionString: CAR_WASH_DB_URL,
  });

  try {
    // Verify API key
    const apiKey = request.headers.get('X-API-Key');
    if (apiKey !== API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await client.connect();

    // Simple query to get users
    const customersQuery = `
      SELECT 
        id,
        "firstName",
        "lastName", 
        email,
        phone,
        "createdAt"
      FROM "User"
      ORDER BY "createdAt" DESC
      LIMIT 50
    `;

    const customersResult = await client.query(customersQuery);

    // Get real data for each customer
    const transformedCustomers = [];
    
    for (const customer of customersResult.rows) {
      // Get booking statistics
      const bookingStatsQuery = `
        SELECT 
          COUNT(*) as total_bookings,
          COALESCE(SUM(CASE WHEN status = 'COMPLETED' THEN "totalAmount" ELSE 0 END), 0) as total_spent,
          MAX("bookingDate") as last_visit
        FROM "Booking" 
        WHERE "userId" = $1
      `;
      const bookingStats = await client.query(bookingStatsQuery, [customer.id]);
      
      // Get vehicles
      const vehiclesQuery = `
        SELECT "licensePlate", make, model, year 
        FROM "Vehicle" 
        WHERE "userId" = $1
        LIMIT 3
      `;
      const vehicles = await client.query(vehiclesQuery, [customer.id]);

      // Get average rating
      const ratingQuery = `
        SELECT COALESCE(AVG(r.rating), 0) as avg_rating
        FROM "Review" r
        JOIN "Booking" b ON r."bookingId" = b.id
        WHERE b."userId" = $1
      `;
      const rating = await client.query(ratingQuery, [customer.id]);

      const totalBookings = parseInt(bookingStats.rows[0]?.total_bookings) || 0;
      const totalSpent = Math.round(parseInt(bookingStats.rows[0]?.total_spent) / 100) || 0; // Convert from cents
      const avgRating = parseFloat(rating.rows[0]?.avg_rating) || 0;
      const lastVisit = bookingStats.rows[0]?.last_visit;

      // Calculate loyalty tier based on spending (basic/premium only)
      const loyaltyTier = totalSpent >= 1000 ? 'premium' : 'basic';

      // Determine customer status
      const daysSinceLastBooking = lastVisit
        ? Math.floor((new Date().getTime() - new Date(lastVisit).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      let status = 'active';
      if (totalSpent >= 2000) {
        status = 'vip';
      } else if (daysSinceLastBooking && daysSinceLastBooking > 90) {
        status = 'inactive';
      }

      // Process vehicle data
      const vehicleDetails = vehicles.rows.map(v => `${v.year} ${v.make} ${v.model}`);
      const licensePlates = vehicles.rows.map(v => v.licensePlate);

      transformedCustomers.push({
        id: customer.id,
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        phone: customer.phone || 'N/A',
        totalBookings,
        totalSpent,
        averageRating: Math.round(avgRating * 10) / 10,
        lastVisit: lastVisit ? new Date(lastVisit).toISOString().split('T')[0] : null,
        loyaltyTier,
        status,
        preferredServices: ['Express Exterior Wash', 'Premium Wash & Wax'],
        vehicles: licensePlates,
        vehicleDetails,
        customerSince: new Date(customer.createdAt).toISOString().split('T')[0],
      });
    }

    return NextResponse.json({
      customers: transformedCustomers,
      summary: {
        totalCustomers: transformedCustomers.length,
        vipCustomers: transformedCustomers.filter(c => c.status === 'vip').length,
        activeCustomers: transformedCustomers.filter(c => c.status === 'active').length,
        inactiveCustomers: transformedCustomers.filter(c => c.status === 'inactive').length,
        averageRating: transformedCustomers.length > 0 ? 
          Math.round((transformedCustomers.reduce((sum, c) => sum + c.averageRating, 0) / transformedCustomers.length) * 10) / 10 : 0,
        averageSpent: transformedCustomers.length > 0 ? 
          Math.round(transformedCustomers.reduce((sum, c) => sum + c.totalSpent, 0) / transformedCustomers.length) : 0,
        loyaltyDistribution: {
          basic: transformedCustomers.filter(c => c.loyaltyTier === 'basic').length,
          premium: transformedCustomers.filter(c => c.loyaltyTier === 'premium').length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}