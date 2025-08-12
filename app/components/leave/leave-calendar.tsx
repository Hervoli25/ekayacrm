'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Eye,
  Filter
} from 'lucide-react';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  employee: {
    name: string;
    employeeId: string;
    department: string;
    title: string;
  };
  leaveType: string;
  status: string;
  isHalfDay: boolean;
  totalDays: number;
  backgroundColor: string;
}

interface TeamStats {
  totalTeamMembers: number;
  employeesOnLeave: number;
  availableMembers: number;
  utilizationRate: number;
}

export function LeaveCalendar() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [view, setView] = useState<'month' | 'week'>('month');

  useEffect(() => {
    if (session?.user) {
      fetchCalendarData();
    }
  }, [session, currentDate, departmentFilter]);

  const fetchCalendarData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        month: currentDate.getMonth().toString(),
        year: currentDate.getFullYear().toString(),
        ...(departmentFilter !== 'all' && { department: departmentFilter })
      });

      const response = await fetch(`/api/leave-calendar?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
        setTeamStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
    
    const days = [];
    const currentDay = new Date(startDate);

    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return days;
  };

  const getEventsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      eventEnd.setDate(eventEnd.getDate() - 1); // Adjust for inclusive end date
      
      return date >= eventStart && date <= eventEnd;
    });
  };

  const getLeaveTypeColor = (leaveType: string, status: string) => {
    if (status === 'PENDING') {
      return 'bg-yellow-500';
    }

    const colors = {
      'ANNUAL': 'bg-blue-500',
      'SICK': 'bg-red-500',
      'MATERNITY': 'bg-pink-500',
      'PATERNITY': 'bg-purple-500',
      'COMPASSIONATE': 'bg-gray-500',
      'STUDY': 'bg-indigo-500',
      'UNPAID': 'bg-orange-500',
      'OTHER': 'bg-teal-500'
    };

    return colors[leaveType as keyof typeof colors] || 'bg-gray-500';
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-7 gap-2">
          {Array(35).fill(0).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">Team Leave Calendar</h2>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-lg font-medium px-4">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </span>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="Executive">Executive</SelectItem>
              <SelectItem value="Human Resources">Human Resources</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Operations">Operations</SelectItem>
              <SelectItem value="Trading">Trading</SelectItem>
              <SelectItem value="IT">IT</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Team Statistics */}
      {teamStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Team</p>
                  <p className="text-2xl font-bold text-blue-600">{teamStats.totalTeamMembers}</p>
                </div>
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Available</p>
                  <p className="text-2xl font-bold text-green-600">{teamStats.availableMembers}</p>
                </div>
                <UserCheck className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">On Leave</p>
                  <p className="text-2xl font-bold text-red-600">{teamStats.employeesOnLeave}</p>
                </div>
                <UserX className="h-6 w-6 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Usage Rate</p>
                  <p className="text-2xl font-bold text-purple-600">{teamStats.utilizationRate}%</p>
                </div>
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calendar */}
      <Card>
        <CardContent className="p-6">
          {/* Calendar Header */}
          <div className="grid grid-cols-7 gap-2 mb-4">
            {dayNames.map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {generateCalendarDays().map((date, index) => {
              const dayEvents = getEventsForDay(date);
              const isCurrentMonth = date.getMonth() === currentDate.getMonth();
              const isToday = date.toDateString() === new Date().toDateString();

              return (
                <div
                  key={index}
                  className={`min-h-24 p-2 border rounded-lg transition-colors ${
                    isCurrentMonth ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100'
                  } ${isToday ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  } ${isToday ? 'text-blue-600' : ''}`}>
                    {date.getDate()}
                  </div>
                  
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(event => (
                      <div
                        key={event.id}
                        className={`text-xs px-2 py-1 rounded text-white truncate ${
                          getLeaveTypeColor(event.leaveType, event.status)
                        }`}
                        title={`${event.employee.name} - ${event.leaveType.replace('_', ' ')}`}
                      >
                        {event.employee.name}
                        {event.isHalfDay && ' (½)'}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-gray-500 px-2">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Leave Type Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { type: 'ANNUAL', label: 'Annual Leave', color: 'bg-blue-500' },
              { type: 'SICK', label: 'Sick Leave', color: 'bg-red-500' },
              { type: 'MATERNITY', label: 'Maternity', color: 'bg-pink-500' },
              { type: 'PATERNITY', label: 'Paternity', color: 'bg-purple-500' },
              { type: 'COMPASSIONATE', label: 'Compassionate', color: 'bg-gray-500' },
              { type: 'STUDY', label: 'Study Leave', color: 'bg-indigo-500' },
              { type: 'UNPAID', label: 'Unpaid Leave', color: 'bg-orange-500' },
              { type: 'PENDING', label: 'Pending Approval', color: 'bg-yellow-500' }
            ].map(item => (
              <div key={item.type} className="flex items-center space-x-2">
                <div className={`w-4 h-4 rounded ${item.color}`}></div>
                <span className="text-sm text-gray-600">{item.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}