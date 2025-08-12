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

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get today's hours
    const todayEntries = await prisma.timeEntry.findMany({
      where: {
        employeeId: session.user.id,
        clockIn: {
          gte: today
        }
      }
    });

    const todayHours = todayEntries.reduce((total, entry) => {
      if (entry.totalHours) {
        return total + parseFloat(entry.totalHours.toString());
      }
      // Calculate hours for active entries
      if (!entry.clockOut && entry.status === 'ACTIVE') {
        const hours = (now.getTime() - new Date(entry.clockIn).getTime()) / (1000 * 60 * 60);
        return total + hours;
      }
      return total;
    }, 0);

    // Get week's hours
    const weekEntries = await prisma.timeEntry.findMany({
      where: {
        employeeId: session.user.id,
        clockIn: {
          gte: startOfWeek
        }
      }
    });

    const weekHours = weekEntries.reduce((total, entry) => {
      if (entry.totalHours) {
        return total + parseFloat(entry.totalHours.toString());
      }
      return total;
    }, 0);

    // Get month's hours
    const monthEntries = await prisma.timeEntry.findMany({
      where: {
        employeeId: session.user.id,
        clockIn: {
          gte: startOfMonth
        }
      }
    });

    const monthHours = monthEntries.reduce((total, entry) => {
      if (entry.totalHours) {
        return total + parseFloat(entry.totalHours.toString());
      }
      return total;
    }, 0);

    // Calculate overtime hours (hours over 8 per day)
    const overtimeHours = todayEntries.reduce((total, entry) => {
      if (entry.totalHours) {
        const hours = parseFloat(entry.totalHours.toString());
        return total + Math.max(0, hours - 8);
      }
      return total;
    }, 0);

    // Get employee schedule to calculate expected hours
    const schedule = await prisma.schedule.findMany({
      where: {
        employeeId: session.user.id,
        isActive: true
      }
    });

    const expectedHoursPerDay = schedule.reduce((total, sched) => {
      const start = sched.startTime.split(':');
      const end = sched.endTime.split(':');
      const startMinutes = parseInt(start[0]) * 60 + parseInt(start[1]);
      const endMinutes = parseInt(end[0]) * 60 + parseInt(end[1]);
      const dayHours = (endMinutes - startMinutes) / 60;
      return total + dayHours;
    }, 0);

    const expectedWeeklyHours = expectedHoursPerDay * 5; // Assuming 5-day work week

    // Calculate efficiency (actual vs expected)
    const efficiency = expectedWeeklyHours > 0 ? (weekHours / expectedWeeklyHours) * 100 : 0;

    // Get attendance statistics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const attendanceEntries = await prisma.timeEntry.findMany({
      where: {
        employeeId: session.user.id,
        clockIn: {
          gte: thirtyDaysAgo
        },
        status: 'COMPLETED'
      }
    });

    // Count unique days with attendance
    const uniqueDays = new Set(
      attendanceEntries.map(entry => 
        new Date(entry.clockIn).toDateString()
      )
    );

    const presentDays = uniqueDays.size;
    const totalWorkDays = 22; // Approximate work days in a month
    
    // Calculate late arrivals (assuming 9 AM standard start)
    const lateArrivals = attendanceEntries.filter(entry => {
      const clockInTime = new Date(entry.clockIn);
      const standardStart = new Date(clockInTime);
      standardStart.setHours(9, 0, 0, 0);
      return clockInTime > standardStart;
    }).length;

    // Calculate early leaves (assuming 5 PM standard end)
    const earlyLeaves = attendanceEntries.filter(entry => {
      if (!entry.clockOut) return false;
      const clockOutTime = new Date(entry.clockOut);
      const standardEnd = new Date(clockOutTime);
      standardEnd.setHours(17, 0, 0, 0);
      return clockOutTime < standardEnd;
    }).length;

    const onTimePercentage = presentDays > 0 ? 
      ((presentDays - lateArrivals) / presentDays) * 100 : 0;

    return NextResponse.json({
      timeStats: {
        todayHours: Math.max(0, todayHours),
        weekHours: Math.max(0, weekHours),
        monthHours: Math.max(0, monthHours),
        overtimeHours: Math.max(0, overtimeHours),
        expectedHours: expectedWeeklyHours,
        efficiency: Math.max(0, Math.min(100, efficiency))
      },
      attendanceStats: {
        presentDays,
        totalDays: totalWorkDays,
        lateArrivals,
        earlyLeaves,
        onTimePercentage: Math.max(0, Math.min(100, onTimePercentage))
      }
    });

  } catch (error) {
    console.error('Error fetching time tracking stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}