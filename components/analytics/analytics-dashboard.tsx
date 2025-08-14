'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react';

interface AnalyticsData {
  employeeMetrics: {
    total: number;
    active: number;
    onLeave: number;
    newHires: number;
  };
  departmentData: Array<{
    name: string;
    employees: number;
    avgSalary: number;
  }>;
  leaveData: Array<{
    month: string;
    approved: number;
    pending: number;
    rejected: number;
  }>;
  attendanceData: Array<{
    date: string;
    present: number;
    absent: number;
    late: number;
  }>;
  payrollData: Array<{
    period: string;
    totalPay: number;
    employees: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      const [employeesRes, leaveRes, attendanceRes, payrollRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/leave-requests'),
        fetch('/api/time-tracking/stats'),
        fetch('/api/payroll/periods')
      ]);

      const employees = employeesRes.ok ? await employeesRes.json() : [];
      const leaves = leaveRes.ok ? await leaveRes.json() : [];
      const timeStats = attendanceRes.ok ? await attendanceRes.json() : {};
      const payroll = payrollRes.ok ? await payrollRes.json() : [];

      // Process employee metrics
      const activeEmployees = employees.filter((emp: any) => emp.isActive).length;
      const onLeave = leaves.filter((leave: any) => 
        leave.status === 'APPROVED' && 
        new Date(leave.startDate) <= new Date() && 
        new Date(leave.endDate) >= new Date()
      ).length;

      // Process department data
      const departmentCounts: { [key: string]: { count: number; totalSalary: number } } = {};
      employees.forEach((emp: any) => {
        const dept = emp.employee?.department || 'Unknown';
        const salary = parseFloat(emp.employee?.salary) || 0;
        
        if (!departmentCounts[dept]) {
          departmentCounts[dept] = { count: 0, totalSalary: 0 };
        }
        departmentCounts[dept].count++;
        departmentCounts[dept].totalSalary += salary;
      });

      const departmentData = Object.entries(departmentCounts).map(([name, data]) => ({
        name,
        employees: data.count,
        avgSalary: data.totalSalary / data.count
      }));

      // Mock leave trend data (last 6 months)
      const leaveData = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        const monthLeaves = leaves.filter((leave: any) => {
          const leaveDate = new Date(leave.createdAt);
          return leaveDate.getMonth() === date.getMonth() && 
                 leaveDate.getFullYear() === date.getFullYear();
        });
        
        return {
          month: date.toLocaleDateString('en', { month: 'short' }),
          approved: monthLeaves.filter((l: any) => l.status === 'APPROVED').length,
          pending: monthLeaves.filter((l: any) => l.status === 'PENDING').length,
          rejected: monthLeaves.filter((l: any) => l.status === 'REJECTED').length
        };
      });

      // Mock attendance data (last 7 days)
      const attendanceData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - i));
        
        return {
          date: date.toLocaleDateString('en', { weekday: 'short' }),
          present: Math.floor(Math.random() * activeEmployees * 0.9) + Math.floor(activeEmployees * 0.1),
          absent: Math.floor(Math.random() * 10) + 2,
          late: Math.floor(Math.random() * 15) + 1
        };
      });

      // Process payroll data
      const payrollData = payroll.slice(0, 6).map((period: any) => ({
        period: new Date(period.startDate).toLocaleDateString('en', { month: 'short', year: '2-digit' }),
        totalPay: period.payslips?.reduce((sum: number, p: any) => sum + p.netPay, 0) || 0,
        employees: period.payslips?.length || 0
      }));

      setAnalyticsData({
        employeeMetrics: {
          total: employees.length,
          active: activeEmployees,
          onLeave: onLeave,
          newHires: employees.filter((emp: any) => {
            const hireDate = new Date(emp.employee?.hireDate);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return hireDate >= thirtyDaysAgo;
          }).length
        },
        departmentData,
        leaveData,
        attendanceData,
        payrollData
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg text-muted-foreground">No analytics data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Analytics Dashboard</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.employeeMetrics.total}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.employeeMetrics.active} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.employeeMetrics.onLeave}</div>
            <p className="text-xs text-muted-foreground">
              Currently on leave
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Hires</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.employeeMetrics.newHires}</div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.departmentData.length}</div>
            <p className="text-xs text-muted-foreground">
              Active departments
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leave">Leave Analytics</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Department Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.departmentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="employees"
                    >
                      {analyticsData.departmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.attendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="present" stackId="1" stroke="#8884d8" fill="#8884d8" />
                    <Area type="monotone" dataKey="late" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                    <Area type="monotone" dataKey="absent" stackId="1" stroke="#ffc658" fill="#ffc658" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Department Analytics</CardTitle>
              <CardDescription>Employee count and average salary by department</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.departmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="employees" fill="#8884d8" name="Employee Count" />
                  <Bar yAxisId="right" dataKey="avgSalary" fill="#82ca9d" name="Avg Salary (R)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Trends</CardTitle>
              <CardDescription>Daily attendance patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analyticsData.attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="present" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="late" stroke="#82ca9d" strokeWidth={2} />
                  <Line type="monotone" dataKey="absent" stroke="#ffc658" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leave Request Trends</CardTitle>
              <CardDescription>Monthly leave request patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.leaveData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="approved" fill="#10b981" name="Approved" />
                  <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                  <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll Trends</CardTitle>
              <CardDescription>Monthly payroll expenditure</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={analyticsData.payrollData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [
                    name === 'totalPay' ? `R${Number(value).toLocaleString()}` : value,
                    name === 'totalPay' ? 'Total Payout' : 'Employees'
                  ]} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="totalPay" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    name="Total Payout (R)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}