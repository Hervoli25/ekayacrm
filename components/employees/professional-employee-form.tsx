'use client';

import { useState, useCallback, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  Briefcase, 
  Calendar,
  DollarSign,
  MapPin,
  UserCheck,
  Save,
  X
} from 'lucide-react';
import { showSuccess, showError, showLoading } from '@/lib/sweetalert';
import Swal from 'sweetalert2';

// Form validation schema
const employeeSchema = z.object({
  employeeId: z.string().min(3, 'Employee ID must be at least 3 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  title: z.string().min(2, 'Title is required'),
  department: z.string().min(1, 'Department is required'),
  role: z.string().min(1, 'Role is required'),
  salary: z.string().optional(),
  hireDate: z.string().min(1, 'Hire date is required'),
  address: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyPhone: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED']).default('ACTIVE'),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface ProfessionalEmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: any;
  onSuccess?: () => void;
}

// Predefined options to prevent layout shifts
const DEPARTMENTS = [
  'Executive',
  'Human Resources', 
  'Finance',
  'Trading',
  'Risk Management',
  'IT',
  'Operations',
  'Compliance'
];

const ROLES = [
  'DIRECTOR',
  'HR_MANAGER',
  'DEPARTMENT_MANAGER', 
  'SUPERVISOR',
  'SENIOR_EMPLOYEE',
  'EMPLOYEE',
  'INTERN'
];

const TITLES = [
  'Chief Executive Officer',
  'Chief Financial Officer',
  'Chief Technology Officer',
  'Director',
  'HR Manager',
  'Finance Manager',
  'Trading Manager',
  'Risk Manager',
  'IT Manager',
  'Operations Manager',
  'Compliance Manager',
  'Senior Trader',
  'Senior Developer',
  'Senior Analyst',
  'Supervisor',
  'Trader',
  'Developer',
  'Analyst',
  'Specialist',
  'Coordinator',
  'Assistant',
  'Intern'
];

export function ProfessionalEmployeeForm({ 
  isOpen, 
  onClose, 
  employee, 
  onSuccess 
}: ProfessionalEmployeeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
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
    },
    mode: 'onChange', // Validate on change for better UX
  });

  const onSubmit = useCallback(async (data: EmployeeFormData) => {
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
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await showSuccess(
          employee ? 'Employee updated successfully!' : 'Employee created successfully!',
          'The employee information has been saved to the database.'
        );
        onSuccess?.();
        onClose();
        form.reset();
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
  }, [employee, onSuccess, onClose, form]);

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      onClose();
      form.reset();
    }
  }, [isSubmitting, onClose, form]);

  // Memoize form sections to prevent unnecessary re-renders
  const personalInfoSection = useMemo(() => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <User className="mr-2 h-5 w-5" />
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="employeeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee ID *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="EMP001" 
                    {...field} 
                    disabled={isSubmitting || !!employee}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="John Doe" 
                    {...field} 
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address *</FormLabel>
                <FormControl>
                  <Input 
                    type="email"
                    placeholder="john.doe@ekhayaintel.com" 
                    {...field} 
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="+27 11 123 4567" 
                    {...field} 
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="123 Business Street, Johannesburg, 2000" 
                  {...field} 
                  disabled={isSubmitting}
                  rows={2}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  ), [form.control, isSubmitting, employee]);

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
              ? 'Update employee information and job details' 
              : 'Create a new employee profile with complete information'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {personalInfoSection}

            {/* Job Information Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Briefcase className="mr-2 h-5 w-5" />
                  Job Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select job title" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TITLES.map((title) => (
                              <SelectItem key={title} value={title}>
                                {title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DEPARTMENTS.map((dept) => (
                              <SelectItem key={dept} value={dept}>
                                {dept}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>System Role *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select system role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ROLES.map((role) => (
                              <SelectItem key={role} value={role}>
                                <div className="flex items-center">
                                  <Badge variant="outline" className="mr-2">
                                    {role.replace('_', ' ')}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          This determines the employee's access level in the system
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hireDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hire Date *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="salary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annual Salary (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="500000"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter annual salary in ZAR
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employment Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ACTIVE">
                              <Badge className="bg-green-100 text-green-800">Active</Badge>
                            </SelectItem>
                            <SelectItem value="INACTIVE">
                              <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                            </SelectItem>
                            <SelectItem value="ON_LEAVE">
                              <Badge className="bg-yellow-100 text-yellow-800">On Leave</Badge>
                            </SelectItem>
                            <SelectItem value="TERMINATED">
                              <Badge className="bg-red-100 text-red-800">Terminated</Badge>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Phone className="mr-2 h-5 w-5" />
                  Emergency Contact (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="emergencyContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Jane Doe"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emergencyPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact Phone</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="+27 82 123 4567"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
            
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Saving...' : (employee ? 'Update Employee' : 'Create Employee')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
