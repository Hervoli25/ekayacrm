
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Calendar, Plus } from 'lucide-react';
import { CreateLeaveRequestData } from '@/lib/types';
import { LeaveType } from '@prisma/client';
import toast from 'react-hot-toast';

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const leaveTypes = [
  { value: 'VACATION', label: 'Vacation' },
  { value: 'SICK_LEAVE', label: 'Sick Leave' },
  { value: 'PERSONAL', label: 'Personal' },
  { value: 'EMERGENCY', label: 'Emergency' },
  { value: 'MATERNITY', label: 'Maternity' },
  { value: 'PATERNITY', label: 'Paternity' },
];

export function LeaveRequestModal({ isOpen, onClose }: LeaveRequestModalProps) {
  const [formData, setFormData] = useState<CreateLeaveRequestData>({
    startDate: new Date(),
    endDate: new Date(),
    leaveType: 'VACATION' as LeaveType,
    reason: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.startDate >= formData.endDate) {
      toast.error('End date must be after start date');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Leave request submitted successfully');
        onClose();
        // Reset form
        setFormData({
          startDate: new Date(),
          endDate: new Date(),
          leaveType: 'VACATION' as LeaveType,
          reason: '',
        });
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to submit leave request');
      }
    } catch (error) {
      console.error('Error submitting leave request:', error);
      toast.error('Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateLeaveRequestData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const parseDate = (dateString: string) => {
    return new Date(dateString + 'T00:00:00');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Plus className="mr-2 h-5 w-5" />
            New Leave Request
          </DialogTitle>
          <DialogDescription>
            Submit a new leave request for approval.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="leaveType">Leave Type *</Label>
            <Select 
              value={formData.leaveType} 
              onValueChange={(value) => handleChange('leaveType', value as LeaveType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="startDate"
                  type="date"
                  value={formatDate(formData.startDate)}
                  onChange={(e) => handleChange('startDate', parseDate(e.target.value))}
                  required
                  className="pl-10"
                  disabled={loading}
                  min={formatDate(new Date())}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="endDate"
                  type="date"
                  value={formatDate(formData.endDate)}
                  onChange={(e) => handleChange('endDate', parseDate(e.target.value))}
                  required
                  className="pl-10"
                  disabled={loading}
                  min={formatDate(formData.startDate)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => handleChange('reason', e.target.value)}
              placeholder="Please provide a reason for your leave request..."
              required
              disabled={loading}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
