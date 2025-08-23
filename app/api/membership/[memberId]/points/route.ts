// 🎯 Digital Membership Card Points Integration API
import { NextRequest, NextResponse } from 'next/server';
import { PointsService } from '@/lib/points-service';
import { prisma } from '@/lib/db';

// GET /api/membership/[memberId]/points - Get points for digital membership card
export async function GET(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const memberId = params.memberId;
    
    if (!memberId) {
      return NextResponse.json({ error: 'Member ID required' }, { status: 400 });
    }

    // Find user by member ID - assuming you store it in a field
    // You may need to adjust this query based on how you store member IDs
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: memberId },
          { email: { contains: memberId } }, // In case member ID is in email
          // Add other fields where member ID might be stored
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        loyaltyPoints: true,
        createdAt: true
      }
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'Member not found',
        memberId 
      }, { status: 404 });
    }

    // Get detailed points information
    const pointsBalance = await PointsService.getPointsBalance(user.id);
    const config = await PointsService.getConfig();

    // Calculate points value in Rands
    const pointsValue = pointsBalance.currentBalance * config.pointValue;

    return NextResponse.json({
      success: true,
      member: {
        id: memberId,
        name: user.name,
        email: user.email,
        memberSince: user.createdAt
      },
      points: {
        current: pointsBalance.currentBalance,
        valueInRands: pointsValue,
        lifetimeEarned: pointsBalance.lifetimeEarned,
        lifetimeRedeemed: pointsBalance.lifetimeRedeemed,
        expiringBalance: pointsBalance.expiringBalance
      },
      nextRedemption: {
        expressWash: Math.max(0, 8000 - pointsBalance.currentBalance),
        premiumWash: Math.max(0, 15000 - pointsBalance.currentBalance),
        deluxeWash: Math.max(0, 20000 - pointsBalance.currentBalance),
        executiveDetail: Math.max(0, 30000 - pointsBalance.currentBalance)
      }
    });

  } catch (error) {
    console.error('Error fetching member points:', error);
    return NextResponse.json(
      { error: 'Failed to fetch member points' },
      { status: 500 }
    );
  }
}

// POST /api/membership/[memberId]/points - Award points to member (for booking completion)
export async function POST(
  request: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const memberId = params.memberId;
    const body = await request.json();
    const { amount, bookingId, membershipPlan = 'BASIC' } = body;

    if (!memberId || !amount) {
      return NextResponse.json({ 
        error: 'Member ID and amount are required' 
      }, { status: 400 });
    }

    // Find user by member ID
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: memberId },
          { email: { contains: memberId } },
        ]
      }
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'Member not found' 
      }, { status: 404 });
    }

    // Award points
    const pointsEarned = await PointsService.awardPoints(
      user.id,
      bookingId || `booking_${Date.now()}`,
      parseInt(amount),
      membershipPlan
    );

    if (pointsEarned > 0) {
      const updatedBalance = await PointsService.getPointsBalance(user.id);
      
      return NextResponse.json({
        success: true,
        pointsEarned,
        newBalance: updatedBalance.currentBalance,
        member: {
          id: memberId,
          name: user.name,
          email: user.email
        }
      });
    } else {
      return NextResponse.json({
        success: true,
        pointsEarned: 0,
        message: 'Amount below minimum threshold for earning points',
        member: {
          id: memberId,
          name: user.name,
          email: user.email
        }
      });
    }

  } catch (error) {
    console.error('Error awarding points to member:', error);
    return NextResponse.json(
      { error: 'Failed to award points' },
      { status: 500 }
    );
  }
}