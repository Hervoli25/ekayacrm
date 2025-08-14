'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Users, 
  DollarSign, 
  TrendingUp,
  MapPin,
  UserCheck,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  budget?: number;
  location?: string;
  isActive: boolean;
  managers: Array<{
    manager: { id: string; name: string; email: string; role: string };
    assignedAt: string;
  }>;
  employees: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    employee?: {
      employeeId: string;
      title: string;
      salary: number;
    };
  }>;
  metrics: {
    totalSalary: number;
    avgSalary: number;
    roleDistribution: Record<string, number>;
    budgetUtilization: number;
  };
  _count: { employees: number };
}

interface DepartmentDetail extends Department {
  analytics: {
    totalEmployees: number;
    totalSalaryBudget: number;
    avgSalary: number;
    budgetUtilization: number;
    roleDistribution: Record<string, number>;
    avgHoursWorked: number;
    totalLeavesTaken: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    code: '',
    description: '',
    budget: '',
    location: '',
    managerId: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments');
      if (!response.ok) throw new Error('Failed to fetch departments');
      const data = await response.json();
      setDepartments(data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch departments',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartmentDetails = async (departmentId: string) => {
    try {
      const response = await fetch(`/api/departments/${departmentId}`);
      if (!response.ok) throw new Error('Failed to fetch department details');
      const data = await response.json();
      setSelectedDepartment(data);
    } catch (error) {
      console.error('Error fetching department details:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch department details',
        variant: 'destructive',
      });
    }
  };

