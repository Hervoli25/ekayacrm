import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';
import { hasPermission } from '@/lib/enterprise-permissions';

const prisma = new PrismaClient();

// GET - Fetch overtime records and calculations
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get('employeeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    let dateFilter = {};
    
    if (startDate && endDate) {
      dateFilter = {
        clockIn: {
          gte: new Date(startDate),
          lte: new Date(endDate + 'T23:59:59.999Z')
        }
      };
    } else if (month && year) {
      const start = new Date(parseInt(year), parseInt(month) - 1, 1);
      const end = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      dateFilter = {
        clockIn: { gte: start, lte: end }
      };
    } else {
      // Default to current month
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      dateFilter = {
        clockIn: { gte: start, lte: end }
      };
    }

    // Determine which employees to include based on permissions
    let employeeFilter = {};
    if (employeeId && hasPermission(session.user.role, 'TIME_VIEW_ALL')) {
      employeeFilter = { employeeId };
    } else if (hasPermission(session.user.role, 'TIME_VIEW_TEAM')) {
      // Get user's department
      const userEmployee = await prisma.employee.findFirst({
        where: { userId: session.user.id }
      });
      
      if (userEmployee) {
        const teamMembers = await prisma.employee.findMany({
          where: { department: userEmployee.department },
          select: { userId: true }
        });
        employeeFilter = {
          employeeId: { in: teamMembers.map(m => m.userId) }
        };
      }
    } else {
      // Regular employees can only see their own data
      employeeFilter = { employeeId: session.user.id };
    }

    // Fetch time entries
    const timeEntries = await prisma.timeEntry.findMany({
      where: {
        ...employeeFilter,
        ...dateFilter,
        clockOut: { not: null }
      },
      include: {
        employee: {
          include: {
            employee: {
              select: {
                name: true,
                employeeId: true,
                department: true,
                title: true
              }
            }
          }
        }
      },
      orderBy: [
        { employeeId: 'asc' },
        { clockIn: 'desc' }
      ]
    });

    // Calculate overtime for each entry
    const overtimeData = await Promise.all(
      timeEntries.map(async (entry) => {
        const overtime = await calculateOvertimeForEntry(entry);
        return {
          ...entry,
          overtime,
          regularHours: overtime.regularHours,
          overtimeHours: overtime.overtimeHours,
          weekendHours: overtime.weekendHours,
          holidayHours: overtime.holidayHours,
          nightShiftHours: overtime.nightShiftHours
        };
      })
    );

    // Group by employee and calculate totals
    const employeeSummaries = {};
    overtimeData.forEach(entry => {
      const empId = entry.employeeId;
      if (!employeeSummaries[empId]) {
        employeeSummaries[empId] = {
          employee: entry.employee,
          totalRegularHours: 0,
          totalOvertimeHours: 0,
          totalWeekendHours: 0,
          totalHolidayHours: 0,
          totalNightShiftHours: 0,
          totalHours: 0,
          overtimeRate: 1.5, // 1.5x regular rate
          weekendRate: 2.0,   // 2x regular rate
          holidayRate: 2.5,   // 2.5x regular rate
          nightShiftRate: 1.25, // 1.25x regular rate
          entries: []
        };
      }

      const summary = employeeSummaries[empId];
      summary.totalRegularHours += entry.overtime.regularHours;
      summary.totalOvertimeHours += entry.overtime.overtimeHours;
      summary.totalWeekendHours += entry.overtime.weekendHours;
      summary.totalHolidayHours += entry.overtime.holidayHours;
      summary.totalNightShiftHours += entry.overtime.nightShiftHours;
      summary.totalHours += parseFloat(entry.totalHours?.toString() || '0');
      summary.entries.push(entry);
    });

    return NextResponse.json({
      success: true,
      period: { startDate, endDate, month, year },
      summary: {
        totalEmployees: Object.keys(employeeSummaries).length,
        totalRegularHours: Object.values(employeeSummaries).reduce((sum: number, emp: any) => sum + emp.totalRegularHours, 0),
        totalOvertimeHours: Object.values(employeeSummaries).reduce((sum: number, emp: any) => sum + emp.totalOvertimeHours, 0),
        totalWeekendHours: Object.values(employeeSummaries).reduce((sum: number, emp: any) => sum + emp.totalWeekendHours, 0)
      },
      employees: Object.values(employeeSummaries),
      rawEntries: overtimeData
    });

  } catch (error) {
    console.error('Error fetching overtime data:', error);
    return NextResponse.json({ error: 'Failed to fetch overtime data' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Create overtime request or manual entry
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { employeeId, date, startTime, endTime, reason, type } = body;

    // Validate required fields
    if (!date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Date, start time, and end time are required' }, { status: 400 });
    }

    // Check permissions for creating entries for others
    if (employeeId && employeeId !== session.user.id && !hasPermission(session.user.role, 'TIME_MANAGE_TEAM')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const targetEmployeeId = employeeId || session.user.id;

    // Create time entry
    const clockIn = new Date(`${date}T${startTime}`);
    const clockOut = new Date(`${date}T${endTime}`);
    
    const totalHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);

    const timeEntry = await prisma.timeEntry.create({
      data: {
        employeeId: targetEmployeeId,
        clockIn,
        clockOut,
        totalHours: totalHours,
        notes: reason,
        status: type === 'overtime_request' ? 'PENDING_APPROVAL' : 'ACTIVE'
      },
      include: {
        employee: {
          include: {
            employee: {
              select: {
                name: true,
                employeeId: true,
                department: true
              }
            }
          }
        }
      }
    });

    // Calculate overtime breakdown
    const overtime = await calculateOvertimeForEntry(timeEntry);

    return NextResponse.json({
      success: true,
      timeEntry,
      overtime,
      message: type === 'overtime_request' ? 'Overtime request submitted for approval' : 'Time entry created successfully'
    });

  } catch (error) {
    console.error('Error creating overtime entry:', error);
    return NextResponse.json({ error: 'Failed to create overtime entry' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

// Calculate overtime for a specific time entry
async function calculateOvertimeForEntry(entry: any) {
  const clockIn = new Date(entry.clockIn);
  const clockOut = new Date(entry.clockOut);
  const totalHours = parseFloat(entry.totalHours?.toString() || '0');

  // Standard work hours (8 hours per day, Monday-Friday)
  const standardDailyHours = 8;
  const dayOfWeek = clockIn.getDay(); // 0 = Sunday, 6 = Saturday
  
  // Check if it's a weekend
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  
  // Check if it's a public holiday (simplified - in practice, you'd have a holidays table)
  const isHoliday = await checkIfHoliday(clockIn);
  
  // Check for night shift (10 PM to 6 AM)
  const isNightShift = checkIfNightShift(clockIn, clockOut);

  let regularHours = 0;
  let overtimeHours = 0;
  let weekendHours = 0;
  let holidayHours = 0;
  let nightShiftHours = 0;

  if (isHoliday) {
    // All hours on holidays are paid at holiday rate
    holidayHours = totalHours;
  } else if (isWeekend) {
    // All hours on weekends are paid at weekend rate
    weekendHours = totalHours;
  } else {
    // Weekday calculation
    if (totalHours <= standardDailyHours) {
      regularHours = totalHours;
    } else {
      regularHours = standardDailyHours;
      overtimeHours = totalHours - standardDailyHours;
    }
  }

  // Calculate night shift hours (can overlap with other categories)
  if (isNightShift) {
    nightShiftHours = calculateNightShiftHours(clockIn, clockOut);
  }

  return {
    regularHours: Number(regularHours.toFixed(2)),
    overtimeHours: Number(overtimeHours.toFixed(2)),
    weekendHours: Number(weekendHours.toFixed(2)),
    holidayHours: Number(holidayHours.toFixed(2)),
    nightShiftHours: Number(nightShiftHours.toFixed(2)),
    isWeekend,
    isHoliday,
    isNightShift,
    dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
    breakdown: {
      regularRate: regularHours,
      overtimeRate: overtimeHours * 1.5,
      weekendRate: weekendHours * 2.0,
      holidayRate: holidayHours * 2.5,
      nightShiftRate: nightShiftHours * 1.25
    }
  };
}

// Check if date is a public holiday
async function checkIfHoliday(date: Date): Promise<boolean> {
  // Simplified implementation - in practice you'd have a holidays table
  const holidays2024 = [
    '2024-01-01', // New Year's Day
    '2024-03-21', // Human Rights Day
    '2024-03-29', // Good Friday
    '2024-04-01', // Family Day
    '2024-04-27', // Freedom Day
    '2024-05-01', // Workers' Day
    '2024-06-16', // Youth Day
    '2024-08-09', // Women's Day
    '2024-09-24', // Heritage Day
    '2024-12-16', // Day of Reconciliation
    '2024-12-25', // Christmas Day
    '2024-12-26'  // Day of Goodwill
  ];

  const dateStr = date.toISOString().split('T')[0];
  return holidays2024.includes(dateStr);
}

// Check if work period includes night shift hours
function checkIfNightShift(clockIn: Date, clockOut: Date): boolean {
  const nightStart = 22; // 10 PM
  const nightEnd = 6;    // 6 AM

  const inHour = clockIn.getHours();
  const outHour = clockOut.getHours();

  // Night shift if starting after 10 PM or ending before 6 AM
  return inHour >= nightStart || outHour <= nightEnd || 
         (inHour < nightEnd && outHour > nightStart);
}

// Calculate actual night shift hours
function calculateNightShiftHours(clockIn: Date, clockOut: Date): number {
  const nightStart = 22 * 60; // 10 PM in minutes
  const nightEnd = 6 * 60;    // 6 AM in minutes

  const inMinutes = clockIn.getHours() * 60 + clockIn.getMinutes();
  const outMinutes = clockOut.getHours() * 60 + clockOut.getMinutes();

  let nightMinutes = 0;

  // If shift spans midnight
  if (outMinutes < inMinutes) {
    // Before midnight
    if (inMinutes >= nightStart) {
      nightMinutes += (24 * 60) - inMinutes; // Until midnight
    }
    // After midnight
    if (outMinutes <= nightEnd) {
      nightMinutes += outMinutes; // From midnight to end
    }
  } else {
    // Same day shift
    if (inMinutes >= nightStart && outMinutes >= nightStart) {
      nightMinutes = outMinutes - Math.max(inMinutes, nightStart);
    } else if (inMinutes <= nightEnd && outMinutes <= nightEnd) {
      nightMinutes = outMinutes - inMinutes;
    }
  }

  return Math.max(0, nightMinutes / 60); // Convert to hours
}