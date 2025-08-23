// 🎯 Booking Points Integration API
import { NextRequest, NextResponse } from 'next/server';
import { PointsService } from '@/lib/points-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// POST /api/crm/bookings/[id]/points - Award points when booking is completed
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookingId = params.id;
    const body = await request.json();
    const { userId, amount, membershipPlan = 'BASIC' } = body;

    if (!bookingId || !userId || !amount) {
      return NextResponse.json({ 
        error: 'Booking ID, user ID, and amount are required' 
      }, { status: 400 });
    }

    const pointsEarned = await PointsService.awardPoints(
      userId, 
      bookingId, 
      parseInt(amount), 
      membershipPlan
    );

    if (pointsEarned > 0) {
      const updatedBalance = await PointsService.getPointsBalance(userId);
      
      return NextResponse.json({
        success: true,
        pointsEarned,
        newBalance: updatedBalance.currentBalance,
        message: `Customer earned ${pointsEarned} points from this booking`
      });
    } else {
      return NextResponse.json({
        success: true,
        pointsEarned: 0,
        message: 'No points earned - amount below minimum threshold'
      });
    }

  } catch (error) {
    console.error('Error awarding booking points:', error);
    return NextResponse.json(
      { error: 'Failed to award points for booking' },
      { status: 500 }
    );
  }
}

// PUT /api/crm/bookings/[id]/points - Redeem points for a booking
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookingId = params.id;
    const body = await request.json();
    const { userId, pointsToUse, bookingAmount } = body;

    if (!bookingId || !userId || !pointsToUse || !bookingAmount) {
      return NextResponse.json({ 
        error: 'Booking ID, user ID, points to use, and booking amount are required' 
      }, { status: 400 });
    }

    const redemptionResult = await PointsService.redeemPoints(
      userId, 
      parseInt(pointsToUse), 
      parseInt(bookingAmount),
      bookingId
    );

    if (redemptionResult.success) {
      const updatedBalance = await PointsService.getPointsBalance(userId);
      
      return NextResponse.json({
        success: true,
        discountAmount: redemptionResult.discountAmount,
        newBalance: updatedBalance.currentBalance,
        message: redemptionResult.message
      });
    } else {
      return NextResponse.json({
        success: false,
        error: redemptionResult.message
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error redeeming points for booking:', error);
    return NextResponse.json(
      { error: 'Failed to redeem points for booking' },
      { status: 500 }
    );
  }
}