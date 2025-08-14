import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const applications = await prisma.application.findMany({
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
      },
      orderBy: {
        appliedAt: 'desc'
      }
    });

    // Transform data to match component interface
    const transformedApplications = applications.map(app => ({
      id: app.id,
      jobId: app.jobId,
      jobTitle: app.job?.title || 'Unknown Position',
      candidateName: app.candidateName,
      candidateEmail: app.email,
      candidatePhone: app.phone || '',
      resumePath: app.resumeUrl || '',
      coverLetter: app.coverLetter || '',
      status: app.status,
      appliedAt: app.appliedAt.toISOString(),
      reviewedBy: app.reviewer?.name || undefined,
      reviewedAt: app.reviewedAt?.toISOString(),
      notes: app.notes || ''
    }));

    return NextResponse.json(transformedApplications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}