
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, Clock, CheckCircle, XCircle, DollarSign, Receipt, TrendingUp } from 'lucide-react';
import { Role } from '@prisma/client';

interface StatsProps {
  userRole: Role;
}

export function DashboardStats({ userRole }: StatsProps) {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    totalRevenue: 0,
    totalReceipts: 0,
    pendingExpenses: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const requests = [
          fetch('/api/employees'),
          fetch('/api/leave-requests'),
        ];

        // Add finance API calls for admin users
        if (userRole === 'ADMIN') {
          requests.push(
            fetch('/api/finance/analytics?period=30'),
            fetch('/api/finance/receipts'),
            fetch('/api/finance/expenses')
          );
        }

        const responses = await Promise.all(requests);
        const [employeesRes, leaveRequestsRes, ...financeResponses] = responses;

        const employees = await employeesRes.json();
        const leaveRequests = await leaveRequestsRes.json();

        const pendingRequests = leaveRequests?.filter((req: any) => req.status === 'PENDING')?.length || 0;
        const approvedRequests = leaveRequests?.filter((req: any) => req.status === 'APPROVED')?.length || 0;
        const rejectedRequests = leaveRequests?.filter((req: any) => req.status === 'REJECTED')?.length || 0;

        let financeStats = { totalRevenue: 0, totalReceipts: 0, pendingExpenses: 0 };
        
        if (userRole === 'ADMIN' && financeResponses.length >= 3) {
          try {
            const [analyticsRes, receiptsRes, expensesRes] = financeResponses;
            const analytics = await analyticsRes.json();
            const receipts = await receiptsRes.json();
            const expenses = await expensesRes.json();

            financeStats = {
              totalRevenue: analytics?.summary?.totalRevenue || 0,
              totalReceipts: receipts?.length || 0,
              pendingExpenses: expenses?.filter((exp: any) => exp.status === 'PENDING')?.length || 0,
            };
          } catch (financeError) {
            console.error('Error fetching finance stats:', financeError);
          }
        }

        setStats({
          totalEmployees: employees?.length || 0,
          pendingRequests,
          approvedRequests,
          rejectedRequests,
          ...financeStats,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userRole]);

  const adminStats = [
    {
      title: 'Total Revenue (30d)',
      value: `R${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Receipts Generated',
      value: stats.totalReceipts,
      icon: Receipt,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Pending Leave Requests',
      value: stats.pendingRequests,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
  ];

  const employeeStats = [
    {
      title: 'My Pending Requests',
      value: stats.pendingRequests,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'My Approved Requests',
      value: stats.approvedRequests,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Team Members',
      value: stats.totalEmployees,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
  ];

  const statsToShow = userRole === 'ADMIN' ? adminStats : employeeStats;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsToShow.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
