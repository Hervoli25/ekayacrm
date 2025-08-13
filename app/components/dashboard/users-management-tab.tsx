'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Edit,
  Trash2,
  Lock,
  Unlock,
  UserPlus,
  Shield,
  Crown,
  Building,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Role } from '@prisma/client';
import { useSession } from 'next-auth/react';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLogin?: string;
  failedLoginAttempts: number;
  lockoutUntil?: string;
  createdAt: string;
  employee?: {
    name: string;
    employeeId: string;
    department: string;
    title: string;
    hireDate: string;
    phone?: string;
    address?: string;
  };
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  lockedUsers: number;
  adminUsers: number;
  recentLogins: number;
  usersByRole: Record<string, number>;
  usersByDepartment: Record<string, number>;
}

const ROLE_COLORS = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800',
  DIRECTOR: 'bg-yellow-100 text-yellow-800',
  HR_MANAGER: 'bg-blue-100 text-blue-800',
  DEPARTMENT_MANAGER: 'bg-green-100 text-green-800',
  SUPERVISOR: 'bg-indigo-100 text-indigo-800',
  SENIOR_EMPLOYEE: 'bg-cyan-100 text-cyan-800',
  EMPLOYEE: 'bg-gray-100 text-gray-800',
  INTERN: 'bg-pink-100 text-pink-800'
};

const ROLE_ICONS = {
  SUPER_ADMIN: Shield,
  DIRECTOR: Crown,
  HR_MANAGER: Users,
  DEPARTMENT_MANAGER: Building,
  SUPERVISOR: UserCheck,
  SENIOR_EMPLOYEE: UserPlus,
  EMPLOYEE: Users,
  INTERN: Users
};

export function UsersManagementTab() {
  const { toast } = useToast();
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  const currentUserRole = session?.user?.role;

  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/admin/users/stats');
      if (!response.ok) throw new Error('Failed to fetch user stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleUserAction = async (userId: string, action: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: 'POST'
      });
      
      if (!response.ok) throw new Error(`Failed to ${action} user`);
      
      toast({
        title: 'Success',
        description: `User ${action}d successfully`,
        variant: 'default'
      });
      
      fetchUsers();
      fetchUserStats();
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      toast({
        title: 'Error',
        description: `Failed to ${action} user`,
        variant: 'destructive'
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.employee?.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive) ||
                         (statusFilter === 'locked' && user.lockoutUntil);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleIcon = (role: Role) => {
    const Icon = ROLE_ICONS[role] || Users;
    return Icon;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-3xl font-bold text-green-600">{stats.activeUsers}</p>
                  <p className="text-xs text-green-500">
                    {Math.round((stats.activeUsers / stats.totalUsers) * 100)}% active
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Recent Logins</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.recentLogins}</p>
                  <p className="text-xs text-yellow-500">Last 24 hours</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Locked Users</p>
                  <p className="text-3xl font-bold text-red-600">{stats.lockedUsers}</p>
                  <p className="text-xs text-red-500">Security lockouts</p>
                </div>
                <Lock className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {currentUserRole === 'SUPER_ADMIN' && (
                    <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  )}
                  <SelectItem value="DIRECTOR">Director</SelectItem>
                  <SelectItem value="HR_MANAGER">HR Manager</SelectItem>
                  <SelectItem value="DEPARTMENT_MANAGER">Dept Manager</SelectItem>
                  <SelectItem value="SUPERVISOR">Supervisor</SelectItem>
                  <SelectItem value="SENIOR_EMPLOYEE">Senior Employee</SelectItem>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="INTERN">Intern</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="locked">Locked</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                </DialogHeader>
                <div className="text-center py-8">
                  <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">User creation form would go here</p>
                  <p className="text-sm text-gray-500">Integration with employee creation system</p>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>
            Manage system users, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredUsers.map((user) => {
              const RoleIcon = getRoleIcon(user.role);
              const isLocked = user.lockoutUntil && new Date(user.lockoutUntil) > new Date();
              
              return (
                <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        <RoleIcon className="h-6 w-6 text-gray-600" />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{user.name}</h3>
                          <Badge className={ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-800'}>
                            {user.role.replace('_', ' ')}
                          </Badge>
                          {!user.isActive && (
                            <Badge variant="destructive">Inactive</Badge>
                          )}
                          {isLocked && (
                            <Badge variant="destructive">
                              <Lock className="h-3 w-3 mr-1" />
                              Locked
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {user.email}
                          </span>
                          {user.employee && (
                            <>
                              <span>ID: {user.employee.employeeId}</span>
                              <span>{user.employee.department}</span>
                              <span>{user.employee.title}</span>
                            </>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Created: {new Date(user.createdAt).toLocaleDateString()}</span>
                          {user.lastLogin && (
                            <span>Last login: {new Date(user.lastLogin).toLocaleDateString()}</span>
                          )}
                          {user.failedLoginAttempts > 0 && (
                            <span className="text-red-600">
                              Failed attempts: {user.failedLoginAttempts}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      
                      {user.isActive ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUserAction(user.id, 'deactivate')}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <Lock className="h-3 w-3 mr-1" />
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUserAction(user.id, 'activate')}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          <Unlock className="h-3 w-3 mr-1" />
                          Activate
                        </Button>
                      )}
                      
                      {isLocked && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUserAction(user.id, 'unlock')}
                          className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                          <Unlock className="h-3 w-3 mr-1" />
                          Unlock
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUserAction(user.id, 'reset-password')}
                        className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                      >
                        Reset Password
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {filteredUsers.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No users found matching your criteria</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role Distribution */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Users by Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.usersByRole).map(([role, count]) => {
                  const percentage = Math.round((count / stats.totalUsers) * 100);
                  const RoleIcon = getRoleIcon(role as Role);
                  
                  return (
                    <div key={role} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <RoleIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{role.replace('_', ' ')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 h-2 bg-gray-200 rounded">
                          <div 
                            className="h-2 bg-blue-500 rounded" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Users by Department</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.usersByDepartment).map(([dept, count]) => {
                  const percentage = Math.round((count / stats.totalUsers) * 100);
                  
                  return (
                    <div key={dept} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{dept}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 h-2 bg-gray-200 rounded">
                          <div 
                            className="h-2 bg-green-500 rounded" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}