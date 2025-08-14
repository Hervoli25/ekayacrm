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

    const goals = await prisma.goal.findMany({
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        review: {
          select: {
            id: true,
            reviewPeriod: true,
            status: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
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
    const { employeeId, title, description, targetDate, category } = body;

    if (!employeeId || !title) {
      return NextResponse.json(
        { error: 'Employee ID and title are required' },
        { status: 400 }
      );
    }

    const goal = await prisma.goal.create({
      data: {
        employeeId,
        title,
        description,
        targetDate: targetDate ? new Date(targetDate) : null,
        status: 'IN_PROGRESS',
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json(goal);
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}