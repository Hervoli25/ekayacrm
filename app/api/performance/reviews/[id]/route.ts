import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const review = await prisma.performanceReview.findUnique({
      where: { id: params.id },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        goals: {
          select: {
            id: true,
            title: true,
            description: true,
            targetDate: true,
            status: true,
            progress: true,
          }
        },
        ratings: {
          select: {
            id: true,
            category: true,
            rating: true,
            comments: true,
          }
        }
      }
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error fetching performance review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { overallRating, strengths, areasForImprovement, status } = body;

    const review = await prisma.performanceReview.update({
      where: { id: params.id },
      data: {
        ...(overallRating && { overallRating }),
        ...(strengths && { strengths }),
        ...(areasForImprovement && { areasForImprovement }),
        ...(status && { status }),
        ...(status === 'COMPLETED' && { reviewDate: new Date() }),
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error updating performance review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}