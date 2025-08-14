'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
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
  X,
  Loader2
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
  reportsTo: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED']).default('ACTIVE'),
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

interface ProfessionalEmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  employee?: any;
  onSuccess?: () => void;
}

// Types for dynamic data
interface JobTitle {
  title: string;
  department: string;
  level: string;
  description?: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
}

interface Role {
  value: string;
  label: string;
  description: string;
  level: string;
}

interface Manager {
  id: string;
  name: string;
  email: string;
  role: string;
  roleLabel: string;
  department: string;
  title: string;
  employeeId: string;
}

export function ProfessionalEmployeeForm({
  isOpen,
  onClose,
  employee,
  onSuccess
}: ProfessionalEmployeeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic data state
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Selected department for filtering
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');

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
      reportsTo: employee?.reportsTo || '',
      status: employee?.status || 'ACTIVE',
    },
    mode: 'onChange', // Validate on change for better UX
  });

  // Fetch dynamic data
  const fetchJobTitles = useCallback(async (department?: string) => {
    try {
      const url = department
        ? `/api/job-titles?department=${encodeURIComponent(department)}`
        : '/api/job-titles';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setJobTitles(data);
      }
    } catch (error) {
      console.error('Error fetching job titles:', error);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const response = await fetch('/api/departments');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  }, []);

  const fetchRoles = useCallback(async () => {
    try {
      const response = await fetch('/api/roles');
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  }, []);

  const fetchManagers = useCallback(async (department?: string) => {
    try {
      const url = department
        ? `/api/managers?department=${encodeURIComponent(department)}`
        : '/api/managers';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setManagers(data.managers || []);
      }
    } catch (error) {
      console.error('Error fetching managers:', error);
    }
  }, []);

  // Load all dynamic data when component mounts
  useEffect(() => {
    if (isOpen) {
      const loadData = async () => {
        setIsLoadingData(true);
        await Promise.all([
          fetchJobTitles(),
          fetchDepartments(),
          fetchRoles(),
          fetchManagers()
        ]);
        setIsLoadingData(false);
      };
      loadData();
    }
  }, [isOpen, fetchJobTitles, fetchDepartments, fetchRoles, fetchManagers]);

  // Update job titles and managers when department changes
  useEffect(() => {
    if (selectedDepartment) {
      fetchJobTitles(selectedDepartment);
      fetchManagers(selectedDepartment);
    }
  }, [selectedDepartment, fetchJobTitles, fetchManagers]);

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
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting || isLoadingData}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={isLoadingData ? "Loading job titles..." : "Select job title"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {jobTitles.map((jobTitle) => (
                              <SelectItem key={`${jobTitle.title}-${jobTitle.department}`} value={jobTitle.title}>
                                <div className="flex flex-col">
                                  <span>{jobTitle.title}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {jobTitle.department} • {jobTitle.level}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {selectedDepartment ? `Showing titles for ${selectedDepartment}` : 'Select a department to filter job titles'}
                        </FormDescription>
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
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedDepartment(value);
                          }}
                          defaultValue={field.value}
                          disabled={isSubmitting || isLoadingData}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={isLoadingData ? "Loading departments..." : "Select department"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.name}>
                                <div className="flex flex-col">
                                  <span>{dept.name}</span>
                                  {dept.description && (
                                    <span className="text-xs text-muted-foreground">
                                      {dept.description}
                                    </span>
                                  )}
                                </div>
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
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting || isLoadingData}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={isLoadingData ? "Loading roles..." : "Select system role"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                <div className="flex flex-col">
                                  <div className="flex items-center">
                                    <Badge variant="outline" className="mr-2">
                                      {role.label}
                                    </Badge>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {role.description}
                                  </span>
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

                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="reportsTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reports To (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting || isLoadingData}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={isLoadingData ? "Loading managers..." : "Select manager/supervisor"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">No direct manager</SelectItem>
                            {managers.map((manager) => (
                              <SelectItem key={manager.id} value={manager.id}>
                                <div className="flex flex-col">
                                  <div className="flex items-center">
                                    <span className="font-medium">{manager.name}</span>
                                    <Badge variant="secondary" className="ml-2 text-xs">
                                      {manager.roleLabel}
                                    </Badge>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {manager.title} • {manager.department}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the direct manager or supervisor for this employee
                        </FormDescription>
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
