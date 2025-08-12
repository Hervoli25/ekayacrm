import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { timeEntryId } = await req.json();

    // Find the active time entry
    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        id: timeEntryId || undefined,
        employeeId: session.user.id,
        status: 'ACTIVE',
        clockOut: null
      },
      orderBy: {
        clockIn: 'desc'
      }
    });

    if (!timeEntry) {
      return NextResponse.json(
        { error: 'No active time entry found to start break' },
        { status: 400 }
      );
    }

    if (timeEntry.breakStart && !timeEntry.breakEnd) {
      return NextResponse.json(
        { error: 'Break is already in progress' },
        { status: 400 }
      );
    }

    const breakStartTime = new Date();

    // Update the time entry with break start
    const updatedEntry = await prisma.timeEntry.update({
      where: { id: timeEntry.id },
      data: {
        breakStart: breakStartTime,
        notes: timeEntry.notes ? 
          `${timeEntry.notes}\nBreak started at ${breakStartTime.toLocaleString()}` :
          `Break started at ${breakStartTime.toLocaleString()}`
      }
    });

    // Log the action for audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'BREAK_START',
        entityType: 'TimeEntry',
        entityId: timeEntry.id,
        details: JSON.stringify({
          breakStart: breakStartTime,
          timeEntryId: timeEntry.id
        })
      }
    }).catch(() => {
      // Audit log is optional, don't fail if it doesn't work
    });

    return NextResponse.json({
      success: true,
      timeEntry: updatedEntry,
      message: 'Break started successfully'
    });

  } catch (error) {
    console.error('Error starting break:', error);
    return NextResponse.json(
      { error: 'Failed to start break' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}