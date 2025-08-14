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
import { showSuccess, showError, showConfirmation } from '@/lib/sweetalert';
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
    targetDate: ''
  });
  const { toast } = useToast();
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editGoalDialogOpen, setEditGoalDialogOpen] = useState(false);
  const [viewingReview, setViewingReview] = useState<PerformanceReview | null>(null);
  const [viewReviewDialogOpen, setViewReviewDialogOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch employees
      const employeesResponse = await fetch('/api/employees');
      const employeesData = employeesResponse.ok ? await employeesResponse.json() : { employees: [] };
      setEmployees(Array.isArray(employeesData) ? employeesData : employeesData.employees || []);

      // Fetch performance reviews
      const reviewsResponse = await fetch('/api/performance/reviews');
      const reviewsData = reviewsResponse.ok ? await reviewsResponse.json() : [];
      
      // Transform reviews data to match component interface
      const transformedReviews = reviewsData.map((review: any) => ({
        id: review.id,
        employeeId: review.employeeId,
        employeeName: review.employee?.name || 'Unknown',
        reviewerName: review.reviewer?.name || 'Unknown',
        period: review.reviewPeriod,
        type: 'QUARTERLY', // Default type, could be enhanced
        status: review.status,
        overallRating: review.overallRating ? parseFloat(review.overallRating.toString()) : 0,
        goals: review.goals || [],
        competencies: review.ratings?.map((r: any) => ({
          id: r.id,
          name: r.category,
          category: r.category,
          rating: r.rating,
          comments: r.comments
        })) || [],
        feedback: review.strengths || '',
        improvementPlan: review.areasForImprovement || '',
        createdAt: review.createdAt,
        dueDate: review.dueDate,
        completedAt: review.reviewDate
      }));

      // Fetch goals
      const goalsResponse = await fetch('/api/performance/goals');
      const goalsData = goalsResponse.ok ? await goalsResponse.json() : [];
      
      // Transform goals data to match component interface
      const transformedGoals = goalsData.map((goal: any) => ({
        id: goal.id,
        title: goal.title,
        description: goal.description || '',
        category: 'DEVELOPMENT', // Default category, could be enhanced
        status: goal.status,
        progress: goal.progress,
        targetDate: goal.targetDate,
        employeeId: goal.employeeId,
        employeeName: goal.employee?.name || 'Unknown'
      }));

      setReviews(transformedReviews);
      setGoals(transformedGoals);
    } catch (error) {
      console.error('Error fetching data:', error);
      await showError('Error', 'Failed to fetch performance data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReview = async () => {
    if (!newReview.employeeId || !newReview.type || !newReview.period) {
      await showError('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/performance/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: employees.find(emp => emp.id === newReview.employeeId)?.userId || newReview.employeeId,
          reviewPeriod: newReview.period,
          dueDate: newReview.dueDate,
          reviewType: newReview.type
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create review');
      }

      const createdReview = await response.json();
      
      // Transform the response to match component interface
      const transformedReview: PerformanceReview = {
        id: createdReview.id,
        employeeId: createdReview.employeeId,
        employeeName: createdReview.employee?.name || 'Unknown',
        reviewerName: createdReview.reviewer?.name || 'Current User',
        period: createdReview.reviewPeriod,
        type: newReview.type as any,
        status: 'DRAFT',
        overallRating: 0,
        goals: [],
        competencies: [],
        feedback: '',
        improvementPlan: '',
        createdAt: createdReview.createdAt,
        dueDate: createdReview.dueDate
      };

      setReviews(prev => [transformedReview, ...prev]);
      setCreateReviewDialogOpen(false);
      setNewReview({ employeeId: '', type: '', period: '', dueDate: '' });

      await showSuccess('Success', 'Performance review created successfully');
    } catch (error) {
      console.error('Error creating review:', error);
      await showError('Error', 'Failed to create performance review');
    }
  };

  const handleCreateGoal = async () => {
    if (!newGoal.employeeId || !newGoal.title) {
      await showError('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/performance/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId: employees.find(emp => emp.id === newGoal.employeeId)?.userId || newGoal.employeeId,
          title: newGoal.title,
          description: newGoal.description,
          targetDate: newGoal.targetDate
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create goal');
      }

      const createdGoal = await response.json();
      
      // Transform the response to match component interface
      const transformedGoal: Goal = {
        id: createdGoal.id,
        title: createdGoal.title,
        description: createdGoal.description || '',
        category: 'PERFORMANCE' as any, // Default category since it's not in the database
        status: 'IN_PROGRESS',
        progress: createdGoal.progress || 0,
        targetDate: createdGoal.targetDate,
        employeeId: createdGoal.employeeId,
        employeeName: createdGoal.employee?.name || 'Unknown'
      };

      setGoals(prev => [transformedGoal, ...prev]);
      setCreateGoalDialogOpen(false);
      setNewGoal({ employeeId: '', title: '', description: '', targetDate: '' });

      await showSuccess('Success', 'Goal created successfully');
    } catch (error) {
      console.error('Error creating goal:', error);
      await showError('Error', 'Failed to create goal');
    }
  };

  const handleUpdateGoal = async (goalId: string, updates: Partial<Goal>) => {
    try {
      const response = await fetch(`/api/performance/goals/${goalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update goal');
      }

      const updatedGoal = await response.json();
      
      setGoals(prev => prev.map(goal => 
        goal.id === goalId 
          ? {
              ...goal,
              title: updatedGoal.title || goal.title,
              description: updatedGoal.description || goal.description,
              progress: updatedGoal.progress !== undefined ? updatedGoal.progress : goal.progress,
              status: updatedGoal.status || goal.status,
              targetDate: updatedGoal.targetDate || goal.targetDate
            }
          : goal
      ));

      await showSuccess('Success', 'Goal updated successfully');
    } catch (error) {
      console.error('Error updating goal:', error);
      await showError('Error', 'Failed to update goal');
    }
  };

  const handleCompleteGoal = async (goalId: string) => {
    const result = await showConfirmation(
      'Complete Goal',
      'Are you sure you want to mark this goal as completed?',
      'Yes, complete it',
      'Cancel'
    );

    if (result.isConfirmed) {
      await handleUpdateGoal(goalId, { status: 'COMPLETED', progress: 100 });
    }
  };

  const handleViewReview = (review: PerformanceReview) => {
    setViewingReview(review);
    setViewReviewDialogOpen(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setEditGoalDialogOpen(true);
  };

  const handleSaveGoalEdit = async () => {
    if (!editingGoal) return;
    
    await handleUpdateGoal(editingGoal.id, {
      title: editingGoal.title,
      description: editingGoal.description,
      progress: editingGoal.progress,
      status: editingGoal.status,
      targetDate: editingGoal.targetDate
    });
    
    setEditGoalDialogOpen(false);
    setEditingGoal(null);
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
                      {Array.isArray(employees) && employees.map(emp => (
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
                      {Array.isArray(employees) && employees.map(emp => (
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
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewReview(review)}
                          >
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
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditGoal(goal)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Update
                          </Button>
                          {goal.status !== 'COMPLETED' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleCompleteGoal(goal.id)}
                            >
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

      {/* View Review Dialog */}
      <Dialog open={viewReviewDialogOpen} onOpenChange={setViewReviewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Performance Review Details</DialogTitle>
            <DialogDescription>
              Review for {viewingReview?.employeeName} - {viewingReview?.period}
            </DialogDescription>
          </DialogHeader>
          {viewingReview && (
            <div className="grid gap-4 py-4 max-h-[500px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Employee</Label>
                  <div className="font-medium">{viewingReview.employeeName}</div>
                </div>
                <div>
                  <Label>Reviewer</Label>
                  <div className="font-medium">{viewingReview.reviewerName}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Period</Label>
                  <div className="font-medium">{viewingReview.period}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div>{getStatusBadge(viewingReview.status)}</div>
                </div>
              </div>
              {viewingReview.overallRating > 0 && (
                <div>
                  <Label>Overall Rating</Label>
                  <div>{getRatingStars(viewingReview.overallRating)}</div>
                </div>
              )}
              {viewingReview.feedback && (
                <div>
                  <Label>Feedback</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">{viewingReview.feedback}</div>
                </div>
              )}
              {viewingReview.improvementPlan && (
                <div>
                  <Label>Improvement Plan</Label>
                  <div className="p-3 bg-gray-50 rounded-lg">{viewingReview.improvementPlan}</div>
                </div>
              )}
              {viewingReview.competencies.length > 0 && (
                <div>
                  <Label>Competency Ratings</Label>
                  <div className="space-y-2">
                    {viewingReview.competencies.map((comp) => (
                      <div key={comp.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="font-medium">{comp.name}</span>
                        <div>{getRatingStars(comp.rating)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <Label>Created</Label>
                  <div>{format(new Date(viewingReview.createdAt), 'MMM dd, yyyy HH:mm')}</div>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <div>{format(new Date(viewingReview.dueDate), 'MMM dd, yyyy')}</div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Goal Dialog */}
      <Dialog open={editGoalDialogOpen} onOpenChange={setEditGoalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Goal</DialogTitle>
            <DialogDescription>Modify goal details and track progress</DialogDescription>
          </DialogHeader>
          {editingGoal && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="editTitle">Goal Title</Label>
                <Input
                  id="editTitle"
                  value={editingGoal.title}
                  onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={editingGoal.description}
                  onChange={(e) => setEditingGoal({ ...editingGoal, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="editProgress">Progress (%)</Label>
                  <Input
                    id="editProgress"
                    type="number"
                    min="0"
                    max="100"
                    value={editingGoal.progress}
                    onChange={(e) => setEditingGoal({ ...editingGoal, progress: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="editStatus">Status</Label>
                  <Select value={editingGoal.status} onValueChange={(value) => setEditingGoal({ ...editingGoal, status: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="OVERDUE">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editTargetDate">Target Date</Label>
                <Input
                  id="editTargetDate"
                  type="date"
                  value={editingGoal.targetDate ? new Date(editingGoal.targetDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setEditingGoal({ ...editingGoal, targetDate: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleSaveGoalEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}