import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, code, description, budget } = await req.json();

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Department name and code are required' },
        { status: 400 }
      );
    }

    // Check if department code already exists
    const existingDepartment = await prisma.department.findUnique({
      where: { code },
    });

    if (existingDepartment) {
      return NextResponse.json(
        { error: 'Department with this code already exists' },
        { status: 400 }
      );
    }

    // Create department
    const department = await prisma.department.create({
      data: {
        name,
        code: code.toUpperCase(),
        description: description || `${name} Department`,
        budget: budget ? parseFloat(budget) : null,
      },
    });

    // Log the creation for audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE_DEPARTMENT',
        entityType: 'Department',
        entityId: department.id,
        details: JSON.stringify({
          departmentName: name,
          departmentCode: code,
          budget: budget || null,
        }),
      },
    }).catch(() => {
      // Audit log is optional, don't fail if it doesn't work
    });

    return NextResponse.json({
      success: true,
      department: {
        id: department.id,
        name: department.name,
        code: department.code,
        description: department.description,
        budget: department.budget,
      },
    });

  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      { error: 'Failed to create department' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}