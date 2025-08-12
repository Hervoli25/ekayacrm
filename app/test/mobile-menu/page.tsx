import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { Navbar } from '@/components/layout/navbar';
import { MobileMenuTest } from '@/components/test/mobile-menu-test';

export default async function MobileMenuTestPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Mobile Menu Test</h1>
          <p className="text-gray-600 mt-2">
            Test the responsive hamburger menu functionality across different screen sizes.
          </p>
        </div>
        <MobileMenuTest />
      </main>
    </div>
  );
}
