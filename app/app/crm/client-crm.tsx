'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { CRMDashboardWidget } from '@/components/crm/dashboard-widget';
import { CRMSearchWidget } from '@/components/crm/search-widget';
import { BookingManagement } from '@/components/crm/booking-management';
import { CapacityMonitor } from '@/components/crm/capacity-monitor';
import { CustomerTools } from '@/components/crm/customer-tools';
import { AnalyticsDashboard } from '@/components/crm/analytics-dashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Car, Search, Calendar, Users, BarChart3, Activity } from 'lucide-react';

export default function ClientCRMPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    }
    // Check if user has permission to access CRM
    if (session && !['ADMIN', 'SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER'].includes(session?.user?.role || '')) {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading your CRM workspace...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-indigo-50/30 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/10 to-transparent rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/5 to-transparent rounded-full blur-3xl animate-pulse animation-delay-500"></div>
        </div>

        <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="space-y-8">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-8">
              <div className="text-center">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2 flex items-center justify-center gap-3">
                  <Car className="h-8 w-8 text-blue-600" />
                  Car Wash CRM System
                </h1>
                <p className="text-gray-600 text-lg font-medium">
                  Manage bookings, monitor capacity, and analyze performance in real-time
                </p>
                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mx-auto mt-4 animate-pulse"></div>
              </div>
            </div>

            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-6 h-12 p-1 bg-gray-100 rounded-xl">
                <TabsTrigger value="overview" className="rounded-lg font-semibold flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  <span className="hidden sm:inline">Overview</span>
                </TabsTrigger>
                <TabsTrigger value="search" className="rounded-lg font-semibold flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <span className="hidden sm:inline">Search</span>
                </TabsTrigger>
                <TabsTrigger value="bookings" className="rounded-lg font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Bookings</span>
                </TabsTrigger>
                <TabsTrigger value="capacity" className="rounded-lg font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span className="hidden sm:inline">Capacity</span>
                </TabsTrigger>
                <TabsTrigger value="customers" className="rounded-lg font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Customers</span>
                </TabsTrigger>
                <TabsTrigger value="analytics" className="rounded-lg font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Analytics</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                  <CRMDashboardWidget />
                  <CapacityMonitor />
                </div>
                <CRMSearchWidget />
              </TabsContent>

              <TabsContent value="search">
                <CRMSearchWidget />
              </TabsContent>

              <TabsContent value="bookings">
                <BookingManagement />
              </TabsContent>

              <TabsContent value="capacity">
                <CapacityMonitor />
              </TabsContent>

              <TabsContent value="customers">
                <CustomerTools />
              </TabsContent>

              <TabsContent value="analytics">
                <AnalyticsDashboard />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}