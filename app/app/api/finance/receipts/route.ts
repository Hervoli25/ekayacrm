
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const receiptSchema = z.object({
  customerName: z.string(),
  customerEmail: z.string().email().optional(),
  services: z.array(z.object({
    service: z.string(),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
  })),
  paymentMethod: z.enum(['CASH', 'CARD', 'DIGITAL_WALLET', 'BANK_TRANSFER']),
  tax: z.number().default(0),
});

function generateReceiptNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const timestamp = Date.now().toString().slice(-6);
  return `EIT-${year}${month}${day}-${timestamp}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = receiptSchema.parse(body);

    const subtotal = data.services.reduce((sum, service) => 
      sum + (service.price * service.quantity), 0
    );
    const total = subtotal + data.tax;

    const receipt = await prisma.receipt.create({
      data: {
        receiptNumber: generateReceiptNumber(),
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        subtotal,
        tax: data.tax,
        total,
        paymentMethod: data.paymentMethod,
        employeeId: session.user.id,
        services: {
          create: data.services.map(service => ({
            service: service.service,
            quantity: service.quantity,
            price: service.price,
            total: service.price * service.quantity,
          })),
        },
      },
      include: {
        services: true,
        employee: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(receipt);
  } catch (error) {
    console.error('Error creating receipt:', error);
    return NextResponse.json(
      { error: 'Failed to create receipt' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const employeeId = searchParams.get('employeeId');

    const receipts = await prisma.receipt.findMany({
      where: {
        ...(startDate && endDate ? {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        } : {}),
        ...(employeeId && session.user.role === 'ADMIN' ? {
          employeeId,
        } : session.user.role === 'EMPLOYEE' ? {
          employeeId: session.user.id,
        } : {}),
      },
      include: {
        services: true,
        employee: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(receipts);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch receipts' },
      { status: 500 }
    );
  }
}
