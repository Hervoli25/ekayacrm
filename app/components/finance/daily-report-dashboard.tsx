
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Line
} from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';

interface DailyReport {
  id: string;
  date: string;
  totalRevenue: number;
  totalBookings: number;
  newCustomers: number;
  returningCustomers: number;
  cashPayments: number;
  cardPayments: number;
  digitalPayments: number;
  topPerformingService?: string;
  peakHour?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function DailyReportDashboard() {
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    newCustomers: 0,
    returningCustomers: 0,
    cashPayments: 0,
    cardPayments: 0,
    digitalPayments: 0,
    topPerformingService: '',
    peakHour: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await fetch('/api/finance/daily-report');
      if (!response.ok) throw new Error('Failed to fetch reports');
      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch daily reports',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createDailyReport = async () => {
    try {
      const response = await fetch('/api/finance/daily-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...reportData,
          date: selectedDate,
        }),
      });

      if (!response.ok) throw new Error('Failed to create report');
      
      toast({
        title: 'Success',
        description: 'Daily report created successfully',
      });
      
      await fetchReports();
      setReportData({
        totalRevenue: 0,
        totalBookings: 0,
        newCustomers: 0,
        returningCustomers: 0,
        cashPayments: 0,
        cardPayments: 0,
        digitalPayments: 0,
        topPerformingService: '',
        peakHour: '',
      });
    } catch (error) {
      console.error('Error creating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to create daily report',
        variant: 'destructive',
      });
    }
  };

  // Prepare chart data
  const revenueChartData = reports.slice(-30).map(report => ({
    date: new Date(report.date).toLocaleDateString(),
    revenue: Number(report.totalRevenue),
    bookings: report.totalBookings,
  }));

  const paymentMethodData = reports.length > 0 ? [
    { name: 'Cash', value: reports.reduce((sum, r) => sum + Number(r.cashPayments), 0) },
    { name: 'Card', value: reports.reduce((sum, r) => sum + Number(r.cardPayments), 0) },
    { name: 'Digital', value: reports.reduce((sum, r) => sum + Number(r.digitalPayments), 0) },
  ] : [];

  const totalRevenue = reports.reduce((sum, r) => sum + Number(r.totalRevenue), 0);
  const totalBookings = reports.reduce((sum, r) => sum + r.totalBookings, 0);
  const avgRevenue = totalRevenue / Math.max(reports.length, 1);

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Daily Business Reports</h2>
        <div className="text-sm text-muted-foreground">
          {reports.length} reports total
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
            <div className="text-2xl font-bold">R{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All time revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total completed services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{avgRevenue.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              Per day average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Days</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reports.length}</div>
            <p className="text-xs text-muted-foreground">
              Days with reports
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`R${Number(value).toLocaleString()}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={paymentMethodData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
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
      </div>

      {/* Create New Report Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create End of Day Report</CardTitle>
          <CardDescription>
            Record today's business performance and metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalRevenue">Total Revenue (R)</Label>
              <Input
                id="totalRevenue"
                type="number"
                step="0.01"
                value={reportData.totalRevenue}
                onChange={(e) => setReportData(prev => ({
                  ...prev,
                  totalRevenue: parseFloat(e.target.value) || 0
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalBookings">Total Bookings</Label>
              <Input
                id="totalBookings"
                type="number"
                value={reportData.totalBookings}
                onChange={(e) => setReportData(prev => ({
                  ...prev,
                  totalBookings: parseInt(e.target.value) || 0
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newCustomers">New Customers</Label>
              <Input
                id="newCustomers"
                type="number"
                value={reportData.newCustomers}
                onChange={(e) => setReportData(prev => ({
                  ...prev,
                  newCustomers: parseInt(e.target.value) || 0
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="returningCustomers">Returning Customers</Label>
              <Input
                id="returningCustomers"
                type="number"
                value={reportData.returningCustomers}
                onChange={(e) => setReportData(prev => ({
                  ...prev,
                  returningCustomers: parseInt(e.target.value) || 0
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cashPayments">Cash Payments (R)</Label>
              <Input
                id="cashPayments"
                type="number"
                step="0.01"
                value={reportData.cashPayments}
                onChange={(e) => setReportData(prev => ({
                  ...prev,
                  cashPayments: parseFloat(e.target.value) || 0
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardPayments">Card Payments (R)</Label>
              <Input
                id="cardPayments"
                type="number"
                step="0.01"
                value={reportData.cardPayments}
                onChange={(e) => setReportData(prev => ({
                  ...prev,
                  cardPayments: parseFloat(e.target.value) || 0
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="digitalPayments">Digital Payments (R)</Label>
              <Input
                id="digitalPayments"
                type="number"
                step="0.01"
                value={reportData.digitalPayments}
                onChange={(e) => setReportData(prev => ({
                  ...prev,
                  digitalPayments: parseFloat(e.target.value) || 0
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="topService">Top Performing Service</Label>
              <Input
                id="topService"
                type="text"
                value={reportData.topPerformingService}
                onChange={(e) => setReportData(prev => ({
                  ...prev,
                  topPerformingService: e.target.value
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="peakHour">Peak Hour</Label>
              <Input
                id="peakHour"
                type="text"
                placeholder="e.g., 2:00 PM - 3:00 PM"
                value={reportData.peakHour}
                onChange={(e) => setReportData(prev => ({
                  ...prev,
                  peakHour: e.target.value
                }))}
              />
            </div>
          </div>

          <div className="mt-6">
            <Button onClick={createDailyReport} className="w-full md:w-auto">
              Create Daily Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Reports */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reports.slice(0, 10).map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">
                    {new Date(report.date).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {report.totalBookings} bookings • {report.newCustomers} new customers
                  </div>
                  {report.topPerformingService && (
                    <Badge variant="secondary" className="mt-1">
                      Top: {report.topPerformingService}
                    </Badge>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">
                    R{Number(report.totalRevenue).toLocaleString()}
                  </div>
                  {report.peakHour && (
                    <div className="text-sm text-muted-foreground">
                      Peak: {report.peakHour}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
