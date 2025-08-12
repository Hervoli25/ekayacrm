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

    // Find the time entry on break
    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        id: timeEntryId || undefined,
        employeeId: session.user.id,
        status: 'ACTIVE',
        clockOut: null,
        breakStart: {
          not: null
        },
        breakEnd: null
      },
      orderBy: {
        clockIn: 'desc'
      }
    });

    if (!timeEntry) {
      return NextResponse.json(
        { error: 'No active break found to end' },
        { status: 400 }
      );
    }

    const breakEndTime = new Date();
    const breakDuration = timeEntry.breakStart ? 
      (breakEndTime.getTime() - new Date(timeEntry.breakStart).getTime()) / (1000 * 60) : 0;

    // Update the time entry with break end
    const updatedEntry = await prisma.timeEntry.update({
      where: { id: timeEntry.id },
      data: {
        breakEnd: breakEndTime,
        notes: timeEntry.notes ? 
          `${timeEntry.notes}\nBreak ended at ${breakEndTime.toLocaleString()} (Duration: ${Math.round(breakDuration)} minutes)` :
          `Break ended at ${breakEndTime.toLocaleString()} (Duration: ${Math.round(breakDuration)} minutes)`
      }
    });

    // Log the action for audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'BREAK_END',
        entityType: 'TimeEntry',
        entityId: timeEntry.id,
        details: JSON.stringify({
          breakStart: timeEntry.breakStart,
          breakEnd: breakEndTime,
          breakDuration: breakDuration,
          timeEntryId: timeEntry.id
        })
      }
    }).catch(() => {
      // Audit log is optional, don't fail if it doesn't work
    });

    return NextResponse.json({
      success: true,
      timeEntry: updatedEntry,
      breakDuration: Math.round(breakDuration),
      message: `Break ended successfully. Duration: ${Math.round(breakDuration)} minutes`
    });

  } catch (error) {
    console.error('Error ending break:', error);
    return NextResponse.json(
      { error: 'Failed to end break' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}