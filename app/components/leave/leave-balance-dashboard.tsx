'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Award,
  Users,
  RefreshCw,
  Download,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useToast } from '@/hooks/use-toast';

interface LeaveBalance {
  employee: {
    id: string;
    name: string;
    employeeId: string;
    department: string;
    hireDate: string;
    yearsOfService: number;
  };
  entitlements: Record<string, number>;
  used: Record<string, number>;
  pending: Record<string, number>;
  carryOver: Record<string, number>;
  accruals: Record<string, number>;
  balances: Record<string, {
    entitled: number;
    accrued: number;
    carriedOver: number;
    used: number;
    pending: number;
    available: number;
    remaining: number;
  }>;
  history: Array<{
    year: number;
    total: number;
    byType: Record<string, number>;
  }>;
  currentYear: number;
  lastUpdated: string;
}

const LEAVE_TYPE_COLORS = {
  VACATION: '#3b82f6',
  SICK_LEAVE: '#ef4444',
  PERSONAL: '#8b5cf6',
  EMERGENCY: '#f97316',
  MATERNITY: '#ec4899',
  PATERNITY: '#6366f1',
  BEREAVEMENT: '#6b7280',
  STUDY_LEAVE: '#14b8a6',
  UNPAID_LEAVE: '#f59e0b'
};

const LEAVE_TYPE_LABELS = {
  VACATION: 'Annual Leave',
  SICK_LEAVE: 'Sick Leave',
  PERSONAL: 'Personal Leave',
  EMERGENCY: 'Emergency Leave',
  MATERNITY: 'Maternity Leave',
  PATERNITY: 'Paternity Leave',
  BEREAVEMENT: 'Bereavement Leave',
  STUDY_LEAVE: 'Study Leave',
  UNPAID_LEAVE: 'Unpaid Leave'
};

