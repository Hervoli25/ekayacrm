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
  StableButton,
} from '@/components/ui/stable-form';
import { Crown, Building, Mail, User, Save, X } from 'lucide-react';
import { showSuccess, showError, showLoading } from '@/lib/sweetalert';
import Swal from 'sweetalert2';

interface DirectorCreationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// Static data to prevent re-renders
const DEPARTMENTS = [
  { value: 'Executive', label: 'Executive' },
  { value: 'Human Resources', label: 'Human Resources' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Trading', label: 'Trading' },
  { value: 'Risk Management', label: 'Risk Management' },
  { value: 'IT', label: 'Information Technology' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Compliance', label: 'Compliance' },
  { value: 'Legal', label: 'Legal' },
  { value: 'Marketing', label: 'Marketing' },
];

const initialFormData = {
  name: '',
  email: '',
  department: '',
};

export function DirectorCreationForm({ isOpen, onClose, onSuccess }: DirectorCreationFormProps) {
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = useCallback((field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
  }, []);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  }, [isSubmitting, resetForm, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim() || !formData.department) {
      await showError('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);

    // Show loading alert
    showLoading('Creating Director Account...', 'Setting up director profile and access credentials');

    try {
      const response = await fetch('/api/admin/create-director', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      // Close loading alert
      Swal.close();

      if (!response.ok) {
        let errorMessage = 'Failed to create director';
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.error || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        await showError('Creation Failed', errorMessage);
        return;
      }

      const result = await response.json();

      if (result.success && result.director) {
        // Reset form and close dialog
        resetForm();
        handleClose();

        // Show success message
        await showSuccess(
          'Director Created Successfully!',
          `Director: ${result.director.name}\nEmail: ${result.director.email}\nDepartment: ${result.director.department}\nEmployee ID: ${result.director.employeeId}\n\nTemporary credentials have been logged for secure access.`
        );

        // Call success callback if provided
        if (onSuccess) {
          onSuccess();
        }
      } else {
        await showError('Creation Failed', result.error || 'Failed to create director');
      }
    } catch (error) {
      console.error('Error creating director:', error);
      Swal.close();
      await showError('Connection Error', 'Failed to create director. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Crown className="h-5 w-5 text-purple-600" />
            <span>Create Director Account</span>
          </DialogTitle>
          <DialogDescription>
            Create a new director account with secure credentials and department assignment.
          </DialogDescription>
        </DialogHeader>

        <Card className="border-0 shadow-none">
          <CardContent className="p-0">
            <StableFormContainer onSubmit={handleSubmit}>
              <div className="space-y-6">
                
                {/* Personal Information */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Personal Information
                  </h4>
                  
                  <StableFormField label="Full Name" required>
                    <StableInput
                      placeholder="Enter director's full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </StableFormField>

                  <StableFormField label="Email Address" required>
                    <StableInput
                      type="email"
                      placeholder="director@company.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      disabled={isSubmitting}
                    />
                  </StableFormField>
                </div>

                {/* Department Assignment */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    Department Assignment
                  </h4>
                  
                  <StableFormField label="Department" required>
                    <StableSelect
                      value={formData.department}
                      onValueChange={(value) => handleInputChange('department', value)}
                      placeholder="Select department"
                      disabled={isSubmitting}
                      options={DEPARTMENTS}
                    />
                  </StableFormField>
                </div>

                {/* Security Notice */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <Crown className="h-5 w-5 text-purple-600 mt-0.5" />
                    <div className="text-sm text-purple-800">
                      <p className="font-medium mb-1">Security Information</p>
                      <p className="text-purple-700">
                        A temporary password will be generated and logged securely for this director account.
                        The credentials will be available in the Credentials Manager for secure distribution.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex space-x-3 pt-4">
                  <StableButton
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </StableButton>
                  
                  <StableButton
                    type="submit"
                    disabled={isSubmitting || !formData.name.trim() || !formData.email.trim() || !formData.department}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Creating...' : 'Create Director'}
                  </StableButton>
                </div>
              </div>
            </StableFormContainer>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}