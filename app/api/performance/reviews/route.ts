import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reviews = await prisma.performanceReview.findMany({
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error('Error fetching performance reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { employeeId, reviewPeriod, dueDate, type } = body;

    if (!employeeId || !reviewPeriod) {
      return NextResponse.json(
        { error: 'Employee ID and review period are required' },
        { status: 400 }
      );
    }

    const review = await prisma.performanceReview.create({
      data: {
        employeeId,
        reviewerId: session.user.id,
        reviewPeriod,
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'DRAFT',
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
    console.error('Error creating performance review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}