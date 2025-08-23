// 🎯 User Points API - For Digital Membership Card Integration
import { NextRequest, NextResponse } from 'next/server';
import { PointsService } from '@/lib/points-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/user/points - Get current user's points (for digital card)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Get comprehensive points information
    const pointsBalance = await PointsService.getPointsBalance(userId);
    const config = await PointsService.getConfig();

    // Calculate what the user can get with their current points
    const serviceThresholds = [
      { name: 'Express Wash', points: 8000, price: 'R80' },
      { name: 'Premium Wash', points: 15000, price: 'R150' },
      { name: 'Deluxe Wash', points: 20000, price: 'R200' },
      { name: 'Executive Detail', points: 30000, price: 'R300' }
    ];

    const availableRewards = serviceThresholds.filter(
      service => pointsBalance.currentBalance >= service.points
    );

    const nextReward = serviceThresholds.find(
      service => pointsBalance.currentBalance < service.points
    );

    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email
      },
      points: {
        current: pointsBalance.currentBalance,
        valueInRands: pointsBalance.currentBalance * config.pointValue,
        lifetimeEarned: pointsBalance.lifetimeEarned,
        lifetimeRedeemed: pointsBalance.lifetimeRedeemed,
        expiringBalance: pointsBalance.expiringBalance,
        expiringBalanceValue: pointsBalance.expiringBalance * config.pointValue
      },
      rewards: {
        available: availableRewards,
        next: nextReward ? {
          ...nextReward,
          pointsNeeded: nextReward.points - pointsBalance.currentBalance
        } : null
      },
      transactions: pointsBalance.recentTransactions.slice(0, 5), // Last 5 transactions
      config: {
        pointValue: config.pointValue,
        pointsPerRand: config.pointsPerRand,
        minimumRedemption: config.minimumRedemption,
        maxRedemptionPercent: config.maxRedemptionPercent
      }
    });

  } catch (error) {
    console.error('Error fetching user points:', error);
    return NextResponse.json(
      { error: 'Failed to fetch points data' },
      { status: 500 }
    );
  }
}