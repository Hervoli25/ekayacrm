import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only SUPER_ADMIN can access temporary credentials
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const showExpired = searchParams.get('showExpired') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    let whereClause = {};
    
    if (!showExpired) {
      whereClause = {
        expiresAt: {
          gt: new Date()
        }
      };
    }

    const credentials = await prisma.temporaryCredential.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            name: true,
            employee: {
              select: {
                employeeId: true,
                title: true,
                department: true
              }
            }
          }
        },
        creator: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    return NextResponse.json({
      credentials,
      total: credentials.length
    });

  } catch (error) {
    console.error('Error fetching credentials:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { credentialId, action } = await request.json();

    if (action === 'mark_used') {
      await prisma.temporaryCredential.update({
        where: { id: credentialId },
        data: {
          isUsed: true,
          usedAt: new Date()
        }
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating credential:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}