
'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Lock } from 'lucide-react';
import { AnimatedBrand } from '@/components/ui/animated-brand';
import { showSuccess, showError, showLoading } from '@/lib/sweetalert';
import Swal from 'sweetalert2';

export function SignInForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Show loading alert
    showLoading('Signing you in...', 'Please wait while we verify your credentials');

    try {
      const result = await signIn('credentials', {
        email: username,
        password,
        redirect: false,
      });

      // Close loading alert
      Swal.close();

      if (result?.error) {
        setError('Invalid username or password');
        await showError(
          'Authentication Failed',
          'Invalid username or password. Please check your credentials and try again.'
        );
      } else {
        await showSuccess(
          'Welcome Back!',
          'You have been signed in successfully.'
        );

        // Get updated session to check user role
        const session = await getSession();
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error) {
      // Close loading alert
      Swal.close();
      setError('An error occurred. Please try again.');
      await showError(
        'Connection Error',
        'Unable to connect to the server. Please check your internet connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
      <CardHeader className="space-y-6 pb-6">
        <AnimatedBrand size="md" showIcon={true} />
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-gray-700 font-medium">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="username"
                type="text"
                placeholder="Enter your username or email"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="pl-10 h-12 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg stable-input"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pl-10 h-12 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg stable-input"
                disabled={isLoading}
                showPasswordToggle={true}
              />
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-blue-50 p-4 rounded-xl border border-red-200/50">
            <p className="text-sm text-gray-700">
              <strong className="text-red-600">Admin Access:</strong> Use your company credentials to sign in.
              <br />
              <strong className="text-blue-600">New Users:</strong> Contact your administrator or register a new account.
            </p>
          </div>
        </CardContent>

        <CardFooter className="pt-6">
          <Button
            type="submit"
            className="w-full h-12 bg-gradient-to-r from-red-600 to-blue-600 hover:from-red-700 hover:to-blue-700 text-white font-semibold rounded-lg shadow-lg transform transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Signing in...</span>
              </div>
            ) : (
              'Sign In'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
