import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only SUPER_ADMIN can access system health
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('=== Running system health check ===');

    // Check for orphaned users
    const orphanedUsers = await prisma.user.findMany({
      where: {
        employee: null,
        role: { not: 'SUPER_ADMIN' }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    // Check for invalid employee IDs
    const allEmployees = await prisma.employee.findMany({
      select: {
        id: true,
        employeeId: true,
        name: true
      }
    });

    const validEmpPattern = /^EMP\d{3}$/;
    const invalidEmployeeIds = allEmployees.filter(emp => {
      const id = emp.employeeId;
      return (
        id.includes('NaN') ||
        !id.startsWith('EMP') ||
        !validEmpPattern.test(id)
      );
    });

    // Check for failed transactions (users without employees created in last 24h)
    const recentFailedTransactions = await prisma.user.findMany({
      where: {
        employee: null,
        role: { not: 'SUPER_ADMIN' },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    // Check for duplicate emails
    const duplicateEmails = await prisma.$queryRaw`
      SELECT email, COUNT(*) as count 
      FROM users 
      GROUP BY email 
      HAVING COUNT(*) > 1
    `;

    // Check for missing employee profiles for certain roles
    const usersNeedingProfiles = await prisma.user.findMany({
      where: {
        role: { in: ['DIRECTOR', 'HR_MANAGER', 'DEPARTMENT_MANAGER'] },
        profile: null
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    // Database performance metrics
    const totalUsers = await prisma.user.count();
    const totalEmployees = await prisma.employee.count();
    const totalProfiles = await prisma.employeeProfile.count();
    
    // Recent activity
    const recentUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }
    });

    const issues = [];
    
    if (orphanedUsers.length > 0) {
      issues.push({
        type: 'orphaned_users',
        severity: 'high',
        title: 'Orphaned Users Detected',
        description: `${orphanedUsers.length} users without employee records`,
        count: orphanedUsers.length,
        details: orphanedUsers.map(u => `${u.name} (${u.email})`)
      });
    }

    if (invalidEmployeeIds.length > 0) {
      issues.push({
        type: 'invalid_employee_ids',
        severity: 'medium',
        title: 'Invalid Employee IDs',
        description: `${invalidEmployeeIds.length} employees with malformed IDs`,
        count: invalidEmployeeIds.length,
        details: invalidEmployeeIds.map(e => `${e.name}: ${e.employeeId}`)
      });
    }

    if (recentFailedTransactions.length > 0) {
      issues.push({
        type: 'failed_transactions',
        severity: 'high',
        title: 'Recent Transaction Failures',
        description: `${recentFailedTransactions.length} users created in last 24h without employee records`,
        count: recentFailedTransactions.length,
        details: recentFailedTransactions.map(u => `${u.name} (${u.email})`)
      });
    }

    if (Array.isArray(duplicateEmails) && duplicateEmails.length > 0) {
      issues.push({
        type: 'duplicate_emails',
        severity: 'high',
        title: 'Duplicate Email Addresses',
        description: `${duplicateEmails.length} duplicate email addresses found`,
        count: duplicateEmails.length,
        details: duplicateEmails.map(d => `${d.email} (${d.count} occurrences)`)
      });
    }

    if (usersNeedingProfiles.length > 0) {
      issues.push({
        type: 'missing_profiles',
        severity: 'low',
        title: 'Missing Employee Profiles',
        description: `${usersNeedingProfiles.length} senior users without detailed profiles`,
        count: usersNeedingProfiles.length,
        details: usersNeedingProfiles.map(u => `${u.name} (${u.role})`)
      });
    }

    const systemHealth = {
      status: issues.length === 0 ? 'healthy' : issues.some(i => i.severity === 'high') ? 'critical' : 'warning',
      lastChecked: new Date().toISOString(),
      issues,
      metrics: {
        totalUsers,
        totalEmployees,
        totalProfiles,
        recentUsers,
        orphanedCount: orphanedUsers.length,
        invalidIdCount: invalidEmployeeIds.length
      }
    };

    console.log('System health check completed:', {
      status: systemHealth.status,
      issueCount: issues.length
    });

    return NextResponse.json(systemHealth);

  } catch (error) {
    console.error('System health check error:', error);
    return NextResponse.json(
      { error: 'Failed to check system health' },
      { status: 500 }
    );
  }
}