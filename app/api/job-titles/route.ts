import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const createJobTitleSchema = z.object({
  title: z.string().min(2).max(100),
  department: z.string().min(2).max(50),
  level: z.enum(['ENTRY', 'JUNIOR', 'SENIOR', 'LEAD', 'MANAGER', 'DIRECTOR', 'EXECUTIVE']),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

// Comprehensive job titles organized by department and level
const DEFAULT_JOB_TITLES = [
  // Executive Level
  { title: 'Chief Executive Officer', department: 'Executive', level: 'EXECUTIVE', description: 'Chief Executive Officer' },
  { title: 'Chief Financial Officer', department: 'Executive', level: 'EXECUTIVE', description: 'Chief Financial Officer' },
  { title: 'Chief Technology Officer', department: 'Executive', level: 'EXECUTIVE', description: 'Chief Technology Officer' },
  { title: 'Chief Operating Officer', department: 'Executive', level: 'EXECUTIVE', description: 'Chief Operating Officer' },
  { title: 'Chief Risk Officer', department: 'Executive', level: 'EXECUTIVE', description: 'Chief Risk Officer' },
  
  // Directors
  { title: 'Director of Human Resources', department: 'Human Resources', level: 'DIRECTOR', description: 'Director of Human Resources' },
  { title: 'Director of Finance', department: 'Finance', level: 'DIRECTOR', description: 'Director of Finance' },
  { title: 'Director of Trading', department: 'Trading', level: 'DIRECTOR', description: 'Director of Trading Operations' },
  { title: 'Director of Risk Management', department: 'Risk Management', level: 'DIRECTOR', description: 'Director of Risk Management' },
  { title: 'Director of Information Technology', department: 'IT', level: 'DIRECTOR', description: 'Director of Information Technology' },
  { title: 'Director of Operations', department: 'Operations', level: 'DIRECTOR', description: 'Director of Operations' },
  { title: 'Director of Compliance', department: 'Compliance', level: 'DIRECTOR', description: 'Director of Compliance' },
  
  // Managers
  { title: 'HR Manager', department: 'Human Resources', level: 'MANAGER', description: 'Human Resources Manager' },
  { title: 'Finance Manager', department: 'Finance', level: 'MANAGER', description: 'Finance Manager' },
  { title: 'Trading Manager', department: 'Trading', level: 'MANAGER', description: 'Trading Operations Manager' },
  { title: 'Risk Manager', department: 'Risk Management', level: 'MANAGER', description: 'Risk Management Manager' },
  { title: 'IT Manager', department: 'IT', level: 'MANAGER', description: 'Information Technology Manager' },
  { title: 'Operations Manager', department: 'Operations', level: 'MANAGER', description: 'Operations Manager' },
  { title: 'Compliance Manager', department: 'Compliance', level: 'MANAGER', description: 'Compliance Manager' },
  { title: 'Portfolio Manager', department: 'Trading', level: 'MANAGER', description: 'Portfolio Manager' },
  { title: 'Treasury Manager', department: 'Finance', level: 'MANAGER', description: 'Treasury Manager' },
  { title: 'Audit Manager', department: 'Finance', level: 'MANAGER', description: 'Internal Audit Manager' },
  
  // Team Leads/Supervisors
  { title: 'Senior HR Specialist', department: 'Human Resources', level: 'LEAD', description: 'Senior Human Resources Specialist' },
  { title: 'Senior Financial Analyst', department: 'Finance', level: 'LEAD', description: 'Senior Financial Analyst' },
  { title: 'Senior Trader', department: 'Trading', level: 'LEAD', description: 'Senior Trader' },
  { title: 'Senior Risk Analyst', department: 'Risk Management', level: 'LEAD', description: 'Senior Risk Analyst' },
  { title: 'Senior Developer', department: 'IT', level: 'LEAD', description: 'Senior Software Developer' },
  { title: 'Senior Systems Administrator', department: 'IT', level: 'LEAD', description: 'Senior Systems Administrator' },
  { title: 'Operations Supervisor', department: 'Operations', level: 'LEAD', description: 'Operations Supervisor' },
  { title: 'Compliance Supervisor', department: 'Compliance', level: 'LEAD', description: 'Compliance Supervisor' },
  
  // Senior Level
  { title: 'Senior Recruiter', department: 'Human Resources', level: 'SENIOR', description: 'Senior Recruiter' },
  { title: 'Senior Accountant', department: 'Finance', level: 'SENIOR', description: 'Senior Accountant' },
  { title: 'Senior Quantitative Analyst', department: 'Trading', level: 'SENIOR', description: 'Senior Quantitative Analyst' },
  { title: 'Senior Risk Specialist', department: 'Risk Management', level: 'SENIOR', description: 'Senior Risk Specialist' },
  { title: 'Senior Software Engineer', department: 'IT', level: 'SENIOR', description: 'Senior Software Engineer' },
  { title: 'Senior Database Administrator', department: 'IT', level: 'SENIOR', description: 'Senior Database Administrator' },
  { title: 'Senior Operations Analyst', department: 'Operations', level: 'SENIOR', description: 'Senior Operations Analyst' },
  { title: 'Senior Compliance Officer', department: 'Compliance', level: 'SENIOR', description: 'Senior Compliance Officer' },
  
  // Junior Level
  { title: 'HR Specialist', department: 'Human Resources', level: 'JUNIOR', description: 'Human Resources Specialist' },
  { title: 'Financial Analyst', department: 'Finance', level: 'JUNIOR', description: 'Financial Analyst' },
  { title: 'Trader', department: 'Trading', level: 'JUNIOR', description: 'Trader' },
  { title: 'Risk Analyst', department: 'Risk Management', level: 'JUNIOR', description: 'Risk Analyst' },
  { title: 'Software Developer', department: 'IT', level: 'JUNIOR', description: 'Software Developer' },
  { title: 'Systems Administrator', department: 'IT', level: 'JUNIOR', description: 'Systems Administrator' },
  { title: 'Operations Analyst', department: 'Operations', level: 'JUNIOR', description: 'Operations Analyst' },
  { title: 'Compliance Officer', department: 'Compliance', level: 'JUNIOR', description: 'Compliance Officer' },
  
  // Entry Level
  { title: 'HR Coordinator', department: 'Human Resources', level: 'ENTRY', description: 'Human Resources Coordinator' },
  { title: 'Accounting Clerk', department: 'Finance', level: 'ENTRY', description: 'Accounting Clerk' },
  { title: 'Junior Trader', department: 'Trading', level: 'ENTRY', description: 'Junior Trader' },
  { title: 'Risk Coordinator', department: 'Risk Management', level: 'ENTRY', description: 'Risk Coordinator' },
  { title: 'Junior Developer', department: 'IT', level: 'ENTRY', description: 'Junior Software Developer' },
  { title: 'IT Support Specialist', department: 'IT', level: 'ENTRY', description: 'IT Support Specialist' },
  { title: 'Operations Coordinator', department: 'Operations', level: 'ENTRY', description: 'Operations Coordinator' },
  { title: 'Compliance Coordinator', department: 'Compliance', level: 'ENTRY', description: 'Compliance Coordinator' },
  { title: 'Administrative Assistant', department: 'Human Resources', level: 'ENTRY', description: 'Administrative Assistant' },
  { title: 'Data Entry Clerk', department: 'Operations', level: 'ENTRY', description: 'Data Entry Clerk' },
  { title: 'Intern', department: 'Human Resources', level: 'ENTRY', description: 'Intern' },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const level = searchParams.get('level');
    const isActive = searchParams.get('isActive');

    // Check if JobTitle model exists, if not return default titles
    try {
      const whereClause: any = {};
      
      if (department && department !== 'all') {
        whereClause.department = department;
      }
      
      if (level && level !== 'all') {
        whereClause.level = level;
      }
      
      if (isActive !== null) {
        whereClause.isActive = isActive === 'true';
      }

      const jobTitles = await prisma.jobTitle.findMany({
        where: whereClause,
        orderBy: [
          { department: 'asc' },
          { level: 'desc' },
          { title: 'asc' }
        ]
      });

      return NextResponse.json(jobTitles);
    } catch (error) {
      // If JobTitle model doesn't exist, return filtered default titles
      let filteredTitles = DEFAULT_JOB_TITLES;
      
      if (department && department !== 'all') {
        filteredTitles = filteredTitles.filter(title => title.department === department);
      }
      
      if (level && level !== 'all') {
        filteredTitles = filteredTitles.filter(title => title.level === level);
      }

      return NextResponse.json(filteredTitles);
    }
  } catch (error) {
    console.error('Error fetching job titles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || !['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { title, department, level, description, isActive } = createJobTitleSchema.parse(body);

    try {
      // Check if job title already exists
      const existingTitle = await prisma.jobTitle.findFirst({
        where: {
          title: { equals: title, mode: 'insensitive' },
          department: { equals: department, mode: 'insensitive' }
        }
      });

      if (existingTitle) {
        return NextResponse.json({ 
          error: 'Job title already exists in this department' 
        }, { status: 400 });
      }

      const jobTitle = await prisma.jobTitle.create({
        data: {
          title,
          department,
          level,
          description,
          isActive: isActive ?? true,
          createdBy: session.user.id
        }
      });

      return NextResponse.json(jobTitle);
    } catch (error) {
      return NextResponse.json({ 
        error: 'JobTitle model not found. Please run database migrations first.' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error creating job title:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
