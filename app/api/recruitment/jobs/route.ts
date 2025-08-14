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

    const jobs = await prisma.jobPosting.findMany({
      include: {
        poster: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        applications: {
          select: {
            id: true,
            status: true,
          }
        }
      },
      orderBy: {
        postedAt: 'desc'
      }
    });

    // Transform data to match component interface
    const transformedJobs = jobs.map(job => ({
      id: job.id,
      title: job.title,
      department: job.department,
      location: job.location,
      type: job.employmentType,
      salaryMin: 0, // Parse from salaryRange if needed
      salaryMax: 0, // Parse from salaryRange if needed
      salaryRange: job.salaryRange,
      description: job.description,
      requirements: job.requirements,
      status: job.status,
      postedBy: job.poster?.name || 'Unknown',
      postedAt: job.postedAt.toISOString(),
      applicationsCount: job.applications.length,
      closingDate: job.closingDate?.toISOString()
    }));

    return NextResponse.json(transformedJobs);
  } catch (error) {
    console.error('Error fetching job postings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, department, location, type, description, requirements, salaryMin, salaryMax, closingDate } = body;

    if (!title || !department || !type) {
      return NextResponse.json(
        { error: 'Title, department, and type are required' },
        { status: 400 }
      );
    }

    const salaryRange = salaryMin && salaryMax ? `R${salaryMin.toLocaleString()} - R${salaryMax.toLocaleString()}` : undefined;

    const job = await prisma.jobPosting.create({
      data: {
        title,
        department,
        location: location || 'Not specified',
        employmentType: type,
        description: description || '',
        requirements: requirements || '',
        salaryRange,
        postedBy: session.user.id,
        status: 'ACTIVE',
        closingDate: closingDate ? new Date(closingDate) : null,
      },
      include: {
        poster: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json({
      id: job.id,
      title: job.title,
      department: job.department,
      location: job.location,
      type: job.employmentType,
      salaryMin,
      salaryMax,
      salaryRange: job.salaryRange,
      description: job.description,
      requirements: job.requirements,
      status: job.status,
      postedBy: job.poster?.name || 'Unknown',
      postedAt: job.postedAt.toISOString(),
      applicationsCount: 0,
      closingDate: job.closingDate?.toISOString()
    });
  } catch (error) {
    console.error('Error creating job posting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}