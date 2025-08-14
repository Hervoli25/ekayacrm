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

    // Check if user has executive report permissions
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || !['SUPER_ADMIN', 'DIRECTOR'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);

    // Parallel queries for dashboard data
    const [
      totalEmployees,
      activeDepartments,
      recentHires,
      pendingLeaves,
      totalPayroll,
      revenue,
      recentTerminations,
      overviewMetrics,
      departmentBreakdown,
      monthlyTrends
    ] = await Promise.all([
      // Total active employees
      prisma.user.count({
        where: { 
          isActive: true, 
          employee: { isNot: null } 
        }
      }),

      // Active departments
      prisma.department.count({
        where: { isActive: true }
      }),

      // Recent hires (last 30 days)
      prisma.employee.count({
        where: {
          hireDate: { gte: thirtyDaysAgo }
        }
      }),

      // Pending leave requests
      prisma.leaveRequest.count({
        where: { status: 'PENDING' }
      }),

      // Total monthly payroll (latest completed period)
      prisma.payrollPeriod.findFirst({
        where: { status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
        include: {
          payslips: {
            select: { netPay: true }
          }
        }
      }),

      // Revenue data (last 30 days)
      prisma.dailyReport.aggregate({
        where: {
          date: { gte: thirtyDaysAgo }
        },
        _sum: { totalRevenue: true },
        _count: true
      }),

      // Recent terminations
      prisma.termination.count({
        where: {
          effectiveDate: { gte: thirtyDaysAgo }
        }
      }),

      // Employee status distribution
      prisma.employee.groupBy({
        by: ['status'],
        _count: true
      }),

      // Department employee breakdown
      prisma.department.findMany({
        where: { isActive: true },
        include: {
          _count: {
            select: { 
              employees: { where: { isActive: true } }
            }
          }
        },
        orderBy: { name: 'asc' }
      }),

      // Monthly trends (last 6 months)
      prisma.$queryRaw`
        SELECT 
          DATE_TRUNC('month', "hireDate") as month,
          COUNT(*) as hires
        FROM "employees"
        WHERE "hireDate" >= ${sixMonthsAgo}
        GROUP BY DATE_TRUNC('month', "hireDate")
        ORDER BY month ASC
      `
    ]);

    // Calculate KPIs
    const totalMonthlyPayroll = totalPayroll?.payslips.reduce((sum, payslip) => 
      sum + Number(payslip.netPay), 0) || 0;

    const totalRevenue = Number(revenue._sum.totalRevenue) || 0;
    const avgDailyRevenue = revenue._count > 0 ? totalRevenue / revenue._count : 0;

    // Employee growth rate
    const employeeGrowthRate = recentHires > 0 && totalEmployees > 0 
      ? ((recentHires / totalEmployees) * 100) 
      : 0;

    // Turnover rate (terminations vs total employees)
    const turnoverRate = recentTerminations > 0 && totalEmployees > 0 
      ? ((recentTerminations / totalEmployees) * 100) 
      : 0;

    const executiveReport = {
      kpis: {
        totalEmployees,
        activeDepartments,
        recentHires,
        employeeGrowthRate: Number(employeeGrowthRate.toFixed(1)),
        turnoverRate: Number(turnoverRate.toFixed(1)),
        pendingLeaves,
        totalMonthlyPayroll,
        totalRevenue,
        avgDailyRevenue: Number(avgDailyRevenue.toFixed(0)),
        revenueGrowth: 0 // Would need historical data for comparison
      },
      
      employeeStatusDistribution: overviewMetrics.map(item => ({
        status: item.status,
        count: item._count
      })),

      departmentBreakdown: departmentBreakdown.map(dept => ({
        name: dept.name,
        code: dept.code,
        employees: dept._count.employees,
        budget: Number(dept.budget) || 0
      })),

      monthlyHiringTrends: monthlyTrends,

      alerts: [
        ...(pendingLeaves > 10 ? [{
          type: 'warning' as const,
          message: `${pendingLeaves} leave requests pending approval`,
          priority: 'medium' as const
        }] : []),
        
        ...(turnoverRate > 5 ? [{
          type: 'error' as const,
          message: `High turnover rate: ${turnoverRate}% this month`,
          priority: 'high' as const
        }] : []),
        
        ...(employeeGrowthRate > 10 ? [{
          type: 'info' as const,
          message: `Strong hiring growth: ${employeeGrowthRate}% this month`,
          priority: 'low' as const
        }] : [])
      ]
    };

    return NextResponse.json(executiveReport);
  } catch (error) {
    console.error('Error generating executive report:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}