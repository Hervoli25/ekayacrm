import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Comprehensive role definitions with descriptions and permissions
const ROLES = [
  {
    value: 'SUPER_ADMIN',
    label: 'Super Administrator',
    description: 'Full system access with all administrative privileges',
    level: 'EXECUTIVE',
    canManage: ['ALL']
  },
  {
    value: 'DIRECTOR',
    label: 'Director',
    description: 'Senior leadership role with department oversight',
    level: 'DIRECTOR',
    canManage: ['DEPARTMENT_MANAGER', 'SUPERVISOR', 'SENIOR_EMPLOYEE', 'EMPLOYEE', 'INTERN']
  },
  {
    value: 'HR_MANAGER',
    label: 'HR Manager',
    description: 'Human Resources management with employee oversight',
    level: 'MANAGER',
    canManage: ['SUPERVISOR', 'SENIOR_EMPLOYEE', 'EMPLOYEE', 'INTERN']
  },
  {
    value: 'DEPARTMENT_MANAGER',
    label: 'Department Manager',
    description: 'Department-level management responsibilities',
    level: 'MANAGER',
    canManage: ['SUPERVISOR', 'SENIOR_EMPLOYEE', 'EMPLOYEE', 'INTERN']
  },
  {
    value: 'SUPERVISOR',
    label: 'Supervisor',
    description: 'Team supervision and coordination role',
    level: 'LEAD',
    canManage: ['SENIOR_EMPLOYEE', 'EMPLOYEE', 'INTERN']
  },
  {
    value: 'SENIOR_EMPLOYEE',
    label: 'Senior Employee',
    description: 'Experienced employee with mentoring responsibilities',
    level: 'SENIOR',
    canManage: ['EMPLOYEE', 'INTERN']
  },
  {
    value: 'EMPLOYEE',
    label: 'Employee',
    description: 'Standard employee role',
    level: 'JUNIOR',
    canManage: ['INTERN']
  },
  {
    value: 'INTERN',
    label: 'Intern',
    description: 'Temporary learning position',
    level: 'ENTRY',
    canManage: []
  }
];

// Role hierarchy for reporting structure
const ROLE_HIERARCHY = {
  'SUPER_ADMIN': 8,
  'DIRECTOR': 7,
  'HR_MANAGER': 6,
  'DEPARTMENT_MANAGER': 6,
  'SUPERVISOR': 5,
  'SENIOR_EMPLOYEE': 4,
  'EMPLOYEE': 3,
  'INTERN': 1
};

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level');
    const canManage = searchParams.get('canManage') === 'true';
    const forReporting = searchParams.get('forReporting') === 'true';

    let filteredRoles = ROLES;

    // Filter by level if specified
    if (level && level !== 'all') {
      filteredRoles = filteredRoles.filter(role => role.level === level);
    }

    // If requesting roles for reporting structure, return roles that can manage others
    if (forReporting) {
      filteredRoles = filteredRoles.filter(role => 
        role.canManage.length > 0 && role.canManage[0] !== 'INTERN'
      );
    }

    // If requesting manageable roles, filter based on current user's role
    if (canManage && session.user.role) {
      const currentRole = ROLES.find(r => r.value === session.user.role);
      if (currentRole) {
        filteredRoles = filteredRoles.filter(role => 
          currentRole.canManage.includes('ALL') || currentRole.canManage.includes(role.value)
        );
      }
    }

    return NextResponse.json({
      roles: filteredRoles,
      hierarchy: ROLE_HIERARCHY
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get roles that can be assigned by the current user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();

    if (action === 'getAssignableRoles') {
      const currentUserRole = session.user.role;
      const currentRole = ROLES.find(r => r.value === currentUserRole);
      
      if (!currentRole) {
        return NextResponse.json({ error: 'Invalid user role' }, { status: 400 });
      }

      const assignableRoles = ROLES.filter(role => 
        currentRole.canManage.includes('ALL') || currentRole.canManage.includes(role.value)
      );

      return NextResponse.json({
        assignableRoles,
        currentUserRole: currentRole
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing role request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
