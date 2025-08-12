

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Briefcase, Phone, MapPin, Shield, DollarSign, Calendar, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  title: string;
  department: string;
  email: string;
  phone?: string | null;
  address?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  salary?: number;
  hireDate: string;
  status: string;
  terminationDate?: string;
  terminationReason?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    role: string;
    createdAt: string;
  };
}

interface EnhancedEmployeeModalProps {
  employee: Employee | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EnhancedEmployeeModal({ employee, isOpen, onClose }: EnhancedEmployeeModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    title: '',
    department: '',
    email: '',
    phone: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    salary: '',
    hireDate: '',
    status: 'ACTIVE',
    terminationDate: '',
    terminationReason: '',
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        employeeId: employee.employeeId || '',
        name: employee.name || '',
        title: employee.title || '',
        department: employee.department || '',
        email: employee.email || '',
        phone: employee.phone || '',
        address: employee.address || '',
        emergencyContact: employee.emergencyContact || '',
        emergencyPhone: employee.emergencyPhone || '',
        salary: employee.salary?.toString() || '',
        hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : '',
        status: employee.status || 'ACTIVE',
        terminationDate: employee.terminationDate ? new Date(employee.terminationDate).toISOString().split('T')[0] : '',
        terminationReason: employee.terminationReason || '',
      });
    } else {
      // Reset form for new employee
      setFormData({
        employeeId: '',
        name: '',
        title: '',
        department: '',
        email: '',
        phone: '',
        address: '',
        emergencyContact: '',
        emergencyPhone: '',
        salary: '',
        hireDate: new Date().toISOString().split('T')[0],
        status: 'ACTIVE',
        terminationDate: '',
        terminationReason: '',
      });
    }
  }, [employee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = employee 
        ? `/api/employees/${employee.id}` 
        : '/api/employees';
      
      const method = employee ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success(employee ? 'Employee updated successfully' : 'Employee created successfully');
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save employee');
      }
    } catch (error) {
      console.error('Error saving employee:', error);
      toast.error('Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  const departments = [
    'Trading',
    'Risk Management',
    'Finance',
    'Compliance',
    'IT',
    'Human Resources',
    'Operations',
    'Research',
    'Sales',
    'Management',
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-yellow-100 text-yellow-800';
      case 'ON_LEAVE': return 'bg-blue-100 text-blue-800';
      case 'TERMINATED': return 'bg-red-100 text-red-800';
      case 'SUSPENDED': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </DialogTitle>
          <DialogDescription>
            {employee
              ? 'Update employee information across all tabs. All fields marked with * are required.'
              : 'Create a comprehensive employee profile. Fill in all required fields marked with *.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="job">Job Details</TabsTrigger>
              <TabsTrigger value="emergency">Emergency</TabsTrigger>
              <TabsTrigger value="employment">Employment</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="employeeId">Employee ID *</Label>
                      <Input
                        id="employeeId"
                        value={formData.employeeId}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                        placeholder="EI001"
                        required
                        disabled={!!employee}
                      />
                    </div>
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john.doe@ekhayaintel.com"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+27 11 123 4567"
                      />
                    </div>
                    {employee && (
                      <div>
                        <Label>Current Status</Label>
                        <Badge className={getStatusColor(formData.status)} variant="secondary">
                          {formData.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Business Street, Sandton, Johannesburg"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="job" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Briefcase className="mr-2 h-4 w-4" />
                    Job Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Job Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="Senior Trader"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="department">Department *</Label>
                      <Select
                        value={formData.department}
                        onValueChange={(value) => setFormData({ ...formData, department: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>
                              {dept}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="salary">Monthly Salary (ZAR)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="salary"
                          type="number"
                          value={formData.salary}
                          onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                          placeholder="50000"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="hireDate">Hire Date *</Label>
                      <Input
                        id="hireDate"
                        type="date"
                        value={formData.hireDate}
                        onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="emergency" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Phone className="mr-2 h-4 w-4" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                    <Input
                      id="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      placeholder="Jane Doe (Spouse)"
                    />
                  </div>
                  <div>
                    <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                    <Input
                      id="emergencyPhone"
                      value={formData.emergencyPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                      placeholder="+27 82 123 4567"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="employment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="mr-2 h-4 w-4" />
                    Employment Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="status">Employment Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                        <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                        <SelectItem value="TERMINATED">Terminated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.status === 'TERMINATED' && (
                    <>
                      <div>
                        <Label htmlFor="terminationDate">Termination Date</Label>
                        <Input
                          id="terminationDate"
                          type="date"
                          value={formData.terminationDate}
                          onChange={(e) => setFormData({ ...formData, terminationDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="terminationReason">Termination Reason</Label>
                        <Textarea
                          id="terminationReason"
                          value={formData.terminationReason}
                          onChange={(e) => setFormData({ ...formData, terminationReason: e.target.value })}
                          placeholder="Reason for termination..."
                          rows={3}
                        />
                      </div>
                    </>
                  )}

                  {employee && (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <Calendar className="mr-1 h-4 w-4" />
                        Employee since {new Date(employee.hireDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="mr-1 h-4 w-4" />
                        User account created {new Date(employee.user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  {formData.status === 'TERMINATED' && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                      <div className="flex items-center text-red-800 mb-1">
                        <AlertTriangle className="mr-1 h-4 w-4" />
                        <span className="font-medium">Termination Notice</span>
                      </div>
                      <p className="text-red-700 text-sm">
                        Setting the status to terminated will restrict the employee's access to the system.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : employee ? 'Update Employee' : 'Create Employee'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
