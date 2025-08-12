import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current active time entry for the user
    const currentEntry = await prisma.timeEntry.findFirst({
      where: {
        employeeId: session.user.id,
        status: 'ACTIVE',
        clockOut: null
      },
      orderBy: {
        clockIn: 'desc'
      }
    });

    return NextResponse.json(currentEntry);

  } catch (error) {
    console.error('Error fetching current time entry:', error);
    return NextResponse.json(
      { error: 'Failed to fetch current time entry' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}