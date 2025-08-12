'use client';

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  StableFormContainer,
  StableFormField,
  StableInput,
  StableSelect,
  StableTextarea,
  StableButton,
} from '@/components/ui/stable-form';
import { User, Briefcase, Phone, UserCheck, Save, X } from 'lucide-react';
import { showSuccess, showError, showLoading } from '@/lib/sweetalert';
import Swal from 'sweetalert2';

interface StableEmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: any;
  onSuccess?: () => void;
}

// Static data to prevent re-renders
const DEPARTMENTS = [
  { value: 'Executive', label: 'Executive' },
  { value: 'Human Resources', label: 'Human Resources' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Trading', label: 'Trading' },
  { value: 'Risk Management', label: 'Risk Management' },
  { value: 'IT', label: 'IT' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Compliance', label: 'Compliance' },
];

const ROLES = [
  { value: 'DIRECTOR', label: 'Director' },
  { value: 'HR_MANAGER', label: 'HR Manager' },
  { value: 'DEPARTMENT_MANAGER', label: 'Department Manager' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'SENIOR_EMPLOYEE', label: 'Senior Employee' },
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'INTERN', label: 'Intern' },
];

const TITLES = [
  { value: 'Chief Executive Officer', label: 'Chief Executive Officer' },
  { value: 'Chief Financial Officer', label: 'Chief Financial Officer' },
  { value: 'Chief Technology Officer', label: 'Chief Technology Officer' },
  { value: 'Director', label: 'Director' },
  { value: 'HR Manager', label: 'HR Manager' },
  { value: 'Finance Manager', label: 'Finance Manager' },
  { value: 'Trading Manager', label: 'Trading Manager' },
  { value: 'Risk Manager', label: 'Risk Manager' },
  { value: 'IT Manager', label: 'IT Manager' },
  { value: 'Operations Manager', label: 'Operations Manager' },
  { value: 'Compliance Manager', label: 'Compliance Manager' },
  { value: 'Senior Trader', label: 'Senior Trader' },
  { value: 'Senior Developer', label: 'Senior Developer' },
  { value: 'Senior Analyst', label: 'Senior Analyst' },
  { value: 'Supervisor', label: 'Supervisor' },
  { value: 'Trader', label: 'Trader' },
  { value: 'Developer', label: 'Developer' },
  { value: 'Analyst', label: 'Analyst' },
  { value: 'Specialist', label: 'Specialist' },
  { value: 'Coordinator', label: 'Coordinator' },
  { value: 'Assistant', label: 'Assistant' },
  { value: 'Intern', label: 'Intern' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'ON_LEAVE', label: 'On Leave' },
  { value: 'TERMINATED', label: 'Terminated' },
];

export function StableEmployeeForm({ 
  isOpen, 
  onClose, 
  employee, 
  onSuccess 
}: StableEmployeeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form state - using single object to minimize re-renders
  const [formData, setFormData] = useState({
    employeeId: employee?.employeeId || '',
    name: employee?.name || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    title: employee?.title || '',
    department: employee?.department || '',
    role: employee?.user?.role || 'EMPLOYEE',
    salary: employee?.salary?.toString() || '',
    hireDate: employee?.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : '',
    address: employee?.address || '',
    emergencyContact: employee?.emergencyContact || '',
    emergencyPhone: employee?.emergencyPhone || '',
    status: employee?.status || 'ACTIVE',
  });

  // Stable update function to prevent re-renders
  const updateField = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  // Validation function
  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.employeeId.trim()) newErrors.employeeId = 'Employee ID is required';
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.role) newErrors.role = 'Role is required';
    if (!formData.hireDate) newErrors.hireDate = 'Hire date is required';
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      showLoading('Saving employee information...');
      
      const url = employee ? `/api/employees/${employee.id}` : '/api/employees';
      const method = employee ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await showSuccess(
          employee ? 'Employee updated successfully!' : 'Employee created successfully!',
          'The employee information has been saved to the database.'
        );
        onSuccess?.();
        onClose();
      } else {
        const error = await response.json();
        await showError('Error', error.error || 'Failed to save employee information');
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      await showError('Error', 'An unexpected error occurred while saving the employee');
    } finally {
      setIsSubmitting(false);
      Swal.close();
    }
  }, [formData, validateForm, employee, onSuccess, onClose]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
    }
  }, [isSubmitting, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <UserCheck className="mr-2 h-6 w-6" />
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </DialogTitle>
          <DialogDescription>
            {employee
              ? 'Update employee information and job details. All fields marked with * are required.'
              : 'Create a new employee profile with complete information. All fields marked with * are required.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <StableFormContainer>
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <User className="mr-2 h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <StableFormField
                    label="Employee ID"
                    required
                    error={errors.employeeId}
                  >
                    <StableInput
                      placeholder="EMP001"
                      value={formData.employeeId}
                      onChange={(e) => updateField('employeeId', e.target.value)}
                      error={!!errors.employeeId}
                      disabled={isSubmitting || !!employee}
                    />
                  </StableFormField>
                  
                  <StableFormField
                    label="Full Name"
                    required
                    error={errors.name}
                  >
                    <StableInput
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      error={!!errors.name}
                      disabled={isSubmitting}
                    />
                  </StableFormField>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <StableFormField
                    label="Email Address"
                    required
                    error={errors.email}
                  >
                    <StableInput
                      type="email"
                      placeholder="john.doe@ekhayaintel.com"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      error={!!errors.email}
                      disabled={isSubmitting}
                    />
                  </StableFormField>
                  
                  <StableFormField
                    label="Phone Number"
                    error={errors.phone}
                  >
                    <StableInput
                      placeholder="+27 11 123 4567"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      error={!!errors.phone}
                      disabled={isSubmitting}
                    />
                  </StableFormField>
                </div>

                <StableFormField
                  label="Address"
                  error={errors.address}
                >
                  <StableTextarea
                    placeholder="123 Business Street, Johannesburg, 2000"
                    value={formData.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    error={!!errors.address}
                    disabled={isSubmitting}
                    rows={2}
                  />
                </StableFormField>
              </CardContent>
            </Card>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <StableButton
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </StableButton>
              <StableButton
                type="submit"
                loading={isSubmitting}
              >
                <Save className="mr-2 h-4 w-4" />
                {employee ? 'Update Employee' : 'Create Employee'}
              </StableButton>
            </div>
          </StableFormContainer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
