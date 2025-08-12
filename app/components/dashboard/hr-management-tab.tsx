'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Calendar, 
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  UserPlus,
  UserMinus,
  Award,
  Target,
  BookOpen,
  FileText,
  BarChart3,
  PieChart,
  Activity,
  Briefcase,
  GraduationCap,
  Heart,
  Shield
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { useToast } from '@/hooks/use-toast';

interface HRMetrics {
  workforce: {
    totalEmployees: number;
    activeEmployees: number;
    newHires: number;
    terminations: number;
    retention: number;
    turnover: number;
    averageTenure: number;
    contractEmployees: number;
    internCount: number;
  };
  leave: {
    totalRequests: number;
    pendingRequests: number;
    approvedRequests: number;
    rejectedRequests: number;
    utilizationRate: number;
    averageDaysPerEmployee: number;
    sickLeaveAbuse: number;
    emergencyLeaveCount: number;
  };
  performance: {
    reviewsCompleted: number;
    reviewsPending: number;
    averageRating: number;
    topPerformers: number;
    improvementPlans: number;
    promotionsThisYear: number;
    trainingHours: number;
    certifications: number;
  };
  compliance: {
    requiredTraining: number;
    completedTraining: number;
    expiredCertifications: number;
    policyAcknowledgments: number;
    disciplinaryActions: number;
    grievances: number;
    safetyIncidents: number;
    complianceScore: number;
  };
  recruitment: {
    openPositions: number;
    applications: number;
    interviews: number;
    offers: number;
    timeToHire: number;
    costPerHire: number;
    sourceEffectiveness: Record<string, number>;
  };
  departmentBreakdown: Record<string, {
    employees: number;
    retention: number;
    averageRating: number;
    leaveUtilization: number;
  }>;
  trends: Array<{
    month: string;
    hires: number;
    terminations: number;
    leaveRequests: number;
    performance: number;
  }>;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export function HRManagementTab() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<HRMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  useEffect(() => {
    fetchHRMetrics();
  }, [selectedPeriod, selectedDepartment]);

