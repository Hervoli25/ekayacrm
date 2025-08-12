'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  TrendingUp,
  TrendingDown,
  Receipt,
  CreditCard,
  PieChart,
  BarChart3,
  Calculator,
  Wallet,
  BanknoteIcon,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Building,
  Users,
  Target,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { useToast } from '@/hooks/use-toast';

interface FinanceMetrics {
  revenue: {
    total: number;
    monthly: number;
    growth: number;
    target: number;
    achievement: number;
    bySource: Record<string, number>;
    recurring: number;
    oneTime: number;
  };
  expenses: {
    total: number;
    monthly: number;
    payroll: number;
    operations: number;
    approved: number;
    pending: number;
    rejected: number;
    overBudget: number;
    savings: number;
  };
  payroll: {
    totalSalaries: number;
    monthlyPayroll: number;
    overtime: number;
    benefits: number;
    taxes: number;
    bonuses: number;
    deductions: number;
    netPay: number;
    averageSalary: number;
    payrollGrowth: number;
  };
  cashflow: {
    netCashFlow: number;
    operatingCashFlow: number;
    investingCashFlow: number;
    financingCashFlow: number;
    currentRatio: number;
    quickRatio: number;
    burnRate: number;
    runway: number;
  };
  budgets: {
    allocated: number;
    spent: number;
    remaining: number;
    utilization: number;
    departmentBudgets: Record<string, {
      allocated: number;
      spent: number;
      remaining: number;
      utilization: number;
    }>;
  };
  kpis: {
    profitMargin: number;
    revenuePerEmployee: number;
    costPerEmployee: number;
    ebitda: number;
    grossProfit: number;
    operatingProfit: number;
    roi: number;
    costOfRevenue: number;
  };
  receivables: {
    total: number;
    overdue: number;
    current: number;
    aging30: number;
    aging60: number;
    aging90: number;
    averageDaysOutstanding: number;
  };
  trends: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
    cashflow: number;
    payroll: number;
  }>;
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export function FinanceManagementTab() {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<FinanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');
  const [selectedView, setSelectedView] = useState('overview');

  useEffect(() => {
    fetchFinanceMetrics();
  }, [selectedPeriod, selectedView]);

  const fetchFinanceMetrics = async () => {
    try {
      setLoading(true);
      
      // Mock data - in practice, this would come from finance/accounting systems
      const mockMetrics: FinanceMetrics = {
        revenue: {
          total: 12500000,
          monthly: 1040833,
          growth: 12.5,
          target: 15000000,
          achievement: 83.3,
          bySource: {
            'Trading Revenue': 8500000,
            'Investment Income': 2800000,
            'Consulting Fees': 850000,
            'Other Income': 350000
          },
          recurring: 9200000,
          oneTime: 3300000
        },
        expenses: {
          total: 8750000,
          monthly: 729167,
          payroll: 5200000,
          operations: 2100000,
          approved: 127,
          pending: 23,
          rejected: 8,
          overBudget: 3,
          savings: 450000
        },
        payroll: {
          totalSalaries: 4680000,
          monthlyPayroll: 390000,
          overtime: 180000,
          benefits: 520000,
          taxes: 936000,
          bonuses: 340000,
          deductions: 156000,
          netPay: 4064000,
          averageSalary: 95000,
          payrollGrowth: 8.3
        },
        cashflow: {
          netCashFlow: 3750000,
          operatingCashFlow: 4200000,
          investingCashFlow: -850000,
          financingCashFlow: -600000,
          currentRatio: 2.4,
          quickRatio: 1.8,
          burnRate: 729167,
          runway: 18.2
        },
        budgets: {
          allocated: 9500000,
          spent: 7200000,
          remaining: 2300000,
          utilization: 75.8,
          departmentBudgets: {
            'Trading': { allocated: 4200000, spent: 3100000, remaining: 1100000, utilization: 73.8 },
            'Operations': { allocated: 2100000, spent: 1650000, remaining: 450000, utilization: 78.6 },
            'Technology': { allocated: 1800000, spent: 1250000, remaining: 550000, utilization: 69.4 },
            'Marketing': { allocated: 850000, spent: 680000, remaining: 170000, utilization: 80.0 },
            'HR': { allocated: 550000, spent: 520000, remaining: 30000, utilization: 94.5 }
          }
        },
        kpis: {
          profitMargin: 30.0,
          revenuePerEmployee: 247500,
          costPerEmployee: 173250,
          ebitda: 4100000,
          grossProfit: 8900000,
          operatingProfit: 3750000,
          roi: 24.5,
          costOfRevenue: 3600000
        },
        receivables: {
          total: 2400000,
          overdue: 380000,
          current: 1850000,
          aging30: 280000,
          aging60: 180000,
          aging90: 90000,
          averageDaysOutstanding: 42
        },
        trends: [
          { month: 'Jan', revenue: 950000, expenses: 680000, profit: 270000, cashflow: 320000, payroll: 385000 },
          { month: 'Feb', revenue: 1080000, expenses: 720000, profit: 360000, cashflow: 410000, payroll: 390000 },
          { month: 'Mar', revenue: 1150000, expenses: 750000, profit: 400000, cashflow: 450000, payroll: 395000 },
          { month: 'Apr', revenue: 1020000, expenses: 710000, profit: 310000, cashflow: 380000, payroll: 388000 },
          { month: 'May', revenue: 1200000, expenses: 780000, profit: 420000, cashflow: 480000, payroll: 392000 },
          { month: 'Jun', revenue: 1350000, expenses: 850000, profit: 500000, cashflow: 520000, payroll: 398000 }
        ]
      };
      
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error fetching finance metrics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch finance metrics',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <Activity className="h-6 w-6 animate-spin mr-2" />
          Loading finance metrics...
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  const revenueData = Object.entries(metrics.revenue.bySource).map(([source, amount]) => ({
    name: source,
    value: amount,
    color: COLORS[Object.keys(metrics.revenue.bySource).indexOf(source)]
  }));

  const budgetData = Object.entries(metrics.budgets.departmentBudgets).map(([dept, data]) => ({
    name: dept,
    allocated: data.allocated,
    spent: data.spent,
    remaining: data.remaining,
    utilization: data.utilization
  }));

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Financial Dashboard</h3>
          <p className="text-sm text-gray-600">Comprehensive financial analytics and insights</p>
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
          
          <Select value={selectedView} onValueChange={setSelectedView}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select view" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="revenue">Revenue Focus</SelectItem>
              <SelectItem value="expenses">Expense Focus</SelectItem>
              <SelectItem value="cashflow">Cash Flow</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600">{formatCurrency(metrics.revenue.total)}</p>
                <p className="text-xs text-green-500 flex items-center">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +{formatPercentage(metrics.revenue.growth)} growth
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-3xl font-bold text-red-600">{formatCurrency(metrics.expenses.total)}</p>
                <p className="text-xs text-green-500">
                  Saved {formatCurrency(metrics.expenses.savings)}
                </p>
              </div>
              <Receipt className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Cash Flow</p>
                <p className="text-3xl font-bold text-blue-600">{formatCurrency(metrics.cashflow.netCashFlow)}</p>
                <p className="text-xs text-gray-500">
                  {metrics.cashflow.runway} months runway
                </p>
              </div>
              <Wallet className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Profit Margin</p>
                <p className="text-3xl font-bold text-purple-600">{formatPercentage(metrics.kpis.profitMargin)}</p>
                <p className="text-xs text-purple-500">
                  ROI: {formatPercentage(metrics.kpis.roi)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue & Expense Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Revenue Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Target Achievement</span>
                <Badge className="bg-blue-100 text-blue-800">
                  {formatPercentage(metrics.revenue.achievement)}
                </Badge>
              </div>
              <Progress value={metrics.revenue.achievement} className="h-3" />
              
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={revenueData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="value"
                      label={({ name, percent }) => `${name.split(' ')[0]} ${(percent * 100).toFixed(0)}%`}
                    >
                      {revenueData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center p-2 bg-blue-50 rounded">
                  <p className="font-bold text-blue-600">{formatCurrency(metrics.revenue.recurring)}</p>
                  <p className="text-blue-600">Recurring</p>
                </div>
                <div className="text-center p-2 bg-green-50 rounded">
                  <p className="font-bold text-green-600">{formatCurrency(metrics.revenue.oneTime)}</p>
                  <p className="text-green-600">One-time</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expense Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calculator className="h-5 w-5 mr-2" />
              Expense Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{metrics.expenses.approved}</p>
                <p className="text-xs text-gray-600">Approved</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{metrics.expenses.pending}</p>
                <p className="text-xs text-gray-600">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{metrics.expenses.rejected}</p>
                <p className="text-xs text-gray-600">Rejected</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Payroll</span>
                  <span>{formatCurrency(metrics.expenses.payroll)}</span>
                </div>
                <Progress value={(metrics.expenses.payroll / metrics.expenses.total) * 100} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Operations</span>
                  <span>{formatCurrency(metrics.expenses.operations)}</span>
                </div>
                <Progress value={(metrics.expenses.operations / metrics.expenses.total) * 100} className="h-2" />
              </div>
            </div>

            {metrics.expenses.overBudget > 0 && (
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="flex items-center text-red-800">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">
                    {metrics.expenses.overBudget} departments over budget
                  </span>
                </div>
              </div>
            )}

            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-lg font-bold text-green-600">{formatCurrency(metrics.expenses.savings)}</p>
              <p className="text-xs text-green-600">Cost Savings This Year</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll & Budget Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payroll Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Payroll Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Monthly Payroll</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.payroll.monthlyPayroll)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Salary</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.payroll.averageSalary)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Base Salaries</span>
                <span className="font-medium">{formatCurrency(metrics.payroll.totalSalaries)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Overtime Pay</span>
                <span className="font-medium text-yellow-600">{formatCurrency(metrics.payroll.overtime)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Benefits</span>
                <span className="font-medium">{formatCurrency(metrics.payroll.benefits)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Bonuses</span>
                <span className="font-medium text-green-600">{formatCurrency(metrics.payroll.bonuses)}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="font-medium">Net Payroll</span>
                <span className="font-bold">{formatCurrency(metrics.payroll.netPay)}</span>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">Payroll Growth</span>
                <div className="flex items-center text-blue-600">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="font-bold">+{formatPercentage(metrics.payroll.payrollGrowth)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget Utilization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Budget Utilization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Overall Utilization</span>
              <Badge className="bg-blue-100 text-blue-800">
                {formatPercentage(metrics.budgets.utilization)}
              </Badge>
            </div>
            <Progress value={metrics.budgets.utilization} className="h-3" />
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <p className="text-gray-600">Allocated</p>
                <p className="font-bold">{formatCurrency(metrics.budgets.allocated)}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600">Spent</p>
                <p className="font-bold text-red-600">{formatCurrency(metrics.budgets.spent)}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600">Remaining</p>
                <p className="font-bold text-green-600">{formatCurrency(metrics.budgets.remaining)}</p>
              </div>
            </div>

            <div className="space-y-2">
              {Object.entries(metrics.budgets.departmentBudgets).map(([dept, data]) => (
                <div key={dept} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{dept}</span>
                    <span className="font-medium">{formatPercentage(data.utilization)}</span>
                  </div>
                  <Progress 
                    value={data.utilization} 
                    className="h-1"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Performance Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Key Performance Indicators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-lg font-bold text-green-600">{formatCurrency(metrics.kpis.ebitda)}</p>
              <p className="text-xs text-green-600">EBITDA</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-lg font-bold text-blue-600">{formatPercentage(metrics.kpis.profitMargin)}</p>
              <p className="text-xs text-blue-600">Profit Margin</p>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <p className="text-lg font-bold text-purple-600">{formatPercentage(metrics.kpis.roi)}</p>
              <p className="text-xs text-purple-600">ROI</p>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <p className="text-lg font-bold text-orange-600">{formatCurrency(metrics.kpis.revenuePerEmployee)}</p>
              <p className="text-xs text-orange-600">Revenue/Employee</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-lg font-bold text-red-600">{formatCurrency(metrics.kpis.costPerEmployee)}</p>
              <p className="text-xs text-red-600">Cost/Employee</p>
            </div>
            <div className="text-center p-3 bg-teal-50 rounded-lg">
              <p className="text-lg font-bold text-teal-600">{formatCurrency(metrics.kpis.grossProfit)}</p>
              <p className="text-xs text-teal-600">Gross Profit</p>
            </div>
            <div className="text-center p-3 bg-indigo-50 rounded-lg">
              <p className="text-lg font-bold text-indigo-600">{formatCurrency(metrics.kpis.operatingProfit)}</p>
              <p className="text-xs text-indigo-600">Operating Profit</p>
            </div>
            <div className="text-center p-3 bg-pink-50 rounded-lg">
              <p className="text-lg font-bold text-pink-600">{metrics.cashflow.currentRatio.toFixed(1)}</p>
              <p className="text-xs text-pink-600">Current Ratio</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Financial Trends (6 Month View)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={metrics.trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => [formatCurrency(Number(value)), '']} />
              <Area type="monotone" dataKey="revenue" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Revenue" />
              <Area type="monotone" dataKey="expenses" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} name="Expenses" />
              <Line type="monotone" dataKey="profit" stroke="#3b82f6" strokeWidth={3} name="Profit" />
              <Line type="monotone" dataKey="cashflow" stroke="#8b5cf6" strokeWidth={2} name="Cash Flow" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Receivables & Cash Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accounts Receivable */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              Accounts Receivable
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Outstanding</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.receivables.total)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Average DSO</p>
                <p className="text-2xl font-bold text-yellow-600">{metrics.receivables.averageDaysOutstanding} days</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current (0-30 days)</span>
                <span className="font-medium text-green-600">{formatCurrency(metrics.receivables.current)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>30-60 days</span>
                <span className="font-medium text-yellow-600">{formatCurrency(metrics.receivables.aging30)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>60-90 days</span>
                <span className="font-medium text-orange-600">{formatCurrency(metrics.receivables.aging60)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>90+ days</span>
                <span className="font-medium text-red-600">{formatCurrency(metrics.receivables.aging90)}</span>
              </div>
            </div>

            {metrics.receivables.overdue > 0 && (
              <div className="bg-red-50 p-3 rounded-lg">
                <div className="flex items-center text-red-800">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">
                    {formatCurrency(metrics.receivables.overdue)} overdue
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cash Flow Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wallet className="h-5 w-5 mr-2" />
              Cash Flow Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Operating Cash Flow</span>
                <div className="flex items-center">
                  <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                  <span className="font-medium text-green-600">
                    {formatCurrency(metrics.cashflow.operatingCashFlow)}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Investing Cash Flow</span>
                <div className="flex items-center">
                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                  <span className="font-medium text-red-600">
                    {formatCurrency(metrics.cashflow.investingCashFlow)}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Financing Cash Flow</span>
                <div className="flex items-center">
                  <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                  <span className="font-medium text-red-600">
                    {formatCurrency(metrics.cashflow.financingCashFlow)}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center border-t pt-2">
                <span className="font-medium">Net Cash Flow</span>
                <span className="font-bold text-blue-600">
                  {formatCurrency(metrics.cashflow.netCashFlow)}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-lg font-bold text-blue-600">{metrics.cashflow.currentRatio.toFixed(1)}</p>
                <p className="text-xs text-blue-600">Current Ratio</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-lg font-bold text-green-600">{metrics.cashflow.quickRatio.toFixed(1)}</p>
                <p className="text-xs text-green-600">Quick Ratio</p>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">Cash Runway</span>
                <span className="font-bold text-blue-600">{metrics.cashflow.runway.toFixed(1)} months</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}