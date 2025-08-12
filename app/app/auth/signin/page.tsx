
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { SignInForm } from '@/components/auth/signin-form';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function SignInPage() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-purple-50 to-blue-50 px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-red-400/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-transparent rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-transparent rounded-full blur-3xl animate-pulse animation-delay-500"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <SignInForm />
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4 font-medium">Need to create an account?</p>
          <Link href="/auth/register">
            <Button
              variant="outline"
              className="w-full h-12 border-2 border-gradient-to-r from-red-500 to-blue-500 text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-blue-50 font-semibold rounded-lg transition-all duration-300 transform hover:scale-105"
            >
              Register New Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