  const fetchHRMetrics = async () => {
    try {
      setLoading(true);
      
      // Mock data - in practice, this would come from HR analytics APIs
      const mockMetrics: HRMetrics = {
        workforce: {
          totalEmployees: 247,
          activeEmployees: 235,
          newHires: 12,
          terminations: 3,
          retention: 94.2,
          turnover: 5.8,
          averageTenure: 3.2,
          contractEmployees: 8,
          internCount: 4
        },
        leave: {
          totalRequests: 89,
          pendingRequests: 12,
          approvedRequests: 71,
          rejectedRequests: 6,
          utilizationRate: 68.5,
          averageDaysPerEmployee: 14.3,
          sickLeaveAbuse: 2,
          emergencyLeaveCount: 8
        },
        performance: {
          reviewsCompleted: 180,
          reviewsPending: 67,
          averageRating: 4.2,
          topPerformers: 45,
          improvementPlans: 8,
          promotionsThisYear: 23,
          trainingHours: 1840,
          certifications: 156
        },
        compliance: {
          requiredTraining: 235,
          completedTraining: 198,
          expiredCertifications: 12,
          policyAcknowledgments: 220,
          disciplinaryActions: 3,
          grievances: 1,
          safetyIncidents: 0,
          complianceScore: 92.8
        },
        recruitment: {
          openPositions: 15,
          applications: 187,
          interviews: 45,
          offers: 12,
          timeToHire: 28,
          costPerHire: 3500,
          sourceEffectiveness: {
            'LinkedIn': 45,
            'Indeed': 32,
            'Referrals': 28,
            'Company Website': 18,
            'Recruiters': 15
          }
        },
        departmentBreakdown: {
          'Trading': { employees: 85, retention: 96.2, averageRating: 4.3, leaveUtilization: 72.1 },
          'Finance': { employees: 42, retention: 92.1, averageRating: 4.1, leaveUtilization: 65.8 },
          'Operations': { employees: 38, retention: 94.7, averageRating: 4.2, leaveUtilization: 69.4 },
          'IT': { employees: 28, retention: 89.3, averageRating: 4.4, leaveUtilization: 71.2 },
          'HR': { employees: 18, retention: 100, averageRating: 4.0, leaveUtilization: 58.9 },
          'Executive': { employees: 12, retention: 100, averageRating: 4.5, leaveUtilization: 45.2 }
        },
        trends: [
          { month: 'Jan', hires: 8, terminations: 2, leaveRequests: 23, performance: 4.1 },
          { month: 'Feb', hires: 5, terminations: 1, leaveRequests: 19, performance: 4.2 },
          { month: 'Mar', hires: 12, terminations: 3, leaveRequests: 31, performance: 4.2 },
          { month: 'Apr', hires: 7, terminations: 2, leaveRequests: 28, performance: 4.3 },
          { month: 'May', hires: 9, terminations: 1, leaveRequests: 35, performance: 4.2 },
          { month: 'Jun', hires: 15, terminations: 4, leaveRequests: 42, performance: 4.1 }
        ]
      };
      
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error fetching HR metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch HR metrics',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <Activity className="h-6 w-6 animate-spin mr-2" />
          Loading HR metrics...
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const pieData = [
    { name: 'Approved', value: metrics.leave.approvedRequests, color: COLORS[0] },
    { name: 'Pending', value: metrics.leave.pendingRequests, color: COLORS[1] },
    { name: 'Rejected', value: metrics.leave.rejectedRequests, color: COLORS[2] }
  ];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">HR Analytics Dashboard</h3>
          <p className="text-sm text-gray-600">Comprehensive human resources metrics and insights</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current-month">Current Month</SelectItem>
              <SelectItem value="last-3-months">Last 3 Months</SelectItem>
              <SelectItem value="ytd">Year to Date</SelectItem>
              <SelectItem value="last-year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              <SelectItem value="Trading">Trading</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Operations">Operations</SelectItem>
              <SelectItem value="IT">IT</SelectItem>
              <SelectItem value="HR">HR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Workforce</p>
                <p className="text-3xl font-bold text-blue-600">{metrics.workforce.totalEmployees}</p>
                <p className="text-xs text-green-500 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{metrics.workforce.newHires} new hires
                </p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Retention Rate</p>
                <p className="text-3xl font-bold text-green-600">{metrics.workforce.retention}%</p>
                <p className="text-xs text-gray-500">
                  Avg tenure: {metrics.workforce.averageTenure}y
                </p>
              </div>
              <Award className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Performance</p>
                <p className="text-3xl font-bold text-purple-600">{metrics.performance.averageRating}</p>
                <p className="text-xs text-green-500 flex items-center">
                  <Target className="h-3 w-3 mr-1" />
                  {metrics.performance.topPerformers} top performers
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Leave Utilization</p>
                <p className="text-3xl font-bold text-yellow-600">{metrics.leave.utilizationRate}%</p>
                <p className="text-xs text-gray-500">
                  {metrics.leave.averageDaysPerEmployee} days/employee
                </p>
              </div>
              <Calendar className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workforce Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Workforce Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{metrics.workforce.activeEmployees}</p>
                <p className="text-xs text-gray-600">Active</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{metrics.workforce.contractEmployees}</p>
                <p className="text-xs text-gray-600">Contract</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{metrics.workforce.internCount}</p>
                <p className="text-xs text-gray-600">Interns</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{metrics.workforce.terminations}</p>
                <p className="text-xs text-gray-600">Terminations</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Turnover Rate</span>
                <span className="font-medium">{metrics.workforce.turnover}%</span>
              </div>
              <Progress value={metrics.workforce.turnover} max={20} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Leave Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Leave Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Pending Requests</span>
                <Badge variant="outline" className="text-yellow-600">
                  {metrics.leave.pendingRequests}
                </Badge>
              </div>
              
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center">
                  <p className="text-red-600 font-bold">{metrics.leave.sickLeaveAbuse}</p>
                  <p className="text-gray-600">Sick Leave Abuse</p>
                </div>
                <div className="text-center">
                  <p className="text-orange-600 font-bold">{metrics.leave.emergencyLeaveCount}</p>
                  <p className="text-gray-600">Emergency Leave</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{metrics.performance.reviewsCompleted}</p>
                <p className="text-xs text-gray-600">Reviews Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{metrics.performance.reviewsPending}</p>
                <p className="text-xs text-gray-600">Reviews Pending</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Performance Score</span>
                <span className="font-bold text-green-600">{metrics.performance.averageRating}/5.0</span>
              </div>
              <Progress value={(metrics.performance.averageRating / 5) * 100} className="h-2" />
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="flex items-center">
                  <Award className="h-3 w-3 mr-1 text-gold-500" />
                  Promotions
                </span>
                <span className="font-medium">{metrics.performance.promotionsThisYear}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1 text-red-500" />
                  Improvement Plans
                </span>
                <span className="font-medium">{metrics.performance.improvementPlans}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center">
                  <BookOpen className="h-3 w-3 mr-1 text-blue-500" />
                  Training Hours
                </span>
                <span className="font-medium">{metrics.performance.trainingHours.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance & Recruitment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Compliance Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Compliance Score</span>
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800">
                  {metrics.compliance.complianceScore}%
                </Badge>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </div>
            </div>

            <Progress value={metrics.compliance.complianceScore} className="h-3" />

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Training Completion</span>
                <span className="text-sm font-medium">
                  {metrics.compliance.completedTraining}/{metrics.compliance.requiredTraining}
                </span>
              </div>
              <Progress 
                value={(metrics.compliance.completedTraining / metrics.compliance.requiredTraining) * 100} 
                className="h-2" 
              />
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="text-center p-2 bg-red-50 rounded">
                  <p className="text-lg font-bold text-red-600">{metrics.compliance.disciplinaryActions}</p>
                  <p className="text-xs text-red-600">Disciplinary Actions</p>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded">
                  <p className="text-lg font-bold text-yellow-600">{metrics.compliance.expiredCertifications}</p>
                  <p className="text-xs text-yellow-600">Expired Certs</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Policy Acknowledgments</span>
                  <span className="font-medium">{metrics.compliance.policyAcknowledgments}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Grievances</span>
                  <span className="font-medium text-yellow-600">{metrics.compliance.grievances}</span>
                </div>
                <div className="flex justify-between">
                  <span>Safety Incidents</span>
                  <span className="font-medium text-green-600">{metrics.compliance.safetyIncidents}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recruitment Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Briefcase className="h-5 w-5 mr-2" />
              Recruitment Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{metrics.recruitment.openPositions}</p>
                <p className="text-xs text-gray-600">Open Positions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{metrics.recruitment.applications}</p>
                <p className="text-xs text-gray-600">Applications</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{metrics.recruitment.interviews}</p>
                <p className="text-xs text-gray-600">Interviews</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">{metrics.recruitment.offers}</p>
                <p className="text-xs text-gray-600">Offers Extended</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Time to Hire</span>
                <span className="font-medium">{metrics.recruitment.timeToHire} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cost per Hire</span>
                <span className="font-medium">R{metrics.recruitment.costPerHire.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Source Effectiveness</p>
              <div className="space-y-2">
                {Object.entries(metrics.recruitment.sourceEffectiveness).map(([source, count]) => (
                  <div key={source} className="flex justify-between items-center">
                    <span className="text-xs">{source}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-gray-200 rounded">
                        <div 
                          className="h-2 bg-blue-500 rounded" 
                          style={{ width: `${(count / Math.max(...Object.values(metrics.recruitment.sourceEffectiveness))) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-medium w-6">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Department Analysis
          </CardTitle>
          <CardDescription>Key metrics by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Department</th>
                  <th className="text-center p-2">Employees</th>
                  <th className="text-center p-2">Retention</th>
                  <th className="text-center p-2">Avg Rating</th>
                  <th className="text-center p-2">Leave Usage</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(metrics.departmentBreakdown).map(([dept, data]) => (
                  <tr key={dept} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{dept}</td>
                    <td className="p-2 text-center">{data.employees}</td>
                    <td className="p-2 text-center">
                      <Badge className={data.retention >= 95 ? 'bg-green-100 text-green-800' : data.retention >= 90 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                        {data.retention.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="p-2 text-center">
                      <div className="flex items-center justify-center">
                        <Star className="h-3 w-3 text-yellow-500 mr-1" />
                        {data.averageRating.toFixed(1)}
                      </div>
                    </td>
                    <td className="p-2 text-center">{data.leaveUtilization.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            HR Trends (6 Month View)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={metrics.trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="hires" stroke="#10b981" name="New Hires" strokeWidth={2} />
              <Line type="monotone" dataKey="terminations" stroke="#ef4444" name="Terminations" strokeWidth={2} />
              <Line type="monotone" dataKey="leaveRequests" stroke="#f59e0b" name="Leave Requests" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}