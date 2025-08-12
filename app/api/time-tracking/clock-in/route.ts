import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    console.log('Clock-in API called');
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Session user:', session.user.id);
    const { location } = await req.json();
    console.log('Location:', location);

    // Check if user already has an active time entry
    console.log('Checking for existing entries...');
    const existingEntry = await prisma.timeEntry.findFirst({
      where: {
        employeeId: session.user.id,
        clockOut: null,
        status: 'ACTIVE'
      }
    });

    console.log('Existing entry:', existingEntry);

    if (existingEntry) {
      console.log('Found existing entry, returning error');
      return NextResponse.json(
        { error: 'You already have an active time entry. Please clock out first.' },
        { status: 400 }
      );
    }

    // Get employee information for ID
    console.log('Getting employee info...');
    const employee = await prisma.employee.findFirst({
      where: { userId: session.user.id }
    });
    console.log('Employee:', employee);

    // Create new time entry
    console.log('Creating time entry...');
    const timeEntry = await prisma.timeEntry.create({
      data: {
        employeeId: session.user.id,
        clockIn: new Date(),
        location: location || 'Not provided',
        status: 'ACTIVE',
        notes: `Clocked in at ${new Date().toLocaleString()}`
      }
    });
    console.log('Time entry created:', timeEntry);

    // Log the action for audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CLOCK_IN',
        entityType: 'TimeEntry',
        entityId: timeEntry.id,
        details: JSON.stringify({
          clockIn: timeEntry.clockIn,
          location: location,
          employeeId: employee?.employeeId || session.user.id
        })
      }
    }).catch(() => {
      // Audit log is optional, don't fail if it doesn't work
    });

    return NextResponse.json({
      success: true,
      timeEntry,
      message: 'Successfully clocked in'
    });

  } catch (error) {
    console.error('Error clocking in - Full error:', error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    return NextResponse.json(
      { 
        error: 'Failed to clock in',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}