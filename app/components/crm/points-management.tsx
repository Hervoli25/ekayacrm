"use client";

// 🎯 CRM Points Management Component
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Gift, 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  DollarSign,
  Users,
  Award,
  Clock,
  History,
  Settings,
  Plus,
  Minus,
  Search,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface PointsBalance {
  currentBalance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  lifetimeExpired: number;
  expiringBalance: number;
  recentTransactions: Array<{
    id: string;
    date: string;
    type: string;
    points: number;
    description: string;
    expires?: string;
  }>;
}

interface PointsAnalytics {
  totalPointsOutstanding: number;
  totalLifetimeEarned: number;
  totalLifetimeRedeemed: number;
  activePointsUsers: number;
  pointsLiabilityInCents: number;
  averagePointsPerUser: number;
}

interface PointsConfig {
  pointsPerRand: number;
  minimumSpend: number;
  membershipMultipliers: {
    BASIC: number;
    PREMIUM: number;
    ELITE: number;
  };
  pointValue: number;
  minimumRedemption: number;
  maxRedemptionPercent: number;
  pointsValidityDays: number;
  expirationWarningDays: number;
}

interface PointsManagementProps {
  customerId?: string;
  customerName?: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  loyaltyPoints: number;
}

export function PointsManagement({ customerId, customerName }: PointsManagementProps) {
  const [activeTab, setActiveTab] = useState('admin-tools');
  const [pointsBalance, setPointsBalance] = useState<PointsBalance | null>(null);
  const [analytics, setAnalytics] = useState<PointsAnalytics | null>(null);
  const [config, setConfig] = useState<PointsConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);
  
  // Customer search and selection
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  // Manual points adjustment
  const [adjustmentDialog, setAdjustmentDialog] = useState(false);
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentAction, setAdjustmentAction] = useState<'award' | 'deduct'>('award');
  const [seedingData, setSeedingData] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(customerSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  // Memoized filtered customers
  const filteredCustomers = useMemo(() => {
    if (!debouncedSearch) return customers.slice(0, 20); // Show first 20 when no search
    
    return customers.filter(customer => 
      customer.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      customer.email.toLowerCase().includes(debouncedSearch.toLowerCase())
    ).slice(0, 10);
  }, [customers, debouncedSearch]);

  // Load all customers for admin selection
  const loadCustomers = useCallback(async () => {
    setCustomersLoading(true);
    try {
      const response = await fetch('/api/crm/customers?search=&tier=all');
      const data = await response.json();
      
      if (data.customers) {
        // Map customer data with actual points
        const customerData = data.customers.map((customer: any) => ({
          id: customer.id,
          name: customer.name || 'Unknown User',
          email: customer.email || '',
          loyaltyPoints: customer.loyaltyPoints || 0
        }));
        setCustomers(customerData);
        toast.success(`Loaded ${customerData.length} customers`);
      } else {
        toast.error('Failed to load customers');
      }
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Error loading customers');
    } finally {
      setCustomersLoading(false);
    }
  }, []);

  // Load customer points balance
  const loadCustomerPoints = async (userId?: string) => {
    const targetId = userId || customerId;
    if (!targetId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/crm/customers/${targetId}/points`);
      const data = await response.json();
      
      if (data.success) {
        setPointsBalance(data);
      } else {
        toast.error('Failed to load customer points');
      }
    } catch (error) {
      console.error('Error loading customer points:', error);
      toast.error('Failed to load customer points');
    }
    setLoading(false);
  };

  // Load points analytics
  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/crm/points/analytics');
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data);
      } else {
        toast.error('Failed to load analytics');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Error loading analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load points configuration
  const loadConfig = useCallback(async () => {
    try {
      const response = await fetch('/api/crm/points/config');
      const data = await response.json();
      
      if (data.success) {
        setConfig(data);
      } else {
        toast.error('Failed to load points configuration');
      }
    } catch (error) {
      console.error('Error loading config:', error);
      toast.error('Error loading configuration');
    }
  }, []);

  // Handle customer selection
  const handleCustomerSelect = async (customer: Customer) => {
    setSelectedCustomer(customer);
    await loadCustomerPoints(customer.id);
    
    // Update the selected customer with actual points from the balance
    if (pointsBalance) {
      setSelectedCustomer({
        ...customer,
        loyaltyPoints: pointsBalance.currentBalance
      });
    }
  };

  // Handle manual points adjustment
  const handlePointsAdjustment = async () => {
    const targetCustomerId = selectedCustomer?.id || customerId;
    
    if (!targetCustomerId || !adjustmentAmount || !adjustmentReason) {
      toast.error('Please select a customer and fill in all fields');
      return;
    }

    // Add loading state to prevent multiple clicks
    const loadingToast = toast.loading(`${adjustmentAction === 'award' ? 'Awarding' : 'Deducting'} ${adjustmentAmount} points...`);

    try {
      console.log('Sending request:', {
        customerId: targetCustomerId,
        amount: parseInt(adjustmentAmount),
        reason: adjustmentReason,
        action: adjustmentAction
      });

      const response = await fetch(`/api/crm/customers/${targetCustomerId}/points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseInt(adjustmentAmount),
          reason: adjustmentReason,
          action: adjustmentAction
        })
      });

      const data = await response.json();
      console.log('Response:', data);
      
      if (data.success) {
        toast.success(data.message, { id: loadingToast });
        setAdjustmentDialog(false);
        setAdjustmentAmount('');
        setAdjustmentReason('');
        await loadCustomerPoints(targetCustomerId); // Reload balance
        await loadAnalytics(); // Reload analytics to show updated totals
      } else {
        toast.error(data.error || 'Failed to adjust points', { id: loadingToast });
      }
    } catch (error) {
      console.error('Error adjusting points:', error);
      toast.error('Network error occurred', { id: loadingToast });
    }
  };

  useEffect(() => {
    if (customerId) {
      loadCustomerPoints();
    }
    loadCustomers(); // Load all customers for admin
    loadAnalytics();
    loadConfig();
  }, [customerId, loadCustomers, loadAnalytics, loadConfig]);

  // Create test data
  const createTestData = useCallback(async () => {
    setSeedingData(true);
    const loadingToast = toast.loading('Creating test data...');
    
    try {
      const response = await fetch('/api/crm/points/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        toast.success(
          `Test data created successfully! ${data.summary?.manualAwards || 0} manual awards, ${data.summary?.simulatedBookings || 0} simulated bookings`,
          { id: loadingToast }
        );
        
        // Reload all data
        await Promise.all([
          loadCustomers(),
          loadAnalytics()
        ]);
        
      } else {
        toast.error(data.error || 'Failed to create test data', { id: loadingToast });
      }
    } catch (error) {
      console.error('Error creating test data:', error);
      toast.error('Network error: Failed to create test data', { id: loadingToast });
    } finally {
      setSeedingData(false);
    }
  }, [loadCustomers, loadAnalytics]);

  // Admin Tools Tab
  const AdminToolsTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold mb-2">Admin Points Management</h3>
            <p className="text-muted-foreground">Search and select a customer to manage their points</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadCustomers}
            disabled={customersLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${customersLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Customer Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Customer Search
              </div>
              {customers.length > 0 && (
                <Badge variant="outline">{customers.length} customers loaded</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search customers by name or email..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {customersLoading && (
                <div className="text-center py-4">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-2">Loading customers...</p>
                </div>
              )}
              
              {!customersLoading && filteredCustomers.length > 0 && (
                <div className="max-h-60 overflow-y-auto border rounded">
                  {filteredCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      onClick={() => handleCustomerSelect(customer)}
                      className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                        selectedCustomer?.id === customer.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{customer.loyaltyPoints.toLocaleString()} pts</p>
                          <p className="text-xs text-muted-foreground">
                            ≈ R{((customer.loyaltyPoints * (config?.pointValue || 0.01))).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!customersLoading && customers.length > 0 && filteredCustomers.length === 0 && customerSearch && (
                <div className="text-center py-4 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No customers found matching "{customerSearch}"</p>
                  <p className="text-xs">Try a different search term</p>
                </div>
              )}

              {!customersLoading && customers.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No customers loaded</p>
                  <Button variant="outline" size="sm" onClick={loadCustomers} className="mt-2">
                    Load Customers
                  </Button>
                </div>
              )}
              
              {selectedCustomer && (
                <Alert>
                  <Award className="h-4 w-4" />
                  <AlertDescription>
                    Selected: <strong>{selectedCustomer.name}</strong> ({selectedCustomer.loyaltyPoints.toLocaleString()} points)
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Test Data Creation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Test Data
            </CardTitle>
            <CardDescription>
              Create test data to see the points system in action
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={createTestData}
              className="w-full"
              variant="outline"
              disabled={seedingData}
            >
              {seedingData ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating Test Data...
                </>
              ) : (
                <>
                  <Gift className="h-4 w-4 mr-2" />
                  Create Test Points Data
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              This will add sample points to existing users for testing purposes
            </p>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button 
            onClick={() => setAdjustmentDialog(true)}
            disabled={!selectedCustomer}
            className="h-20 flex flex-col"
          >
            <Award className="h-6 w-6 mb-2" />
            Manage Points
          </Button>
          
          <Button 
            variant="outline"
            onClick={async () => {
              if (selectedCustomer) {
                // Directly award points without opening dialog
                const loadingToast = toast.loading('Awarding 1000 test points...');
                
                try {
                  const response = await fetch(`/api/crm/customers/${selectedCustomer.id}/points`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      amount: 1000,
                      reason: 'Quick test bonus points',
                      action: 'award'
                    })
                  });

                  const data = await response.json();
                  
                  if (data.success) {
                    toast.success('Successfully awarded 1000 points!', { id: loadingToast });
                    await loadCustomerPoints(selectedCustomer.id);
                    await loadAnalytics();
                    await loadCustomers(); // Refresh customer list
                  } else {
                    toast.error(data.error || 'Failed to award points', { id: loadingToast });
                  }
                } catch (error) {
                  console.error('Error awarding points:', error);
                  toast.error('Network error occurred', { id: loadingToast });
                }
              }
            }}
            disabled={!selectedCustomer}
            className="h-20 flex flex-col"
          >
            <Plus className="h-6 w-6 mb-2 text-green-600" />
            Quick +1000
          </Button>
          
          <Button 
            variant="outline"
            onClick={async () => {
              if (selectedCustomer) {
                // Directly deduct points without opening dialog
                const loadingToast = toast.loading('Deducting 500 test points...');
                
                try {
                  const response = await fetch(`/api/crm/customers/${selectedCustomer.id}/points`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      amount: 500,
                      reason: 'Quick test point deduction',
                      action: 'deduct'
                    })
                  });

                  const data = await response.json();
                  
                  if (data.success) {
                    toast.success('Successfully deducted 500 points!', { id: loadingToast });
                    await loadCustomerPoints(selectedCustomer.id);
                    await loadAnalytics();
                    await loadCustomers(); // Refresh customer list
                  } else {
                    toast.error(data.error || 'Failed to deduct points', { id: loadingToast });
                  }
                } catch (error) {
                  console.error('Error deducting points:', error);
                  toast.error('Network error occurred', { id: loadingToast });
                }
              }
            }}
            disabled={!selectedCustomer}
            className="h-20 flex flex-col"
          >
            <Minus className="h-6 w-6 mb-2 text-red-600" />
            Quick -500
          </Button>
        </div>
      </div>
    );
  };

  // Customer Points Overview Tab
  const CustomerPointsOverview = () => {
    if (!pointsBalance) return <div>Loading customer points...</div>;

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold">
              Points Balance for {selectedCustomer?.name || customerName || 'Unknown Customer'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Customer ID: {selectedCustomer?.id || customerId}
            </p>
          </div>
          <Dialog open={adjustmentDialog} onOpenChange={setAdjustmentDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Adjust Points
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Manual Points Adjustment</DialogTitle>
                <DialogDescription>
                  Award or deduct points for {selectedCustomer?.name || customerName || 'selected customer'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="action">Action</Label>
                  <Select value={adjustmentAction} onValueChange={(value: 'award' | 'deduct') => setAdjustmentAction(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="award">
                        <div className="flex items-center">
                          <Plus className="h-4 w-4 mr-2 text-green-600" />
                          Award Points
                        </div>
                      </SelectItem>
                      <SelectItem value="deduct">
                        <div className="flex items-center">
                          <Minus className="h-4 w-4 mr-2 text-red-600" />
                          Deduct Points
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={adjustmentAmount}
                    onChange={(e) => setAdjustmentAmount(e.target.value)}
                    placeholder="Enter points amount"
                  />
                </div>
                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="Enter reason for adjustment"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAdjustmentDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handlePointsAdjustment}>
                  {adjustmentAction === 'award' ? 'Award Points' : 'Deduct Points'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
              <Award className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pointsBalance.currentBalance.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                ≈ R{((pointsBalance.currentBalance * (config?.pointValue || 0.01))).toFixed(2)} value
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lifetime Earned</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {pointsBalance.lifetimeEarned.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lifetime Redeemed</CardTitle>
              <Gift className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {pointsBalance.lifetimeRedeemed.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">
                {pointsBalance.expiringBalance.toLocaleString()}
              </div>
              {pointsBalance.expiringBalance > 0 && (
                <Alert className="mt-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Points expiring in next 30 days
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <History className="h-5 w-5 mr-2" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pointsBalance.recentTransactions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pointsBalance.recentTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="text-sm">
                        {new Date(transaction.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.points > 0 ? "default" : "secondary"}>
                          {transaction.type.replace('_', ' ').toLowerCase()}
                        </Badge>
                      </TableCell>
                      <TableCell className={`font-medium ${transaction.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.points > 0 ? '+' : ''}{transaction.points}
                      </TableCell>
                      <TableCell className="text-sm">{transaction.description}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {transaction.expires ? new Date(transaction.expires).toLocaleDateString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-4">No transactions found</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  // System Analytics Tab
  const SystemAnalytics = () => {
    if (!analytics) return <div>Loading analytics...</div>;

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Points System Analytics</h3>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Points Users</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.activePointsUsers}</div>
              <p className="text-xs text-muted-foreground">Users with points balance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Points Liability</CardTitle>
              <DollarSign className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                R{(analytics.pointsLiabilityInCents / 100).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Total outstanding value</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Points/User</CardTitle>
              <Award className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.averagePointsPerUser}</div>
              <p className="text-xs text-muted-foreground">Average balance per user</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Lifetime Points Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Total Earned:</span>
                <span className="font-medium text-green-600">
                  {analytics.totalLifetimeEarned.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Redeemed:</span>
                <span className="font-medium text-blue-600">
                  {analytics.totalLifetimeRedeemed.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Outstanding Balance:</span>
                <span className="font-medium">
                  {analytics.totalPointsOutstanding.toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">Redemption Rate:</span>
                <span className="font-medium">
                  {analytics.totalLifetimeEarned > 0 
                    ? ((analytics.totalLifetimeRedeemed / analytics.totalLifetimeEarned) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">User Engagement:</span>
                <span className="font-medium">
                  {analytics.activePointsUsers > 0 ? 'Active' : 'Low'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Award className="h-6 w-6 mr-2 text-primary" />
            Points Management
          </h2>
          <p className="text-muted-foreground">
            Manage customer loyalty points and system analytics
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="admin-tools" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Admin Tools
          </TabsTrigger>
          <TabsTrigger 
            value="overview" 
            disabled={!selectedCustomer && !customerId}
            className="flex items-center"
          >
            <Award className="h-4 w-4 mr-2" />
            Customer Points
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            System Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="admin-tools" className="space-y-4">
          <AdminToolsTab />
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          {(selectedCustomer || customerId) ? (
            <CustomerPointsOverview />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-40">
                <div className="text-center">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Select a customer to view their points balance and history
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <SystemAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}