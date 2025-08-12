'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Calendar,
  Clock,
  FileText,
  CheckCircle,
  AlertTriangle,
  Plus,
  User,
  Building
} from 'lucide-react';
import { showError, showSuccess } from '@/lib/sweetalert';

interface LeaveBalance {
  annualAllocation: number;
  used: number;
  pending: number;
  remaining: number;
  breakdown: {
    annual: number;
    sick: number;
    maternity: number;
    paternity: number;
    compassionate: number;
    study: number;
    unpaid: number;
    other: number;
  };
}

interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  status: string;
  totalDays: number;
  isHalfDay: boolean;
  createdAt: string;
  employee?: {
    name: string;
    employeeId: string;
    department: string;
    title: string;
  };
}

export function LeaveRequestForm() {
  const { data: session } = useSession();
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    leaveType: '',
    isHalfDay: false,
    attachmentUrl: ''
  });

  useEffect(() => {
    if (session?.user) {
      fetchLeaveData();
    }
  }, [session]);

  const fetchLeaveData = async () => {
    try {
      // Fetch leave balance
      const balanceResponse = await fetch('/api/leave-balance');
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        setLeaveBalance(balanceData.balance);
      }

      // Fetch leave requests
      const requestsResponse = await fetch('/api/leave-requests');
      if (requestsResponse.ok) {
        const requestsData = await requestsResponse.json();
        setLeaveRequests(requestsData.leaveRequests || []);
      }
    } catch (error) {
      console.error('Error fetching leave data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate || !formData.leaveType) {
      await showError('Validation Error', 'Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        await showSuccess('Success!', 'Leave request submitted successfully!');
        setFormData({
          startDate: '',
          endDate: '',
          leaveType: '',
          isHalfDay: false,
          attachmentUrl: ''
        });
        setShowRequestDialog(false);
        fetchLeaveData(); // Refresh data
      } else {
        await showError('Submission Failed', result.error || 'Failed to submit leave request');
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      await showError('Connection Error', 'Failed to submit leave request. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const timeDiff = end.getTime() - start.getTime();
    const days = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    return formData.isHalfDay ? 0.5 : days;
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Leave Management</h2>
          <p className="text-gray-600">Request and track your leave applications</p>
        </div>
        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Request Leave
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Submit Leave Request</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitRequest} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date *</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date *</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="leave-type">Leave Type *</Label>
                <Select value={formData.leaveType} onValueChange={(value) => setFormData({...formData, leaveType: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select leave type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANNUAL">Annual Leave</SelectItem>
                    <SelectItem value="SICK">Sick Leave</SelectItem>
                    <SelectItem value="MATERNITY">Maternity Leave</SelectItem>
                    <SelectItem value="PATERNITY">Paternity Leave</SelectItem>
                    <SelectItem value="COMPASSIONATE">Compassionate Leave</SelectItem>
                    <SelectItem value="STUDY">Study Leave</SelectItem>
                    <SelectItem value="UNPAID">Unpaid Leave</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="half-day"
                  checked={formData.isHalfDay}
                  onCheckedChange={(checked) => setFormData({...formData, isHalfDay: checked as boolean})}
                />
                <Label htmlFor="half-day" className="text-sm">This is a half-day leave</Label>
              </div>

              {formData.startDate && formData.endDate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    <span className="font-medium">Total days:</span> {calculateDays()} day(s)
                  </p>
                  {leaveBalance && (
                    <p className="text-xs text-blue-600 mt-1">
                      Remaining balance: {leaveBalance.remaining} days
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowRequestDialog(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Leave Balance Cards */}
      {leaveBalance && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Annual Allocation</p>
                  <p className="text-3xl font-bold text-blue-600">{leaveBalance.annualAllocation}</p>
                  <p className="text-xs text-gray-500">days per year</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Remaining</p>
                  <p className="text-3xl font-bold text-green-600">{leaveBalance.remaining}</p>
                  <p className="text-xs text-gray-500">available days</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Used</p>
                  <p className="text-3xl font-bold text-red-600">{leaveBalance.used}</p>
                  <p className="text-xs text-gray-500">days taken</p>
                </div>
                <Clock className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-3xl font-bold text-yellow-600">{leaveBalance.pending}</p>
                  <p className="text-xs text-gray-500">awaiting approval</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Leave Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>My Leave Requests</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {leaveRequests.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">No leave requests yet</p>
              <p className="text-sm text-gray-500">Your leave requests will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaveRequests.slice(0, 10).map((request) => (
                <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <Badge className={getLeaveTypeColor(request.leaveType)}>
                          {request.leaveType.replace('_', ' ')}
                        </Badge>
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900">
                          {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          Submitted on {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{request.totalDays} day(s)</p>
                      {request.isHalfDay && (
                        <p className="text-xs text-gray-500">Half Day</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}