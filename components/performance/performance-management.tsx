'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Target, 
  Plus, 
  Search,
  Calendar,
  Star,
  TrendingUp,
  TrendingDown,
  Award,
  Users,
  BarChart3,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  User
} from 'lucide-react';
import { format } from 'date-fns';

interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  reviewerName: string;
  period: string;
  type: 'QUARTERLY' | 'ANNUAL' | 'PROBATION' | 'SPECIAL';
  status: 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED';
  overallRating: number;
  goals: Goal[];
  competencies: Competency[];
  feedback: string;
  improvementPlan: string;
  createdAt: string;
  dueDate: string;
  completedAt?: string;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'PERFORMANCE' | 'DEVELOPMENT' | 'BEHAVIORAL' | 'STRATEGIC';
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
  progress: number;
  targetDate: string;
  completedAt?: string;
  employeeId: string;
  employeeName: string;
}

interface Competency {
  id: string;
  name: string;
  category: string;
  rating: number;
  comments: string;
}

const reviewTypes = [
  { value: 'QUARTERLY', label: 'Quarterly Review' },
  { value: 'ANNUAL', label: 'Annual Review' },
  { value: 'PROBATION', label: 'Probation Review' },
  { value: 'SPECIAL', label: 'Special Review' }
];

const goalCategories = [
  { value: 'PERFORMANCE', label: 'Performance', color: 'bg-blue-100 text-blue-800' },
  { value: 'DEVELOPMENT', label: 'Development', color: 'bg-green-100 text-green-800' },
  { value: 'BEHAVIORAL', label: 'Behavioral', color: 'bg-purple-100 text-purple-800' },
  { value: 'STRATEGIC', label: 'Strategic', color: 'bg-orange-100 text-orange-800' }
];

const statusColors = {
  NOT_STARTED: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  OVERDUE: 'bg-red-100 text-red-800',
  DRAFT: 'bg-gray-100 text-gray-800',
  APPROVED: 'bg-green-100 text-green-800'
};

