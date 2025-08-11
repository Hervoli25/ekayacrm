
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Check, X, Trash2, Calendar, User, Clock } from 'lucide-react';
import { LeaveRequest } from '@/lib/types';
import { Role, LeaveStatus, LeaveType } from '@prisma/client';
import { format, differenceInDays } from 'date-fns';

interface LeaveRequestTableProps {
  requests: LeaveRequest[];
  loading: boolean;
  userRole: Role;
  currentUserId: string;
  onApprove: (request: LeaveRequest) => void;
  onDelete: (requestId: string) => void;
}

export function LeaveRequestTable({
  requests,
  loading,
  userRole,
  currentUserId,
  onApprove,
  onDelete,
}: LeaveRequestTableProps) {
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

  const calculateDuration = (startDate: Date, endDate: Date) => {
    const days = differenceInDays(new Date(endDate), new Date(startDate)) + 1;
    return `${days} day${days > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex space-x-4">
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No leave requests found</h3>
          <p className="text-gray-500">
            {userRole === 'ADMIN' 
              ? 'No leave requests match your current filter.' 
              : 'You haven\'t submitted any leave requests yet.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {userRole === 'ADMIN' && <TableHead>Employee</TableHead>}
                <TableHead>Leave Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((request) => (
                <TableRow key={request?.id} className="hover:bg-gray-50">
                  {userRole === 'ADMIN' && (
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {request?.user?.employee?.name || request?.user?.name || 'Unknown'}
                        </span>
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant="outline">
                      {formatLeaveType(request?.leaveType)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {calculateDuration(request?.startDate, request?.endDate)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span>{format(new Date(request?.startDate), 'MMM dd')}</span>
                        <span>-</span>
                        <span>{format(new Date(request?.endDate), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(request?.status)}>
                      {request?.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{format(new Date(request?.createdAt), 'MMM dd')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate text-sm text-gray-600" title={request?.reason}>
                      {request?.reason}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {userRole === 'ADMIN' && request?.status === 'PENDING' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onApprove(request)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                      
                      {(userRole === 'ADMIN' || request?.userId === currentUserId) && 
                        request?.status === 'PENDING' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(request?.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
