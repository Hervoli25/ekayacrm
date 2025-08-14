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

    const goals = await prisma.goal.findMany({
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error fetching performance goals:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance goals' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      console.error('Performance goal creation: No session or email');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Performance goal creation request body:', body);
    const { employeeId, title, description, targetDate } = body;

    if (!employeeId || !title) {
      console.error('Performance goal creation: Missing required fields', { employeeId, title });
      return NextResponse.json(
        { error: 'Missing required fields: employeeId and title are required' },
        { status: 400 }
      );
    }

    const goal = await prisma.goal.create({
      data: {
        employeeId: employeeId,
        title,
        description: description || '',
        targetDate: targetDate ? new Date(targetDate) : null,
        status: 'IN_PROGRESS'
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error('Error creating performance goal:', error);
    return NextResponse.json(
      { error: 'Failed to create performance goal' },
      { status: 500 }
    );
  }
}
