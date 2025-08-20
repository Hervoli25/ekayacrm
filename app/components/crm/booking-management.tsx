'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useCRMSearch } from '@/hooks/use-crm-data';
import { getCRMApiHeaders } from '@/lib/crm-config';
import { 
  Calendar,
  Clock,
  User,
  Car,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Star,
  Edit3,
  CheckCircle,
  XCircle,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Booking {
  id: string;
  bookingReference: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  licensePlate: string;
  serviceName: string;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
  totalAmount: number;
  paymentStatus: string;
  rating?: number;
  feedback?: string;
  notes?: string;
  location?: string;
}

export function BookingManagement() {
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  
  // Use the CRM search hook to get all bookings
  const { results: allBookings, loading, error, search } = useCRMSearch();

  // Load all bookings on component mount
  useEffect(() => {
    search(''); // Empty search to get all bookings
  }, [search]);

  const displayBookings = allBookings;

  const filteredBookings = displayBookings.filter(booking => 
    statusFilter === 'all' || booking.status.toLowerCase() === statusFilter
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
      case 'in-progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-ZA', {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    });
  };

  const updateBookingStatus = async (bookingId: string, newStatus: string) => {
    setUpdatingStatus(bookingId);
    
    try {
      const response = await fetch(`/api/crm/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: getCRMApiHeaders(),
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update booking status');
      }

      // Refresh the bookings list
      search('');
      
    } catch (error) {
      console.error('Failed to update booking status:', error);
      alert('Failed to update booking status. Please try again.');
    } finally {
      setUpdatingStatus(null);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Booking Management
          </CardTitle>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-gray-300 h-5 w-32 rounded"></div>
                  <div className="flex gap-2">
                    <div className="bg-gray-300 h-5 w-16 rounded"></div>
                    <div className="bg-gray-300 h-5 w-16 rounded"></div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-gray-300 h-4 w-full rounded"></div>
                  <div className="bg-gray-300 h-4 w-full rounded"></div>
                  <div className="bg-gray-300 h-4 w-full rounded"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">Error loading bookings: {error}</span>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-600" />
                      {booking.customerName}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Ref: {booking.bookingReference}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={cn('text-xs', getStatusColor(booking.status))}>
                      {booking.status}
                    </Badge>
                    <Badge className={cn('text-xs', getPaymentStatusColor(booking.paymentStatus))}>
                      {booking.paymentStatus}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm mb-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-3 w-3" />
                    {formatDate(booking.scheduledDate)}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-3 w-3" />
                    {booking.scheduledTime}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Car className="h-3 w-3" />
                    {booking.licensePlate}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="h-3 w-3" />
                    R{booking.totalAmount}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-3 w-3" />
                    {booking.customerPhone}
                  </div>
                  {booking.location && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-3 w-3" />
                      {booking.location}
                    </div>
                  )}
                </div>

                <div className="text-sm text-gray-700 mb-3">
                  <strong>Service:</strong> {booking.serviceName}
                </div>

                {booking.rating && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span>{booking.rating.toFixed(1)} / 5</span>
                    {booking.feedback && (
                      <span className="text-gray-500">- "{booking.feedback}"</span>
                    )}
                  </div>
                )}

                <div className="flex gap-2 items-center">
                  <Select
                    value={booking.status}
                    onValueChange={(value) => updateBookingStatus(booking.id, value)}
                    disabled={updatingStatus === booking.id}
                  >
                    <SelectTrigger className="w-32 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  {updatingStatus === booking.id && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                  )}

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <Edit3 className="h-3 w-3 mr-1" />
                        Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Booking Details - {booking.bookingReference}</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div>
                          <h4 className="font-medium mb-2">Customer Information</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-500" />
                              {booking.customerName}
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-500" />
                              {booking.customerEmail}
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-500" />
                              {booking.customerPhone}
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2">Booking Information</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Car className="h-4 w-4 text-gray-500" />
                              {booking.licensePlate}
                            </div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              {formatDate(booking.scheduledDate)} at {booking.scheduledTime}
                            </div>
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-gray-500" />
                              R{booking.totalAmount} - {booking.paymentStatus}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Service Notes</h4>
                        <Textarea
                          placeholder="Add notes about this booking..."
                          defaultValue={booking.notes || ''}
                          rows={3}
                        />
                      </div>

                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Contact Customer
                        </Button>
                        <Button size="sm">
                          Save Changes
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button size="sm" variant="outline">
                    <Phone className="h-3 w-3 mr-1" />
                    Call
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredBookings.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No bookings found</p>
                <p className="text-sm">
                  {statusFilter !== 'all' 
                    ? `No ${statusFilter} bookings available` 
                    : 'No bookings available'
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}