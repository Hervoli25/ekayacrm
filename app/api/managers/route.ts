import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Roles that can manage other employees
const MANAGEMENT_ROLES = [
  'SUPER_ADMIN',
  'DIRECTOR', 
  'HR_MANAGER',
  'DEPARTMENT_MANAGER',
  'SUPERVISOR'
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const excludeUserId = searchParams.get('excludeUserId'); // Exclude current user when editing
    const roleLevel = searchParams.get('roleLevel'); // Filter by role level

    try {
      // Build where clause for managers
      const whereClause: any = {
        isActive: true,
        role: {
          in: MANAGEMENT_ROLES
        }
      };

      // Exclude specific user (useful when editing an employee)
      if (excludeUserId) {
        whereClause.id = {
          not: excludeUserId
        };
      }

      // Filter by department if specified
      if (department && department !== 'all') {
        whereClause.OR = [
          { department: department }, // Same department
          { role: { in: ['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER'] } } // Or high-level roles that can manage across departments
        ];
      }

      const managers = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          employee: {
            select: {
              employeeId: true,
              title: true
            }
          }
        },
        orderBy: [
          { role: 'asc' }, // Order by role hierarchy
          { name: 'asc' }
        ]
      });

      // Transform and organize managers by role hierarchy
      const organizedManagers = managers.map(manager => ({
        id: manager.id,
        name: manager.name,
        email: manager.email,
        role: manager.role,
        roleLabel: getRoleLabel(manager.role),
        department: manager.department,
        title: manager.employee?.title || 'N/A',
        employeeId: manager.employee?.employeeId || 'N/A',
        canManageDepartments: ['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER'].includes(manager.role),
        hierarchy: getRoleHierarchy(manager.role)
      })).sort((a, b) => b.hierarchy - a.hierarchy); // Sort by hierarchy level (highest first)

      // Group by role for better organization
      const groupedManagers = organizedManagers.reduce((acc, manager) => {
        const roleGroup = acc[manager.role] || [];
        roleGroup.push(manager);
        acc[manager.role] = roleGroup;
        return acc;
      }, {} as Record<string, typeof organizedManagers>);

      return NextResponse.json({
        managers: organizedManagers,
        groupedByRole: groupedManagers,
        totalCount: organizedManagers.length
      });

    } catch (error) {
      console.error('Database error:', error);
      
      // Fallback: Return basic structure if database query fails
      return NextResponse.json({
        managers: [],
        groupedByRole: {},
        totalCount: 0,
        error: 'Database connection issue. Please try again.'
      });
    }

  } catch (error) {
    console.error('Error fetching managers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Get specific manager details
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { managerId, action } = await request.json();

    if (action === 'getManagerDetails') {
      const manager = await prisma.user.findUnique({
        where: { 
          id: managerId,
          isActive: true,
          role: { in: MANAGEMENT_ROLES }
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          employee: {
            select: {
              employeeId: true,
              title: true,
              phone: true
            }
          },
          managedEmployees: {
            select: {
              employee: {
                select: {
                  name: true,
                  employee: {
                    select: {
                      title: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!manager) {
        return NextResponse.json({ error: 'Manager not found' }, { status: 404 });
      }

      return NextResponse.json({
        manager: {
          ...manager,
          roleLabel: getRoleLabel(manager.role),
          hierarchy: getRoleHierarchy(manager.role),
          directReports: manager.managedEmployees.length
        }
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Error processing manager request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper functions
function getRoleLabel(role: string): string {
  const roleLabels: Record<string, string> = {
    'SUPER_ADMIN': 'Super Administrator',
    'DIRECTOR': 'Director',
    'HR_MANAGER': 'HR Manager',
    'DEPARTMENT_MANAGER': 'Department Manager',
    'SUPERVISOR': 'Supervisor'
  };
  return roleLabels[role] || role;
}

function getRoleHierarchy(role: string): number {
  const hierarchy: Record<string, number> = {
    'SUPER_ADMIN': 10,
    'DIRECTOR': 8,
    'HR_MANAGER': 7,
    'DEPARTMENT_MANAGER': 6,
    'SUPERVISOR': 5
  };
  return hierarchy[role] || 0;
}
