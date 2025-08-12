'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { LeaveRequestForm } from '@/components/leave/leave-request-form';
import { LeaveManagementDashboard } from '@/components/leave/leave-management-dashboard';
import { hasPermission } from '@/lib/enterprise-permissions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LeaveRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const canManageLeave = hasPermission(session.user.role, 'LEAVE_APPROVE_ALL') ||
                        hasPermission(session.user.role, 'LEAVE_APPROVE_DEPARTMENT') ||
                        hasPermission(session.user.role, 'LEAVE_APPROVE_TEAM');

  const canViewLeave = hasPermission(session.user.role, 'LEAVE_VIEW_OWN') ||
                      hasPermission(session.user.role, 'LEAVE_VIEW_TEAM') ||
                      hasPermission(session.user.role, 'LEAVE_VIEW_ALL');

  if (!canViewLeave) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">You don't have permission to access leave management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {canManageLeave ? (
          <Tabs defaultValue="management" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="management">Leave Management</TabsTrigger>
              <TabsTrigger value="my-requests">My Requests</TabsTrigger>
            </TabsList>
            
            <TabsContent value="management">
              <LeaveManagementDashboard />
            </TabsContent>
            
            <TabsContent value="my-requests">
              <LeaveRequestForm />
            </TabsContent>
          </Tabs>
        ) : (
          <LeaveRequestForm />
        )}
      </div>
    </div>
  );
}