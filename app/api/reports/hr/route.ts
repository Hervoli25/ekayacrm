import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || !['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    const [
      employeesByDepartment,
      leaveAnalytics,
      performanceReviews,
      timeTrackingMetrics,
      disciplinaryActions,
      upcomingReviews,
      salaryDistribution,
      roleDistribution,
      tenureAnalysis
    ] = await Promise.all([
      // Employees by department
      prisma.department.findMany({
        where: { isActive: true },
        include: {
          employees: {
            where: { isActive: true },
            include: {
              employee: {
                select: { title: true, salary: true, hireDate: true }
              }
            }
          }
        }
      }),

      // Leave analytics
      prisma.leaveRequest.groupBy({
        by: ['status'],
        _count: true,
        where: {
          createdAt: { gte: ninetyDaysAgo }
        }
      }),

      // Performance review status
      prisma.performanceReview.groupBy({
        by: ['status'],
        _count: true,
        where: {
          createdAt: { gte: ninetyDaysAgo }
        }
      }),

      // Time tracking metrics
      prisma.timeEntry.aggregate({
        where: {
          clockIn: { gte: thirtyDaysAgo },
          status: 'COMPLETED'
        },
        _avg: { totalHours: true },
        _sum: { totalHours: true },
        _count: true
      }),

      // Disciplinary actions
      prisma.disciplinaryAction.count({
        where: {
          issuedDate: { gte: ninetyDaysAgo }
        }
      }),

      // Upcoming performance reviews
      prisma.performanceReview.count({
        where: {
          dueDate: {
            gte: now,
            lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
          },
          status: { in: ['DRAFT', 'IN_PROGRESS'] }
        }
      }),

      // Salary distribution
      prisma.employee.groupBy({
        by: ['department'],
        _avg: { salary: true },
        _min: { salary: true },
        _max: { salary: true },
        where: {
          salary: { not: null },
          status: 'ACTIVE'
        }
      }),

      // Role distribution
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
        where: {
          isActive: true,
          employee: { isNot: null }
        }
      }),

      // Employee tenure analysis
      prisma.$queryRaw`
        SELECT 
          CASE 
            WHEN EXTRACT(YEAR FROM AGE("hireDate")) < 1 THEN '0-1 years'
            WHEN EXTRACT(YEAR FROM AGE("hireDate")) < 3 THEN '1-3 years'
            WHEN EXTRACT(YEAR FROM AGE("hireDate")) < 5 THEN '3-5 years'
            ELSE '5+ years'
          END as tenure_bracket,
          COUNT(*) as count
        FROM "employees"
        WHERE "status" = 'ACTIVE'
        GROUP BY tenure_bracket
        ORDER BY 
          CASE tenure_bracket
            WHEN '0-1 years' THEN 1
            WHEN '1-3 years' THEN 2
            WHEN '3-5 years' THEN 3
            ELSE 4
          END
      `
    ]);

    // Calculate additional metrics
    const totalActiveEmployees = employeesByDepartment.reduce((sum, dept) => 
      sum + dept.employees.length, 0
    );

    const avgSalary = employeesByDepartment.reduce((sum, dept) => {
      const deptSalarySum = dept.employees.reduce((dSum, emp) => 
        dSum + Number(emp.employee?.salary || 0), 0
      );
      return sum + deptSalarySum;
    }, 0) / Math.max(totalActiveEmployees, 1);

    const avgHoursPerEmployee = Number(timeTrackingMetrics._avg.totalHours) || 0;
    const totalHoursWorked = Number(timeTrackingMetrics._sum.totalHours) || 0;

    // Leave utilization rate
    const totalLeaveRequests = leaveAnalytics.reduce((sum, item) => sum + item._count, 0);
    const approvedLeaves = leaveAnalytics.find(item => item.status === 'APPROVED')?._count || 0;
    const leaveApprovalRate = totalLeaveRequests > 0 ? (approvedLeaves / totalLeaveRequests) * 100 : 0;

    const hrReport = {
      overview: {
        totalEmployees: totalActiveEmployees,
        avgSalary: Number(avgSalary.toFixed(0)),
        avgHoursWorked: Number(avgHoursPerEmployee.toFixed(1)),
        disciplinaryActions,
        upcomingReviews,
        leaveApprovalRate: Number(leaveApprovalRate.toFixed(1))
      },

      departmentMetrics: employeesByDepartment.map(dept => ({
        name: dept.name,
        code: dept.code,
        employeeCount: dept.employees.length,
        avgSalary: dept.employees.length > 0 
          ? dept.employees.reduce((sum, emp) => sum + Number(emp.employee?.salary || 0), 0) / dept.employees.length
          : 0,
        avgTenure: dept.employees.length > 0
          ? dept.employees.reduce((sum, emp) => {
              const years = emp.employee?.hireDate 
                ? (now.getTime() - new Date(emp.employee.hireDate).getTime()) / (365 * 24 * 60 * 60 * 1000)
                : 0;
              return sum + years;
            }, 0) / dept.employees.length
          : 0
      })),

      leaveAnalytics: {
        distribution: leaveAnalytics.map(item => ({
          status: item.status,
          count: item._count
        })),
        approvalRate: leaveApprovalRate
      },

      performanceMetrics: {
        reviewStatus: performanceReviews.map(item => ({
          status: item.status,
          count: item._count
        })),
        upcomingReviews
      },

      workforceAnalytics: {
        roleDistribution: roleDistribution.map(item => ({
          role: item.role,
          count: item._count
        })),
        
        tenureDistribution: tenureAnalysis,
        
        salaryBands: salaryDistribution.map(item => ({
          department: item.department,
          avgSalary: Number(item._avg.salary) || 0,
          minSalary: Number(item._min.salary) || 0,
          maxSalary: Number(item._max.salary) || 0
        }))
      },

      timeAndAttendance: {
        totalHoursWorked,
        avgHoursPerEmployee,
        totalEntries: timeTrackingMetrics._count
      },

      actionItems: [
        ...(upcomingReviews > 0 ? [{
          type: 'info' as const,
          message: `${upcomingReviews} performance reviews due in the next 30 days`,
          priority: 'medium' as const
        }] : []),
        
        ...(disciplinaryActions > 5 ? [{
          type: 'warning' as const,
          message: `${disciplinaryActions} disciplinary actions in the last 90 days`,
          priority: 'high' as const
        }] : []),
        
        ...(leaveApprovalRate < 80 ? [{
          type: 'warning' as const,
          message: `Low leave approval rate: ${leaveApprovalRate.toFixed(1)}%`,
          priority: 'medium' as const
        }] : [])
      ]
    };

    return NextResponse.json(hrReport);
  } catch (error) {
    console.error('Error generating HR report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}