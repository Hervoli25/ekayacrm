
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const expenseSchema = z.object({
  date: z.string(),
  category: z.enum(['SUPPLIES', 'UTILITIES', 'MAINTENANCE', 'MARKETING', 'OFFICE', 'TRAVEL', 'TRAINING', 'OTHER']),
  description: z.string(),
  amount: z.number().positive(),
  paymentMethod: z.enum(['CASH', 'CARD', 'DIGITAL_WALLET', 'BANK_TRANSFER']),
  receiptUrl: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = expenseSchema.parse(body);

    const expense = await prisma.expense.create({
      data: {
        date: new Date(data.date),
        category: data.category,
        description: data.description,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        receiptUrl: data.receiptUrl,
        createdBy: session.user.id,
      },
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
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
    const status = searchParams.get('status');

    const expenses = await prisma.expense.findMany({
      where: {
        ...(startDate && endDate ? {
          date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        } : {}),
        ...(status ? { status: status as any } : {}),
        ...(session.user.role === 'EMPLOYEE' ? {
          createdBy: session.user.id,
        } : {}),
      },
      include: {
        creator: {
          select: {
            name: true,
            email: true,
          },
        },
        approver: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}
