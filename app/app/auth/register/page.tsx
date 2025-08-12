
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { SignUpForm } from '@/components/auth/signup-form';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default async function RegisterPage() {
  const session = await getServerSession(authOptions);
  
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-purple-50 to-blue-50 px-4 py-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-red-400/20 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-transparent rounded-full blur-3xl animate-pulse animation-delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/10 to-transparent rounded-full blur-3xl animate-pulse animation-delay-500"></div>
      </div>

      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8 relative z-10">
        <Link href="/auth/signin">
          <Button
            variant="ghost"
            className="mb-4 hover:bg-gradient-to-r hover:from-red-50 hover:to-blue-50 font-semibold transition-all duration-300"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </Button>
        </Link>
      </div>

      {/* Registration Form */}
      <div className="flex justify-center relative z-10">
        <SignUpForm />
      </div>
    </div>
  );
}
