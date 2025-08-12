import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, department } = await req.json();

    if (!name || !email || !department) {
      return NextResponse.json(
        { error: 'Name, email, and department are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Generate temporary password
    const tempPassword = `Director${Math.random().toString(36).substring(2, 8)}!`;
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Create user with director role
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'DIRECTOR',
      },
    });

    // Create employee record
    const employeeId = `DIR${String(Date.now()).slice(-3)}`;
    await prisma.employee.create({
      data: {
        userId: user.id,
        employeeId,
        name,
        title: 'Director',
        department,
        email,
        phone: '', // Will be updated by director
      },
    });

    // Log temporary credentials for SUPER_ADMIN access
    await prisma.temporaryCredential.create({
      data: {
        employeeId: user.id,
        employeeName: name,
        email,
        tempPassword,
        role: 'DIRECTOR',
        createdBy: session.user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        notes: `Director created by ${session.user.name || session.user.email} for ${department} department`
      }
    });

    // Log the creation for audit
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CREATE_DIRECTOR',
        entityType: 'User',
        entityId: user.id,
        details: JSON.stringify({
          directorName: name,
          directorEmail: email,
          department,
        }),
      },
    }).catch(() => {
      // Audit log is optional, don't fail if it doesn't work
    });

    return NextResponse.json({
      success: true,
      director: {
        id: user.id,
        name,
        email,
        department,
        employeeId,
        tempPassword, // Only returned once for setup
      },
    });

  } catch (error) {
    console.error('Error creating director:', error);
    return NextResponse.json(
      { error: 'Failed to create director' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}