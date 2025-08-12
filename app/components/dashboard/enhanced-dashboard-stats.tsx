

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { QuickEmployeeAdd } from './quick-employee-add';
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
        <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent">{stats.totalEmployees}</p>
                <div className="flex items-center mt-2">
                  <UserCheck className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">{stats.activeEmployees} active</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-red-500 to-blue-500 p-3 rounded-xl shadow-lg">
                <Users className="h-6 w-6 text-white drop-shadow-sm" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Hires</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats.newHiresThisMonth}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">This month</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-xl shadow-lg">
                <UserPlus className="h-6 w-6 text-white drop-shadow-sm" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Leaves</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">{stats.pendingLeaveRequests}</p>
                <div className="flex items-center mt-2">
                  <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-sm text-yellow-600 font-medium">Awaiting approval</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-3 rounded-xl shadow-lg">
                <CalendarDays className="h-6 w-6 text-white drop-shadow-sm" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">On Leave Today</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">{stats.approvedLeavesToday}</p>
                <div className="flex items-center mt-2">
                  <CheckCircle2 className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-sm text-blue-600 font-medium">Approved leaves</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-indigo-500 p-3 rounded-xl shadow-lg">
                <Calendar className="h-6 w-6 text-white drop-shadow-sm" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isManager && (
        <>
          {/* Department & Status Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-red-50 to-blue-50 rounded-t-lg">
                <CardTitle className="flex items-center text-gray-800">
                  <div className="bg-gradient-to-r from-red-500 to-blue-500 p-2 rounded-lg mr-3">
                    <Building className="h-5 w-5 text-white" />
                  </div>
                  Employees by Department
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {stats.employeesByDepartment.map((dept, index) => (
                    <div key={dept.department} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 hover:from-red-50 hover:to-blue-50 transition-all duration-300">
                      <div className="flex items-center space-x-3">
                        <Badge className={`${getDepartmentColor(index)} font-medium`} variant="secondary">
                          {dept.department}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-bold text-gray-800">{dept.count}</span>
                        <div className="w-20 bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-red-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${(dept.count / stats.totalEmployees) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-red-50 to-blue-50 rounded-t-lg">
                <CardTitle className="flex items-center text-gray-800">
                  <div className="bg-gradient-to-r from-red-500 to-blue-500 p-2 rounded-lg mr-3">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  Employee Status Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {stats.employeesByStatus.map((status) => (
                    <div key={status.status} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 hover:from-red-50 hover:to-blue-50 transition-all duration-300">
                      <div className="flex items-center space-x-3">
                        <Badge
                          className={`font-medium ${
                            status.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            status.status === 'TERMINATED' ? 'bg-red-100 text-red-800' :
                            status.status === 'ON_LEAVE' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}
                          variant="secondary"
                        >
                          {status.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-bold text-gray-800">{status.count}</span>
                        <div className="w-20 bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              status.status === 'ACTIVE' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                              status.status === 'TERMINATED' ? 'bg-gradient-to-r from-red-500 to-rose-500' :
                              status.status === 'ON_LEAVE' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                              'bg-gradient-to-r from-yellow-500 to-orange-500'
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
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-red-50 to-blue-50 rounded-t-lg">
                <CardTitle className="flex items-center text-gray-800">
                  <div className="bg-gradient-to-r from-red-500 to-blue-500 p-2 rounded-lg mr-3">
                    <PieChart className="h-5 w-5 text-white" />
                  </div>
                  Leave Requests by Type
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {stats.leaveRequestsByType.map((leave, index) => (
                    <div key={leave.type} className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 hover:from-red-50 hover:to-blue-50 transition-all duration-300">
                      <div className="flex items-center space-x-3">
                        <Badge
                          className={`font-medium ${
                            leave.type === 'VACATION' ? 'bg-purple-100 text-purple-800' :
                            leave.type === 'SICK_LEAVE' ? 'bg-red-100 text-red-800' :
                            leave.type === 'PERSONAL' ? 'bg-blue-100 text-blue-800' :
                            leave.type === 'EMERGENCY' ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                          variant="secondary"
                        >
                          {leave.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <span className="text-sm font-bold text-gray-800">{leave.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-red-50 to-blue-50 rounded-t-lg">
                <CardTitle className="flex items-center text-gray-800">
                  <div className="bg-gradient-to-r from-red-500 to-blue-500 p-2 rounded-lg mr-3">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  Recent HR Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {stats.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-red-50 hover:to-blue-50 rounded-lg transition-all duration-300">
                      <div className={`p-2 rounded-full shadow-sm ${
                        activity.type === 'new_employee' ? 'bg-gradient-to-r from-green-100 to-emerald-100' :
                        activity.type === 'leave_request' ? 'bg-gradient-to-r from-blue-100 to-indigo-100' :
                        activity.type === 'leave_approved' ? 'bg-gradient-to-r from-green-100 to-emerald-100' :
                        activity.type === 'leave_rejected' ? 'bg-gradient-to-r from-red-100 to-rose-100' :
                        'bg-gradient-to-r from-gray-100 to-slate-100'
                      }`}>
                        {activity.type === 'new_employee' && <UserPlus className="h-4 w-4 text-green-600" />}
                        {activity.type === 'leave_request' && <CalendarDays className="h-4 w-4 text-blue-600" />}
                        {activity.type === 'leave_approved' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                        {activity.type === 'leave_rejected' && <XCircle className="h-4 w-4 text-red-600" />}
                        {!['new_employee', 'leave_request', 'leave_approved', 'leave_rejected'].includes(activity.type) &&
                          <Activity className="h-4 w-4 text-gray-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 truncate font-medium">{activity.description}</p>
                        <p className="text-xs text-gray-500 font-medium">{format(new Date(activity.date), 'MMM dd, HH:mm')}</p>
                      </div>
                    </div>
                  ))}
                  {stats.recentActivity.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-8 font-medium">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Quick Actions */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-red-50 to-blue-50 rounded-t-lg">
          <CardTitle className="flex items-center text-gray-800">
            <div className="bg-gradient-to-r from-red-500 to-blue-500 p-2 rounded-lg mr-3">
              <Activity className="h-5 w-5 text-white" />
            </div>
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-28 flex flex-col space-y-3 border-2 border-gray-200 hover:border-red-300 hover:bg-gradient-to-r hover:from-red-50 hover:to-blue-50 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
              asChild
            >
              <a href="/leave-requests">
                <div className="bg-gradient-to-r from-red-500 to-blue-500 p-2 rounded-lg">
                  <CalendarDays className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">View Leaves</span>
              </a>
            </Button>
            {isManager && (
              <>
                <Button
                  variant="outline"
                  className="h-28 flex flex-col space-y-3 border-2 border-gray-200 hover:border-green-300 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                  asChild
                >
                  <a href="/employees">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-lg">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Manage Employees</span>
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="h-28 flex flex-col space-y-3 border-2 border-gray-200 hover:border-purple-300 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                  asChild
                >
                  <a href="/finance">
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-2 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Finance Reports</span>
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="h-28 flex flex-col space-y-3 border-2 border-gray-200 hover:border-yellow-300 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
                  asChild
                >
                  <a href="/auth/register">
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-2 rounded-lg">
                      <UserPlus className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">Add User</span>
                  </a>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Employee Add - Only for authorized roles */}
      {['DIRECTOR', 'HR_MANAGER', 'DEPARTMENT_MANAGER', 'SUPER_ADMIN'].includes(userRole) && (
        <QuickEmployeeAdd userRole={userRole} />
      )}

      {/* Test Card for Form Stability */}
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <CheckCircle2 className="mr-2 h-5 w-5 text-green-600" />
            Form Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-sm mb-4">
            Test the stable form system - no jumping or shaking while typing.
          </p>
          <Button
            onClick={() => window.location.href = '/employees'}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Test Employee Form
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
