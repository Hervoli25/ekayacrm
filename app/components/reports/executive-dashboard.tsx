'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Building2, 
  TrendingUp, 
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  Briefcase,
  Target
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

interface ExecutiveReport {
  kpis: {
    totalEmployees: number;
    activeDepartments: number;
    recentHires: number;
    employeeGrowthRate: number;
    turnoverRate: number;
    pendingLeaves: number;
    totalMonthlyPayroll: number;
    totalRevenue: number;
    avgDailyRevenue: number;
    revenueGrowth: number;
  };
  employeeStatusDistribution: Array<{
    status: string;
    count: number;
  }>;
  departmentBreakdown: Array<{
    name: string;
    code: string;
    employees: number;
    budget: number;
  }>;
  monthlyHiringTrends: Array<{
    month: string;
    hires: number;
  }>;
  alerts: Array<{
    type: 'info' | 'warning' | 'error';
    message: string;
    priority: 'low' | 'medium' | 'high';
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function ExecutiveDashboard() {
  const [report, setReport] = useState<ExecutiveReport | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchExecutiveReport();
  }, []);

  const fetchExecutiveReport = async () => {
    try {
      const response = await fetch('/api/reports/executive');
      if (!response.ok) throw new Error('Failed to fetch executive report');
      const data = await response.json();
      setReport(data);
    } catch (error) {
      console.error('Error fetching executive report:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch executive report',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg">Loading executive dashboard...</div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg text-muted-foreground">No executive data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Executive Dashboard</h2>
        <Button onClick={fetchExecutiveReport} variant="outline">
          Refresh Data
        </Button>
      </div>

      {/* Alerts Section */}
      {report.alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Action Items</h3>
          <div className="grid gap-3">
            {report.alerts.map((alert, index) => (
              <div key={index} className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}>
                <div className="flex items-center space-x-2">
                  {getAlertIcon(alert.type)}
                  <span className="text-sm font-medium">{alert.message}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {alert.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.kpis.totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              {report.kpis.employeeGrowthRate > 0 ? '+' : ''}{report.kpis.employeeGrowthRate}% this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.kpis.activeDepartments}</div>
            <p className="text-xs text-muted-foreground">
              Active departments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Payroll</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{report.kpis.totalMonthlyPayroll.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Latest period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{report.kpis.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              R{report.kpis.avgDailyRevenue.toLocaleString()}/day avg
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turnover Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.kpis.turnoverRate}%</div>
            <p className="text-xs text-muted-foreground">
              {report.kpis.pendingLeaves} pending leaves
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Department Size Distribution</CardTitle>
            <CardDescription>Number of employees per department</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={report.departmentBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="code" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="employees" fill="#8884d8" name="Employees" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employee Status Distribution</CardTitle>
            <CardDescription>Current employee status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={report.employeeStatusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ status, count, percent }) => 
                    `${status}: ${count} (${(percent * 100).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {report.employeeStatusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Department Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Department Overview</CardTitle>
          <CardDescription>Key metrics for each department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {report.departmentBreakdown.map((dept, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{dept.name}</h3>
                    <p className="text-sm text-muted-foreground">{dept.code}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Employees</p>
                    <p className="font-semibold">{dept.employees}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Budget</p>
                    <p className="font-semibold">
                      {dept.budget > 0 ? `R${dept.budget.toLocaleString()}` : 'Not set'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Financial Performance</CardTitle>
            <CardDescription>Revenue vs Payroll comparison</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Monthly Revenue</span>
                <span className="text-lg font-bold text-green-600">
                  R{report.kpis.totalRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Monthly Payroll</span>
                <span className="text-lg font-bold text-red-600">
                  R{report.kpis.totalMonthlyPayroll.toLocaleString()}
                </span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Net Margin</span>
                  <span className={`text-lg font-bold ${
                    (report.kpis.totalRevenue - report.kpis.totalMonthlyPayroll) > 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    R{(report.kpis.totalRevenue - report.kpis.totalMonthlyPayroll).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {report.kpis.totalRevenue > 0 
                    ? `${(((report.kpis.totalRevenue - report.kpis.totalMonthlyPayroll) / report.kpis.totalRevenue) * 100).toFixed(1)}% margin`
                    : 'No revenue data'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Metrics Summary</CardTitle>
            <CardDescription>Important business indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">New Hires (30 days)</span>
                </div>
                <Badge variant="secondary">{report.kpis.recentHires}</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Growth Rate</span>
                </div>
                <Badge variant={report.kpis.employeeGrowthRate > 0 ? 'default' : 'secondary'}>
                  {report.kpis.employeeGrowthRate > 0 ? '+' : ''}{report.kpis.employeeGrowthRate}%
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm">Pending Leaves</span>
                </div>
                <Badge variant={report.kpis.pendingLeaves > 10 ? 'destructive' : 'secondary'}>
                  {report.kpis.pendingLeaves}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-red-600" />
                  <span className="text-sm">Turnover Rate</span>
                </div>
                <Badge variant={report.kpis.turnoverRate > 5 ? 'destructive' : 'default'}>
                  {report.kpis.turnoverRate}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}