export function LeaveBalanceDashboard() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    if (session?.user) {
      fetchBalance();
      if (['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER'].includes(session.user.role)) {
        fetchEmployees();
      }
    }
  }, [session, selectedEmployee]);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      const url = selectedEmployee 
        ? `/api/leave-balance/enhanced?userId=${selectedEmployee}`
        : '/api/leave-balance/enhanced';
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch balance');
      
      const data = await response.json();
      setBalance(data);
    } catch (error) {
      console.error('Error fetching leave balance:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch leave balance',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      setEmployees(data.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading leave balance...
        </div>
      </div>
    );
  }

  if (!balance) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-gray-600">Unable to load leave balance data</p>
        <Button onClick={fetchBalance} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  // Prepare chart data
  const usageData = Object.keys(balance.balances)
    .filter(type => balance.balances[type].entitled > 0)
    .map(type => ({
      name: LEAVE_TYPE_LABELS[type] || type,
      entitled: balance.balances[type].entitled,
      used: balance.balances[type].used,
      remaining: balance.balances[type].remaining,
      utilization: balance.balances[type].entitled > 0 
        ? Math.round((balance.balances[type].used / balance.balances[type].entitled) * 100)
        : 0
    }));

  const pieData = Object.keys(balance.used)
    .filter(type => balance.used[type] > 0)
    .map(type => ({
      name: LEAVE_TYPE_LABELS[type] || type,
      value: balance.used[type],
      color: LEAVE_TYPE_COLORS[type] || '#6b7280'
    }));

  const historyData = balance.history.map(year => ({
    year: year.year.toString(),
    total: year.total,
    ...year.byType
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leave Balance</h2>
          <p className="text-gray-600 mt-1">
            Comprehensive leave tracking and balance management
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          {['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER'].includes(session?.user?.role || '') && (
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select employee (or view your own)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">My Leave Balance</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.userId}>
                    {emp.name} ({emp.employeeId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Button onClick={fetchBalance} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Employee Info */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{balance.employee.name}</h3>
                <p className="text-sm text-gray-600">
                  {balance.employee.employeeId} • {balance.employee.department}
                </p>
                <div className="flex items-center space-x-4 mt-1">
                  <Badge variant="outline">
                    <Calendar className="h-3 w-3 mr-1" />
                    Hired {formatDate(balance.employee.hireDate)}
                  </Badge>
                  <Badge variant="outline">
                    <Award className="h-3 w-3 mr-1" />
                    {balance.employee.yearsOfService} years service
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-gray-600">Balance Period</p>
              <p className="text-lg font-semibold">{balance.currentYear}</p>
              <p className="text-xs text-gray-500">
                Last updated: {new Date(balance.lastUpdated).toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Balance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Entitled</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {Object.values(balance.entitlements).reduce((sum, val) => sum + val, 0)} days
                    </p>
                  </div>
                  <Calendar className="h-6 w-6 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Days Used</p>
                    <p className="text-2xl font-bold text-red-600">
                      {Object.values(balance.used).reduce((sum, val) => sum + val, 0)} days
                    </p>
                  </div>
                  <CheckCircle className="h-6 w-6 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {Object.values(balance.pending).reduce((sum, val) => sum + val, 0)} days
                    </p>
                  </div>
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Remaining</p>
                    <p className="text-2xl font-bold text-green-600">
                      {Object.values(balance.balances)
                        .reduce((sum, bal) => sum + bal.remaining, 0)} days
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Leave Type Progress Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.keys(balance.balances)
              .filter(type => balance.balances[type].entitled > 0)
              .map(type => {
                const data = balance.balances[type];
                const utilization = data.entitled > 0 
                  ? Math.round((data.used / data.entitled) * 100)
                  : 0;
                
                return (
                  <Card key={type}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">
                          {LEAVE_TYPE_LABELS[type] || type}
                        </CardTitle>
                        <Badge 
                          variant="outline" 
                          className={getUtilizationColor(utilization)}
                        >
                          {utilization}% used
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Progress 
                          value={utilization} 
                          className="h-2"
                        />
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <p className="text-gray-600">Entitled</p>
                            <p className="font-semibold">{data.entitled}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-600">Used</p>
                            <p className="font-semibold text-red-600">{data.used}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-600">Remaining</p>
                            <p className="font-semibold text-green-600">{data.remaining}</p>
                          </div>
                        </div>

                        {(data.carriedOver > 0 || data.pending > 0) && (
                          <div className="pt-2 border-t border-gray-200">
                            <div className="flex justify-between text-xs text-gray-600">
                              {data.carriedOver > 0 && (
                                <span>Carried over: {data.carriedOver} days</span>
                              )}
                              {data.pending > 0 && (
                                <span>Pending: {data.pending} days</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Leave Breakdown</CardTitle>
              <CardDescription>
                Complete breakdown of leave entitlements, usage, and balances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Leave Type</th>
                      <th className="text-center p-2">Entitled</th>
                      <th className="text-center p-2">Accrued</th>
                      <th className="text-center p-2">Carried Over</th>
                      <th className="text-center p-2">Available</th>
                      <th className="text-center p-2">Used</th>
                      <th className="text-center p-2">Pending</th>
                      <th className="text-center p-2">Remaining</th>
                      <th className="text-center p-2">Utilization</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(balance.balances).map(type => {
                      const data = balance.balances[type];
                      const utilization = data.entitled > 0 
                        ? Math.round((data.used / data.entitled) * 100)
                        : 0;
                      
                      return (
                        <tr key={type} className="border-b hover:bg-gray-50">
                          <td className="p-2 font-medium">
                            {LEAVE_TYPE_LABELS[type] || type}
                          </td>
                          <td className="p-2 text-center">{data.entitled}</td>
                          <td className="p-2 text-center">{data.accrued}</td>
                          <td className="p-2 text-center">{data.carriedOver}</td>
                          <td className="p-2 text-center font-semibold">{data.available}</td>
                          <td className="p-2 text-center text-red-600">{data.used}</td>
                          <td className="p-2 text-center text-yellow-600">{data.pending}</td>
                          <td className="p-2 text-center text-green-600 font-semibold">{data.remaining}</td>
                          <td className="p-2 text-center">
                            <Badge 
                              variant="outline" 
                              className={getUtilizationColor(utilization)}
                            >
                              {utilization}%
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Usage Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Leave Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={usageData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="entitled" fill="#e5e7eb" name="Entitled" />
                    <Bar dataKey="used" fill="#ef4444" name="Used" />
                    <Bar dataKey="remaining" fill="#22c55e" name="Remaining" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pie Chart */}
            {pieData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Leave Usage Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Leave History Trend</CardTitle>
              <CardDescription>
                Historical leave usage over the past {balance.history.length} years
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={historyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    name="Total Days" 
                  />
                  {Object.keys(LEAVE_TYPE_COLORS).map(type => (
                    <Line 
                      key={type}
                      type="monotone" 
                      dataKey={type} 
                      stroke={LEAVE_TYPE_COLORS[type]}
                      strokeWidth={2}
                      name={LEAVE_TYPE_LABELS[type]}
                      connectNulls={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}