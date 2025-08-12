
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { RoleBasedDashboard } from '@/components/enterprise/role-based-dashboard';

export default function ClientDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50/30 via-white to-blue-50/30 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-red-400/10 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/10 to-transparent rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/5 to-transparent rounded-full blur-3xl animate-pulse animation-delay-500"></div>
      </div>

      <Navbar />
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border-0 p-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                Welcome back, {session?.user?.name || session?.user?.email}!
              </h1>
              <p className="text-gray-600 text-lg font-medium">
                Here's what's happening in your HR system today.
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-blue-500 rounded-full mx-auto mt-4 animate-pulse"></div>
            </div>
          </div>

          <RoleBasedDashboard 
            userRole={session?.user?.role as any} 
            userName={session?.user?.name || session?.user?.email || 'User'}
            departmentName="Trading" // This would come from user's department in real app
          />
        </div>
      </main>
    </div>
  );
}