export default function PerformanceManagement() {
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [createReviewDialogOpen, setCreateReviewDialogOpen] = useState(false);
  const [createGoalDialogOpen, setCreateGoalDialogOpen] = useState(false);
  const [newReview, setNewReview] = useState({
    employeeId: '',
    type: '',
    period: '',
    dueDate: ''
  });
  const [newGoal, setNewGoal] = useState({
    employeeId: '',
    title: '',
    description: '',
    category: '',
    targetDate: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch employees
      const employeesResponse = await fetch('/api/employees');
      const employeesData = employeesResponse.ok ? await employeesResponse.json() : [];
      setEmployees(employeesData);

      // Mock performance data since no API exists
      const mockReviews: PerformanceReview[] = [
        {
          id: '1',
          employeeId: '1',
          employeeName: 'John Smith',
          reviewerName: 'Sarah Johnson',
          period: 'Q4 2023',
          type: 'QUARTERLY',
          status: 'COMPLETED',
          overallRating: 4.2,
          goals: [],
          competencies: [
            { id: '1', name: 'Communication', category: 'Soft Skills', rating: 4, comments: 'Excellent verbal and written communication' },
            { id: '2', name: 'Technical Skills', category: 'Hard Skills', rating: 5, comments: 'Outstanding technical proficiency' },
            { id: '3', name: 'Leadership', category: 'Soft Skills', rating: 3, comments: 'Shows potential, needs development' }
          ],
          feedback: 'John has shown exceptional performance this quarter...',
          improvementPlan: 'Focus on leadership development and team collaboration',
          createdAt: '2024-01-15T10:00:00Z',
          dueDate: '2024-02-15T00:00:00Z',
          completedAt: '2024-02-10T15:30:00Z'
        },
        {
          id: '2',
          employeeId: '2',
          employeeName: 'Alice Johnson',
          reviewerName: 'Mike Wilson',
          period: 'Annual 2023',
          type: 'ANNUAL',
          status: 'IN_PROGRESS',
          overallRating: 0,
          goals: [],
          competencies: [],
          feedback: '',
          improvementPlan: '',
          createdAt: '2024-01-20T09:00:00Z',
          dueDate: '2024-03-01T00:00:00Z'
        }
      ];

      const mockGoals: Goal[] = [
        {
          id: '1',
          title: 'Complete React Advanced Training',
          description: 'Complete advanced React course and implement learnings in current project',
          category: 'DEVELOPMENT',
          status: 'IN_PROGRESS',
          progress: 75,
          targetDate: '2024-03-31T00:00:00Z',
          employeeId: '1',
          employeeName: 'John Smith'
        },
        {
          id: '2',
          title: 'Increase Sales by 20%',
          description: 'Achieve 20% increase in quarterly sales compared to previous quarter',
          category: 'PERFORMANCE',
          status: 'IN_PROGRESS',
          progress: 60,
          targetDate: '2024-03-31T00:00:00Z',
          employeeId: '2',
          employeeName: 'Alice Johnson'
        },
        {
          id: '3',
          title: 'Lead Team Project',
          description: 'Successfully lead the new product launch project',
          category: 'BEHAVIORAL',
          status: 'NOT_STARTED',
          progress: 0,
          targetDate: '2024-06-30T00:00:00Z',
          employeeId: '1',
          employeeName: 'John Smith'
        }
      ];

      setReviews(mockReviews);
      setGoals(mockGoals);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch performance data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReview = async () => {
    if (!newReview.employeeId || !newReview.type || !newReview.period) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const employee = employees.find(emp => emp.id === newReview.employeeId);
      const mockReview: PerformanceReview = {
        id: Date.now().toString(),
        employeeId: newReview.employeeId,
        employeeName: employee?.name || 'Unknown',
        reviewerName: 'Current User',
        period: newReview.period,
        type: newReview.type as any,
        status: 'DRAFT',
        overallRating: 0,
        goals: [],
        competencies: [],
        feedback: '',
        improvementPlan: '',
        createdAt: new Date().toISOString(),
        dueDate: newReview.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };

      setReviews(prev => [mockReview, ...prev]);
      setCreateReviewDialogOpen(false);
      setNewReview({ employeeId: '', type: '', period: '', dueDate: '' });

      toast({
        title: 'Success',
        description: 'Performance review created successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create performance review',
        variant: 'destructive',
      });
    }
  };

  const handleCreateGoal = async () => {
    if (!newGoal.employeeId || !newGoal.title || !newGoal.category) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const employee = employees.find(emp => emp.id === newGoal.employeeId);
      const mockGoal: Goal = {
        id: Date.now().toString(),
        title: newGoal.title,
        description: newGoal.description,
        category: newGoal.category as any,
        status: 'NOT_STARTED',
        progress: 0,
        targetDate: newGoal.targetDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        employeeId: newGoal.employeeId,
        employeeName: employee?.name || 'Unknown'
      };

      setGoals(prev => [mockGoal, ...prev]);
      setCreateGoalDialogOpen(false);
      setNewGoal({ employeeId: '', title: '', description: '', category: '', targetDate: '' });

      toast({
        title: 'Success',
        description: 'Goal created successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create goal',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getCategoryBadge = (category: string) => {
    const cat = goalCategories.find(c => c.value === category);
    return (
      <Badge className={cat?.color || 'bg-gray-100 text-gray-800'}>
        {cat?.label || category}
      </Badge>
    );
  };

  const getRatingStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star 
            key={star} 
            className={`h-4 w-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
        <span className="ml-2 text-sm text-muted-foreground">({rating}/5)</span>
      </div>
    );
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || review.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredGoals = goals.filter(goal =>
    goal.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    goal.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalReviews: reviews.length,
    completedReviews: reviews.filter(r => r.status === 'COMPLETED').length,
    overdueReviews: reviews.filter(r => new Date(r.dueDate) < new Date() && r.status !== 'COMPLETED').length,
    avgRating: reviews.filter(r => r.overallRating > 0).reduce((sum, r) => sum + r.overallRating, 0) / 
               Math.max(reviews.filter(r => r.overallRating > 0).length, 1),
    totalGoals: goals.length,
    completedGoals: goals.filter(g => g.status === 'COMPLETED').length,
    avgProgress: goals.reduce((sum, g) => sum + g.progress, 0) / Math.max(goals.length, 1)
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-lg">Loading performance data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Performance Management</h2>
        <div className="flex space-x-2">
          <Dialog open={createGoalDialogOpen} onOpenChange={setCreateGoalDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Target className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Goal</DialogTitle>
                <DialogDescription>Set a new performance goal for an employee</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="goalEmployee">Employee *</Label>
                  <Select value={newGoal.employeeId} onValueChange={(value) => setNewGoal({ ...newGoal, employeeId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="goalTitle">Goal Title *</Label>
                  <Input
                    id="goalTitle"
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    placeholder="Complete training program"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="goalCategory">Category *</Label>
                  <Select value={newGoal.category} onValueChange={(value) => setNewGoal({ ...newGoal, category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {goalCategories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="goalDescription">Description</Label>
                  <Textarea
                    id="goalDescription"
                    value={newGoal.description}
                    onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                    placeholder="Detailed description of the goal"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="goalTargetDate">Target Date</Label>
                  <Input
                    id="goalTargetDate"
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateGoal}>Create Goal</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={createReviewDialogOpen} onOpenChange={setCreateReviewDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Review
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Performance Review</DialogTitle>
                <DialogDescription>Start a new performance review for an employee</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="employee">Employee *</Label>
                  <Select value={newReview.employeeId} onValueChange={(value) => setNewReview({ ...newReview, employeeId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(emp => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">Review Type *</Label>
                  <Select value={newReview.type} onValueChange={(value) => setNewReview({ ...newReview, type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select review type" />
                    </SelectTrigger>
                    <SelectContent>
                      {reviewTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="period">Review Period *</Label>
                  <Input
                    id="period"
                    value={newReview.period}
                    onChange={(e) => setNewReview({ ...newReview, period: e.target.value })}
                    placeholder="Q1 2024"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={newReview.dueDate}
                    onChange={(e) => setNewReview({ ...newReview, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateReview}>Create Review</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReviews}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedReviews} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRating.toFixed(1)}/5</div>
            <p className="text-xs text-muted-foreground">
              Across all reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Goals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGoals}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedGoals} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Reviews</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdueReviews}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reviews" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reviews">Performance Reviews</TabsTrigger>
          <TabsTrigger value="goals">Goals & Objectives</TabsTrigger>
        </TabsList>

        <div className="flex justify-between items-center">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-[300px]"
            />
          </div>
        </div>

        <TabsContent value="reviews" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Reviews</CardTitle>
              <CardDescription>Track and manage employee performance evaluations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Reviewer</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          {review.employeeName}
                        </div>
                      </TableCell>
                      <TableCell>{review.period}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {reviewTypes.find(t => t.value === review.type)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(review.status)}</TableCell>
                      <TableCell>
                        {review.overallRating > 0 ? getRatingStars(review.overallRating) : '-'}
                      </TableCell>
                      <TableCell>{review.reviewerName}</TableCell>
                      <TableCell>
                        <div className={new Date(review.dueDate) < new Date() && review.status !== 'COMPLETED' ? 'text-red-600' : ''}>
                          {format(new Date(review.dueDate), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Goals & Objectives</CardTitle>
              <CardDescription>Track employee goals and development objectives</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Goal</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Target Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGoals.map((goal) => (
                    <TableRow key={goal.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{goal.title}</div>
                          <div className="text-sm text-muted-foreground">{goal.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          {goal.employeeName}
                        </div>
                      </TableCell>
                      <TableCell>{getCategoryBadge(goal.category)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress value={goal.progress} className="w-[60px]" />
                          <span className="text-sm text-muted-foreground">{goal.progress}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(goal.status)}</TableCell>
                      <TableCell>
                        <div className={new Date(goal.targetDate) < new Date() && goal.status !== 'COMPLETED' ? 'text-red-600' : ''}>
                          {format(new Date(goal.targetDate), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1" />
                            Update
                          </Button>
                          {goal.status === 'IN_PROGRESS' && (
                            <Button variant="outline" size="sm">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Complete
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
        </TabsContent>
      </Tabs>
    </div>
  );
}