// 🎯 CRM Points Analytics API Endpoint
import { NextRequest, NextResponse } from 'next/server';
import { PointsService } from '@/lib/points-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/crm/points/analytics - Get points system analytics
export async function GET(request: NextRequest) {
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

    const analytics = await PointsService.getPointsAnalytics();
    
    return NextResponse.json({
      ...analytics,
      success: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching points analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch points analytics' },
      { status: 500 }
    );
  }
}