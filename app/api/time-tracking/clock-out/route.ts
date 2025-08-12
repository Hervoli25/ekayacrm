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

    // Find the time entry to clock out
    const timeEntry = await prisma.timeEntry.findFirst({
      where: {
        id: timeEntryId || undefined,
        employeeId: session.user.id,
        clockOut: null,
        status: 'ACTIVE'
      },
      orderBy: {
        clockIn: 'desc'
      }
    });

    if (!timeEntry) {
      return NextResponse.json(
        { error: 'No active time entry found to clock out' },
        { status: 400 }
      );
    }

    const clockOutTime = new Date();
    const clockInTime = new Date(timeEntry.clockIn);
    
    // Calculate total hours
    let totalHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
    
    // Subtract break time if any
    if (timeEntry.breakStart && timeEntry.breakEnd) {
      const breakStart = new Date(timeEntry.breakStart);
      const breakEnd = new Date(timeEntry.breakEnd);
      const breakHours = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60);
      totalHours -= breakHours;
    }

    // Update the time entry
    const updatedEntry = await prisma.timeEntry.update({
      where: { id: timeEntry.id },
      data: {
        clockOut: clockOutTime,
        totalHours: totalHours,
        status: 'COMPLETED',
        notes: timeEntry.notes ? 
          `${timeEntry.notes}\nClocked out at ${clockOutTime.toLocaleString()}` :
          `Clocked out at ${clockOutTime.toLocaleString()}`
      }
    });

    // Log the action for audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CLOCK_OUT',
        entityType: 'TimeEntry',
        entityId: timeEntry.id,
        details: JSON.stringify({
          clockIn: timeEntry.clockIn,
          clockOut: clockOutTime,
          totalHours: totalHours,
          breakTime: timeEntry.breakStart && timeEntry.breakEnd ? 
            (new Date(timeEntry.breakEnd).getTime() - new Date(timeEntry.breakStart).getTime()) / (1000 * 60 * 60) : 0
        })
      }
    }).catch(() => {
      // Audit log is optional, don't fail if it doesn't work
    });

    return NextResponse.json({
      success: true,
      timeEntry: updatedEntry,
      totalHours: totalHours,
      message: `Successfully clocked out. Total hours: ${totalHours.toFixed(2)}`
    });

  } catch (error) {
    console.error('Error clocking out:', error);
    return NextResponse.json(
      { error: 'Failed to clock out' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}