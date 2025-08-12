import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    console.log('Test API called');
    
    // Test session
    const session = await getServerSession(authOptions);
    console.log('Session:', session?.user?.id);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    // Test database connection
    console.log('Testing database connection...');
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);

    // Test timeEntry table exists
    console.log('Testing timeEntry table...');
    const timeEntryCount = await prisma.timeEntry.count();
    console.log('TimeEntry count:', timeEntryCount);

    // Test user exists
    console.log('Testing user exists...');
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });
    console.log('User found:', !!user);

    return NextResponse.json({
      success: true,
      session: !!session,
      userId: session.user.id,
      userCount,
      timeEntryCount,
      userExists: !!user
    });

  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}