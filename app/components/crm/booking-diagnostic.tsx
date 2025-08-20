'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3,
  AlertTriangle,
  Calendar,
  TrendingUp,
  RefreshCw,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';

interface DiagnosticData {
  summary: {
    total_bookings: number;
    future_bookings: number;
    past_bookings: number;
    yesterday_bookings: number;
  };
  status_distribution: Array<{
    status: string;
    count: number;
    percentage: string;
  }>;
  recent_bookings_by_date: Array<{
    date: string;
    status: string;
    count: number;
  }>;
  yesterday_analysis: {
    bookings: Array<{
      id: string;
      booking_date: string;
      time_slot: string;
      status: string;
      customer: string;
      service: string;
      date_category: string;
      should_be_completed: boolean;
    }>;
  };
  status_transition_analysis: Array<{
    status: string;
    total_count: number;
    past_date_count: number;
    very_old_count: number;
    needs_attention: boolean;
    sample_old_dates: string[];
  }>;
  business_logic_recommendations: {
    confirmed_to_in_progress: string;
    in_progress_to_completed: string;
    auto_complete_overdue: string;
    status_workflow: string[];
  };
  issues_found: Array<{
    issue: string;
    count: number;
    severity: string;
    recommendation: string;
  }>;
}

export function BookingDiagnostic() {
  const [data, setData] = useState<DiagnosticData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingOldBookings, setUpdatingOldBookings] = useState(false);

  const fetchDiagnosticData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/crm/bookings/diagnostic', {
        headers: {
          'X-API-Key': 'ekhaya-car-wash-secret-key-2024'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch diagnostic data');
      }

      const diagnosticData = await response.json();
      setData(diagnosticData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const bulkCompleteOldBookings = async () => {
    setUpdatingOldBookings(true);
    
    try {
      const response = await fetch('/api/crm/bookings/diagnostic', {
        method: 'POST',
        headers: {
          'X-API-Key': 'ekhaya-car-wash-secret-key-2024',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'bulk_complete_old'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update bookings');
      }

      const result = await response.json();
      alert(`Successfully updated ${result.updated_bookings.length} bookings to COMPLETED`);
      
      // Refresh the diagnostic data
      fetchDiagnosticData();
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'An error occurred'}`);
    } finally {
      setUpdatingOldBookings(false);
    }
  };

  useEffect(() => {
    fetchDiagnosticData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin h-8 w-8" />
        <span className="ml-2">Loading diagnostic data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!data) return null;

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Booking Status Diagnostic</h2>
        <Button onClick={fetchDiagnosticData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.total_bookings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Future Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data.summary.future_bookings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Past Bookings</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data.summary.past_bookings}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yesterday</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.yesterday_bookings}</div>
          </CardContent>
        </Card>
      </div>

      {/* Issues Found */}
      {data.issues_found.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Issues Found
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.issues_found.map((issue, index) => (
              <Alert key={index} variant="destructive">
                <AlertDescription>
                  <div className="font-semibold">{issue.issue}</div>
                  <div className="text-sm mt-1">Count: {issue.count} | Severity: {issue.severity}</div>
                  <div className="text-sm mt-1">{issue.recommendation}</div>
                </AlertDescription>
              </Alert>
            ))}
            
            <div className="mt-4">
              <Button 
                onClick={bulkCompleteOldBookings} 
                disabled={updatingOldBookings}
                variant="destructive"
              >
                {updatingOldBookings ? (
                  <>
                    <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Auto-Complete Old Bookings
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Current Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.status_distribution.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(item.status)}>
                    {item.status}
                  </Badge>
                  <span className="text-sm">{item.count} bookings</span>
                </div>
                <span className="text-sm font-medium">{item.percentage}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status Transition Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Status Transition Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.status_transition_analysis.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                  {item.needs_attention && (
                    <Badge variant="destructive">Needs Attention</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Count:</span> {item.total_count}
                  </div>
                  <div>
                    <span className="font-medium">Past Date:</span> {item.past_date_count}
                  </div>
                  <div>
                    <span className="font-medium">Very Old:</span> {item.very_old_count}
                  </div>
                </div>
                {item.sample_old_dates.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs font-medium text-gray-600">Sample old dates:</span>
                    <div className="text-xs text-gray-500 mt-1">
                      {item.sample_old_dates.join(', ')}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Business Logic Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Status Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2">Recommended Flow:</h4>
              <ul className="space-y-2">
                {data.business_logic_recommendations.status_workflow.map((flow, index) => (
                  <li key={index} className="text-sm flex items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                    {flow}
                  </li>
                ))}
              </ul>
            </div>
            
            <Separator />
            
            <div className="space-y-3">
              <div>
                <h4 className="font-medium">Auto-completion Logic:</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {data.business_logic_recommendations.auto_complete_overdue}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Yesterday's Analysis */}
      {data.yesterday_analysis.bookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Yesterday's Bookings Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.yesterday_analysis.bookings.map((booking, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{booking.customer}</div>
                    <div className="text-sm text-gray-600">
                      {booking.service} • {booking.time_slot}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                    {booking.should_be_completed && (
                      <Badge variant="destructive">Should be completed</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}