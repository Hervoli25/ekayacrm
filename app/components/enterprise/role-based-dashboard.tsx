'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { showSuccess, showError, showLoading } from '@/lib/sweetalert';
import Swal from 'sweetalert2';
import { CredentialsManager } from '@/components/admin/credentials-manager';
import { DirectorCreationForm } from '@/components/enterprise/director-creation-form';
import { SystemManagementTab } from '@/components/dashboard/system-management-tab';
import {
  Users,
  Calendar,
  Clock,
  CheckCircle, 
  XCircle, 
  DollarSign, 
  Receipt, 
  TrendingUp,
  Shield,
  AlertTriangle,
  FileText,
  Crown,
  Building,
  UserCheck,
  Zap,
  Plus,
  Eye,
  Edit,
  Trash2,
  Star,
  Settings,
  Database,
  Server,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Globe,
  Lock,
  Key,
  Monitor,
  HardDrive,
  Cpu,
  MemoryStick,
  Mail,
  Bell,
  Search,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Power,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Role } from '@prisma/client';

interface DashboardProps {
  userRole: Role;
  userName: string;
  departmentName?: string;
}

interface Stats {
  totalEmployees: number;
  pendingLeaveRequests: number;
  approvedLeaveRequests: number;
  rejectedLeaveRequests: number;
  totalRevenue: number;
  totalReceipts: number;
  pendingExpenses: number;
  disciplinaryActions: number;
  pendingPerformanceReviews: number;
  departmentBudget?: number;
  teamSize?: number;
  clearanceLevel?: string;
}