  const createDepartment = async () => {
    try {
      const response = await fetch('/api/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newDepartment,
          budget: newDepartment.budget ? Number(newDepartment.budget) : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create department');
      }

      toast({
        title: 'Success',
        description: 'Department created successfully',
      });

      setCreateDialogOpen(false);
      setNewDepartment({
        name: '',
        code: '',
        description: '',
        budget: '',
        location: '',
        managerId: ''
      });
      fetchDepartments();
    } catch (error) {
      console.error('Error creating department:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create department',
        variant: 'destructive',
      });
    }
  };

  const updateDepartment = async () => {
    if (!editingDepartment) return;

    try {
      const response = await fetch(`/api/departments/${editingDepartment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingDepartment.name,
          code: editingDepartment.code,
          description: editingDepartment.description,
          budget: editingDepartment.budget ? Number(editingDepartment.budget) : undefined,
          location: editingDepartment.location,
          isActive: editingDepartment.isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update department');
      }

      toast({
        title: 'Success',
        description: 'Department updated successfully',
      });

      setEditDialogOpen(false);
      setEditingDepartment(null);
      fetchDepartments();
    } catch (error) {
      console.error('Error updating department:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update department',
        variant: 'destructive',
      });
    }
  };

  const deleteDepartment = async (departmentId: string) => {
    if (!confirm('Are you sure you want to delete this department? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/departments/${departmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete department');
      }

      toast({
        title: 'Success',
        description: 'Department deleted successfully',
      });

      fetchDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete department',
        variant: 'destructive',
      });
    }
  };

  const totalEmployees = departments.reduce((sum, dept) => sum + dept._count.employees, 0);
  const totalBudget = departments.reduce((sum, dept) => sum + (dept.budget || 0), 0);
  const activeDepartments = departments.filter(dept => dept.isActive).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg">Loading departments...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Department Management</h2>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Department
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
              <DialogDescription>
                Add a new department to your organization structure.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Department Name</Label>
                <Input
                  id="name"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                  placeholder="e.g., Human Resources"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">Department Code</Label>
                <Input
                  id="code"
                  value={newDepartment.code}
                  onChange={(e) => setNewDepartment({ ...newDepartment, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., HR"
                  maxLength={10}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                  placeholder="Brief description of the department"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="budget">Annual Budget (R)</Label>
                <Input
                  id="budget"
                  type="number"
                  value={newDepartment.budget}
                  onChange={(e) => setNewDepartment({ ...newDepartment, budget: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newDepartment.location}
                  onChange={(e) => setNewDepartment({ ...newDepartment, location: e.target.value })}
                  placeholder="e.g., Main Building, Floor 2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createDepartment} disabled={!newDepartment.name || !newDepartment.code}>
                Create Department
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDepartments}</div>
            <p className="text-xs text-muted-foreground">
              {departments.length - activeDepartments} inactive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEmployees}</div>
            <p className="text-xs text-muted-foreground">
              Across all departments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{totalBudget.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Annual budget allocation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Department Size</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeDepartments > 0 ? Math.round(totalEmployees / activeDepartments) : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Employees per department
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Department Overview Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Employee Distribution</CardTitle>
            <CardDescription>Employees per department</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departments.filter(d => d.isActive)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="code" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="_count.employees" fill="#8884d8" name="Employees" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Allocation</CardTitle>
            <CardDescription>Budget distribution across departments</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departments.filter(d => d.budget && d.budget > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="budget"
                  nameKey="code"
                >
                  {departments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`R${Number(value).toLocaleString()}`, 'Budget']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Departments Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Departments</CardTitle>
          <CardDescription>Manage your organization's department structure</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Utilization</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{dept.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <span className="font-mono">{dept.code}</span>
                        {dept.location && (
                          <>
                            <span className="mx-2">•</span>
                            <MapPin className="h-3 w-3 mr-1" />
                            {dept.location}
                          </>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {dept.managers.length > 0 ? (
                      <div>
                        <div className="font-medium">{dept.managers[0].manager.name}</div>
                        <div className="text-sm text-muted-foreground">{dept.managers[0].manager.email}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No manager assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      {dept._count.employees}
                    </div>
                  </TableCell>
                  <TableCell>
                    {dept.budget ? `R${dept.budget.toLocaleString()}` : 'Not set'}
                  </TableCell>
                  <TableCell>
                    {dept.budget && dept.budget > 0 ? (
                      <div className="space-y-1">
                        <Progress value={Math.min(dept.metrics.budgetUtilization, 100)} />
                        <div className="text-sm text-muted-foreground">
                          {dept.metrics.budgetUtilization.toFixed(1)}%
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={dept.isActive ? 'default' : 'secondary'}>
                      {dept.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchDepartmentDetails(dept.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingDepartment(dept);
                          setEditDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteDepartment(dept.id)}
                        disabled={dept._count.employees > 0}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Department Details Modal */}
      {selectedDepartment && (
        <Dialog open={!!selectedDepartment} onOpenChange={() => setSelectedDepartment(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedDepartment.name} Department Details</DialogTitle>
              <DialogDescription>
                Comprehensive overview of department metrics and employees
              </DialogDescription>
            </DialogHeader>
            
            {/* Department Analytics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Employees</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{selectedDepartment.analytics.totalEmployees}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Avg Salary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">R{selectedDepartment.analytics.avgSalary.toLocaleString()}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Avg Hours/Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{selectedDepartment.analytics.avgHoursWorked.toFixed(0)}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Leaves</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold">{selectedDepartment.analytics.totalLeavesTaken}</div>
                </CardContent>
              </Card>
            </div>

            {/* Employee List */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">Department Employees</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Salary</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedDepartment.employees.map((employee) => (
                    <TableRow key={employee.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-sm text-muted-foreground">{employee.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>{employee.employee?.title || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{employee.role.replace('_', ' ')}</Badge>
                      </TableCell>
                      <TableCell>
                        R{employee.employee?.salary ? Number(employee.employee.salary).toLocaleString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Department Dialog */}
      {editingDepartment && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Department</DialogTitle>
              <DialogDescription>
                Update department information and settings.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Department Name</Label>
                <Input
                  id="edit-name"
                  value={editingDepartment.name}
                  onChange={(e) => setEditingDepartment({ ...editingDepartment, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-code">Department Code</Label>
                <Input
                  id="edit-code"
                  value={editingDepartment.code}
                  onChange={(e) => setEditingDepartment({ ...editingDepartment, code: e.target.value.toUpperCase() })}
                  maxLength={10}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editingDepartment.description || ''}
                  onChange={(e) => setEditingDepartment({ ...editingDepartment, description: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-budget">Annual Budget (R)</Label>
                <Input
                  id="edit-budget"
                  type="number"
                  value={editingDepartment.budget || ''}
                  onChange={(e) => setEditingDepartment({ ...editingDepartment, budget: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input
                  id="edit-location"
                  value={editingDepartment.location || ''}
                  onChange={(e) => setEditingDepartment({ ...editingDepartment, location: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-active">Status</Label>
                <Select 
                  value={editingDepartment.isActive.toString()}
                  onValueChange={(value) => setEditingDepartment({ ...editingDepartment, isActive: value === 'true' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={updateDepartment}>Update Department</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}