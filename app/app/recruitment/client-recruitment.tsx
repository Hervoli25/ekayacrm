'use client';

import { useSession, SessionProvider } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import RecruitmentDashboard from '../../components/recruitment/recruitment-dashboard';

function ClientRecruitmentContent() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
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

  if (!session) {
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
                Recruitment Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage job postings, applications, and hiring process
              </p>
            </div>

            <RecruitmentDashboard />
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}

export default function ClientRecruitment() {
  return (
    <SessionProvider>
      <ClientRecruitmentContent />
    </SessionProvider>
  );
}