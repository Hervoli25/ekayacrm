
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  Award,
  CreditCard,
  BarChart3,
  Target
} from 'lucide-react';

interface AnalyticsData {
  summary: {
    totalRevenue: number;
    totalBookings: number;
    avgDailyRevenue: number;
    daysAnalyzed: number;
  };
  revenueData: Array<{
    date: string;
    totalRevenue: number;
    totalBookings: number;
    cashPayments: number;
    cardPayments: number;
    digitalPayments: number;
  }>;
  topServices: Array<{
    serviceName: string;
    totalRevenue: number;
    totalBookings: number;
  }>;
  topEmployees: Array<{
    employeeId: string;
    employeeName: string;
    employeeEmail: string;
    totalRevenue: number;
    totalServices: number;
    totalCommission: number;
    totalTips: number;
    avgRating: number;
  }>;
  paymentMethodBreakdown: {
    cash: number;
    card: number;
    digital: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function FinanceAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/finance/analytics?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch analytics data',
        variant: 'destructive',
      });
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

  const { summary, revenueData, topServices, topEmployees, paymentMethodBreakdown } = analyticsData;

  // Prepare chart data
  const revenueChartData = revenueData.map(day => ({
    ...day,
    date: new Date(day.date).toLocaleDateString(),
  }));

  const paymentMethodData = [
    { name: 'Cash', value: paymentMethodBreakdown.cash },
    { name: 'Card', value: paymentMethodBreakdown.card },
    { name: 'Digital', value: paymentMethodBreakdown.digital },
  ].filter(item => item.value > 0);

  const serviceRevenueData = topServices.slice(0, 8);
  const employeeRevenueData = topEmployees.slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Financial Analytics</h2>
        <div className="flex items-center space-x-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchAnalytics} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{summary.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Last {period} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalBookings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Services completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{summary.avgDailyRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Average per day
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Days</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.daysAnalyzed}</div>
            <p className="text-xs text-muted-foreground">
              Days with activity
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Daily revenue over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueChartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`R${Number(value).toLocaleString()}`, 'Revenue']} />
                <Area 
                  type="monotone" 
                  dataKey="totalRevenue" 
                  stroke="#8884d8" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bookings vs Revenue</CardTitle>
            <CardDescription>Relationship between bookings and revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="totalBookings" fill="#82ca9d" name="Bookings" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Payment Methods and Top Services */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Revenue breakdown by payment method</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent, value }) => 
                    `${name}: ${(percent * 100).toFixed(0)}% (R${Number(value).toLocaleString()})`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentMethodData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R${Number(value).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Services</CardTitle>
            <CardDescription>Services generating the most revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={serviceRevenueData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="serviceName" type="category" width={120} />
                <Tooltip formatter={(value) => [`R${Number(value).toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="totalRevenue" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Employees Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Employees</CardTitle>
          <CardDescription>Employee performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={employeeRevenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="employeeName" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  const nameStr = String(name);
                  if (nameStr === 'totalRevenue' || nameStr === 'totalCommission' || nameStr === 'totalTips') {
                    return [`R${Number(value).toLocaleString()}`, nameStr.replace('total', '').replace(/([A-Z])/g, ' $1').toLowerCase()];
                  }
                  return [value, nameStr.replace('total', '').replace(/([A-Z])/g, ' $1').toLowerCase()];
                }}
              />
              <Bar dataKey="totalRevenue" fill="#8884d8" name="Revenue" />
              <Bar dataKey="totalCommission" fill="#82ca9d" name="Commission" />
              <Bar dataKey="totalTips" fill="#ffc658" name="Tips" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Service Performance Table */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Service Performance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topServices.slice(0, 8).map((service, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium">{service.serviceName}</div>
                    <div className="text-sm text-muted-foreground">
                      {service.totalBookings} bookings
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">R{service.totalRevenue.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">
                      R{(service.totalRevenue / service.totalBookings).toFixed(0)} avg
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Employee Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topEmployees.slice(0, 8).map((employee, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="font-medium">{employee.employeeName}</div>
                    <div className="text-sm text-muted-foreground flex items-center space-x-2">
                      <span>{employee.totalServices} services</span>
                      {employee.avgRating > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          ⭐ {employee.avgRating.toFixed(1)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">R{employee.totalRevenue.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">
                      R{employee.totalCommission.toLocaleString()} commission
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
          <CardDescription>Business performance insights for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Revenue Performance</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {summary.avgDailyRevenue > 1000 
                    ? "Strong daily revenue performance exceeding R1,000 per day" 
                    : "Room for improvement in daily revenue targets"}
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Service Efficiency</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Average revenue per booking: R{(summary.totalRevenue / Math.max(summary.totalBookings, 1)).toFixed(0)}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CreditCard className="h-4 w-4 text-purple-600" />
                  <span className="font-medium">Payment Preferences</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Most popular payment method: {
                    paymentMethodBreakdown.cash > paymentMethodBreakdown.card && paymentMethodBreakdown.cash > paymentMethodBreakdown.digital ? 'Cash' :
                    paymentMethodBreakdown.card > paymentMethodBreakdown.digital ? 'Card' : 'Digital'
                  }
                </p>
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium">Top Service</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {topServices[0]?.serviceName || 'No service data'} generates the highest revenue
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
