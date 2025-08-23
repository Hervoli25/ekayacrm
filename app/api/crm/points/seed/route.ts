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

    // Only super admin can seed test data
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get a few existing users to give test points
    const users = await prisma.user.findMany({
      take: 5,
      select: { id: true, name: true, email: true }
    });

    if (users.length === 0) {
      return NextResponse.json({
        error: 'No users found. Create some users first.'
      }, { status: 400 });
    }

    const results = [];

    // Award different amounts of points to different users
    const testData = [
      { points: 2500, reason: 'Welcome bonus' },
      { points: 1200, reason: 'Birthday bonus' },
      { points: 3500, reason: 'Premium service bonus' },
      { points: 800, reason: 'Referral bonus' },
      { points: 4200, reason: 'Loyalty milestone bonus' }
    ];

    for (let i = 0; i < Math.min(users.length, testData.length); i++) {
      const user = users[i];
      const data = testData[i];
      
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
    }

    // Create a few transactions with booking IDs to simulate real usage
    if (users.length > 0) {
      const simulatedBookingResults = [];
      
      for (let i = 0; i < Math.min(3, users.length); i++) {
        const user = users[i];
        
        // Simulate booking completion - R150 service (Premium member)
        const pointsEarned = await PointsService.awardPoints(
          user.id,
          `booking_sim_${Date.now()}_${i}`,
          15000, // R150 in cents
          'PREMIUM' // 1.5x multiplier
        );
        
        simulatedBookingResults.push({
          user: user.name || user.email,
          bookingAmount: 'R150',
          pointsEarned,
          membershipPlan: 'PREMIUM'
        });
      }
      
      results.push({
        type: 'simulated_bookings',
        data: simulatedBookingResults
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Test data created successfully',
      results,
      totalUsers: users.length,
      totalTestTransactions: results.length
    });

  } catch (error) {
    console.error('Error seeding points test data:', error);
    return NextResponse.json(
      { error: 'Failed to seed test data' },
      { status: 500 }
    );
  }
}