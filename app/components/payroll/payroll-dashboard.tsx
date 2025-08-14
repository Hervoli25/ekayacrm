'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  Calendar, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Download,
  Plus,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';

interface PayrollPeriod {
  id: string;
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  processor?: { name: string; email: string };
  approver?: { name: string; email: string };
  payslips: Array<{
    id: string;
    employee: {
      name: string;
      email: string;
    };
    grossPay: number;
    netPay: number;
    status: string;
  }>;
  createdAt: string;
}

interface Payslip {
  id: string;
  employee: {
    name: string;
    email: string;
    employee?: {
      employeeId: string;
      department: string;
      title: string;
    };
  };
  payrollPeriod: {
    startDate: string;
    endDate: string;
    status: string;
  };
  baseSalary: number;
  overtime: number;
  bonuses: number;
  commission: number;
  allowances: number;
  grossPay: number;
  taxDeductions: number;
  otherDeductions: number;
  netPay: number;
  status: string;
  payDate?: string;
  approver?: { name: string; email: string };
}

export default function PayrollDashboard() {
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<PayrollPeriod | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPeriod, setNewPeriod] = useState({
    startDate: '',
    endDate: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPayrollPeriods();
    fetchPayslips();
  }, []);

  const fetchPayrollPeriods = async () => {
    try {
      const response = await fetch('/api/payroll/periods');
      if (!response.ok) throw new Error('Failed to fetch payroll periods');
      const data = await response.json();
      setPayrollPeriods(data);
    } catch (error) {
      console.error('Error fetching payroll periods:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch payroll periods',
        variant: 'destructive',
      });
    }
  };

  const fetchPayslips = async (payrollPeriodId?: string) => {
    try {
      const url = payrollPeriodId 
        ? `/api/payroll/payslips?payrollPeriodId=${payrollPeriodId}`
        : '/api/payroll/payslips';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch payslips');
      const data = await response.json();
      setPayslips(data);
    } catch (error) {
      console.error('Error fetching payslips:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch payslips',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createPayrollPeriod = async () => {
    try {
      const response = await fetch('/api/payroll/periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPeriod),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create payroll period');
      }

      const data = await response.json();
      toast({
        title: 'Success',
        description: `Payroll period created with ${data.payslipsGenerated} payslips`,
      });

      setCreateDialogOpen(false);
      setNewPeriod({ startDate: '', endDate: '' });
      fetchPayrollPeriods();
    } catch (error) {
      console.error('Error creating payroll period:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create payroll period',
        variant: 'destructive',
      });
    }
  };

  const updatePayrollStatus = async (periodId: string, action: string) => {
    try {
      const response = await fetch(`/api/payroll/periods/${periodId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update payroll period');
      }

      toast({
        title: 'Success',
        description: `Payroll period ${action}d successfully`,
      });

      fetchPayrollPeriods();
    } catch (error) {
      console.error('Error updating payroll period:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update payroll period',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      DRAFT: 'secondary',
      PROCESSING: 'default',
      COMPLETED: 'default',
      CANCELLED: 'destructive',
      GENERATED: 'secondary',
      REVIEWED: 'default',
      APPROVED: 'default',
      PAID: 'default'
    } as const;

    const colors = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      GENERATED: 'bg-yellow-100 text-yellow-800',
      REVIEWED: 'bg-blue-100 text-blue-800',
      APPROVED: 'bg-green-100 text-green-800',
      PAID: 'bg-green-100 text-green-800'
    };

    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const totalGrossPay = payrollPeriods.reduce((sum, period) => 
    sum + period.payslips.reduce((periodSum, payslip) => periodSum + payslip.grossPay, 0), 0
  );

  const totalNetPay = payrollPeriods.reduce((sum, period) => 
    sum + period.payslips.reduce((periodSum, payslip) => periodSum + payslip.netPay, 0), 0
  );

  const activeEmployees = new Set(
    payrollPeriods.flatMap(period => period.payslips.map(p => p.employee.email))
  ).size;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg">Loading payroll data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Payroll Management</h2>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Payroll Period
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Payroll Period</DialogTitle>
              <DialogDescription>
                Create a new payroll period and automatically generate payslips for all active employees.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newPeriod.startDate}
                  onChange={(e) => setNewPeriod({ ...newPeriod, startDate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={newPeriod.endDate}
                  onChange={(e) => setNewPeriod({ ...newPeriod, endDate: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={createPayrollPeriod} disabled={!newPeriod.startDate || !newPeriod.endDate}>
                Create Payroll Period
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gross Pay</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{totalGrossPay.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across all periods
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Net Pay</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{totalNetPay.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              After deductions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payroll Periods</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payrollPeriods.length}</div>
            <p className="text-xs text-muted-foreground">
              Total created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEmployees}</div>
            <p className="text-xs text-muted-foreground">
              In payroll system
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Periods Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Periods</CardTitle>
          <CardDescription>Manage payroll periods and their status</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Employees</TableHead>
                <TableHead>Gross Pay</TableHead>
                <TableHead>Net Pay</TableHead>
                <TableHead>Processor</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payrollPeriods.map((period) => (
                <TableRow key={period.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {format(new Date(period.startDate), 'MMM dd')} - {format(new Date(period.endDate), 'MMM dd, yyyy')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Created {format(new Date(period.createdAt), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(period.status)}</TableCell>
                  <TableCell>{period.payslips.length}</TableCell>
                  <TableCell>
                    R{period.payslips.reduce((sum, p) => sum + p.grossPay, 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    R{period.payslips.reduce((sum, p) => sum + p.netPay, 0).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {period.processor?.name || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {period.status === 'DRAFT' && (
                        <Button
                          size="sm"
                          onClick={() => updatePayrollStatus(period.id, 'process')}
                        >
                          Process
                        </Button>
                      )}
                      {period.status === 'PROCESSING' && (
                        <Button
                          size="sm"
                          onClick={() => updatePayrollStatus(period.id, 'approve')}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      )}
                      {period.status !== 'COMPLETED' && period.status !== 'CANCELLED' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => updatePayrollStatus(period.id, 'cancel')}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedPeriod(period);
                          fetchPayslips(period.id);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Individual Payslips */}
      {selectedPeriod && (
        <Card>
          <CardHeader>
            <CardTitle>
              Payslips - {format(new Date(selectedPeriod.startDate), 'MMM dd')} to {format(new Date(selectedPeriod.endDate), 'MMM dd, yyyy')}
            </CardTitle>
            <CardDescription>Individual employee payslips for this period</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Base Salary</TableHead>
                  <TableHead>Overtime</TableHead>
                  <TableHead>Gross Pay</TableHead>
                  <TableHead>Tax</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.map((payslip) => (
                  <TableRow key={payslip.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{payslip.employee.name}</div>
                        <div className="text-sm text-muted-foreground">{payslip.employee.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{payslip.employee.employee?.department || 'N/A'}</TableCell>
                    <TableCell>R{payslip.baseSalary.toLocaleString()}</TableCell>
                    <TableCell>R{payslip.overtime.toLocaleString()}</TableCell>
                    <TableCell>R{payslip.grossPay.toLocaleString()}</TableCell>
                    <TableCell>R{payslip.taxDeductions.toLocaleString()}</TableCell>
                    <TableCell>R{payslip.netPay.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(payslip.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}