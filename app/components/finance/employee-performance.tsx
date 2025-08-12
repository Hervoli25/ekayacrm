
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, Users, DollarSign, Award } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface EmployeePerformance {
  id: string;
  servicesCompleted: number;
  revenue: number;
  commission: number;
  tips: number;
  customerRating: number | null;
  createdAt: string;
  employee: {
    name: string;
    email: string;
  };
  dailyReport: {
    date: string;
    totalRevenue: number;
  };
}

interface Employee {
  id: string;
  name: string;
  email: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function EmployeePerformance() {
  const { data: session } = useSession();
  const [performances, setPerformances] = useState<EmployeePerformance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
    fetchPerformances();
  }, [selectedEmployee, dateRange]);

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

  const fetchPerformances = async () => {
    try {
      const params = new URLSearchParams({
        ...(selectedEmployee && ['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '') ? { employeeId: selectedEmployee } : {}),
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });

      const response = await fetch(`/api/finance/employee-performance?${params}`);
      if (!response.ok) throw new Error('Failed to fetch performance data');
      const data = await response.json();
      setPerformances(data);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch performance data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate aggregated statistics
  const aggregatePerformance = () => {
    const totalRevenue = performances.reduce((sum, p) => sum + Number(p.revenue), 0);
    const totalCommission = performances.reduce((sum, p) => sum + Number(p.commission), 0);
    const totalTips = performances.reduce((sum, p) => sum + Number(p.tips), 0);
    const totalServices = performances.reduce((sum, p) => sum + p.servicesCompleted, 0);
    
    const ratingsCount = performances.filter(p => p.customerRating).length;
    const avgRating = ratingsCount > 0 
      ? performances.reduce((sum, p) => sum + (p.customerRating || 0), 0) / ratingsCount 
      : 0;

    return {
      totalRevenue,
      totalCommission,
      totalTips,
      totalServices,
      avgRating,
      totalEarnings: totalCommission + totalTips,
    };
  };

  // Prepare chart data
  const chartData = performances.map(p => ({
    date: new Date(p.dailyReport.date).toLocaleDateString(),
    revenue: Number(p.revenue),
    services: p.servicesCompleted,
    commission: Number(p.commission),
    tips: Number(p.tips),
    rating: p.customerRating || 0,
  }));

  // Employee comparison data (for admins)
  const employeeComparison = ['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '') ?
    employees.map(emp => {
      const empPerformances = performances.filter(p => p.employee.email === emp.email);
      const revenue = empPerformances.reduce((sum, p) => sum + Number(p.revenue), 0);
      const services = empPerformances.reduce((sum, p) => sum + p.servicesCompleted, 0);
      const commission = empPerformances.reduce((sum, p) => sum + Number(p.commission), 0);
      
      return {
        name: emp.name,
        revenue,
        services,
        commission,
      };
    }).filter(emp => emp.revenue > 0 || emp.services > 0) : [];

  const stats = aggregatePerformance();

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Employee Performance</h2>
        <div className="text-sm text-muted-foreground">
          {performances.length} performance records
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-3">
            {['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '') && (
              <div className="space-y-2">
                <Label>Employee</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="All employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All employees</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Generated revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Services Completed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalServices}</div>
            <p className="text-xs text-muted-foreground">
              Total services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{stats.totalEarnings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Commission + Tips
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              Customer satisfaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Daily Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'revenue' || name === 'commission' || name === 'tips') {
                      return [`R${Number(value).toLocaleString()}`, name];
                    }
                    return [value, name];
                  }}
                />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" name="Revenue" />
                <Line type="monotone" dataKey="services" stroke="#82ca9d" name="Services" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Earnings Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`R${Number(value).toLocaleString()}`, 'Amount']} />
                <Bar dataKey="commission" stackId="a" fill="#8884d8" name="Commission" />
                <Bar dataKey="tips" stackId="a" fill="#82ca9d" name="Tips" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Employee Comparison (Admin only) */}
      {['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '') && employeeComparison.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Employee Comparison</CardTitle>
            <CardDescription>Performance comparison across all employees</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={employeeComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`R${Number(value).toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="revenue" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Detailed Performance Records */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Records</CardTitle>
          <CardDescription>Detailed view of performance data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {performances.map((performance) => (
              <div key={performance.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="font-medium">
                    {performance.employee.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(performance.dailyReport.date).toLocaleDateString()}
                  </div>
                  <div className="flex space-x-4 text-sm">
                    <Badge variant="secondary">
                      {performance.servicesCompleted} services
                    </Badge>
                    {performance.customerRating && (
                      <Badge variant="outline">
                        ⭐ {performance.customerRating.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="text-right space-y-1">
                  <div className="text-lg font-semibold">
                    R{Number(performance.revenue).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Commission: R{Number(performance.commission).toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Tips: R{Number(performance.tips).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
            
            {performances.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No performance records found for the selected period
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
