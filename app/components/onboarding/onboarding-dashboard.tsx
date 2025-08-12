'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BookOpen,
  Award,
  Calendar,
  User,
  BarChart3,
  Download,
  Eye
} from 'lucide-react';

interface OnboardingProgress {
  employeeId: string;
  employeeName: string;
  department: string;
  startDate: string;
  progress: number;
  completedSteps: number;
  totalSteps: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'overdue';
  lastActivity: string;
  estimatedCompletion: string;
}

export function OnboardingDashboard() {
  const [employees, setEmployees] = useState<OnboardingProgress[]>([]);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockData: OnboardingProgress[] = [
      {
        employeeId: 'EMP001',
        employeeName: 'John Smith',
        department: 'Car Wash Operations',
        startDate: '2024-01-15',
        progress: 85,
        completedSteps: 5,
        totalSteps: 6,
        status: 'in-progress',
        lastActivity: '2024-01-16',
        estimatedCompletion: '2024-01-17'
      },
      {
        employeeId: 'EMP002',
        employeeName: 'Sarah Johnson',
        department: 'Customer Service',
        startDate: '2024-01-14',
        progress: 100,
        completedSteps: 6,
        totalSteps: 6,
        status: 'completed',
        lastActivity: '2024-01-15',
        estimatedCompletion: '2024-01-15'
      },
      {
        employeeId: 'EMP003',
        employeeName: 'Mike Wilson',
        department: 'Car Wash Operations',
        startDate: '2024-01-10',
        progress: 33,
        completedSteps: 2,
        totalSteps: 6,
        status: 'overdue',
        lastActivity: '2024-01-12',
        estimatedCompletion: '2024-01-18'
      },
      {
        employeeId: 'EMP004',
        employeeName: 'Lisa Chen',
        department: 'Quality Control',
        startDate: '2024-01-16',
        progress: 0,
        completedSteps: 0,
        totalSteps: 6,
        status: 'not-started',
        lastActivity: 'Never',
        estimatedCompletion: '2024-01-19'
      }
    ];
    setEmployees(mockData);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'not-started': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'in-progress': return <Clock className="h-4 w-4" />;
      case 'overdue': return <AlertCircle className="h-4 w-4" />;
      case 'not-started': return <User className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const stats = {
    totalEmployees: employees.length,
    completed: employees.filter(e => e.status === 'completed').length,
    inProgress: employees.filter(e => e.status === 'in-progress').length,
    overdue: employees.filter(e => e.status === 'overdue').length,
    averageProgress: employees.reduce((acc, emp) => acc + emp.progress, 0) / employees.length || 0
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Onboarding Dashboard</h1>
          <p className="text-gray-600 mt-1">Track employee onboarding progress for Prestige Car Wash</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600">
            <BookOpen className="h-4 w-4 mr-2" />
            View Program
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Total Employees</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalEmployees}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Completed</p>
                <p className="text-2xl font-bold text-green-900">{stats.completed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.inProgress}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-red-600">Overdue</p>
                <p className="text-2xl font-bold text-red-900">{stats.overdue}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Avg Progress</p>
                <p className="text-2xl font-bold text-purple-900">{Math.round(stats.averageProgress)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Employee Progress</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="program">Program Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Employee Onboarding Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employees.map((employee) => (
                  <div key={employee.employeeId} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {employee.employeeName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{employee.employeeName}</h3>
                          <p className="text-sm text-gray-500">{employee.department}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(employee.status)}>
                          {getStatusIcon(employee.status)}
                          <span className="ml-1 capitalize">{employee.status.replace('-', ' ')}</span>
                        </Badge>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress: {employee.completedSteps}/{employee.totalSteps} steps</span>
                        <span>{employee.progress}%</span>
                      </div>
                      <Progress value={employee.progress} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Started: {new Date(employee.startDate).toLocaleDateString()}</span>
                        <span>Est. Completion: {new Date(employee.estimatedCompletion).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Completion Rates by Department
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Car Wash Operations</span>
                    <span className="text-sm text-gray-500">60% (3/5)</span>
                  </div>
                  <Progress value={60} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Customer Service</span>
                    <span className="text-sm text-gray-500">100% (1/1)</span>
                  </div>
                  <Progress value={100} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Quality Control</span>
                    <span className="text-sm text-gray-500">0% (0/1)</span>
                  </div>
                  <Progress value={0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">Sarah Johnson completed onboarding</span>
                    <span className="text-gray-400">2 days ago</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">John Smith completed Safety Protocols</span>
                    <span className="text-gray-400">1 day ago</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-gray-600">Lisa Chen started onboarding</span>
                    <span className="text-gray-400">Today</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-gray-600">Mike Wilson is overdue</span>
                    <span className="text-gray-400">3 days overdue</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="program" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Prestige Car Wash Onboarding Program
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Welcome & Introduction</h3>
                  <p className="text-sm text-blue-700">Company culture, values, and service standards</p>
                  <Badge variant="outline" className="mt-2 text-blue-600">10 min</Badge>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-900 mb-2">Safety Protocols</h3>
                  <p className="text-sm text-red-700">Essential safety procedures and guidelines</p>
                  <Badge variant="outline" className="mt-2 text-red-600">15 min</Badge>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-900 mb-2">Service Packages</h3>
                  <p className="text-sm text-green-700">Understanding our car wash services</p>
                  <Badge variant="outline" className="mt-2 text-green-600">20 min</Badge>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-900 mb-2">Equipment Training</h3>
                  <p className="text-sm text-purple-700">Proper equipment and chemical usage</p>
                  <Badge variant="outline" className="mt-2 text-purple-600">25 min</Badge>
                </div>
                <div className="bg-pink-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-pink-900 mb-2">Customer Service</h3>
                  <p className="text-sm text-pink-700">Excellence in customer interactions</p>
                  <Badge variant="outline" className="mt-2 text-pink-600">15 min</Badge>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-900 mb-2">Quality Control</h3>
                  <p className="text-sm text-yellow-700">Maintaining premium standards</p>
                  <Badge variant="outline" className="mt-2 text-yellow-600">10 min</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
