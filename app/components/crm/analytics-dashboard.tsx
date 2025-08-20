'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { getCRMApiHeaders } from '@/lib/crm-config';
import { 
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  PieChart,
  Calendar,
  Users,
  Car,
  Target,
  Award,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface RevenueData {
  period: string;
  revenue: number;
  change: number;
  bookings: number;
  avgOrderValue: number;
}

interface ServicePerformance {
  name: string;
  revenue: number;
  bookings: number;
  percentage: number;
  growth: number;
}

export function AnalyticsDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch analytics data from API
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/crm/analytics?period=${selectedPeriod}`, {
        headers: getCRMApiHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }

      const data = await response.json();
      setAnalyticsData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  if (loading || !analyticsData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Revenue Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-gray-200 h-24 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Analytics Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const currentData = {
    period: selectedPeriod,
    revenue: analyticsData.revenue.total,
    change: analyticsData.revenue.change,
    bookings: analyticsData.bookings.total,
    avgOrderValue: analyticsData.revenue.avgOrderValue
  };

  const servicePerformance = analyticsData.servicePerformance || [];

  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString()}`;
  };

  const getGrowthColor = (change: number) => {
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getGrowthIcon = (change: number) => {
    return change >= 0 ? 
      <TrendingUp className="h-3 w-3" /> : 
      <TrendingDown className="h-3 w-3" />;
  };

  // Use real hourly revenue data from API
  const hourlyRevenue = analyticsData.hourlyPattern || [];
  const maxHourlyRevenue = hourlyRevenue.length > 0 ? Math.max(...hourlyRevenue.map((h: any) => h.revenue)) : 100;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            Revenue Analytics
          </CardTitle>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(currentData.revenue)}
            </div>
            <div className="text-sm text-gray-600">{currentData.period}</div>
            <div className={cn('text-xs flex items-center justify-center gap-1 mt-1', getGrowthColor(currentData.change))}>
              {getGrowthIcon(currentData.change)}
              {Math.abs(currentData.change)}%
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <Calendar className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {currentData.bookings}
            </div>
            <div className="text-sm text-gray-600">Bookings</div>
            <div className="text-xs text-blue-600 mt-1">
              +{Math.floor(currentData.change / 2)}% vs last period
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <Target className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(currentData.avgOrderValue)}
            </div>
            <div className="text-sm text-gray-600">Avg Order Value</div>
            <div className="text-xs text-purple-600 mt-1">
              Steady performance
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4 text-center">
            <Award className="h-6 w-6 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {analyticsData.customerSatisfaction?.rating || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">Customer Satisfaction</div>
            <div className="text-xs text-green-600 mt-1">
              {analyticsData.customerSatisfaction?.change ? `${analyticsData.customerSatisfaction.change > 0 ? '+' : ''}${analyticsData.customerSatisfaction.change}%` : ''}
            </div>
          </div>
        </div>

        {/* Today's Hourly Revenue */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Today's Revenue by Hour
          </h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
              {hourlyRevenue.map((hour: any, index: number) => (
                <div key={index} className="text-center">
                  <div className="mb-2">
                    <div 
                      className="bg-blue-500 rounded-sm mx-auto transition-all duration-300 hover:bg-blue-600"
                      style={{ 
                        height: `${maxHourlyRevenue > 0 ? (hour.revenue / maxHourlyRevenue) * 60 : 10}px`,
                        width: '20px'
                      }}
                    />
                  </div>
                  <div className="text-xs text-gray-600 mb-1">{hour.hour}:00</div>
                  <div className="text-xs font-medium text-gray-900">
                    R{hour.revenue}
                  </div>
                </div>
              ))}
              {hourlyRevenue.length === 0 && (
                <div className="col-span-full text-center py-4 text-gray-500">
                  <p>No hourly data available for this period</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Service Performance */}
        <div className="mb-6">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Service Performance ({selectedPeriod})
          </h4>
          <div className="space-y-3">
            {servicePerformance.map((service, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="font-medium text-gray-900">{service.name}</span>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(service.revenue)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        {service.bookings} bookings
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {service.percentage}%
                    </div>
                    <div className={cn('text-xs flex items-center gap-1', getGrowthColor(service.growth))}>
                      {getGrowthIcon(service.growth)}
                      {Math.abs(service.growth)}%
                    </div>
                  </div>
                </div>
                <Progress value={service.percentage} className="h-2" />
              </div>
            ))}
          </div>
        </div>

        {/* Performance Targets */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              Monthly Target
            </h5>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Revenue Goal:</span>
                <span className="font-medium">R{analyticsData.targets?.monthlyTarget?.toLocaleString() || '35,000'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Current:</span>
                <span className="font-medium">R{analyticsData.targets?.currentProgress?.toLocaleString() || '0'}</span>
              </div>
              <Progress value={analyticsData.targets?.progressPercentage || 0} className="h-2" />
              <div className="text-xs text-green-600">
                {Math.round(analyticsData.targets?.progressPercentage || 0)}% of target achieved
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-green-600" />
              Customer Metrics
            </h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Unique Customers:</span>
                <span className="font-medium">{analyticsData.customers?.unique || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Returning:</span>
                <span className="font-medium">{analyticsData.customers?.retentionRate || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span>Total Bookings:</span>
                <span className="font-medium">{analyticsData.bookings?.total || 0}</span>
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              Growth Insights
            </h5>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Best Day:</span>
                <span className="font-medium">{analyticsData.insights?.bestDay || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Peak Hour:</span>
                <span className="font-medium">{analyticsData.insights?.peakHour || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Top Service:</span>
                <span className="font-medium">{analyticsData.insights?.topService || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}