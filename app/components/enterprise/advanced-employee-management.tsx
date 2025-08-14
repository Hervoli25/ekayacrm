'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { showSuccess, showError, showDeleteConfirmation } from '@/lib/sweetalert';
import {
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  Eye,
  Shield,
  DollarSign,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Crown,
  Building,
  Users,
  Star
} from 'lucide-react';
import { Role, EmployeeStatus } from '@prisma/client';
import { hasPermission } from '@/lib/enterprise-permissions';

interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  title: string;
  department: string;
  role: Role;
  status: EmployeeStatus;
  salary?: number;
  hireDate: string;
  phone?: string;
  clearanceLevel?: string;
  reportsTo?: string;
  lastLogin?: string;
  performanceScore?: number;
  pendingLeave?: number;
}

interface AdvancedEmployeeManagementProps {
  userRole: Role;
  userDepartment?: string;
}

export function AdvancedEmployeeManagement({ userRole, userDepartment }: AdvancedEmployeeManagementProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    name: '',
    email: '',
    title: '',
    department: '',
    role: '',
    phone: '',
    salary: '',
    hireDate: '',
    reportsTo: '',
    securityClearance: 'NONE'
  });
  const [isCreatingEmployee, setIsCreatingEmployee] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<any>(null);

  // Dynamic data state
  const [jobTitles, setJobTitles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [isLoadingFormData, setIsLoadingFormData] = useState(false);


  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        // Build query parameters based on role
        const params = new URLSearchParams();
        if (userDepartment && userRole !== 'SUPER_ADMIN' && userRole !== 'DIRECTOR' && userRole !== 'HR_MANAGER') {
          params.append('department', userDepartment);
        }

        const response = await fetch(`/api/employees?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch employees');
        }

        const data = await response.json();
        setEmployees(data.employees || []);
        setFilteredEmployees(data.employees || []);
      } catch (error) {
        console.error('Error fetching employees:', error);
        // Set empty array on error
        setEmployees([]);
        setFilteredEmployees([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [userRole, userDepartment]);

  // Fetch dynamic form data
  useEffect(() => {
    const fetchFormData = async () => {
      if (showCreateDialog) {
        setIsLoadingFormData(true);
        try {
          const [jobTitlesRes, departmentsRes, rolesRes, managersRes] = await Promise.all([
            fetch('/api/job-titles'),
            fetch('/api/departments'),
            fetch('/api/roles'),
            fetch('/api/managers')
          ]);

          if (jobTitlesRes.ok) {
            const jobTitlesData = await jobTitlesRes.json();
            setJobTitles(jobTitlesData);
          }

          if (departmentsRes.ok) {
            const departmentsData = await departmentsRes.json();
            setDepartments(departmentsData);
          }

          if (rolesRes.ok) {
            const rolesData = await rolesRes.json();
            setRoles(rolesData.roles || []);
          }

          if (managersRes.ok) {
            const managersData = await managersRes.json();
            setManagers(managersData.managers || []);
          }
        } catch (error) {
          console.error('Error fetching form data:', error);
        } finally {
          setIsLoadingFormData(false);
        }
      }
    };

    fetchFormData();
  }, [showCreateDialog]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeForm.name || !employeeForm.email || !employeeForm.title || !employeeForm.department || !employeeForm.role) {
      await showError('Validation Error', 'Please fill in all required fields');
      return;
    }

    setIsCreatingEmployee(true);
    try {
      const response = await fetch('/api/admin/create-employee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(employeeForm),
      });

      const result = await response.json();

      if (response.ok) {
        setCreateSuccess(result.employee);
        setEmployeeForm({
          name: '',
          email: '',
          title: '',
          department: '',
          role: '',
          phone: '',
          salary: '',
          hireDate: '',
          reportsTo: '',
          securityClearance: 'NONE'
        });
        setShowCreateDialog(false);
        
        // Show success message with credentials
        await showSuccess(
          'Employee Created Successfully!',
          `Login Credentials:\nName: ${result.employee.name}\nEmail: ${result.employee.email}\nEmployee ID: ${result.employee.employeeId}\nTemporary Password: ${result.employee.tempPassword}\nRole: ${result.employee.role}\n\nPlease share these credentials securely with the new employee.`
        );

        // Refresh employee list
        const updatedEmployees = await fetch('/api/employees');
        const updatedData = await updatedEmployees.json();
        setEmployees(updatedData.employees || []);
        setFilteredEmployees(updatedData.employees || []);
      } else {
        await showError('Creation Failed', result.error || 'Failed to create employee');
      }
    } catch (error) {
      console.error('Error creating employee:', error);
      await showError('Connection Error', 'Failed to create employee. Please check your connection and try again.');
    } finally {
      setIsCreatingEmployee(false);
    }
  };

  const resetEmployeeForm = () => {
    setEmployeeForm({
      name: '',
      email: '',
      title: '',
      department: '',
      role: '',
      phone: '',
      salary: '',
      hireDate: '',
      reportsTo: '',
      securityClearance: 'NONE'
    });
  };

  useEffect(() => {
    let filtered = employees;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(emp => emp.department === departmentFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(emp => emp.status === statusFilter);
    }

    setFilteredEmployees(filtered);
  }, [employees, searchTerm, departmentFilter, statusFilter]);

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'DIRECTOR': return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'HR_MANAGER': return <Shield className="h-4 w-4 text-blue-500" />;
      case 'DEPARTMENT_MANAGER': return <Building className="h-4 w-4 text-green-500" />;
      case 'SUPERVISOR': return <Users className="h-4 w-4 text-purple-500" />;
      case 'SENIOR_EMPLOYEE': return <Star className="h-4 w-4 text-indigo-500" />;
      default: return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case 'DIRECTOR': return 'bg-yellow-100 text-yellow-800';
      case 'HR_MANAGER': return 'bg-blue-100 text-blue-800';
      case 'DEPARTMENT_MANAGER': return 'bg-green-100 text-green-800';
      case 'SUPERVISOR': return 'bg-purple-100 text-purple-800';
      case 'SENIOR_EMPLOYEE': return 'bg-indigo-100 text-indigo-800';
      case 'EMPLOYEE': return 'bg-gray-100 text-gray-800';
      case 'INTERN': return 'bg-orange-100 text-orange-800';
    }
  };

  const getStatusBadgeColor = (status: EmployeeStatus) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'ON_LEAVE': return 'bg-blue-100 text-blue-800';
      case 'TERMINATED': return 'bg-red-100 text-red-800';
      case 'SUSPENDED': return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getClearanceColor = (level?: string) => {
    switch (level) {
      case 'TOP_SECRET': return 'bg-red-100 text-red-800';
      case 'SECRET': return 'bg-orange-100 text-orange-800';
      case 'CONFIDENTIAL': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canViewSalary = hasPermission(userRole, 'EMPLOYEE_VIEW_SALARY');
  const canEditEmployee = hasPermission(userRole, 'EMPLOYEE_UPDATE');
  const canCreateEmployee = hasPermission(userRole, 'EMPLOYEE_CREATE');
  const canDeleteEmployee = hasPermission(userRole, 'EMPLOYEE_DELETE');

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
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
          <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
          <p className="text-gray-600">
            {userRole === 'DIRECTOR' && 'Full access to all employees across all departments'}
            {userRole === 'HR_MANAGER' && 'Manage all employee records and HR operations'}
            {userRole === 'DEPARTMENT_MANAGER' && `Manage employees in ${userDepartment} department`}
            {userRole === 'SUPERVISOR' && 'Manage your direct reports'}
            {(userRole === 'EMPLOYEE' || userRole === 'SENIOR_EMPLOYEE' || userRole === 'INTERN') && 'View colleague information'}
          </p>
        </div>
        {(canCreateEmployee || userRole === 'SUPER_ADMIN') && (
          <Button onClick={() => {
            resetEmployeeForm();
            setShowCreateDialog(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="Executive">Executive</SelectItem>
                <SelectItem value="Human Resources">Human Resources</SelectItem>
                <SelectItem value="Trading">Trading</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="IT">IT</SelectItem>
                <SelectItem value="Operations">Operations</SelectItem>
                <SelectItem value="Risk Management">Risk Management</SelectItem>
                <SelectItem value="Compliance">Compliance</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="TERMINATED">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Employee Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                {canViewSalary && <TableHead>Salary</TableHead>}
                <TableHead>Performance</TableHead>
                <TableHead>Clearance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                        {employee.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.email}</div>
                        <div className="text-xs text-gray-400">ID: {employee.employeeId}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getRoleIcon(employee.role)}
                      <Badge className={getRoleBadgeColor(employee.role)}>
                        {employee.role.replace('_', ' ')}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{employee.department}</div>
                      <div className="text-gray-500">{employee.title}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(employee.status)}>
                      {employee.status}
                    </Badge>
                  </TableCell>
                  {canViewSalary && (
                    <TableCell>
                      {employee.salary ? (
                        <div className="font-medium">R{employee.salary.toLocaleString()}</div>
                      ) : (
                        <span className="text-gray-400">Restricted</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        (employee.performanceScore || 0) >= 4.5 ? 'bg-green-500' :
                        (employee.performanceScore || 0) >= 4.0 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-sm">{employee.performanceScore?.toFixed(1) || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {employee.clearanceLevel && employee.clearanceLevel !== 'NONE' ? (
                      <Badge className={getClearanceColor(employee.clearanceLevel)}>
                        {employee.clearanceLevel}
                      </Badge>
                    ) : (
                      <span className="text-gray-400 text-sm">None</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedEmployee(employee)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canEditEmployee && (
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDeleteEmployee && (
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold text-lg">
                  {selectedEmployee.name.charAt(0)}
                </div>
                <div>
                  <div className="text-xl font-bold">{selectedEmployee.name}</div>
                  <div className="text-sm text-gray-500">{selectedEmployee.title}</div>
                </div>
              </DialogTitle>
              <DialogDescription>
                Detailed employee information and performance metrics
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="leave">Leave</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Employee ID:</span>
                        <span className="font-medium">{selectedEmployee.employeeId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{selectedEmployee.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{selectedEmployee.phone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hire Date:</span>
                        <span className="font-medium">{new Date(selectedEmployee.hireDate).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Role & Department</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Role:</span>
                        <div className="flex items-center space-x-2">
                          {getRoleIcon(selectedEmployee.role)}
                          <Badge className={getRoleBadgeColor(selectedEmployee.role)}>
                            {selectedEmployee.role.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Department:</span>
                        <span className="font-medium">{selectedEmployee.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reports To:</span>
                        <span className="font-medium">{selectedEmployee.reportsTo || 'N/A'}</span>
                      </div>
                      {canViewSalary && selectedEmployee.salary && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Salary:</span>
                          <span className="font-medium">R{selectedEmployee.salary.toLocaleString()}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Performance Score</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {selectedEmployee.performanceScore?.toFixed(1) || 'N/A'}
                          </p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Goals Completed</p>
                          <p className="text-2xl font-bold text-green-600">8/10</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Training Hours</p>
                          <p className="text-2xl font-bold text-purple-600">24</p>
                        </div>
                        <Clock className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="leave" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Pending Requests</p>
                          <p className="text-2xl font-bold text-yellow-600">{selectedEmployee.pendingLeave || 0}</p>
                        </div>
                        <Clock className="h-8 w-8 text-yellow-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Days Used</p>
                          <p className="text-2xl font-bold text-blue-600">12</p>
                        </div>
                        <Calendar className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Days Remaining</p>
                          <p className="text-2xl font-bold text-green-600">18</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Security Clearance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <span>Clearance Level:</span>
                        {selectedEmployee.clearanceLevel && selectedEmployee.clearanceLevel !== 'NONE' ? (
                          <Badge className={getClearanceColor(selectedEmployee.clearanceLevel)}>
                            {selectedEmployee.clearanceLevel}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Access Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Login:</span>
                        <span className="font-medium">{selectedEmployee.lastLogin || 'Never'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Account Status:</span>
                        <Badge className="bg-green-100 text-green-800">Active</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Failed Attempts:</span>
                        <span className="font-medium">0</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Employee Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-3">
              <Plus className="h-6 w-6 text-blue-600" />
              <span>Add New Employee</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateEmployee} className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Information */}
              <div className="space-y-2">
                <Label htmlFor="emp-name">Full Name *</Label>
                <Input
                  id="emp-name"
                  placeholder="Enter employee's full name"
                  value={employeeForm.name}
                  onChange={(e) => setEmployeeForm({...employeeForm, name: e.target.value})}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emp-email">Email *</Label>
                <Input
                  id="emp-email"
                  type="email"
                  placeholder="employee@company.com"
                  value={employeeForm.email}
                  onChange={(e) => setEmployeeForm({...employeeForm, email: e.target.value})}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emp-title">Job Title *</Label>
                <Select
                  value={employeeForm.title}
                  onValueChange={(value) => setEmployeeForm({...employeeForm, title: value})}
                  disabled={isLoadingFormData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingFormData ? "Loading job titles..." : "Select job title"} />
                  </SelectTrigger>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="emp-phone">Phone Number</Label>
                <Input
                  id="emp-phone"
                  placeholder="+27 XX XXX XXXX"
                  value={employeeForm.phone}
                  onChange={(e) => setEmployeeForm({...employeeForm, phone: e.target.value})}
                />
              </div>

              {/* Role and Department */}
              <div className="space-y-2">
                <Label htmlFor="emp-role">Role *</Label>
                <Select
                  value={employeeForm.role}
                  onValueChange={(value) => setEmployeeForm({...employeeForm, role: value})}
                  disabled={isLoadingFormData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingFormData ? "Loading roles..." : "Select employee role"} />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex flex-col">
                          <span>{role.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {role.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="emp-department">Department *</Label>
                <Select
                  value={employeeForm.department}
                  onValueChange={(value) => setEmployeeForm({...employeeForm, department: value})}
                  disabled={isLoadingFormData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingFormData ? "Loading departments..." : "Select department"} />
                  </SelectTrigger>
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
              </div>

              {/* Financial Information */}
              {canViewSalary && (
                <div className="space-y-2">
                  <Label htmlFor="emp-salary">Annual Salary (Optional)</Label>
                  <Input
                    id="emp-salary"
                    type="number"
                    placeholder="e.g., 350000"
                    value={employeeForm.salary}
                    onChange={(e) => setEmployeeForm({...employeeForm, salary: e.target.value})}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="emp-hire-date">Hire Date</Label>
                <Input
                  id="emp-hire-date"
                  type="date"
                  value={employeeForm.hireDate}
                  onChange={(e) => setEmployeeForm({...employeeForm, hireDate: e.target.value})}
                />
              </div>

              {/* Reporting Structure */}
              <div className="space-y-2">
                <Label htmlFor="emp-reports-to">Reports To</Label>
                <Select
                  value={employeeForm.reportsTo}
                  onValueChange={(value) => setEmployeeForm({...employeeForm, reportsTo: value})}
                  disabled={isLoadingFormData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingFormData ? "Loading managers..." : "Select manager/supervisor"} />
                  </SelectTrigger>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="emp-clearance">Security Clearance</Label>
                <Select value={employeeForm.securityClearance} onValueChange={(value) => setEmployeeForm({...employeeForm, securityClearance: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select clearance level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">None</SelectItem>
                    <SelectItem value="CONFIDENTIAL">Confidential</SelectItem>
                    <SelectItem value="SECRET">Secret</SelectItem>
                    <SelectItem value="TOP_SECRET">Top Secret</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  resetEmployeeForm();
                  setShowCreateDialog(false);
                }}
                disabled={isCreatingEmployee}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isCreatingEmployee}
              >
                {isCreatingEmployee ? 'Creating Employee...' : 'Create Employee'}
              </Button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <div className="flex items-start space-x-3">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-900">Security Note</p>
                  <p className="text-blue-700 mt-1">
                    A temporary password will be automatically generated for the new employee. 
                    Please share the login credentials securely with them.
                  </p>
                </div>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-900">{filteredEmployees.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Employees</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredEmployees.filter(e => e.status === 'ACTIVE').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">On Leave</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredEmployees.filter(e => e.pendingLeave && e.pendingLeave > 0).length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Performance</p>
                <p className="text-2xl font-bold text-purple-600">
                  {(filteredEmployees.reduce((acc, e) => acc + (e.performanceScore || 0), 0) / filteredEmployees.length).toFixed(1)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}