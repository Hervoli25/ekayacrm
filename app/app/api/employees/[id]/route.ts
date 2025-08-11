

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Get employee error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN', 'HR_DIRECTOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      name,
      title,
      department,
      email,
      phone,
      address,
      emergencyContact,
      emergencyPhone,
      salary,
      status,
      terminationDate,
      terminationReason,
    } = await request.json();

    const existingEmployee = await prisma.employee.findUnique({
      where: { id: params.id },
      include: { user: true }
    });

    if (!existingEmployee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Check if email is being changed and if it conflicts
    if (email && email !== existingEmployee.email) {
      const emailConflict = await prisma.employee.findFirst({
        where: {
          email,
          id: { not: params.id }
        }
      });

      if (emailConflict) {
        return NextResponse.json(
          { error: 'Another employee with this email already exists' },
          { status: 400 }
        );
      }

      // Update user email as well
      await prisma.user.update({
        where: { id: existingEmployee.userId },
        data: { email, name }
      });
    }

    const updateData: any = {
      name,
      title,
      department,
      email,
      phone: phone || null,
      address: address || null,
      emergencyContact: emergencyContact || null,
      emergencyPhone: emergencyPhone || null,
      salary: salary ? parseFloat(salary) : null,
    };

    // Handle status changes
    if (status && status !== existingEmployee.status) {
      updateData.status = status;
      
      if (status === 'TERMINATED') {
        updateData.terminationDate = terminationDate ? new Date(terminationDate) : new Date();
        updateData.terminationReason = terminationReason || null;
      } else if (existingEmployee.status === 'TERMINATED' && status === 'ACTIVE') {
        // Reactivating employee
        updateData.terminationDate = null;
        updateData.terminationReason = null;
      }
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id: params.id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json(updatedEmployee);
  } catch (error) {
    console.error('Update employee error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const employee = await prisma.employee.findUnique({
      where: { id: params.id },
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Delete employee and cascade delete user
    await prisma.employee.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
