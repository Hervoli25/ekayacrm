'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  Plus, 
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Moon,
  Sun,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Download,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useToast } from '@/hooks/use-toast';

interface OvertimeData {
  success: boolean;
  period: {
    startDate?: string;
    endDate?: string;
    month?: string;
    year?: string;
  };
  summary: {
    totalEmployees: number;
    totalRegularHours: number;
    totalOvertimeHours: number;
    totalWeekendHours: number;
  };
  employees: Array<{
    employee: {
      employee: {
        name: string;
        employeeId: string;
        department: string;
        title: string;
      };
    };
    totalRegularHours: number;
    totalOvertimeHours: number;
    totalWeekendHours: number;
    totalHolidayHours: number;
    totalNightShiftHours: number;
    totalHours: number;
    overtimeRate: number;
    weekendRate: number;
    holidayRate: number;
    nightShiftRate: number;
    entries: any[];
  }>;
  rawEntries: any[];
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export function OvertimeDashboard() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [overtimeData, setOvertimeData] = useState<OvertimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  
  // Filters
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    reason: '',
    type: 'overtime_entry'
  });

  useEffect(() => {
    if (session?.user) {
      fetchOvertimeData();
      if (['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'DEPARTMENT_MANAGER'].includes(session.user.role)) {
        fetchEmployees();
      }
    }
  }, [session, selectedEmployee, selectedMonth, selectedYear]);

  const fetchOvertimeData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        month: selectedMonth.toString(),
        year: selectedYear.toString()
      });
      
      if (selectedEmployee) {
        params.append('employeeId', selectedEmployee);
      }

      const response = await fetch(`/api/overtime?${params}`);
      if (!response.ok) throw new Error('Failed to fetch overtime data');
      
      const data = await response.json();
      setOvertimeData(data);
    } catch (error) {
      console.error('Error fetching overtime data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch overtime data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

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

  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/overtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to create overtime entry');

      const result = await response.json();
      toast({
        title: 'Success',
        description: result.message,
        variant: 'default'
      });

      setIsCreateModalOpen(false);
      setFormData({
        employeeId: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
        reason: '',
        type: 'overtime_entry'
      });
      
      fetchOvertimeData();
    } catch (error) {
      console.error('Error creating overtime entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to create overtime entry',
        variant: 'destructive'
      });
    }
  };

  const calculateHours = () => {
    if (!formData.startTime || !formData.endTime) return 0;
    
    const start = new Date(`2000-01-01T${formData.startTime}:00`);
    const end = new Date(`2000-01-01T${formData.endTime}:00`);
    
    if (end < start) {
      // Handle overnight shifts
      end.setDate(end.getDate() + 1);
    }
    
    return Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));
  };

  const formatHours = (hours: number) => {
    return hours.toFixed(1);
  };

  const formatCurrency = (amount: number) => {
    return `R${amount.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading overtime data...
        </div>
      </div>
    );
  }

  if (!overtimeData) {
    return (
      <div className="text-center p-8">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <p className="text-gray-600">Unable to load overtime data</p>
        <Button onClick={fetchOvertimeData} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  // Prepare chart data
  const employeeHoursData = overtimeData.employees.map(emp => ({
    name: emp.employee.employee.name,
    regular: emp.totalRegularHours,
    overtime: emp.totalOvertimeHours,
    weekend: emp.totalWeekendHours,
    holiday: emp.totalHolidayHours,
    nightShift: emp.totalNightShiftHours
  }));

  const pieData = [
    { name: 'Regular Hours', value: overtimeData.summary.totalRegularHours, color: COLORS[0] },
    { name: 'Overtime Hours', value: overtimeData.summary.totalOvertimeHours, color: COLORS[1] },
    { name: 'Weekend Hours', value: overtimeData.summary.totalWeekendHours, color: COLORS[2] }
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Overtime Management</h2>
          <p className="text-gray-600 mt-1">
            Track and manage overtime, weekend, and night shift hours
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Overtime
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Overtime Entry</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateEntry} className="space-y-4">
                {['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'DEPARTMENT_MANAGER'].includes(session?.user?.role || '') && (
                  <div>
                    <Label htmlFor="employee">Employee</Label>
                    <Select 
                      value={formData.employeeId} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, employeeId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee (leave empty for yourself)" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.id} value={employee.userId}>
                            {employee.name} ({employee.employeeId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label>Total Hours: {formatHours(calculateHours())}</Label>
                </div>
                
                <div>
                  <Label htmlFor="type">Entry Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="overtime_entry">Overtime Entry</SelectItem>
                      <SelectItem value="overtime_request">Overtime Request (Requires Approval)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="reason">Reason/Notes</Label>
                  <Textarea
                    id="reason"
                    placeholder="Describe the overtime work..."
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {formData.type === 'overtime_request' ? 'Submit Request' : 'Add Entry'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER', 'DEPARTMENT_MANAGER'].includes(session?.user?.role || '') && (
              <div>
                <Label>Employee</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="All employees" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All employees</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.userId}>
                        {employee.name} ({employee.employeeId})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div>
              <Label>Month</Label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Year</Label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button onClick={fetchOvertimeData} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-blue-600">{overtimeData.summary.totalEmployees}</p>
              </div>
              <Users className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Regular Hours</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatHours(overtimeData.summary.totalRegularHours)}
                </p>
              </div>
              <Sun className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overtime Hours</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatHours(overtimeData.summary.totalOvertimeHours)}
                </p>
              </div>
              <Clock className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Weekend Hours</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatHours(overtimeData.summary.totalWeekendHours)}
                </p>
              </div>
              <Calendar className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="employees">By Employee</TabsTrigger>
          <TabsTrigger value="entries">Time Entries</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hours Distribution Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Hours Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${formatHours(Number(value))} hours`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-300 flex items-center justify-center text-gray-500">
                    No data available for this period
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Employee Hours Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Employee Hours Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                {employeeHoursData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={employeeHoursData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip formatter={(value) => `${formatHours(Number(value))} hours`} />
                      <Bar dataKey="regular" stackId="a" fill="#22c55e" name="Regular" />
                      <Bar dataKey="overtime" stackId="a" fill="#ef4444" name="Overtime" />
                      <Bar dataKey="weekend" stackId="a" fill="#8b5cf6" name="Weekend" />
                      <Bar dataKey="holiday" stackId="a" fill="#f59e0b" name="Holiday" />
                      <Bar dataKey="nightShift" stackId="a" fill="#6b7280" name="Night Shift" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-300 flex items-center justify-center text-gray-500">
                    No employee data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          <div className="grid gap-4">
            {overtimeData.employees.map((emp, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">{emp.employee.employee.name}</h3>
                      <p className="text-sm text-gray-600">
                        {emp.employee.employee.employeeId} • {emp.employee.employee.department}
                      </p>
                      <p className="text-xs text-gray-500">{emp.employee.employee.title}</p>
                    </div>
                    
                    <div className="text-right space-y-1">
                      <p className="text-2xl font-bold">{formatHours(emp.totalHours)} hrs</p>
                      <p className="text-sm text-gray-600">Total Hours</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Regular</p>
                      <p className="font-semibold text-green-600">{formatHours(emp.totalRegularHours)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Overtime</p>
                      <p className="font-semibold text-red-600">{formatHours(emp.totalOvertimeHours)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Weekend</p>
                      <p className="font-semibold text-purple-600">{formatHours(emp.totalWeekendHours)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Holiday</p>
                      <p className="font-semibold text-yellow-600">{formatHours(emp.totalHolidayHours)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Night Shift</p>
                      <p className="font-semibold text-gray-600">{formatHours(emp.totalNightShiftHours)}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">Pay Multipliers:</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">Overtime: {emp.overtimeRate}x</Badge>
                      <Badge variant="outline">Weekend: {emp.weekendRate}x</Badge>
                      <Badge variant="outline">Holiday: {emp.holidayRate}x</Badge>
                      <Badge variant="outline">Night: {emp.nightShiftRate}x</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {overtimeData.employees.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No overtime data found for this period</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="entries" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Time Entries</CardTitle>
              <CardDescription>
                Detailed view of all time entries for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overtimeData.rawEntries.map((entry, index) => (
                  <div key={entry.id || index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h4 className="font-medium">
                          {entry.employee.employee?.name || 'Unknown Employee'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {new Date(entry.clockIn).toLocaleDateString()} • {' '}
                          {new Date(entry.clockIn).toLocaleTimeString()} - {' '}
                          {new Date(entry.clockOut).toLocaleTimeString()}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {entry.overtime?.isWeekend && (
                            <Badge variant="outline" className="text-purple-600">Weekend</Badge>
                          )}
                          {entry.overtime?.isHoliday && (
                            <Badge variant="outline" className="text-yellow-600">Holiday</Badge>
                          )}
                          {entry.overtime?.isNightShift && (
                            <Badge variant="outline" className="text-gray-600">
                              <Moon className="h-3 w-3 mr-1" />
                              Night Shift
                            </Badge>
                          )}
                        </div>
                        {entry.notes && (
                          <p className="text-xs text-gray-500">{entry.notes}</p>
                        )}
                      </div>
                      
                      <div className="text-right space-y-1">
                        <p className="text-lg font-semibold">
                          {formatHours(entry.totalHours || 0)} hrs
                        </p>
                        <div className="text-xs text-gray-600 space-y-1">
                          {entry.overtime?.regularHours > 0 && (
                            <p>Regular: {formatHours(entry.overtime.regularHours)}</p>
                          )}
                          {entry.overtime?.overtimeHours > 0 && (
                            <p className="text-red-600">OT: {formatHours(entry.overtime.overtimeHours)}</p>
                          )}
                          {entry.overtime?.weekendHours > 0 && (
                            <p className="text-purple-600">Weekend: {formatHours(entry.overtime.weekendHours)}</p>
                          )}
                          {entry.overtime?.holidayHours > 0 && (
                            <p className="text-yellow-600">Holiday: {formatHours(entry.overtime.holidayHours)}</p>
                          )}
                          {entry.overtime?.nightShiftHours > 0 && (
                            <p className="text-gray-600">Night: {formatHours(entry.overtime.nightShiftHours)}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {overtimeData.rawEntries.length === 0 && (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No time entries found for this period</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}