
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 px-4 py-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <Link href="/auth/signin">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </Button>
        </Link>
      </div>

      {/* Registration Form */}
      <div className="flex justify-center">
        <SignUpForm />
      </div>
    </div>
  );
}
