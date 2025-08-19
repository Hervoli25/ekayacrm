'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Activity,
  Clock,
  Car,
  Users,
  AlertCircle,
  CheckCircle,
  Zap,
  Calendar
} from 'lucide-react';
import { useCRMCapacity } from '@/hooks/use-crm-data';
import { cn } from '@/lib/utils';

interface TimeSlot {
  time: string;
  totalCapacity: number;
  bookedCapacity: number;
  availableCapacity: number;
  status: 'available' | 'busy' | 'full';
  waitlist: number;
}

export function CapacityMonitor() {
  const { capacity, loading, error } = useCRMCapacity();

  // Use real capacity data from API, fallback to empty array if loading
  const displayCapacity = loading ? [] : (capacity?.slots || []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800';
      case 'full':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available':
        return <CheckCircle className="h-3 w-3" />;
      case 'busy':
        return <Clock className="h-3 w-3" />;
      case 'full':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const calculateUtilization = (slot: TimeSlot) => {
    return (slot.bookedCapacity / slot.totalCapacity) * 100;
  };

  const getTotalStats = () => {
    const totalCapacity = displayCapacity.reduce((sum, slot) => sum + slot.totalCapacity, 0);
    const totalBooked = displayCapacity.reduce((sum, slot) => sum + slot.bookedCapacity, 0);
    const totalWaitlist = displayCapacity.reduce((sum, slot) => sum + (slot.waitlistCount || 0), 0);
    const averageUtilization = totalCapacity > 0 ? (totalBooked / totalCapacity) * 100 : 0;
    
    return {
      totalCapacity,
      totalBooked,
      totalAvailable: totalCapacity - totalBooked,
      totalWaitlist,
      averageUtilization
    };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Capacity Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-8 w-12 mx-auto mb-2" />
                <Skeleton className="h-4 w-16 mx-auto" />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-2 w-full mb-2" />
                <div className="flex gap-4">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-16" />
                </div>
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
            Capacity Monitor Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">{error}</p>
          <p className="text-xs text-gray-500 mt-1">
            Unable to load capacity data
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Today's Capacity Monitor
          </CardTitle>
          <Badge variant="outline" className="text-green-600 border-green-200">
            <Zap className="h-3 w-3 mr-1" />
            Live
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-center mb-1">
              <Car className="h-4 w-4 text-blue-600 mr-1" />
              <span className="text-2xl font-bold text-gray-900">
                {stats.totalCapacity}
              </span>
            </div>
            <p className="text-xs text-gray-600">Total Capacity</p>
          </div>
          
          <div className="text-center bg-green-50 rounded-lg p-3">
            <div className="flex items-center justify-center mb-1">
              <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-2xl font-bold text-gray-900">
                {stats.totalBooked}
              </span>
            </div>
            <p className="text-xs text-gray-600">Booked</p>
          </div>
          
          <div className="text-center bg-blue-50 rounded-lg p-3">
            <div className="flex items-center justify-center mb-1">
              <Clock className="h-4 w-4 text-blue-600 mr-1" />
              <span className="text-2xl font-bold text-gray-900">
                {stats.totalAvailable}
              </span>
            </div>
            <p className="text-xs text-gray-600">Available</p>
          </div>
          
          <div className="text-center bg-purple-50 rounded-lg p-3">
            <div className="flex items-center justify-center mb-1">
              <Users className="h-4 w-4 text-purple-600 mr-1" />
              <span className="text-2xl font-bold text-gray-900">
                {stats.totalWaitlist}
              </span>
            </div>
            <p className="text-xs text-gray-600">Waitlist</p>
          </div>
        </div>

        {/* Overall Utilization */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Overall Utilization
            </span>
            <span className="text-sm font-semibold text-gray-900">
              {stats.averageUtilization.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={stats.averageUtilization} 
            className="h-2"
          />
        </div>

        {/* Time Slots */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {displayCapacity.map((slot, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="font-medium text-gray-900">{slot.time}</span>
                </div>
                <Badge className={cn('text-xs flex items-center gap-1', getStatusColor(slot.status))}>
                  {getStatusIcon(slot.status)}
                  {slot.status}
                </Badge>
              </div>

              <div className="mb-2">
                <div className="flex justify-between items-center text-xs text-gray-600 mb-1">
                  <span>{slot.bookedCapacity} of {slot.totalCapacity} slots booked</span>
                  <span>{calculateUtilization(slot).toFixed(0)}% utilized</span>
                </div>
                <Progress 
                  value={calculateUtilization(slot)} 
                  className="h-1.5"
                />
              </div>

              <div className="flex justify-between items-center text-xs">
                <div className="flex gap-4">
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle className="h-3 w-3" />
                    {slot.bookedCapacity} booked
                  </span>
                  <span className="flex items-center gap-1 text-blue-600">
                    <Clock className="h-3 w-3" />
                    {slot.availableCapacity} available
                  </span>
                </div>
                {slot.waitlist > 0 && (
                  <span className="flex items-center gap-1 text-purple-600">
                    <Users className="h-3 w-3" />
                    {slot.waitlist} waitlist
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            <button className="text-xs bg-blue-50 text-blue-600 px-3 py-2 rounded-md hover:bg-blue-100 transition-colors duration-200">
              Manage Bookings
            </button>
            <button className="text-xs bg-green-50 text-green-600 px-3 py-2 rounded-md hover:bg-green-100 transition-colors duration-200">
              Add Time Slot
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}