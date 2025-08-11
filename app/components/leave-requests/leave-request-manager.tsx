
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calendar, Filter } from 'lucide-react';
import { Role } from '@prisma/client';
import { LeaveRequestTable } from './leave-request-table';
import { LeaveRequestModal } from './leave-request-modal';
import { LeaveApprovalModal } from './leave-approval-modal';
import { LeaveRequest } from '@/lib/types';
import toast from 'react-hot-toast';

interface LeaveRequestManagerProps {
  userRole: Role;
  userId: string;
}

export function LeaveRequestManager({ userRole, userId }: LeaveRequestManagerProps) {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);

  const fetchRequests = async () => {
    try {
      const params = new URLSearchParams({
        status: statusFilter,
      });
      
      const response = await fetch(`/api/leave-requests?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setRequests(data || []);
      } else {
        toast.error('Failed to fetch leave requests');
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      toast.error('Failed to fetch leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleCreateRequest = () => {
    setIsCreateModalOpen(true);
  };

  const handleApproveRequest = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setIsApprovalModalOpen(true);
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this leave request?')) {
      return;
    }

    try {
      const response = await fetch(`/api/leave-requests/${requestId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Leave request deleted successfully');
        fetchRequests();
      } else {
        toast.error('Failed to delete leave request');
      }
    } catch (error) {
      console.error('Error deleting leave request:', error);
      toast.error('Failed to delete leave request');
    }
  };

  const handleCreateModalClose = () => {
    setIsCreateModalOpen(false);
    fetchRequests();
  };

  const handleApprovalModalClose = () => {
    setIsApprovalModalOpen(false);
    setSelectedRequest(null);
    fetchRequests();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calendar className="mr-2 h-6 w-6" />
            Leave Requests
          </h1>
          <p className="text-gray-600 mt-1">
            {userRole === 'ADMIN' 
              ? 'Manage and approve employee leave requests'
              : 'View and submit your leave requests'}
          </p>
        </div>
        
        <Button onClick={handleCreateRequest} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-4 w-4" />
            Filter Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <LeaveRequestTable
        requests={requests}
        loading={loading}
        userRole={userRole}
        currentUserId={userId}
        onApprove={handleApproveRequest}
        onDelete={handleDeleteRequest}
      />

      {isCreateModalOpen && (
        <LeaveRequestModal
          isOpen={isCreateModalOpen}
          onClose={handleCreateModalClose}
        />
      )}

      {isApprovalModalOpen && selectedRequest && (
        <LeaveApprovalModal
          request={selectedRequest}
          isOpen={isApprovalModalOpen}
          onClose={handleApprovalModalClose}
        />
      )}
    </div>
  );
}
