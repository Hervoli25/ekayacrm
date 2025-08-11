

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  CalendarDays,
  Clock,
  Users,
  Plus,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  Search,
  Filter,
  Calendar,
} from 'lucide-react';
import { Role } from '@prisma/client';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';

interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
  status: string;
  adminNotes?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedAt?: string;
  totalDays?: number;
  isHalfDay: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    name: string;
    email: string;
    employee: {
      name: string;
      employeeId: string;
      department: string;
      title: string;
    };
  };
}

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  email: string;
}

interface EnhancedLeaveManagerProps {
  userRole: Role;
  userId: string;
}

export function EnhancedLeaveManager({ userRole, userId }: EnhancedLeaveManagerProps) {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('all');
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    employeeId: '',
    startDate: '',
    endDate: '',
    leaveType: '',
    reason: '',
    isHalfDay: false,
  });
  const [actionData, setActionData] = useState({
    action: '',
    adminNotes: '',
  });

  const canManage = ['SUPER_ADMIN', 'ADMIN', 'HR_DIRECTOR', 'MANAGER'].includes(userRole);

  useEffect(() => {
    fetchLeaveRequests();
    if (canManage) {
      fetchEmployees();
    }
  }, [statusFilter, leaveTypeFilter]);

  const fetchLeaveRequests = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await fetch(`/api/leave-requests?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setLeaveRequests(data || []);
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

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const data = await response.json();
      
      if (response.ok) {
        setEmployees(data || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleCreateLeave = async () => {
    try {
      const response = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Leave request created successfully');
        setIsCreateModalOpen(false);
        resetForm();
        fetchLeaveRequests();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create leave request');
      }
    } catch (error) {
      console.error('Error creating leave request:', error);
      toast.error('Failed to create leave request');
    }
  };

  const handleUpdateLeave = async (requestId: string, action: string) => {
    try {
      const response = await fetch(`/api/leave-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          ...actionData,
          ...(action === 'modify' ? formData : {}),
        }),
      });

      if (response.ok) {
        toast.success(`Leave request ${action}d successfully`);
        setIsActionModalOpen(false);
        setIsEditModalOpen(false);
        resetForm();
        fetchLeaveRequests();
      } else {
        const error = await response.json();
        toast.error(error.error || `Failed to ${action} leave request`);
      }
    } catch (error) {
      console.error(`Error ${action}ing leave request:`, error);
      toast.error(`Failed to ${action} leave request`);
    }
  };

  const handleDeleteLeave = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this leave request?')) {
      return;
    }

    try {
      const response = await fetch(`/api/leave-requests/${requestId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Leave request deleted successfully');
        fetchLeaveRequests();
      } else {
        toast.error('Failed to delete leave request');
      }
    } catch (error) {
      console.error('Error deleting leave request:', error);
      toast.error('Failed to delete leave request');
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      startDate: '',
      endDate: '',
      leaveType: '',
      reason: '',
      isHalfDay: false,
    });
    setActionData({
      action: '',
      adminNotes: '',
    });
  };

  const openActionModal = (request: LeaveRequest, actionType: string) => {
    setSelectedRequest(request);
    setActionData({ action: actionType, adminNotes: '' });
    setIsActionModalOpen(true);
  };

  const openEditModal = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setFormData({
      employeeId: request.user.employee.employeeId,
      startDate: format(new Date(request.startDate), 'yyyy-MM-dd'),
      endDate: format(new Date(request.endDate), 'yyyy-MM-dd'),
      leaveType: request.leaveType,
      reason: request.reason,
      isHalfDay: request.isHalfDay,
    });
    setIsEditModalOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'MODIFIED': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'VACATION': return 'bg-purple-100 text-purple-800';
      case 'SICK_LEAVE': return 'bg-red-100 text-red-800';
      case 'PERSONAL': return 'bg-blue-100 text-blue-800';
      case 'EMERGENCY': return 'bg-orange-100 text-orange-800';
      case 'MATERNITY': return 'bg-pink-100 text-pink-800';
      case 'PATERNITY': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredRequests = leaveRequests.filter(request => {
    const matchesSearch = 
      request.user.employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.user.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.user.employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.reason.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = leaveTypeFilter === 'all' || request.leaveType === leaveTypeFilter;
    
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <CalendarDays className="mr-2 h-6 w-6" />
            Leave Management
          </h1>
          <p className="text-gray-600 mt-1">
            {canManage ? 'Manage all employee leave requests' : 'View and manage your leave requests'}
          </p>
        </div>
        
        <Button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          {canManage ? 'Create Leave Request' : 'Request Leave'}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="modified">Modified</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="VACATION">Vacation</SelectItem>
                <SelectItem value="SICK_LEAVE">Sick Leave</SelectItem>
                <SelectItem value="PERSONAL">Personal</SelectItem>
                <SelectItem value="EMERGENCY">Emergency</SelectItem>
                <SelectItem value="MATERNITY">Maternity</SelectItem>
                <SelectItem value="PATERNITY">Paternity</SelectItem>
                <SelectItem value="BEREAVEMENT">Bereavement</SelectItem>
                <SelectItem value="STUDY_LEAVE">Study Leave</SelectItem>
                <SelectItem value="UNPAID_LEAVE">Unpaid Leave</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-600 flex items-center">
              <Users className="mr-1 h-4 w-4" />
              {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leave Requests */}
      <div className="grid gap-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <CalendarDays className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-gray-600">No leave requests found</p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge className={getStatusColor(request.status)} variant="outline">
                        {request.status}
                      </Badge>
                      <Badge className={getLeaveTypeColor(request.leaveType)} variant="secondary">
                        {request.leaveType.replace('_', ' ')}
                      </Badge>
                      {request.isHalfDay && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700">
                          Half Day
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {request.user.employee.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {request.user.employee.employeeId} • {request.user.employee.department}
                        </p>
                        <p className="text-sm text-gray-500">{request.user.employee.title}</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <Calendar className="mr-1 h-4 w-4" />
                          {format(new Date(request.startDate), 'MMM dd, yyyy')} - {format(new Date(request.endDate), 'MMM dd, yyyy')}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="mr-1 h-4 w-4" />
                          {request.totalDays || differenceInDays(new Date(request.endDate), new Date(request.startDate)) + 1} day{(request.totalDays || 1) !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                      <p className="text-sm text-gray-600">{request.reason}</p>
                      {request.adminNotes && (
                        <>
                          <p className="text-sm font-medium text-gray-700 mt-2 mb-1">Admin Notes:</p>
                          <p className="text-sm text-gray-600">{request.adminNotes}</p>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {canManage && request.status === 'PENDING' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openActionModal(request, 'approve')}
                          className="text-green-700 border-green-200 hover:bg-green-50"
                        >
                          <CheckCircle2 className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openActionModal(request, 'reject')}
                          className="text-red-700 border-red-200 hover:bg-red-50"
                        >
                          <XCircle className="mr-1 h-4 w-4" />
                          Reject
                        </Button>
                      </>
                    )}
                    
                    {(request.user && userId && userId === (request.user as any).id || canManage) && request.status === 'PENDING' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(request)}
                        className="text-blue-700 border-blue-200 hover:bg-blue-50"
                      >
                        <Edit className="mr-1 h-4 w-4" />
                        Modify
                      </Button>
                    )}
                    
                    {(request.user && userId && userId === (request.user as any).id || canManage) && ['PENDING', 'APPROVED'].includes(request.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openActionModal(request, 'cancel')}
                        className="text-gray-700 border-gray-200 hover:bg-gray-50"
                      >
                        Cancel
                      </Button>
                    )}
                    
                    {canManage && ['SUPER_ADMIN', 'ADMIN'].includes(userRole) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteLeave(request.id)}
                        className="text-red-700 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Leave Request Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {canManage && (
              <div>
                <Label htmlFor="employee">Employee</Label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(value) => setFormData({ ...formData, employeeId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee (leave empty for yourself)" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.employeeId}>
                        {employee.name} ({employee.employeeId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label htmlFor="leaveType">Leave Type</Label>
              <Select
                value={formData.leaveType}
                onValueChange={(value) => setFormData({ ...formData, leaveType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VACATION">Vacation</SelectItem>
                  <SelectItem value="SICK_LEAVE">Sick Leave</SelectItem>
                  <SelectItem value="PERSONAL">Personal</SelectItem>
                  <SelectItem value="EMERGENCY">Emergency</SelectItem>
                  <SelectItem value="MATERNITY">Maternity</SelectItem>
                  <SelectItem value="PATERNITY">Paternity</SelectItem>
                  <SelectItem value="BEREAVEMENT">Bereavement</SelectItem>
                  <SelectItem value="STUDY_LEAVE">Study Leave</SelectItem>
                  <SelectItem value="UNPAID_LEAVE">Unpaid Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                id="halfDay"
                type="checkbox"
                checked={formData.isHalfDay}
                onChange={(e) => setFormData({ ...formData, isHalfDay: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="halfDay" className="text-sm">Half day leave</Label>
            </div>
            
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a reason for your leave request"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateLeave}>
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Leave Request Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modify Leave Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="leaveType">Leave Type</Label>
              <Select
                value={formData.leaveType}
                onValueChange={(value) => setFormData({ ...formData, leaveType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VACATION">Vacation</SelectItem>
                  <SelectItem value="SICK_LEAVE">Sick Leave</SelectItem>
                  <SelectItem value="PERSONAL">Personal</SelectItem>
                  <SelectItem value="EMERGENCY">Emergency</SelectItem>
                  <SelectItem value="MATERNITY">Maternity</SelectItem>
                  <SelectItem value="PATERNITY">Paternity</SelectItem>
                  <SelectItem value="BEREAVEMENT">Bereavement</SelectItem>
                  <SelectItem value="STUDY_LEAVE">Study Leave</SelectItem>
                  <SelectItem value="UNPAID_LEAVE">Unpaid Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                id="halfDay"
                type="checkbox"
                checked={formData.isHalfDay}
                onChange={(e) => setFormData({ ...formData, isHalfDay: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="halfDay" className="text-sm">Half day leave</Label>
            </div>
            
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a reason for your leave request"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => selectedRequest && handleUpdateLeave(selectedRequest.id, 'modify')}>
                Update Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Action Modal (Approve/Reject/Cancel) */}
      <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionData.action === 'approve' && 'Approve Leave Request'}
              {actionData.action === 'reject' && 'Reject Leave Request'}
              {actionData.action === 'cancel' && 'Cancel Leave Request'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRequest && (
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="font-medium">{selectedRequest.user.employee.name}</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(selectedRequest.startDate), 'MMM dd, yyyy')} - {format(new Date(selectedRequest.endDate), 'MMM dd, yyyy')}
                </p>
                <p className="text-sm text-gray-600 mt-1">{selectedRequest.reason}</p>
              </div>
            )}
            
            {(actionData.action === 'approve' || actionData.action === 'reject') && (
              <div>
                <Label htmlFor="adminNotes">
                  {actionData.action === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason'}
                </Label>
                <Textarea
                  id="adminNotes"
                  placeholder={actionData.action === 'approve' 
                    ? 'Add any notes about this approval...' 
                    : 'Please provide a reason for rejection...'}
                  value={actionData.adminNotes}
                  onChange={(e) => setActionData({ ...actionData, adminNotes: e.target.value })}
                  rows={3}
                />
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsActionModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => selectedRequest && handleUpdateLeave(selectedRequest.id, actionData.action)}
                className={
                  actionData.action === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                  actionData.action === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-gray-600 hover:bg-gray-700'
                }
              >
                {actionData.action === 'approve' && 'Approve Request'}
                {actionData.action === 'reject' && 'Reject Request'}
                {actionData.action === 'cancel' && 'Cancel Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
