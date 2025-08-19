import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const API_KEY = 'ekhaya-car-wash-secret-key-2024';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify API key
    const apiKey = request.headers.get('X-API-Key');
    if (apiKey !== API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const bookingId = params.id;

    // Fetch detailed booking information
    const booking = await prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            dateOfBirth: true,
            createdAt: true,
          },
        },
        vehicle: {
          select: {
            licensePlate: true,
            make: true,
            model: true,
            year: true,
            color: true,
          },
        },
        service: {
          select: {
            name: true,
            description: true,
            price: true,
            duration: true,
            category: true,
          },
        },
        // Include payment information
        payment: {
          select: {
            status: true,
            amount: true,
            paymentDate: true,
            transactionId: true,
            paymentMethodType: true,
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Get customer's booking history
    const customerBookingHistory = await prisma.booking.findMany({
      where: {
        userId: booking.userId,
        id: {
          not: booking.id, // Exclude current booking
        },
      },
      select: {
        id: true,
        bookingDate: true,
        timeSlot: true,
        status: true,
        totalAmount: true,
        service: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        bookingDate: 'desc',
      },
      take: 10,
    });

    // Transform the data to match CRM format
    const transformedBooking = {
      id: booking.id,
      bookingReference: booking.id.slice(-8).toUpperCase(),
      customerName: `${booking.user.firstName} ${booking.user.lastName}`,
      customerEmail: booking.user.email,
      customerPhone: booking.user.phone || 'N/A',
      customerId: booking.user.id,
      customerSince: booking.user.createdAt.toISOString().split('T')[0],
      licensePlate: booking.vehicle.licensePlate,
      vehicleDetails: `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}`,
      vehicleColor: booking.vehicle.color,
      serviceName: booking.service.name,
      serviceDescription: booking.service.description,
      serviceCategory: booking.service.category,
      serviceDuration: booking.service.duration,
      servicePrice: Number(booking.service.price),
      scheduledDate: booking.bookingDate.toISOString().split('T')[0],
      scheduledTime: booking.timeSlot,
      status: booking.status.toLowerCase(),
      totalAmount: Math.round(Number(booking.totalAmount) / 100), // Convert from cents
      paymentStatus: booking.payment?.status?.toLowerCase() || 'pending',
      paymentAmount: booking.payment ? Math.round(Number(booking.payment.amount) / 100) : 0,
      paymentDate: booking.payment?.paymentDate?.toISOString(),
      transactionId: booking.payment?.transactionId,
      paymentMethod: booking.payment?.paymentMethodType || 'N/A',
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
      updatedAt: booking.updatedAt.toISOString(),
      // No modification requests table in current schema
      customerHistory: customerBookingHistory.map((historyBooking) => ({
        id: historyBooking.id,
        reference: historyBooking.id.slice(-8).toUpperCase(),
        date: historyBooking.bookingDate.toISOString().split('T')[0],
        time: historyBooking.timeSlot,
        service: historyBooking.service.name,
        status: historyBooking.status.toLowerCase(),
        amount: Math.round(Number(historyBooking.totalAmount) / 100),
      })),
    };

    return NextResponse.json(transformedBooking);
  } catch (error) {
    console.error('Error fetching booking details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking details' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}