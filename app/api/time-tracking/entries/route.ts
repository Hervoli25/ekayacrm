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

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build where clause
    const whereClause: any = {
      employeeId: session.user.id
    };

    if (startDate && endDate) {
      whereClause.clockIn = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    // Get time entries for the user
    const timeEntries = await prisma.timeEntry.findMany({
      where: whereClause,
      orderBy: {
        clockIn: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Get total count for pagination
    const totalCount = await prisma.timeEntry.count({
      where: whereClause
    });

    return NextResponse.json({
      entries: timeEntries,
      totalCount,
      hasMore: offset + limit < totalCount
    });

  } catch (error) {
    console.error('Error fetching time entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time entries' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { clockIn, clockOut, breakStart, breakEnd, location, notes, project } = await req.json();

    if (!clockIn) {
      return NextResponse.json(
        { error: 'Clock in time is required' },
        { status: 400 }
      );
    }

    // Get employee information
    const employee = await prisma.employee.findFirst({
      where: { userId: session.user.id }
    });

    // Calculate total hours if clock out is provided
    let totalHours = 0;
    if (clockOut) {
      const clockInTime = new Date(clockIn);
      const clockOutTime = new Date(clockOut);
      totalHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
      
      // Subtract break time if provided
      if (breakStart && breakEnd) {
        const breakStartTime = new Date(breakStart);
        const breakEndTime = new Date(breakEnd);
        const breakHours = (breakEndTime.getTime() - breakStartTime.getTime()) / (1000 * 60 * 60);
        totalHours -= breakHours;
      }
    }

    // Create manual time entry
    const timeEntry = await prisma.timeEntry.create({
      data: {
        employeeId: session.user.id,
        clockIn: new Date(clockIn),
        clockOut: clockOut ? new Date(clockOut) : null,
        breakStart: breakStart ? new Date(breakStart) : null,
        breakEnd: breakEnd ? new Date(breakEnd) : null,
        totalHours: totalHours || null,
        location: location || 'Manual Entry',
        notes: notes || `Manual entry created at ${new Date().toLocaleString()}`,
        status: clockOut ? 'COMPLETED' : 'ACTIVE'
      }
    });

    // Log the action for audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'MANUAL_TIME_ENTRY',
        entityType: 'TimeEntry',
        entityId: timeEntry.id,
        details: JSON.stringify({
          clockIn,
          clockOut,
          totalHours,
          isManualEntry: true,
          employeeId: employee?.employeeId || session.user.id
        })
      }
    }).catch(() => {
      // Audit log is optional, don't fail if it doesn't work
    });

    return NextResponse.json({
      success: true,
      timeEntry,
      message: 'Time entry created successfully'
    });

  } catch (error) {
    console.error('Error creating time entry:', error);
    return NextResponse.json(
      { error: 'Failed to create time entry' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}