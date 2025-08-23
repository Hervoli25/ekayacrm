// 🎯 Points Configuration Management API
import { NextRequest, NextResponse } from 'next/server';
import { PointsService } from '@/lib/points-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/crm/points/config - Get current points configuration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await PointsService.getConfig();
    
    return NextResponse.json({
      ...config,
      success: true
    });

  } catch (error) {
    console.error('Error fetching points configuration:', error);
    return NextResponse.json(
      { error: 'Failed to fetch points configuration' },
      { status: 500 }
    );
  }
}

// POST /api/crm/points/config - Update points configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only super admin can update configuration
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const {
      pointsPerRand,
      minimumSpend,
      membershipMultipliers,
      pointValue,
      minimumRedemption,
      maxRedemptionPercent,
      pointsValidityDays,
      expirationWarningDays,
      extensionPurchaseMin,
      extensionDays
    } = body;

    // Deactivate current configuration
    await prisma.pointsConfig.updateMany({
      where: { isActive: true },
      data: { isActive: false }
    });

    // Create new configuration
    const newConfig = await prisma.pointsConfig.create({
      data: {
        pointsPerRand: pointsPerRand || 1.0,
        minimumSpend: minimumSpend || 5000,
        membershipMultipliers: membershipMultipliers || {
          BASIC: 1.0,
          PREMIUM: 1.5,
          ELITE: 2.0
        },
        pointValue: pointValue || 0.01,
        minimumRedemption: minimumRedemption || 100,
        maxRedemptionPercent: maxRedemptionPercent || 50.0,
        pointsValidityDays: pointsValidityDays || 365,
        expirationWarningDays: expirationWarningDays || 30,
        extensionPurchaseMin: extensionPurchaseMin || 2000,
        extensionDays: extensionDays || 365,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Points configuration updated successfully',
      configId: newConfig.id
    });

  } catch (error) {
    console.error('Error updating points configuration:', error);
    return NextResponse.json(
      { error: 'Failed to update points configuration' },
      { status: 500 }
    );
  }
}