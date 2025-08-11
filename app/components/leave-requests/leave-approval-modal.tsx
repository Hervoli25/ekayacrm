
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CheckCircle, XCircle, User, Calendar, Clock } from 'lucide-react';
import { LeaveRequest } from '@/lib/types';
import { LeaveType } from '@prisma/client';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';

interface LeaveApprovalModalProps {
  request: LeaveRequest;
  isOpen: boolean;
  onClose: () => void;
}

export function LeaveApprovalModal({ request, isOpen, onClose }: LeaveApprovalModalProps) {
  const [adminNotes, setAdminNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const formatLeaveType = (type: LeaveType) => {
    return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const calculateDuration = (startDate: Date, endDate: Date) => {
    const days = differenceInDays(new Date(endDate), new Date(startDate)) + 1;
    return days;
  };

  const handleApproval = async (status: 'APPROVED' | 'REJECTED') => {
    setLoading(true);

    try {
      const response = await fetch(`/api/leave-requests/${request.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          adminNotes: adminNotes || null,
        }),
      });

      if (response.ok) {
        toast.success(
          status === 'APPROVED' 
            ? 'Leave request approved successfully' 
            : 'Leave request rejected'
        );
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update leave request');
      }
    } catch (error) {
      console.error('Error updating leave request:', error);
      toast.error('Failed to update leave request');
    } finally {
      setLoading(false);
    }
  };

  const duration = calculateDuration(request.startDate, request.endDate);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-blue-600" />
            Review Leave Request
          </DialogTitle>
          <DialogDescription>
            Review and approve or reject this leave request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Request Details */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">
                {request?.user?.employee?.name || request?.user?.name || 'Unknown Employee'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Leave Type:</span>
                <div className="mt-1">
                  <Badge variant="outline">
                    {formatLeaveType(request.leaveType)}
                  </Badge>
                </div>
              </div>
              
              <div>
                <span className="text-gray-500">Duration:</span>
                <div className="mt-1 font-medium">
                  {duration} day{duration > 1 ? 's' : ''}
                </div>
              </div>
            </div>

            <div>
              <span className="text-gray-500 text-sm">Dates:</span>
              <div className="mt-1 flex items-center space-x-1">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium">
                  {format(new Date(request.startDate), 'MMM dd, yyyy')} - {format(new Date(request.endDate), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>

            <div>
              <span className="text-gray-500 text-sm">Requested:</span>
              <div className="mt-1 flex items-center space-x-1">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-sm">
                  {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                </span>
              </div>
            </div>

            <div>
              <span className="text-gray-500 text-sm">Reason:</span>
              <div className="mt-1 text-sm bg-white p-3 rounded border">
                {request.reason}
              </div>
            </div>
          </div>

          {/* Admin Notes */}
          <div className="space-y-2">
            <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
            <Textarea
              id="adminNotes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add any comments or notes about this decision..."
              disabled={loading}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleApproval('REJECTED')}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <XCircle className="mr-2 h-4 w-4" />
              {loading ? 'Processing...' : 'Reject'}
            </Button>
            <Button
              onClick={() => handleApproval('APPROVED')}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {loading ? 'Processing...' : 'Approve'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
