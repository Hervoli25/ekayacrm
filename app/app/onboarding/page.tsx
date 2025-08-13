import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { CarWashOnboarding } from '@/components/onboarding/car-wash-onboarding';

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <DashboardLayout>
      <CarWashOnboarding />
    </DashboardLayout>
  );
}
