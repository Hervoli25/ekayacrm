
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
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
import { Plus, Check, X, DollarSign, TrendingDown, Calendar } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Expense {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  receiptUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  creator: {
    name: string;
    email: string;
  };
  approver?: {
    name: string;
    email: string;
  };
  createdAt: string;
}

const EXPENSE_CATEGORIES = [
  { value: 'SUPPLIES', label: 'Supplies' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'MARKETING', label: 'Marketing' },
  { value: 'OFFICE', label: 'Office' },
  { value: 'TRAVEL', label: 'Travel' },
  { value: 'TRAINING', label: 'Training' },
  { value: 'OTHER', label: 'Other' },
];

const PAYMENT_METHODS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' },
  { value: 'DIGITAL_WALLET', label: 'Digital Wallet' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
];

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#ff7300'];

export default function ExpenseTracker() {
  const { data: session } = useSession();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [expenseData, setExpenseData] = useState({
    date: new Date().toISOString().split('T')[0],
    category: '',
    description: '',
    amount: 0,
    paymentMethod: '',
    receiptUrl: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchExpenses();
  }, [filterStatus, dateRange]);

  const fetchExpenses = async () => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        ...(filterStatus ? { status: filterStatus } : {}),
      });

      const response = await fetch(`/api/finance/expenses?${params}`);
      if (!response.ok) throw new Error('Failed to fetch expenses');
      const data = await response.json();
      setExpenses(data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch expenses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createExpense = async () => {
    if (!expenseData.category || !expenseData.description || !expenseData.paymentMethod || expenseData.amount <= 0) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/finance/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });

      if (!response.ok) throw new Error('Failed to create expense');
      
      toast({
        title: 'Success',
        description: 'Expense recorded successfully',
      });
      
      await fetchExpenses();
      setExpenseData({
        date: new Date().toISOString().split('T')[0],
        category: '',
        description: '',
        amount: 0,
        paymentMethod: '',
        receiptUrl: '',
      });
      setDialogOpen(false);
    } catch (error) {
      console.error('Error creating expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to create expense',
        variant: 'destructive',
      });
    }
  };

  const approveExpense = async (expenseId: string, action: 'APPROVED' | 'REJECTED') => {
    try {
      const response = await fetch(`/api/finance/expenses/${expenseId}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) throw new Error('Failed to update expense');
      
      toast({
        title: 'Success',
        description: `Expense ${action.toLowerCase()} successfully`,
      });
      
      await fetchExpenses();
    } catch (error) {
      console.error('Error updating expense:', error);
      toast({
        title: 'Error',
        description: 'Failed to update expense',
        variant: 'destructive',
      });
    }
  };

  // Calculate statistics
  const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
  const pendingExpenses = expenses.filter(exp => exp.status === 'PENDING').length;
  const approvedExpenses = expenses.filter(exp => exp.status === 'APPROVED').reduce((sum, exp) => sum + Number(exp.amount), 0);

  // Category breakdown
  const categoryData = EXPENSE_CATEGORIES.map(cat => {
    const categoryExpenses = expenses.filter(exp => exp.category === cat.value);
    const total = categoryExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    return {
      name: cat.label,
      value: total,
      count: categoryExpenses.length,
    };
  }).filter(cat => cat.value > 0);

  // Monthly trend
  const monthlyData = expenses.reduce((acc, exp) => {
    const month = new Date(exp.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    if (!acc[month]) {
      acc[month] = { month, total: 0, count: 0 };
    }
    acc[month].total += Number(exp.amount);
    acc[month].count += 1;
    return acc;
  }, {} as Record<string, any>);

  const trendData = Object.values(monthlyData).sort((a, b) => 
    new Date(a.month + ' 1').getTime() - new Date(b.month + ' 1').getTime()
  );

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Expense Tracker</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record New Expense</DialogTitle>
              <DialogDescription>
                Add a new business expense for approval
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="expenseDate">Date *</Label>
                  <Input
                    id="expenseDate"
                    type="date"
                    value={expenseData.date}
                    onChange={(e) => setExpenseData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (R) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={expenseData.amount}
                    onChange={(e) => setExpenseData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Category *</Label>
                  <Select 
                    value={expenseData.category} 
                    onValueChange={(value) => setExpenseData(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Payment Method *</Label>
                  <Select 
                    value={expenseData.paymentMethod} 
                    onValueChange={(value) => setExpenseData(prev => ({ ...prev, paymentMethod: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((method) => (
                        <SelectItem key={method.value} value={method.value}>
                          {method.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={expenseData.description}
                  onChange={(e) => setExpenseData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe the expense..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receiptUrl">Receipt URL (optional)</Label>
                <Input
                  id="receiptUrl"
                  type="url"
                  value={expenseData.receiptUrl}
                  onChange={(e) => setExpenseData(prev => ({ ...prev, receiptUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              <Button onClick={createExpense} className="w-full">
                Record Expense
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{totalExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              All recorded expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingExpenses}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R{approvedExpenses.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total approved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>Status Filter</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R${Number(value).toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Expense Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`R${Number(value).toLocaleString()}`, 'Total']} />
                <Bar dataKey="total" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Expense List */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Records</CardTitle>
          <CardDescription>All expense records with approval status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="font-medium">{expense.description}</div>
                    <Badge className={STATUS_COLORS[expense.status]}>
                      {expense.status}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-muted-foreground space-x-4">
                    <span>Category: {EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.label}</span>
                    <span>Date: {new Date(expense.date).toLocaleDateString()}</span>
                    <span>By: {expense.creator.name}</span>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Payment: {PAYMENT_METHODS.find(m => m.value === expense.paymentMethod)?.label}
                    {expense.receiptUrl && (
                      <a href={expense.receiptUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 hover:underline">
                        View Receipt
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      R{Number(expense.amount).toLocaleString()}
                    </div>
                    {expense.approver && (
                      <div className="text-xs text-muted-foreground">
                        Approved by {expense.approver.name}
                      </div>
                    )}
                  </div>

                  {session?.user?.role === 'ADMIN' && expense.status === 'PENDING' && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={() => approveExpense(expense.id, 'APPROVED')}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => approveExpense(expense.id, 'REJECTED')}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {expenses.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No expenses found for the selected criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
