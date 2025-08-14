import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, notes } = body;

    const application = await prisma.application.update({
      where: { id: params.id },
      data: {
        status,
        ...(notes && { notes }),
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            department: true,
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json({
      id: application.id,
      jobId: application.jobId,
      jobTitle: application.job?.title || 'Unknown Position',
      candidateName: application.candidateName,
      candidateEmail: application.email,
      candidatePhone: application.phone || '',
      resumePath: application.resumeUrl || '',
      coverLetter: application.coverLetter || '',
      status: application.status,
      appliedAt: application.appliedAt.toISOString(),
      reviewedBy: application.reviewer?.name || undefined,
      reviewedAt: application.reviewedAt?.toISOString(),
      notes: application.notes || ''
    });
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}