'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LeaveCalendar } from './leave-calendar';
import { 
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Building,
  Eye,
  FileText,
  Users
} from 'lucide-react';
import { hasPermission } from '@/lib/enterprise-permissions';
import { showSuccess, showError } from '@/lib/sweetalert';

interface LeaveRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  status: string;
  totalDays: number;
  isHalfDay: boolean;
  adminNotes?: string;
  createdAt: string;
  employee?: {
    name: string;
    employeeId: string;
    department: string;
    title: string;
  };
  approvals?: Array<{
    id: string;
    step: number;
    status: string;
    approvedAt?: string;
    rejectedAt?: string;
    notes?: string;
    approver: {
      name: string;
      role: string;
    };
  }>;
}

export function LeaveManagementDashboard() {
  const { data: session } = useSession();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [processingApproval, setProcessingApproval] = useState(false);

  const canApproveLeave = session?.user && (
    hasPermission(session.user.role, 'LEAVE_APPROVE_ALL') ||
    hasPermission(session.user.role, 'LEAVE_APPROVE_DEPARTMENT') ||
    hasPermission(session.user.role, 'LEAVE_APPROVE_TEAM')
  );

  useEffect(() => {
    if (session?.user) {
      fetchLeaveRequests();
    }
  }, [session]);

  useEffect(() => {
    filterRequests();
  }, [leaveRequests, statusFilter]);

  const fetchLeaveRequests = async () => {
    try {
      const response = await fetch('/api/leave-requests');
      if (response.ok) {
        const data = await response.json();
        setLeaveRequests(data.leaveRequests || []);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = leaveRequests;
    if (statusFilter !== 'all') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }
    setFilteredRequests(filtered);
  };

  const handleApproval = async (action: 'approve' | 'reject') => {
    if (!selectedRequest) return;

    setProcessingApproval(true);
    try {
      const response = await fetch(`/api/leave-requests/${selectedRequest.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          notes: approvalNotes
        }),
      });

      const result = await response.json();

      if (response.ok) {
        await showSuccess('Success!', `Leave request ${action}d successfully!`);
        setShowApprovalDialog(false);
        setSelectedRequest(null);
        setApprovalNotes('');
        fetchLeaveRequests(); // Refresh data
      } else {
        await showError('Action Failed', result.error || `Failed to ${action} leave request`);
      }
    } catch (error) {
      console.error(`Error ${action}ing leave request:`, error);
      await showError('Connection Error', `Failed to ${action} leave request. Please check your connection and try again.`);
    } finally {
      setProcessingApproval(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLeaveTypeColor = (type: string) => {
    const colors = {
      'ANNUAL': 'bg-blue-100 text-blue-800',
      'SICK': 'bg-red-100 text-red-800',
      'MATERNITY': 'bg-pink-100 text-pink-800',
      'PATERNITY': 'bg-purple-100 text-purple-800',
      'COMPASSIONATE': 'bg-gray-100 text-gray-800',
      'STUDY': 'bg-indigo-100 text-indigo-800',
      'UNPAID': 'bg-orange-100 text-orange-800',
      'OTHER': 'bg-teal-100 text-teal-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPendingCount = () => leaveRequests.filter(req => req.status === 'PENDING').length;
  const getApprovedCount = () => leaveRequests.filter(req => req.status === 'APPROVED').length;
  const getRejectedCount = () => leaveRequests.filter(req => req.status === 'REJECTED').length;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="requests">Leave Requests</TabsTrigger>
          <TabsTrigger value="calendar">Team Calendar</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Leave Management</h2>
            <p className="text-gray-600">
              {canApproveLeave 
                ? 'Review and approve leave requests from your team' 
                : 'View leave requests in your department'
              }
            </p>
          </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-3xl font-bold text-yellow-600">{getPendingCount()}</p>
                <p className="text-xs text-yellow-500">requires action</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-3xl font-bold text-green-600">{getApprovedCount()}</p>
                <p className="text-xs text-green-500">this month</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-3xl font-bold text-red-600">{getRejectedCount()}</p>
                <p className="text-xs text-red-500">this month</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-3xl font-bold text-blue-600">{leaveRequests.length}</p>
                <p className="text-xs text-blue-500">all time</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Leave Requests</span>
            </CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No leave requests found</p>
              <p className="text-sm text-gray-500">Leave requests will appear here when submitted</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="font-medium text-gray-900">
                            {request.employee?.name || 'Unknown Employee'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Building className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {request.employee?.department}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <Badge className={getLeaveTypeColor(request.leaveType)}>
                          {request.leaveType.replace('_', ' ')}
                        </Badge>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {request.totalDays} day(s)
                          {request.isHalfDay && ' (Half Day)'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          Submitted on {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Approval History */}
                      {request.approvals && request.approvals.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-700">Approval History:</p>
                          {request.approvals.map((approval) => (
                            <div key={approval.id} className="text-xs text-gray-600 pl-2">
                              Step {approval.step}: {approval.status} by {approval.approver.name}
                              {approval.notes && (
                                <span className="ml-1 text-gray-500">- "{approval.notes}"</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canApproveLeave && request.status === 'PENDING' && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowApprovalDialog(true);
                          }}
                        >
                          Review
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Leave Request</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <p><span className="font-medium">Employee:</span> {selectedRequest.employee?.name}</p>
                <p><span className="font-medium">Department:</span> {selectedRequest.employee?.department}</p>
                <p><span className="font-medium">Leave Type:</span> {selectedRequest.leaveType.replace('_', ' ')}</p>
                <p><span className="font-medium">Duration:</span> {new Date(selectedRequest.startDate).toLocaleDateString()} - {new Date(selectedRequest.endDate).toLocaleDateString()}</p>
                <p><span className="font-medium">Total Days:</span> {selectedRequest.totalDays} day(s)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approval-notes">Notes (Optional)</Label>
                <Textarea
                  id="approval-notes"
                  placeholder="Add any notes about your decision..."
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => handleApproval('reject')}
                  disabled={processingApproval}
                >
                  {processingApproval ? 'Processing...' : 'Reject'}
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={() => handleApproval('approve')}
                  disabled={processingApproval}
                >
                  {processingApproval ? 'Processing...' : 'Approve'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <div className="text-center py-8">
            <p className="text-gray-500">Team Calendar view coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}