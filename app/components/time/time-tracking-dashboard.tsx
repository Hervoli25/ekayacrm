'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Play, 
  Pause, 
  Square, 
  Calendar,
  TrendingUp,
  MapPin,
  Coffee,
  CheckCircle,
  AlertTriangle,
  Timer,
  ClockIcon,
  BarChart3,
  Users,
  Building,
  Target
} from 'lucide-react';
import { showSuccess, showError, showLoading } from '@/lib/sweetalert';
import Swal from 'sweetalert2';

interface TimeEntry {
  id: string;
  clockIn: string;
  clockOut?: string;
  breakStart?: string;
  breakEnd?: string;
  totalHours?: number;
  location?: string;
  notes?: string;
  status: 'ACTIVE' | 'COMPLETED' | 'OVERTIME' | 'ABSENT';
  createdAt: string;
}

interface TimeStats {
  todayHours: number;
  weekHours: number;
  monthHours: number;
  overtimeHours: number;
  expectedHours: number;
  efficiency: number;
}

interface AttendanceStats {
  presentDays: number;
  totalDays: number;
  lateArrivals: number;
  earlyLeaves: number;
  onTimePercentage: number;
}

export function TimeTrackingDashboard() {
  const { data: session } = useSession();
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([]);
  const [timeStats, setTimeStats] = useState<TimeStats>({
    todayHours: 0,
    weekHours: 0,
    monthHours: 0,
    overtimeHours: 0,
    expectedHours: 40,
    efficiency: 0
  });
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    presentDays: 0,
    totalDays: 0,
    lateArrivals: 0,
    earlyLeaves: 0,
    onTimePercentage: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch time tracking data
  useEffect(() => {
    fetchTimeData();
  }, []);

  const fetchTimeData = async () => {
    try {
      setLoading(true);
      
      // Fetch current time entry
      const currentResponse = await fetch('/api/time-tracking/current');
      if (currentResponse.ok) {
        const current = await currentResponse.json();
        setCurrentEntry(current);
      }

      // Fetch recent entries
      const entriesResponse = await fetch('/api/time-tracking/entries?limit=10');
      if (entriesResponse.ok) {
        const entries = await entriesResponse.json();
        setRecentEntries(entries);
      }

      // Fetch time statistics
      const statsResponse = await fetch('/api/time-tracking/stats');
      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        setTimeStats(stats.timeStats);
        setAttendanceStats(stats.attendanceStats);
      }
    } catch (error) {
      console.error('Error fetching time data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      console.log('Starting clock in process...');
      showLoading('Clocking In...', 'Recording your start time and location');
      
      const location = await getCurrentLocation();
      console.log('Got location:', location);
      
      console.log('Making API call to /api/time-tracking/clock-in');
      const response = await fetch('/api/time-tracking/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: location
        })
      });
      
      console.log('API response status:', response.status);
      console.log('API response ok:', response.ok);

      Swal.close();

      if (response.ok) {
        const result = await response.json();
        console.log('Clock in success:', result);
        setCurrentEntry(result.timeEntry);
        await showSuccess('Clocked In Successfully!', `Started work at ${new Date().toLocaleTimeString()}`);
        fetchTimeData();
      } else {
        const error = await response.json();
        console.log('Clock in error response:', error);
        let errorMessage = 'Failed to clock in. Please try again.';
        
        if (error.error === 'You already have an active time entry. Please clock out first.') {
          errorMessage = 'You are already clocked in. Please clock out before clocking in again.';
        } else if (error.details) {
          errorMessage = error.details;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        await showError('Clock In Failed', errorMessage);
      }
    } catch (error) {
      Swal.close();
      console.error('Clock in catch error:', error);
      await showError('Clock In Error', 'Network error or system issue. Please check your connection and try again.');
    }
  };

  const handleClockOut = async () => {
    try {
      showLoading('Clocking Out...', 'Recording your end time');
      
      const response = await fetch('/api/time-tracking/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeEntryId: currentEntry?.id
        })
      });

      Swal.close();

      if (response.ok) {
        const result = await response.json();
        setCurrentEntry(null);
        await showSuccess('Clocked Out Successfully!', `Total hours worked: ${result.totalHours?.toFixed(2) || '0'} hrs`);
        fetchTimeData();
      } else {
        const error = await response.json();
        await showError('Clock Out Failed', error.message || 'Failed to clock out');
      }
    } catch (error) {
      Swal.close();
      await showError('Clock Out Error', 'Failed to clock out. Please try again.');
    }
  };

  const handleBreakStart = async () => {
    try {
      const response = await fetch('/api/time-tracking/break-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeEntryId: currentEntry?.id
        })
      });

      if (response.ok) {
        await showSuccess('Break Started', 'Enjoy your break!');
        fetchTimeData();
      }
    } catch (error) {
      await showError('Break Error', 'Failed to start break.');
    }
  };

  const handleBreakEnd = async () => {
    try {
      const response = await fetch('/api/time-tracking/break-end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeEntryId: currentEntry?.id
        })
      });

      if (response.ok) {
        await showSuccess('Break Ended', 'Welcome back to work!');
        fetchTimeData();
      }
    } catch (error) {
      await showError('Break Error', 'Failed to end break.');
    }
  };

  const getCurrentLocation = async (): Promise<string> => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve(`${position.coords.latitude},${position.coords.longitude}`);
          },
          (error) => {
            console.log('Location error:', error);
            // Handle different error types gracefully
            switch(error.code) {
              case error.PERMISSION_DENIED:
                resolve('Location access denied by user');
                break;
              case error.POSITION_UNAVAILABLE:
                resolve('Location information unavailable');
                break;
              case error.TIMEOUT:
                resolve('Location request timed out');
                break;
              default:
                resolve('Location not available');
                break;
            }
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 600000 // 10 minutes
          }
        );
      } else {
        resolve('Geolocation not supported');
      }
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const calculateWorkingHours = () => {
    if (!currentEntry?.clockIn) return 0;
    const start = new Date(currentEntry.clockIn);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    return diff / (1000 * 60 * 60); // Convert to hours
  };

  const getStatusColor = (status: string, entry?: TimeEntry) => {
    if (status === 'ACTIVE' && entry?.breakStart && !entry?.breakEnd) {
      return 'bg-yellow-100 text-yellow-800'; // On break
    }
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      case 'OVERTIME': return 'bg-purple-100 text-purple-800';
      case 'ABSENT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-green-50/30 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
              Time Tracking Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {session?.user?.name || 'Employee'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-bold text-gray-800">
              {formatTime(currentTime)}
            </div>
            <div className="text-sm text-gray-500">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions Card */}
        <Card className="shadow-xl border-0 bg-gradient-to-r from-blue-600 to-green-600 text-white">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Timer className="h-6 w-6" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Clock In/Out */}
              <div className="space-y-3">
                <h3 className="font-semibold">Work Status</h3>
                {!currentEntry ? (
                  <Button 
                    onClick={handleClockIn}
                    className="w-full h-12 bg-white text-blue-600 hover:bg-blue-50 font-semibold"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Clock In
                  </Button>
                ) : (
                  <Button 
                    onClick={handleClockOut}
                    className="w-full h-12 bg-red-500 hover:bg-red-600 text-white font-semibold"
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Clock Out
                  </Button>
                )}
                {currentEntry && (
                  <div className="text-sm text-blue-100">
                    Started: {new Date(currentEntry.clockIn).toLocaleTimeString()}
                  </div>
                )}
              </div>

              {/* Break Controls */}
              <div className="space-y-3">
                <h3 className="font-semibold">Break Time</h3>
                {currentEntry?.status === 'ACTIVE' && !currentEntry?.breakStart ? (
                  <Button 
                    onClick={handleBreakStart}
                    className="w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold"
                  >
                    <Coffee className="h-4 w-4 mr-2" />
                    Start Break
                  </Button>
                ) : currentEntry?.status === 'ACTIVE' && currentEntry?.breakStart && !currentEntry?.breakEnd ? (
                  <Button 
                    onClick={handleBreakEnd}
                    className="w-full h-12 bg-green-500 hover:bg-green-600 text-white font-semibold"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    End Break
                  </Button>
                ) : (
                  <Button 
                    disabled
                    className="w-full h-12 bg-gray-400 text-gray-200 font-semibold"
                  >
                    <Coffee className="h-4 w-4 mr-2" />
                    Clock In First
                  </Button>
                )}
              </div>

              {/* Current Session Info */}
              <div className="space-y-3">
                <h3 className="font-semibold">Today's Progress</h3>
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="text-2xl font-bold">
                    {currentEntry ? calculateWorkingHours().toFixed(1) : timeStats.todayHours.toFixed(1)}h
                  </div>
                  <div className="text-sm text-blue-100">
                    of {timeStats.expectedHours / 5}h expected
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Today's Hours */}
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-sm font-medium text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Today's Hours</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                {timeStats.todayHours.toFixed(1)}h
              </div>
              <Progress 
                value={(timeStats.todayHours / (timeStats.expectedHours / 5)) * 100} 
                className="mt-2" 
              />
            </CardContent>
          </Card>

          {/* Week Progress */}
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-sm font-medium text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>This Week</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-800">
                {timeStats.weekHours.toFixed(1)}h
              </div>
              <Progress 
                value={(timeStats.weekHours / timeStats.expectedHours) * 100} 
                className="mt-2" 
              />
            </CardContent>
          </Card>

          {/* Attendance Rate */}
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-sm font-medium text-gray-600">
                <CheckCircle className="h-4 w-4" />
                <span>Attendance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {attendanceStats.onTimePercentage.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {attendanceStats.presentDays}/{attendanceStats.totalDays} days
              </div>
            </CardContent>
          </Card>

          {/* Efficiency */}
          <Card className="shadow-lg border-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-2 text-sm font-medium text-gray-600">
                <TrendingUp className="h-4 w-4" />
                <span>Efficiency</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {timeStats.efficiency.toFixed(0)}%
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Productivity Score
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Entries */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ClockIcon className="h-5 w-5" />
              <span>Recent Time Entries</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentEntries.length > 0 ? recentEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge className={getStatusColor(entry.status, entry)}>
                      {entry.status === 'ACTIVE' && entry.breakStart && !entry.breakEnd ? 'ON BREAK' : entry.status}
                    </Badge>
                    <div>
                      <div className="font-medium">
                        {new Date(entry.clockIn).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(entry.clockIn).toLocaleTimeString()} - 
                        {entry.clockOut ? new Date(entry.clockOut).toLocaleTimeString() : 'In Progress'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">
                      {entry.totalHours?.toFixed(2) || '0.00'}h
                    </div>
                    {entry.location && (
                      <div className="text-xs text-gray-500 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        Location tracked
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>No time entries found</p>
                  <p className="text-sm">Clock in to start tracking your time</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}