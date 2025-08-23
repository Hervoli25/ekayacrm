// 🎯 CRM Customer Points API Endpoint
import { NextRequest, NextResponse } from 'next/server';
import { PointsService } from '@/lib/points-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/crm/customers/[id]/points - Get customer points summary
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customerId = params.id;
    
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
    }

    const pointsBalance = await PointsService.getPointsBalance(customerId);
    
    return NextResponse.json({
      customerId,
      ...pointsBalance,
      success: true
    });

  } catch (error) {
    console.error('Error fetching customer points:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer points' },
      { status: 500 }
    );
  }
}

// POST /api/crm/customers/[id]/points - Award or deduct points manually
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privileges
    const userRole = session.user.role;
    const allowedRoles = ['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER'];
    
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const customerId = params.id;
    const body = await request.json();
    const { amount, reason, action } = body;

    if (!customerId || !amount || !reason || !action) {
      return NextResponse.json({ 
        error: 'Customer ID, amount, reason, and action are required' 
      }, { status: 400 });
    }

    if (!['award', 'deduct'].includes(action)) {
      return NextResponse.json({ 
        error: 'Action must be either "award" or "deduct"' 
      }, { status: 400 });
    }

    let success = false;
    
    if (action === 'award') {
      success = await PointsService.awardManualPoints(
        customerId, 
        parseInt(amount), 
        reason, 
        session.user.id
      );
    } else {
      success = await PointsService.deductPoints(
        customerId, 
        parseInt(amount), 
        reason, 
        session.user.id
      );
    }

    if (success) {
      const updatedBalance = await PointsService.getPointsBalance(customerId);
      
      return NextResponse.json({
        success: true,
        message: `Successfully ${action === 'award' ? 'awarded' : 'deducted'} ${amount} points`,
        newBalance: updatedBalance.currentBalance
      });
    } else {
      return NextResponse.json(
        { error: `Failed to ${action} points` },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error managing customer points:', error);
    return NextResponse.json(
      { error: 'Failed to manage customer points' },
      { status: 500 }
    );
  }
}