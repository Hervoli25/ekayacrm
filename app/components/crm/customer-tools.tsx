'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCRMApiHeaders } from '@/lib/crm-config';
import { 
  Users,
  User,
  Phone,
  Mail,
  MessageSquare,
  Star,
  Calendar,
  Car,
  DollarSign,
  TrendingUp,
  Gift,
  Heart,
  Clock,
  Send,
  UserPlus,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalBookings: number;
  totalSpent: number;
  averageRating: number;
  lastVisit: string;
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  status: 'active' | 'inactive' | 'vip';
  preferredServices: string[];
  vehicles: string[];
}

export function CustomerTools() {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [messageText, setMessageText] = useState('');
  const [messageType, setMessageType] = useState<string>('promotional');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch customers from API
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/crm/customers?search=${encodeURIComponent(searchQuery)}&tier=${filterTier}`, {
        headers: getCRMApiHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.statusText}`);
      }

      const data = await response.json();
      setCustomers(data.customers || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customers');
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch customers on component mount and when search/filter changes
  useEffect(() => {
    fetchCustomers();
  }, [searchQuery, filterTier]);

  const filteredCustomers = customers;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze':
        return 'bg-amber-100 text-amber-800';
      case 'silver':
        return 'bg-gray-100 text-gray-800';
      case 'gold':
        return 'bg-yellow-100 text-yellow-800';
      case 'platinum':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'vip':
        return 'bg-purple-100 text-purple-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const sendMessage = async () => {
    // Simulate sending message
    console.log('Sending message:', { messageText, messageType, recipients: selectedCustomer ? [selectedCustomer] : filteredCustomers });
    setMessageText('');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          Customer Relationship Tools
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search and Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Search customers by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={filterTier} onValueChange={setFilterTier}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="bronze">Bronze</SelectItem>
              <SelectItem value="silver">Silver</SelectItem>
              <SelectItem value="gold">Gold</SelectItem>
              <SelectItem value="platinum">Platinum</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Customer Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <div className="text-xl font-bold text-gray-900">{customers.length}</div>
            <div className="text-xs text-gray-600">Total Customers</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <Heart className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <div className="text-xl font-bold text-gray-900">
              {customers.filter(c => c.status === 'vip').length}
            </div>
            <div className="text-xs text-gray-600">VIP Customers</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <Star className="h-5 w-5 text-yellow-600 mx-auto mb-1" />
            <div className="text-xl font-bold text-gray-900">
              {customers.length > 0 ? (customers.reduce((sum, c) => sum + c.averageRating, 0) / customers.length).toFixed(1) : 'N/A'}
            </div>
            <div className="text-xs text-gray-600">Avg Rating</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 text-center">
            <TrendingUp className="h-5 w-5 text-purple-600 mx-auto mb-1" />
            <div className="text-xl font-bold text-gray-900">
              {customers.filter(c => c.status === 'active').length}
            </div>
            <div className="text-xs text-gray-600">Active Customers</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mb-6">
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <MessageSquare className="h-4 w-4 mr-1" />
                Send Message
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Message to Customers</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Select value={messageType} onValueChange={setMessageType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="promotional">Promotional Offer</SelectItem>
                    <SelectItem value="reminder">Appointment Reminder</SelectItem>
                    <SelectItem value="followup">Follow-up Message</SelectItem>
                    <SelectItem value="custom">Custom Message</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea
                  placeholder="Enter your message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={4}
                />
                <div className="text-sm text-gray-500">
                  Recipients: {filteredCustomers.length} customers
                </div>
                <Button onClick={sendMessage} className="w-full">
                  <Send className="h-4 w-4 mr-1" />
                  Send Message
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Button size="sm" variant="outline">
            <Gift className="h-4 w-4 mr-1" />
            Create Promotion
          </Button>
          
          <Button size="sm" variant="outline">
            <UserPlus className="h-4 w-4 mr-1" />
            Add Customer
          </Button>
        </div>

        {/* Customer List */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredCustomers.map((customer) => (
            <div
              key={customer.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-600" />
                    {customer.name}
                  </h4>
                  <div className="flex gap-2 mt-1">
                    <Badge className={cn('text-xs', getTierColor(customer.loyaltyTier))}>
                      {customer.loyaltyTier}
                    </Badge>
                    <Badge className={cn('text-xs', getStatusColor(customer.status))}>
                      {customer.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {customer.averageRating.toFixed(1)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-3">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-3 w-3" />
                  {customer.email}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-3 w-3" />
                  {customer.phone}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-3 w-3" />
                  {customer.totalBookings} bookings
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <DollarSign className="h-3 w-3" />
                  R{customer.totalSpent.toLocaleString()} spent
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="h-3 w-3" />
                  Last visit: {formatDate(customer.lastVisit)}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Car className="h-3 w-3" />
                  {customer.vehicles.length} vehicle(s)
                </div>
              </div>

              {/* Preferred Services */}
              <div className="mb-3">
                <span className="text-xs text-gray-500">Preferred Services:</span>
                <div className="flex gap-1 mt-1">
                  {customer.preferredServices.map((service, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Vehicles */}
              <div className="mb-3">
                <span className="text-xs text-gray-500">Vehicles:</span>
                <div className="flex gap-1 mt-1">
                  {customer.vehicles.map((vehicle, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {vehicle}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedCustomer(customer)}
                    >
                      View Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>{customer.name} - Customer Profile</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-6 mt-4">
                      <div>
                        <h4 className="font-medium mb-3">Contact Information</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-500" />
                            {customer.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-500" />
                            {customer.phone}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-3">Customer Stats</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Total Bookings:</span>
                            <span className="font-medium">{customer.totalBookings}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Spent:</span>
                            <span className="font-medium">R{customer.totalSpent.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Average Rating:</span>
                            <span className="font-medium flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {customer.averageRating}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Last Visit:</span>
                            <span className="font-medium">{formatDate(customer.lastVisit)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Quick Actions</h4>
                      <div className="flex gap-2">
                        <Button size="sm">
                          <Phone className="h-4 w-4 mr-1" />
                          Call Customer
                        </Button>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Send Message
                        </Button>
                        <Button size="sm" variant="outline">
                          <Calendar className="h-4 w-4 mr-1" />
                          Book Appointment
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
                
                <Button size="sm" variant="outline">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Message
                </Button>
                <Button size="sm" variant="outline">
                  <Phone className="h-3 w-3 mr-1" />
                  Call
                </Button>
              </div>
            </div>
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No customers found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}