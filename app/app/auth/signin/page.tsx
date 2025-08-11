
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md">
        <SignInForm />
        <div className="mt-6 text-center">
          <p className="text-gray-600 mb-3">Need to create an account?</p>
          <Link href="/auth/register">
            <Button variant="outline" className="w-full">
              Register New Account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
