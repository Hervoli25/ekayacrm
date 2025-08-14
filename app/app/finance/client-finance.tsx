
'use client';

import { useState, useEffect } from 'react';
import { useSession, SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DailyReportDashboard from '@/components/finance/daily-report-dashboard';
import ReceiptGenerator from '@/components/finance/receipt-generator';
import EmployeePerformance from '@/components/finance/employee-performance';
import ExpenseTracker from '@/components/finance/expense-tracker';
import FinanceAnalytics from '@/components/finance/finance-analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function ClientFinanceContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    if (!['ADMIN', 'SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER'].includes(session.user?.role || '')) {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || !['ADMIN', 'SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER'].includes(session.user?.role || '')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Finance Management
              </h1>
              <p className="text-gray-600 mt-1">
                Comprehensive financial tracking and business analytics for Ekhaya Intel Trading
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  Daily Reports
                </TabsTrigger>
                <TabsTrigger value="receipts" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  Receipts
                </TabsTrigger>
                <TabsTrigger value="performance" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  Performance
                </TabsTrigger>
                <TabsTrigger value="expenses" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  Expenses
                </TabsTrigger>
                <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  Analytics
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="space-y-6">
                <DailyReportDashboard />
              </TabsContent>

              <TabsContent value="receipts" className="space-y-6">
                <ReceiptGenerator />
              </TabsContent>

              <TabsContent value="performance" className="space-y-6">
                <EmployeePerformance />
              </TabsContent>

              <TabsContent value="expenses" className="space-y-6">
                <ExpenseTracker />
              </TabsContent>

              <TabsContent value="analytics" className="space-y-6">
                <FinanceAnalytics />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}

export default function ClientFinance() {
  return (
    <SessionProvider>
      <ClientFinanceContent />
    </SessionProvider>
  );
}
