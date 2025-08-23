// 🎯 Points System Test Data Seeder API
import { NextRequest, NextResponse } from 'next/server';
import { PointsService } from '@/lib/points-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// POST /api/crm/points/seed - Create test data for points system
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin roles can seed test data
    const allowedRoles = ['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER'];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get existing users to give test points
    const users = await prisma.user.findMany({
      take: 10,
      select: { id: true, name: true, email: true, loyaltyPoints: true }
    });

    if (users.length === 0) {
      return NextResponse.json({
        error: 'No users found. Create some users first.'
      }, { status: 400 });
    }

    const results = [];

    // Award different amounts of points to different users
    const testData = [
      { points: 2500, reason: 'Welcome bonus - System Test' },
      { points: 1200, reason: 'Birthday bonus - System Test' },
      { points: 3500, reason: 'Premium service bonus - System Test' },
      { points: 800, reason: 'Referral bonus - System Test' },
      { points: 4200, reason: 'Loyalty milestone - System Test' },
      { points: 1500, reason: 'First wash bonus - System Test' },
      { points: 2200, reason: 'Monthly bonus - System Test' },
      { points: 950, reason: 'Review bonus - System Test' },
      { points: 3100, reason: 'VIP upgrade bonus - System Test' },
      { points: 1800, reason: 'Holiday special - System Test' }
    ];

    for (let i = 0; i < Math.min(users.length, testData.length); i++) {
      const user = users[i];
      const data = testData[i];
      
      try {
        const success = await PointsService.awardManualPoints(
          user.id,
          data.points,
          data.reason,
          session.user.id
        );

        results.push({
          user: user.name || user.email,
          points: data.points,
          reason: data.reason,
          success
        });
      } catch (error) {
        console.error(`Error awarding points to ${user.email}:`, error);
        results.push({
          user: user.name || user.email,
          points: data.points,
          reason: data.reason,
          success: false,
          error: error.message
        });
      }
    }

    // Create simulated booking transactions for realistic data
    const bookingResults = [];
    for (let i = 0; i < Math.min(5, users.length); i++) {
      const user = users[i];
      
      try {
        // Simulate different service bookings
        const services = [
          { amount: 8000, service: 'Express Wash', plan: 'BASIC' },
          { amount: 15000, service: 'Premium Wash', plan: 'PREMIUM' },
          { amount: 30000, service: 'Executive Detail', plan: 'ELITE' },
          { amount: 12000, service: 'Deluxe Wash', plan: 'PREMIUM' },
          { amount: 6000, service: 'Quick Clean', plan: 'BASIC' }
        ];
        
        const service = services[i % services.length];
        
        const pointsEarned = await PointsService.awardPoints(
          user.id,
          `test_booking_${Date.now()}_${i}`,
          service.amount,
          service.plan
        );
        
        bookingResults.push({
          user: user.name || user.email,
          service: service.service,
          amount: `R${(service.amount/100).toFixed(2)}`,
          membershipPlan: service.plan,
          pointsEarned
        });
      } catch (error) {
        console.error(`Error creating booking simulation for ${user.email}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Test data created successfully',
      summary: {
        manualAwards: results.length,
        successfulAwards: results.filter(r => r.success).length,
        simulatedBookings: bookingResults.length,
        totalUsersProcessed: users.length
      },
      details: {
        manualAwards: results,
        simulatedBookings: bookingResults
      }
    });

  } catch (error) {
    console.error('Error seeding points test data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to seed test data',
        details: error.message 
      },
      { status: 500 }
    );
  }
}