import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { OnboardingDashboard } from '@/components/onboarding/onboarding-dashboard';

export default async function OnboardingDashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin');
  }

  // Check if user has permission to view onboarding dashboard
  const allowedRoles = ['SUPER_ADMIN', 'ADMIN', 'HR_DIRECTOR', 'DIRECTOR', 'HR_MANAGER'];
  if (!allowedRoles.includes(session.user.role)) {
    redirect('/dashboard');
  }

  return (
    <DashboardLayout>
      <OnboardingDashboard />
    </DashboardLayout>
  );
}
