'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Calendar, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Users,
  AlertCircle,
  Info,
  Lightbulb
} from 'lucide-react';
import { LeaveType } from '@prisma/client';
import { useToast } from '@/hooks/use-toast';

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  employeeId?: string; // For managers creating requests for others
}

interface ConflictCheck {
  success: boolean;
  hasConflicts: boolean;
  conflicts: Array<{
    type: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    message: string;
    details: any;
  }>;
  recommendations: Array<{
    type: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    message: string;
    action: string;
  }>;
}

const leaveTypes = [
  { value: 'VACATION', label: 'Annual Leave', description: 'Paid vacation time' },
  { value: 'SICK_LEAVE', label: 'Sick Leave', description: 'Medical leave' },
  { value: 'PERSONAL', label: 'Personal Leave', description: 'Personal or family responsibilities' },
  { value: 'EMERGENCY', label: 'Emergency Leave', description: 'Unexpected urgent situations' },
  { value: 'MATERNITY', label: 'Maternity Leave', description: 'Maternity leave (4 months)' },
  { value: 'PATERNITY', label: 'Paternity Leave', description: 'Paternity leave (10 days)' },
  { value: 'BEREAVEMENT', label: 'Bereavement Leave', description: 'Compassionate leave' },
  { value: 'STUDY_LEAVE', label: 'Study Leave', description: 'Educational purposes' },
  { value: 'UNPAID_LEAVE', label: 'Unpaid Leave', description: 'Leave without pay' }
];

export function EnhancedLeaveRequestModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  employeeId 
}: LeaveRequestModalProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    leaveType: 'VACATION' as LeaveType,
    reason: '',
    isHalfDay: false,
    employeeId: employeeId || ''
  });

  const [loading, setLoading] = useState(false);
  const [checkingConflicts, setCheckingConflicts] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictCheck | null>(null);
  const [showConflicts, setShowConflicts] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<any>(null);

  const canSelectEmployee = ['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'DEPARTMENT_MANAGER'].includes(session?.user?.role || '');

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setFormData({
        startDate: '',
        endDate: '',
        leaveType: 'VACATION',
        reason: '',
        isHalfDay: false,
        employeeId: employeeId || ''
      });
      setConflicts(null);
      setShowConflicts(false);
      
      if (canSelectEmployee) {
        fetchEmployees();
      }
      
      fetchLeaveBalance();
    }
  }, [isOpen, employeeId]);

  useEffect(() => {
    // Check conflicts when dates change
    if (formData.startDate && formData.endDate) {
      const debounceTimer = setTimeout(() => {
        checkConflicts();
      }, 1000);
      
      return () => clearTimeout(debounceTimer);
    }
  }, [formData.startDate, formData.endDate, formData.employeeId]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      setEmployees(data.employees || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchLeaveBalance = async () => {
    try {
      const targetUserId = formData.employeeId || session?.user?.id;
      if (!targetUserId) return;

      const url = `/api/leave-balance/enhanced?userId=${targetUserId}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch balance');
      const data = await response.json();
      setLeaveBalance(data);
    } catch (error) {
      console.error('Error fetching leave balance:', error);
    }
  };

  const checkConflicts = async () => {
    if (!formData.startDate || !formData.endDate) return;
    
    try {
      setCheckingConflicts(true);
      const response = await fetch('/api/leave-calendar/conflicts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: formData.startDate,
          endDate: formData.endDate,
          employeeId: formData.employeeId || session?.user?.id
        })
      });
      
      if (!response.ok) throw new Error('Failed to check conflicts');
      
      const data = await response.json();
      setConflicts(data);
      setShowConflicts(data.hasConflicts);
    } catch (error) {
      console.error('Error checking conflicts:', error);
      toast({
        title: 'Warning',
        description: 'Unable to check for conflicts. Please verify manually.',
        variant: 'destructive'
      });
    } finally {
      setCheckingConflicts(false);
    }
  };

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    return formData.isHalfDay ? 0.5 : days;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.startDate || !formData.endDate || !formData.reason.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    // Check for high severity conflicts
    const highSeverityConflicts = conflicts?.conflicts.filter(c => c.severity === 'HIGH') || [];
    if (highSeverityConflicts.length > 0) {
      toast({
        title: 'Cannot Submit',
        description: 'Please resolve high severity conflicts before submitting',
        variant: 'destructive'
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          totalDays: calculateDays()
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create leave request');
      }

      toast({
        title: 'Success',
        description: 'Leave request submitted successfully',
        variant: 'default'
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating leave request:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit request',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'HIGH': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'MEDIUM': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'LOW': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return 'border-red-200 bg-red-50';
      case 'MEDIUM': return 'border-yellow-200 bg-yellow-50';
      case 'LOW': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getLeaveTypeBalance = () => {
    if (!leaveBalance || !formData.leaveType) return null;
    return leaveBalance.balances[formData.leaveType] || null;
  };

  const selectedLeaveType = leaveTypes.find(type => type.value === formData.leaveType);
  const balance = getLeaveTypeBalance();
  const requestedDays = calculateDays();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Request Leave
          </DialogTitle>
          <DialogDescription>
            Submit a new leave request with automatic conflict detection
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee Selection (for managers) */}
          {canSelectEmployee && (
            <div className="space-y-2">
              <Label htmlFor="employee">Employee (Optional)</Label>
              <Select 
                value={formData.employeeId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select employee (leave empty for yourself)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Myself</SelectItem>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.userId}>
                      {employee.name} ({employee.employeeId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Leave Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="leaveType">Leave Type *</Label>
            <Select 
              value={formData.leaveType} 
              onValueChange={(value: LeaveType) => setFormData(prev => ({ ...prev, leaveType: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedLeaveType && (
              <p className="text-sm text-gray-600">{selectedLeaveType.description}</p>
            )}
          </div>

          {/* Leave Balance Display */}
          {balance && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedLeaveType?.label} Balance:
                </span>
                <div className="flex items-center space-x-4 text-sm">
                  <span>Available: <strong>{balance.remaining}</strong> days</span>
                  <span>Requesting: <strong>{requestedDays}</strong> days</span>
                  <Badge 
                    variant={balance.remaining >= requestedDays ? "default" : "destructive"}
                  >
                    {balance.remaining >= requestedDays ? "Sufficient" : "Insufficient"}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Date Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                min={formData.startDate || new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          {/* Half Day Option */}
          <div className="flex items-center space-x-2">
            <input
              id="halfDay"
              type="checkbox"
              checked={formData.isHalfDay}
              onChange={(e) => setFormData(prev => ({ ...prev, isHalfDay: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <Label htmlFor="halfDay" className="text-sm">
              Half day leave (applies to single day only)
            </Label>
          </div>

          {/* Duration Display */}
          {formData.startDate && formData.endDate && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span>Duration:</span>
                <span className="font-medium">
                  {requestedDays} {requestedDays === 1 ? 'day' : 'days'}
                </span>
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a reason for your leave request..."
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              rows={3}
              required
            />
          </div>

          {/* Conflict Detection */}
          {checkingConflicts && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="h-4 w-4 animate-spin" />
              <span>Checking for conflicts...</span>
            </div>
          )}

          {/* Conflicts Display */}
          {conflicts && showConflicts && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Conflict Analysis</h4>
                <Badge variant={conflicts.hasConflicts ? "destructive" : "default"}>
                  {conflicts.hasConflicts ? `${conflicts.conflicts.length} conflicts` : 'No conflicts'}
                </Badge>
              </div>

              {conflicts.conflicts.map((conflict, index) => (
                <Alert key={index} className={getSeverityColor(conflict.severity)}>
                  <div className="flex items-start space-x-2">
                    {getSeverityIcon(conflict.severity)}
                    <div className="flex-1">
                      <AlertDescription className="font-medium">
                        {conflict.message}
                      </AlertDescription>
                      {conflict.details && typeof conflict.details === 'object' && (
                        <div className="mt-2 text-xs space-y-1">
                          {conflict.type === 'TEAM_COVERAGE' && conflict.details.map((member: any, i: number) => (
                            <div key={i} className="text-gray-600">
                              • {member.employeeName} ({member.title}) - {member.overlapDays} day(s) overlap
                            </div>
                          ))}
                          {conflict.type === 'INSUFFICIENT_BALANCE' && (
                            <div className="text-gray-600">
                              Available: {conflict.details.available} days, Requested: {conflict.details.requested} days
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Alert>
              ))}

              {/* Recommendations */}
              {conflicts.recommendations.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-blue-600" />
                    <h5 className="font-medium text-blue-900">Recommendations</h5>
                  </div>
                  <div className="space-y-1">
                    {conflicts.recommendations.map((rec, index) => (
                      <div key={index} className="text-sm text-blue-800">
                        • {rec.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || checkingConflicts}
              className={conflicts?.conflicts.some(c => c.severity === 'HIGH') ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {loading ? 'Submitting...' : 
               conflicts?.conflicts.some(c => c.severity === 'HIGH') ? 'Submit Despite Conflicts' : 
               'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}