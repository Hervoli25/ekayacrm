
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Clock } from 'lucide-react';
import { Role, LeaveStatus, LeaveType } from '@prisma/client';
import { format } from 'date-fns';

interface RecentActivityProps {
  userRole: Role;
  userId: string;
}

export function RecentActivity({ userRole, userId }: RecentActivityProps) {
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecentRequests = async () => {
      try {
        const response = await fetch('/api/leave-requests');
        const requests = await response.json();
        
        // Show last 5 requests
        const recent = requests?.slice(0, 5) || [];
        setRecentRequests(recent);
      } catch (error) {
        console.error('Error fetching recent activity:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentRequests();
  }, []);

  const getStatusColor = (status: LeaveStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatLeaveType = (type: LeaveType) => {
    return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Recent Leave Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="mr-2 h-5 w-5" />
          {userRole === 'ADMIN' ? 'Recent Leave Requests' : 'My Recent Requests'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentRequests?.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <p>No recent leave requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentRequests?.map((request: any) => (
              <div key={request?.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50">
                <div className="bg-blue-100 p-2 rounded-full">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {request?.user?.employee?.name || request?.user?.name || 'Unknown User'}
                    </p>
                    <Badge className={getStatusColor(request?.status)}>
                      {request?.status}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{formatLeaveType(request?.leaveType)}</span>
                    <span className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {format(new Date(request?.startDate), 'MMM dd')} - {format(new Date(request?.endDate), 'MMM dd')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
