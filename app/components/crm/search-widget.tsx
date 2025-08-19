'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, 
  User, 
  Car, 
  Calendar, 
  DollarSign,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  Star
} from 'lucide-react';
import { useCRMSearch } from '@/hooks/use-crm-data';
import { cn } from '@/lib/utils';

interface SearchResult {
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
}

export function CRMSearchWidget() {
  const [query, setQuery] = useState('');
  const { results, loading, error, search } = useCRMSearch();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(query);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
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
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-blue-600" />
          Quick Search
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Search by name, phone, email, license plate, or booking ref..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-600">{error}</span>
            </div>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.map((booking: SearchResult) => (
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-3 w-3" />
                    {booking.customerEmail}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-3 w-3" />
                    {booking.customerPhone}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Car className="h-3 w-3" />
                    {booking.licensePlate} - {booking.serviceName}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-3 w-3" />
                    {formatDate(booking.scheduledDate)} at {booking.scheduledTime}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <DollarSign className="h-3 w-3" />
                    R{booking.totalAmount.toLocaleString()}
                  </div>
                  {booking.rating && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {booking.rating.toFixed(1)} / 5
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs">
                      View Details
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      Update Status
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      Contact Customer
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Search className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No bookings found for "{query}"</p>
            <p className="text-sm">Try searching with a different term</p>
          </div>
        )}

        {!loading && !query && results.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Search className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>Start typing to search bookings</p>
            <p className="text-sm">Search by name, phone, email, license plate, or booking reference</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}