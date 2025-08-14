import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';



export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reviews = await prisma.performanceReview.findMany({
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
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
      { error: 'Failed to fetch performance reviews' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.error('Performance review creation: No session or email');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Performance review creation request body:', body);
    const { employeeId, reviewType, reviewPeriod, dueDate, reviewerId } = body;

    if (!employeeId || !reviewType || !reviewPeriod) {
      console.error('Performance review creation: Missing required fields', { employeeId, reviewType, reviewPeriod });
      return NextResponse.json(
        { error: 'Missing required fields: employeeId, reviewType, and reviewPeriod are required' },
        { status: 400 }
      );
    }

    // Get the current user as reviewer if not specified
    let finalReviewerId = reviewerId;
    if (!finalReviewerId) {
      const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      finalReviewerId = currentUser?.id;
    }

    const review = await prisma.performanceReview.create({
      data: {
        employeeId: employeeId,
        reviewerId: finalReviewerId || '',
        reviewPeriod,
        dueDate: dueDate ? new Date(dueDate) : new Date(),
        status: 'DRAFT'
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error('Error creating performance review:', error);
    return NextResponse.json(
      { error: 'Failed to create performance review' },
      { status: 500 }
    );
  }
}
