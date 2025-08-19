'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Car, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  Star, 
  Users, 
  TrendingUp,
  AlertCircle,
  Calendar
} from 'lucide-react';
import { useCRMStats } from '@/hooks/use-crm-data';
import { cn } from '@/lib/utils';

export function CRMDashboardWidget() {
  const { stats, loading, error } = useCRMStats();

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-600" />
            Car Wash CRM Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
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
            CRM Connection Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
          <p className="text-xs text-gray-500 mt-1">
            Check if the CRM API endpoints are available
          </p>
        </CardContent>
      </Card>
    );
  }

  const statItems = [
    {
      title: "Today's Bookings",
      value: stats.todayBookings,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '',
      changeColor: ''
    },
    {
      title: 'Week Revenue',
      value: `R${stats.weekRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '',
      changeColor: ''
    },
    {
      title: 'Pending',
      value: stats.pendingBookings,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      change: '',
      changeColor: ''
    },
    {
      title: 'Confirmed',
      value: stats.confirmedBookings,
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '',
      changeColor: ''
    },
    {
      title: 'Completed',
      value: stats.completedBookings,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '',
      changeColor: ''
    },
    {
      title: 'Avg Rating',
      value: stats.averageRating.toFixed(1),
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      change: '',
      changeColor: ''
    },
    {
      title: 'Waitlist',
      value: stats.activeWaitlist,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: '',
      changeColor: ''
    },
    {
      title: 'Performance',
      value: stats.completedBookings > 0 ? `${Math.round((stats.completedBookings / (stats.pendingBookings + stats.confirmedBookings + stats.completedBookings)) * 100)}%` : '0%',
      icon: TrendingUp,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      change: '',
      changeColor: ''
    }
  ];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-600" />
            Car Wash CRM Overview
          </CardTitle>
          <Badge variant="outline" className="text-green-600 border-green-200">
            Live Data
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {statItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors duration-200"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={cn('p-1.5 rounded-md', item.bgColor)}>
                    <Icon className={cn('h-4 w-4', item.color)} />
                  </div>
                  {item.change && (
                    <span className={cn('text-xs font-medium', item.changeColor)}>
                      {item.change}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {item.title}
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {item.value}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button className="text-xs bg-blue-50 text-blue-600 px-3 py-2 rounded-md hover:bg-blue-100 transition-colors duration-200">
              View Bookings
            </button>
            <button className="text-xs bg-green-50 text-green-600 px-3 py-2 rounded-md hover:bg-green-100 transition-colors duration-200">
              New Booking
            </button>
            <button className="text-xs bg-yellow-50 text-yellow-600 px-3 py-2 rounded-md hover:bg-yellow-100 transition-colors duration-200">
              Capacity
            </button>
            <button className="text-xs bg-purple-50 text-purple-600 px-3 py-2 rounded-md hover:bg-purple-100 transition-colors duration-200">
              Analytics
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}