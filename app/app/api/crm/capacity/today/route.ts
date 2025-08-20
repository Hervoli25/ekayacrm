import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';
import { getCRMApiKey, getCRMDatabaseUrl } from '@/lib/env';

export async function GET(request: NextRequest) {
  const client = new Client({
    connectionString: getCRMDatabaseUrl(),
  });

  try {
    // Verify API key
    const apiKey = request.headers.get('X-API-Key');
    if (apiKey !== getCRMApiKey()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await client.connect();

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Define your working hours and capacity per slot
    const timeSlots = [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
      '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
      '17:00', '17:30'
    ];

    const maxCapacityPerSlot = 4;

    // Get all bookings for today with service and user details
    const todayBookingsQuery = `
      SELECT 
        b."timeSlot",
        b.status,
        u."firstName",
        u."lastName",
        s.name as service_name,
        s.duration
      FROM "Booking" b
      JOIN "User" u ON b."userId" = u.id
      JOIN "Service" s ON b."serviceId" = s.id
      WHERE b."bookingDate" >= $1 
        AND b."bookingDate" < $2
        AND b.status IN ('CONFIRMED', 'IN_PROGRESS', 'COMPLETED')
      ORDER BY b."timeSlot" ASC
    `;

    const todayBookings = await client.query(todayBookingsQuery, [startOfToday, endOfToday]);

    // Group bookings by time slot
    const bookingsBySlot = todayBookings.rows.reduce((acc, booking) => {
      if (!acc[booking.timeSlot]) {
        acc[booking.timeSlot] = [];
      }
      acc[booking.timeSlot].push(booking);
      return acc;
    }, {} as Record<string, any[]>);

    // Calculate capacity for each time slot
    const capacitySlots = timeSlots.map((timeSlot) => {
      const bookings = bookingsBySlot[timeSlot] || [];
      const bookedCount = bookings.length;
      const availableCount = Math.max(0, maxCapacityPerSlot - bookedCount);
      
      // Count waitlist (bookings beyond capacity)
      const waitlistCount = Math.max(0, bookedCount - maxCapacityPerSlot);
      
      // Determine status
      let status: 'available' | 'busy' | 'full';
      if (bookedCount === 0) {
        status = 'available';
      } else if (bookedCount >= maxCapacityPerSlot) {
        status = 'full';
      } else {
        status = 'busy';
      }

      // Get service distribution for this slot
      const serviceDistribution = bookings.reduce((acc, booking) => {
        const serviceName = booking.service_name;
        acc[serviceName] = (acc[serviceName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        time: timeSlot,
        timeDisplay: `${timeSlot} - ${getEndTime(timeSlot)}`,
        totalCapacity: maxCapacityPerSlot,
        bookedCapacity: Math.min(bookedCount, maxCapacityPerSlot),
        availableCapacity: availableCount,
        waitlistCount,
        waitlist: waitlistCount, // For compatibility with UI component
        status,
        utilization: (Math.min(bookedCount, maxCapacityPerSlot) / maxCapacityPerSlot) * 100,
        bookings: bookings.map((booking) => ({
          customerName: `${booking.firstName} ${booking.lastName}`,
          serviceName: booking.service_name,
          status: booking.status.toLowerCase(),
          duration: booking.duration,
        })),
        serviceDistribution,
      };
    });

    // Calculate overall statistics
    const totalCapacity = timeSlots.length * maxCapacityPerSlot;
    const totalBooked = capacitySlots.reduce((sum, slot) => sum + slot.bookedCapacity, 0);
    const totalAvailable = totalCapacity - totalBooked;
    const totalWaitlist = capacitySlots.reduce((sum, slot) => sum + slot.waitlistCount, 0);
    const overallUtilization = (totalBooked / totalCapacity) * 100;

    // Find peak hours
    const peakSlot = capacitySlots.reduce((peak, slot) => 
      slot.utilization > peak.utilization ? slot : peak
    );

    return NextResponse.json({
      date: today.toISOString().split('T')[0],
      slots: capacitySlots,
      summary: {
        totalCapacity,
        totalBooked,
        totalAvailable,
        totalWaitlist,
        overallUtilization: Math.round(overallUtilization * 100) / 100,
        peakHour: peakSlot.time,
        peakUtilization: Math.round(peakSlot.utilization * 100) / 100,
        operatingHours: `${timeSlots[0]} - ${getEndTime(timeSlots[timeSlots.length - 1])}`,
      },
    });
  } catch (error) {
    console.error('Error fetching capacity data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch capacity data' },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}

// Helper function to calculate end time (assuming 30-minute slots)
function getEndTime(startTime: string): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const endMinutes = minutes + 30;
  const endHours = hours + Math.floor(endMinutes / 60);
  const finalMinutes = endMinutes % 60;
  
  return `${endHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
}