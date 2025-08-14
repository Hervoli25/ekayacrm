import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing performance endpoints...');

    // First, get a valid user ID from the database
    const users = await prisma.user.findMany({
      take: 2,
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    console.log('Available users:', users);

    if (users.length < 1) {
      return NextResponse.json({
        success: false,
        error: 'No users found in database'
      }, { status: 500 });
    }

    const userId = users[0].id;

    // Test creating a performance review
    const testReview = {
      employeeId: userId, // Use actual user ID
      reviewerId: userId,
      reviewPeriod: 'Q1 2024',
      dueDate: new Date('2024-12-31'),
      status: 'DRAFT' as any
    };
    
    console.log('Creating test review with data:', testReview);
    
    const review = await prisma.performanceReview.create({
      data: testReview,
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
    
    console.log('Review created successfully:', review.id);
    
    // Test creating a performance goal
    const testGoal = {
      employeeId: userId, // Use actual user ID
      title: 'Test Goal',
      description: 'This is a test goal',
      targetDate: new Date('2024-12-31'),
      status: 'IN_PROGRESS' as any
    };
    
    console.log('Creating test goal with data:', testGoal);
    
    const goal = await prisma.goal.create({
      data: testGoal,
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
    
    console.log('Goal created successfully:', goal.id);
    
    return NextResponse.json({
      success: true,
      message: 'Performance endpoints test successful',
      review: review,
      goal: goal
    });
  } catch (error) {
    console.error('Test performance endpoints error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
