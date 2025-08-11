

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  UserPlus,
  UserMinus,
  CalendarDays,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  BarChart3,
  PieChart,
  Activity,
  Building,
  Calendar,
  CheckCircle2,
  XCircle,
  UserCheck,
} from 'lucide-react';
import { Role } from '@prisma/client';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  newHiresThisMonth: number;
  terminatedThisMonth: number;
  pendingLeaveRequests: number;
  approvedLeavesToday: number;
  employeesByDepartment: Array<{ department: string; count: number }>;
  employeesByStatus: Array<{ status: string; count: number }>;
  leaveRequestsByType: Array<{ type: string; count: number }>;
  recentActivity: Array<{
    id: string;
    type: string;
    description: string;
    date: string;
    employeeName?: string;
  }>;
}

interface EnhancedDashboardStatsProps {
  userRole: Role;
  userId: string;
}

export function EnhancedDashboardStats({ userRole, userId }: EnhancedDashboardStatsProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('thisMonth');

  const isManager = ['SUPER_ADMIN', 'ADMIN', 'HR_DIRECTOR', 'MANAGER'].includes(userRole);

  useEffect(() => {
    fetchDashboardStats();
  }, [timeRange]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`/api/dashboard/stats?range=${timeRange}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-600">Unable to load dashboard statistics</p>
        </CardContent>
      </Card>
    );
  }

  const getDepartmentColor = (index: number) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-purple-100 text-purple-800',
      'bg-orange-100 text-orange-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      {isManager && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">HR Analytics Dashboard</h2>
            <p className="text-gray-600">Comprehensive view of your organization's HR metrics</p>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="last3Months">Last 3 Months</SelectItem>
              <SelectItem value="thisYear">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees}</p>
                <div className="flex items-center mt-1">
                  <UserCheck className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">{stats.activeEmployees} active</span>
                </div>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Hires</p>
                <p className="text-2xl font-bold text-gray-900">{stats.newHiresThisMonth}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">This month</span>
                </div>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <UserPlus className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Leaves</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingLeaveRequests}</p>
                <div className="flex items-center mt-1">
                  <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-sm text-yellow-600">Awaiting approval</span>
                </div>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <CalendarDays className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">On Leave Today</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approvedLeavesToday}</p>
                <div className="flex items-center mt-1">
                  <CheckCircle2 className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-sm text-blue-600">Approved leaves</span>
                </div>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isManager && (
        <>
          {/* Department & Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="mr-2 h-5 w-5" />
                  Employees by Department
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.employeesByDepartment.map((dept, index) => (
                    <div key={dept.department} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge className={getDepartmentColor(index)} variant="secondary">
                          {dept.department}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{dept.count}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(dept.count / stats.totalEmployees) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="mr-2 h-5 w-5" />
                  Employee Status Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.employeesByStatus.map((status) => (
                    <div key={status.status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge 
                          className={
                            status.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            status.status === 'TERMINATED' ? 'bg-red-100 text-red-800' :
                            status.status === 'ON_LEAVE' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          } 
                          variant="secondary"
                        >
                          {status.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{status.count}</span>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              status.status === 'ACTIVE' ? 'bg-green-600' :
                              status.status === 'TERMINATED' ? 'bg-red-600' :
                              status.status === 'ON_LEAVE' ? 'bg-blue-600' :
                              'bg-yellow-600'
                            }`}
                            style={{ width: `${(status.count / stats.totalEmployees) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leave Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="mr-2 h-5 w-5" />
                  Leave Requests by Type
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.leaveRequestsByType.map((leave, index) => (
                    <div key={leave.type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge 
                          className={
                            leave.type === 'VACATION' ? 'bg-purple-100 text-purple-800' :
                            leave.type === 'SICK_LEAVE' ? 'bg-red-100 text-red-800' :
                            leave.type === 'PERSONAL' ? 'bg-blue-100 text-blue-800' :
                            leave.type === 'EMERGENCY' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          } 
                          variant="secondary"
                        >
                          {leave.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <span className="text-sm font-medium">{leave.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Recent HR Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {stats.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                      <div className={`p-2 rounded-full ${
                        activity.type === 'new_employee' ? 'bg-green-100' :
                        activity.type === 'leave_request' ? 'bg-blue-100' :
                        activity.type === 'leave_approved' ? 'bg-green-100' :
                        activity.type === 'leave_rejected' ? 'bg-red-100' :
                        'bg-gray-100'
                      }`}>
                        {activity.type === 'new_employee' && <UserPlus className="h-4 w-4 text-green-600" />}
                        {activity.type === 'leave_request' && <CalendarDays className="h-4 w-4 text-blue-600" />}
                        {activity.type === 'leave_approved' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        {activity.type === 'leave_rejected' && <XCircle className="h-4 w-4 text-red-600" />}
                        {!['new_employee', 'leave_request', 'leave_approved', 'leave_rejected'].includes(activity.type) && 
                          <Activity className="h-4 w-4 text-gray-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate">{activity.description}</p>
                        <p className="text-xs text-gray-500">{format(new Date(activity.date), 'MMM dd, HH:mm')}</p>
                      </div>
                    </div>
                  ))}
                  {stats.recentActivity.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-24 flex flex-col space-y-2" asChild>
              <a href="/leave-requests">
                <CalendarDays className="h-6 w-6" />
                <span className="text-sm">View Leaves</span>
              </a>
            </Button>
            {isManager && (
              <>
                <Button variant="outline" className="h-24 flex flex-col space-y-2" asChild>
                  <a href="/employees">
                    <Users className="h-6 w-6" />
                    <span className="text-sm">Manage Employees</span>
                  </a>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col space-y-2" asChild>
                  <a href="/finance">
                    <BarChart3 className="h-6 w-6" />
                    <span className="text-sm">Finance Reports</span>
                  </a>
                </Button>
                <Button variant="outline" className="h-24 flex flex-col space-y-2" asChild>
                  <a href="/auth/register">
                    <UserPlus className="h-6 w-6" />
                    <span className="text-sm">Add User</span>
                  </a>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