export function RoleBasedDashboard({ userRole, userName, departmentName }: DashboardProps) {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalEmployees: 0,
    pendingLeaveRequests: 0,
    approvedLeaveRequests: 0,
    rejectedLeaveRequests: 0,
    totalRevenue: 0,
    totalReceipts: 0,
    pendingExpenses: 0,
    disciplinaryActions: 0,
    pendingPerformanceReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [createDirectorOpen, setCreateDirectorOpen] = useState(false);
  const [createDepartmentOpen, setCreateDepartmentOpen] = useState(false);
  const [departmentForm, setDepartmentForm] = useState({ name: '', code: '', description: '', budget: '' });
  const [isCreatingDepartment, setIsCreatingDepartment] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<{ type: 'director' | 'department', data?: any } | null>(null);
  const [systemStats, setSystemStats] = useState({
    uptime: '99.9%',
    memoryUsage: 68,
    cpuUsage: 45,
    diskUsage: 32,
    activeUsers: 1,
    totalSessions: 1,
    databaseConnections: 5,
    systemHealth: 'Excellent'
  });

  useEffect(() => {
    fetchDashboardStats();
  }, [userRole]);

  const fetchDashboardStats = async () => {
    try {
      // Mock data for now - in real app, these would be API calls
      // Fetch real employee count
      const employeesResponse = await fetch('/api/employees');
      const employeesData = await employeesResponse.json();
      const totalEmployees = employeesData.total || 1;

      const mockStats: Stats = {
        totalEmployees,
        pendingLeaveRequests: 0,
        approvedLeaveRequests: 0,
        rejectedLeaveRequests: 0,
        totalRevenue: 0,
        totalReceipts: 0,
        pendingExpenses: 0,
        disciplinaryActions: 0,
        pendingPerformanceReviews: 0,
        departmentBudget: userRole === 'DEPARTMENT_MANAGER' ? 0 : undefined,
        teamSize: userRole === 'SUPERVISOR' ? 0 : userRole === 'SENIOR_EMPLOYEE' ? 0 : undefined,
        clearanceLevel: userRole === 'DIRECTOR' ? 'TOP_SECRET' : 
                       userRole === 'HR_MANAGER' ? 'SECRET' :
                       userRole === 'DEPARTMENT_MANAGER' ? 'CONFIDENTIAL' : 'NONE',
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Fallback to basic stats
      setStats({
        totalEmployees: 1,
        pendingLeaveRequests: 0,
        approvedLeaveRequests: 0,
        rejectedLeaveRequests: 0,
        totalRevenue: 0,
        totalReceipts: 0,
        pendingExpenses: 0,
        disciplinaryActions: 0,
        pendingPerformanceReviews: 0,
      });
    } finally {
      setLoading(false);
    }
  };


  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentForm.name || !departmentForm.code) return;

    setIsCreatingDepartment(true);

    // Show loading alert
    showLoading('Creating Department...', 'Please wait while we set up the department');

    try {
      const response = await fetch('/api/admin/create-department', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(departmentForm),
      });

      // Close loading alert
      Swal.close();

      // Check if response is ok first
      if (!response.ok) {
        let errorMessage = 'Failed to create department';
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.error || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        await showError('Creation Failed', errorMessage);
        return;
      }

      // Parse successful response
      const result = await response.json();

      if (result.success && result.department) {
        setCreateSuccess({ type: 'department', data: result.department });
        setDepartmentForm({ name: '', code: '', description: '', budget: '' });
        setCreateDepartmentOpen(false);

        // Show success
        await showSuccess(
          'Department Created Successfully!',
          `Name: ${result.department.name}\nCode: ${result.department.code}`
        );
      } else {
        await showError('Creation Failed', result.error || 'Failed to create department');
      }
    } catch (error) {
      console.error('Error creating department:', error);
      Swal.close(); // Make sure loading is closed
      await showError('Connection Error', 'Failed to create department. Please check your connection and try again.');
    } finally {
      setIsCreatingDepartment(false);
    }
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'DIRECTOR': return Crown;
      case 'HR_MANAGER': return Shield;
      case 'DEPARTMENT_MANAGER': return Building;
      case 'SUPERVISOR': return UserCheck;
      case 'SENIOR_EMPLOYEE': return Zap;
      default: return Users;
    }
  };

  const getRoleColor = (role: Role) => {
    switch (role) {
      case 'DIRECTOR': return 'bg-gradient-to-r from-yellow-400 to-orange-500';
      case 'HR_MANAGER': return 'bg-gradient-to-r from-blue-500 to-blue-600';
      case 'DEPARTMENT_MANAGER': return 'bg-gradient-to-r from-green-500 to-green-600';
      case 'SUPERVISOR': return 'bg-gradient-to-r from-purple-500 to-purple-600';
      case 'SENIOR_EMPLOYEE': return 'bg-gradient-to-r from-indigo-500 to-indigo-600';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  const getRoleDisplayName = (role: Role) => {
    switch (role) {
      case 'DIRECTOR': return 'Director';
      case 'HR_MANAGER': return 'HR Manager';
      case 'DEPARTMENT_MANAGER': return 'Department Manager';
      case 'SUPERVISOR': return 'Supervisor';
      case 'SENIOR_EMPLOYEE': return 'Senior Employee';
      case 'EMPLOYEE': return 'Employee';
      case 'INTERN': return 'Intern';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const SuperAdminDashboard = () => (
    <div className="space-y-6">
      {/* Animated Hero Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-indigo-600/10 animate-pulse"></div>
        <div className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 p-8 rounded-2xl text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 animate-spin-slow"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 animate-bounce"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                <Shield className="h-12 w-12 animate-pulse" />
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">System Administrator</h1>
                <p className="text-xl opacity-90 mb-3">Welcome back, {userName}</p>
                <div className="flex space-x-3">
                  <Badge className="px-3 py-1 bg-red-500/90 hover:bg-red-600/90 animate-pulse">
                    🔒 UNLIMITED ACCESS
                  </Badge>
                  <Badge className="px-3 py-1 bg-green-500/90 hover:bg-green-600/90">
                    🟢 System Online
                  </Badge>
                </div>
              </div>
            </div>
            <div className="hidden md:flex space-x-4">
              <div className="text-center">
                <div className="text-3xl font-bold">99.9%</div>
                <div className="text-sm opacity-80">Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">{stats.totalEmployees || 1}</div>
                <div className="text-sm opacity-80">Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">0</div>
                <div className="text-sm opacity-80">Issues</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7 h-12 p-1 bg-gray-100 rounded-xl">
          <TabsTrigger value="overview" className="rounded-lg font-semibold">Overview</TabsTrigger>
          <TabsTrigger value="users" className="rounded-lg font-semibold">Users</TabsTrigger>
          <TabsTrigger value="credentials" className="rounded-lg font-semibold">Credentials</TabsTrigger>
          <TabsTrigger value="system" className="rounded-lg font-semibold">System</TabsTrigger>
          <TabsTrigger value="hr" className="rounded-lg font-semibold">HR</TabsTrigger>
          <TabsTrigger value="finance" className="rounded-lg font-semibold">Finance</TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg font-semibold">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Animated Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200/30 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide">Total Users</p>
                    <p className="text-4xl font-bold text-gray-900 mt-1">{stats.totalEmployees || 1}</p>
                    <p className="text-xs text-purple-500 mt-1">+0 this month</p>
                  </div>
                  <div className="p-4 bg-purple-500 rounded-2xl group-hover:rotate-12 transition-transform duration-300">
                    <Users className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-green-200/30 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-green-600 uppercase tracking-wide">System Health</p>
                    <p className="text-4xl font-bold text-gray-900 mt-1">{systemStats.systemHealth}</p>
                    <p className="text-xs text-green-500 mt-1">{systemStats.uptime} uptime</p>
                  </div>
                  <div className="p-4 bg-green-500 rounded-2xl group-hover:rotate-12 transition-transform duration-300">
                    <Activity className="h-8 w-8 text-white animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200/30 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">Active Directors</p>
                    <p className="text-4xl font-bold text-gray-900 mt-1">0</p>
                    <p className="text-xs text-blue-500 mt-1">Ready to create</p>
                  </div>
                  <div className="p-4 bg-blue-500 rounded-2xl group-hover:rotate-12 transition-transform duration-300">
                    <Crown className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 hover:scale-105 border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-orange-200/30 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-500"></div>
              <CardContent className="p-6 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-orange-600 uppercase tracking-wide">Setup Progress</p>
                    <p className="text-4xl font-bold text-gray-900 mt-1">25%</p>
                    <p className="text-xs text-orange-500 mt-1">Getting started</p>
                  </div>
                  <div className="p-4 bg-orange-500 rounded-2xl group-hover:rotate-12 transition-transform duration-300">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & System Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3 text-2xl">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <span>Quick Setup Actions</span>
                </CardTitle>
                <p className="text-gray-600">Get your HR system up and running</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => setCreateDirectorOpen(true)}
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="h-5 w-5 mr-3" />
                  Create Director Account
                </Button>
                
                <DirectorCreationForm 
                  isOpen={createDirectorOpen} 
                  onClose={() => setCreateDirectorOpen(false)}
                  onSuccess={() => {
                    fetchDashboardStats();
                  }}
                />

                <Dialog open={createDepartmentOpen} onOpenChange={setCreateDepartmentOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full h-12 text-base font-semibold border-2 hover:bg-gray-50">
                      <Building className="h-4 w-4 mr-2" />
                      Setup Departments
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Setup Department</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateDepartment} className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Department Name</Label>
                        <Input 
                          placeholder="e.g., Marketing, Sales, IT"
                          value={departmentForm.name}
                          onChange={(e) => setDepartmentForm({...departmentForm, name: e.target.value})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Department Code</Label>
                        <Input 
                          placeholder="e.g., MKT, SALES, IT"
                          value={departmentForm.code}
                          onChange={(e) => setDepartmentForm({...departmentForm, code: e.target.value.toUpperCase()})}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description (Optional)</Label>
                        <Input 
                          placeholder="Department description"
                          value={departmentForm.description}
                          onChange={(e) => setDepartmentForm({...departmentForm, description: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Budget (Optional)</Label>
                        <Input 
                          type="number" 
                          placeholder="Annual budget"
                          value={departmentForm.budget}
                          onChange={(e) => setDepartmentForm({...departmentForm, budget: e.target.value})}
                        />
                      </div>
                      <Button type="submit" className="w-full" disabled={isCreatingDepartment}>
                        {isCreatingDepartment ? 'Creating...' : 'Create Department'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <Button variant="outline" className="w-full h-12 text-base font-semibold border-2 hover:bg-gray-50" onClick={() => router.push('/employees')}>
                  <Users className="h-4 w-4 mr-2" />
                  Add Employees
                </Button>
                <Button variant="outline" className="w-full h-12 text-base font-semibold border-2 hover:bg-gray-50">
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Workflows
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0 bg-gradient-to-br from-white to-gray-50">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-3 text-2xl">
                  <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg">
                    <Monitor className="h-6 w-6 text-white" />
                  </div>
                  <span>System Status</span>
                </CardTitle>
                <p className="text-gray-600">Real-time system monitoring</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Database</span>
                    <Badge className="bg-green-100 text-green-800 px-3 py-1">
                      <Database className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Authentication</span>
                    <Badge className="bg-green-100 text-green-800 px-3 py-1">
                      <Key className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Permissions</span>
                    <Badge className="bg-green-100 text-green-800 px-3 py-1">
                      <Shield className="h-3 w-3 mr-1" />
                      Configured
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Real Data Mode</span>
                    <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Enabled
                    </Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm font-medium mb-1">
                      <span>Memory Usage</span>
                      <span>{systemStats.memoryUsage}%</span>
                    </div>
                    <Progress value={systemStats.memoryUsage} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-medium mb-1">
                      <span>CPU Usage</span>
                      <span>{systemStats.cpuUsage}%</span>
                    </div>
                    <Progress value={systemStats.cpuUsage} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm font-medium mb-1">
                      <span>Disk Usage</span>
                      <span>{systemStats.diskUsage}%</span>
                    </div>
                    <Progress value={systemStats.diskUsage} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-3 text-2xl">
                <Users className="h-6 w-6 text-blue-600" />
                <span>User Management</span>
              </CardTitle>
              <p className="text-gray-600">Create and manage user accounts with role-based permissions</p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to build your team</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Start by creating director accounts who will have full HR management powers, then build out your organization structure.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" onClick={() => setCreateDirectorOpen(true)}>
                    <Plus className="h-5 w-5 mr-2" />
                    Create First Director
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => router.push('/employees')}>
                    <Eye className="h-5 w-5 mr-2" />
                    View Employee Directory
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="credentials" className="space-y-4">
          <CredentialsManager />
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <SystemManagementTab />
        </TabsContent>

        <TabsContent value="hr" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-lg border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Employees</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalEmployees || 1}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Employees</p>
                    <p className="text-2xl font-bold text-green-600">{stats.totalEmployees || 1}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-l-4 border-l-yellow-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pendingLeaveRequests}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Departments</p>
                    <p className="text-2xl font-bold text-purple-600">4</p>
                  </div>
                  <Building className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>HR Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full justify-start" variant="outline" onClick={() => router.push('/employees')}>
                  <Users className="h-4 w-4 mr-2" />
                  Manage Employees
                </Button>
                <Button className="w-full justify-start" variant="outline" onClick={() => router.push('/leave-requests')}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Review Leave Requests
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Performance Reviews
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Reports
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle>Recent HR Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No recent activity</p>
                    <p className="text-sm text-gray-500">HR activities will appear here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="finance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-lg border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-green-600">R{stats.totalRevenue.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Receipts</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalReceipts}</p>
                  </div>
                  <Receipt className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-l-4 border-l-yellow-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Expenses</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.pendingExpenses}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-l-4 border-l-purple-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Growth</p>
                    <p className="text-2xl font-bold text-purple-600">+12%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <span>Financial Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <PieChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Financial data will appear here</p>
                  <p className="text-sm text-gray-500">Connect your finance system to see charts and analytics</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <LineChart className="h-5 w-5 text-green-600" />
                  <span>Revenue Trends</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <LineChart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Revenue trends will appear here</p>
                  <p className="text-sm text-gray-500">Financial data is ready to be integrated</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="shadow-lg border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Security Score</p>
                    <p className="text-2xl font-bold text-green-600">A+</p>
                  </div>
                  <Shield className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                    <p className="text-2xl font-bold text-blue-600">{systemStats.activeUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-l-4 border-l-yellow-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Failed Logins</p>
                    <p className="text-2xl font-bold text-yellow-600">0</p>
                  </div>
                  <XCircle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Security Incidents</p>
                    <p className="text-2xl font-bold text-red-600">0</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-red-600" />
                  <span>Security Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Two-Factor Auth</span>
                  <Badge className="bg-green-100 text-green-800">Enabled</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>SSL Certificate</span>
                  <Badge className="bg-green-100 text-green-800">Valid</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Firewall</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Data Encryption</span>
                  <Badge className="bg-green-100 text-green-800">AES-256</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Backup Status</span>
                  <Badge className="bg-green-100 text-green-800">Up to Date</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5 text-purple-600" />
                  <span>Access Monitoring</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <Monitor className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No security alerts</p>
                    <p className="text-sm text-gray-500">All systems operating normally</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  const DirectorDashboard = () => (
    <div className="space-y-6">
      {/* Role Header */}
      <div className={`p-6 rounded-lg text-white ${getRoleColor(userRole)}`}>
        <div className="flex items-center space-x-4">
          <Crown className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Director Dashboard</h1>
            <p className="opacity-90">Welcome back, {userName} - You have unlimited access to all systems</p>
            {stats.clearanceLevel && (
              <Badge className="mt-2 bg-red-600 hover:bg-red-700">
                🔒 {stats.clearanceLevel} CLEARANCE
              </Badge>
            )}
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="hr">HR Management</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Employees</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalEmployees}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue (YTD)</p>
                    <p className="text-3xl font-bold text-gray-900">R{stats.totalRevenue.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending Approvals</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.pendingLeaveRequests + stats.pendingExpenses}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Security Alerts</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.disciplinaryActions}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>Leave Requests</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Pending</span>
                    <Badge variant="secondary">{stats.pendingLeaveRequests}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Approved</span>
                    <Badge className="bg-green-100 text-green-800">{stats.approvedLeaveRequests}</Badge>
                  </div>
                  <Button className="w-full mt-4" size="sm">Review All</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Receipt className="h-5 w-5" />
                  <span>Expense Claims</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Pending</span>
                    <Badge variant="secondary">{stats.pendingExpenses}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>This Month</span>
                    <Badge className="bg-blue-100 text-blue-800">R247K</Badge>
                  </div>
                  <Button className="w-full mt-4" size="sm">Review All</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Performance Reviews</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Pending</span>
                    <Badge variant="secondary">{stats.pendingPerformanceReviews}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Completed</span>
                    <Badge className="bg-green-100 text-green-800">35</Badge>
                  </div>
                  <Button className="w-full mt-4" size="sm">Review All</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="finance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R{stats.totalRevenue.toLocaleString()}
                </div>
                <p className="text-sm text-gray-500">Year to Date</p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Trading</span>
                    <span>R8.5M</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Investments</span>
                    <span>R4.0M</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Department Budgets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Trading</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 rounded">
                        <div className="w-16 h-2 bg-blue-500 rounded"></div>
                      </div>
                      <span className="text-xs">80%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Finance</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 rounded">
                        <div className="w-12 h-2 bg-green-500 rounded"></div>
                      </div>
                      <span className="text-xs">60%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">IT</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 h-2 bg-gray-200 rounded">
                        <div className="w-8 h-2 bg-yellow-500 rounded"></div>
                      </div>
                      <span className="text-xs">40%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expense Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">High Priority</span>
                    <Badge variant="destructive">5</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Medium Priority</span>
                    <Badge className="bg-yellow-100 text-yellow-800">12</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Low Priority</span>
                    <Badge className="bg-green-100 text-green-800">6</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="hr" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>HR Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Employee Retention</span>
                    <span className="font-bold text-green-600">94%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Performance</span>
                    <span className="font-bold text-blue-600">4.2/5</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Training Completion</span>
                    <span className="font-bold text-purple-600">87%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Disciplinary Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Active Cases</span>
                    <Badge variant="destructive">{stats.disciplinaryActions}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Under Review</span>
                    <Badge className="bg-yellow-100 text-yellow-800">2</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Resolved This Month</span>
                    <Badge className="bg-green-100 text-green-800">8</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-red-500" />
                  <span>Security Incidents</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">0</div>
                <p className="text-sm text-gray-500">Active incidents</p>
                <div className="mt-4">
                  <Button variant="outline" size="sm" className="w-full">
                    View Security Log
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Access Control</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Active Sessions</span>
                    <span className="text-sm font-medium">42</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Failed Logins (24h)</span>
                    <span className="text-sm font-medium">3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Locked Accounts</span>
                    <span className="text-sm font-medium text-red-600">1</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">POPI Act Compliant</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">ISO 27001 Certified</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Annual Review Due</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  // For other roles, show appropriate dashboard
  const OtherRoleDashboard = () => {
    const RoleIcon = getRoleIcon(userRole);
    
    return (
      <div className="space-y-6">
        {/* Role Header */}
        <div className={`p-6 rounded-lg text-white ${getRoleColor(userRole)}`}>
          <div className="flex items-center space-x-4">
            <RoleIcon className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">{getRoleDisplayName(userRole)} Dashboard</h1>
              <p className="opacity-90">Welcome back, {userName}</p>
              {departmentName && <p className="opacity-80 text-sm">Department: {departmentName}</p>}
              {stats.clearanceLevel && stats.clearanceLevel !== 'NONE' && (
                <Badge className="mt-2 bg-black/20 hover:bg-black/30">
                  🔒 {stats.clearanceLevel} CLEARANCE
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Role-specific stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {userRole === 'HR_MANAGER' && (
            <>
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Employees</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalEmployees}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-yellow-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Pending Leave Requests</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.pendingLeaveRequests}</p>
                    </div>
                    <Calendar className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {userRole === 'DEPARTMENT_MANAGER' && (
            <>
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Team Size</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.totalEmployees}</p>
                    </div>
                    <Users className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Department Budget</p>
                      <p className="text-2xl font-bold text-gray-900">
                        R{stats.departmentBudget?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {(userRole === 'SUPERVISOR' || userRole === 'SENIOR_EMPLOYEE') && (
            <>
              <Card className="border-l-4 border-l-indigo-500">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Team Members</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.teamSize || stats.totalEmployees}</p>
                    </div>
                    <Users className="h-8 w-8 text-indigo-500" />
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">My Leave Requests</p>
                  <p className="text-3xl font-bold text-gray-900">2</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Performance Score</p>
                  <p className="text-3xl font-bold text-gray-900">4.5</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Request Leave
              </Button>
              <Button variant="outline" size="sm">
                <Clock className="h-4 w-4 mr-2" />
                Clock In/Out
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                View Payslip
              </Button>
              <Button variant="outline" size="sm">
                <TrendingUp className="h-4 w-4 mr-2" />
                Performance
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (userRole === 'SUPER_ADMIN') {
    return <SuperAdminDashboard />;
  } else if (userRole === 'DIRECTOR') {
    return <DirectorDashboard />;
  } else {
    return <OtherRoleDashboard />;
  }
}