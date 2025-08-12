
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Mail, Lock, User, Phone, Briefcase, Building } from 'lucide-react';
import { AnimatedBrand } from '@/components/ui/animated-brand';
import { showSuccess, showError, showLoading } from '@/lib/sweetalert';
import Swal from 'sweetalert2';

export function SignUpForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: '',
    department: '',
    title: '',
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      await showError('Password Mismatch', 'The passwords you entered do not match. Please try again.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      await showError('Weak Password', 'Password must be at least 6 characters long for security.');
      return;
    }

    if (!formData.role) {
      setError('Please select a role');
      setIsLoading(false);
      await showError('Missing Information', 'Please select your role in the organization.');
      return;
    }

    // Show loading alert
    showLoading('Creating your account...', 'Please wait while we set up your profile');

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          role: formData.role,
          department: formData.department,
          title: formData.title,
          phone: formData.phone,
        }),
      });

      const data = await response.json();

      // Close loading alert
      Swal.close();

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        await showError('Registration Failed', data.error || 'Unable to create your account. Please try again.');
      } else {
        await showSuccess(
          'Welcome to Ekhaya Intel Trading!',
          'Your account has been created successfully. You can now sign in with your credentials.'
        );

        // Redirect to sign in page after successful registration
        router.push('/auth/signin');
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
    <div className="w-full max-w-2xl mx-auto">
      <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-6 pb-6">
          <AnimatedBrand size="md" showIcon={true} />
          <CardDescription className="text-center text-gray-600 font-medium">
            Create your HR Management System account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    required
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    required
                    className="pl-10 h-12 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg"
                    disabled={isLoading}
                    showPasswordToggle={true}
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm Password *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    required
                    className="pl-10 h-12 border-gray-300 focus:border-red-500 focus:ring-red-500 rounded-lg"
                    disabled={isLoading}
                    showPasswordToggle={true}
                  />
                </div>
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => handleInputChange('role', value)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPER_ADMIN">Director (Super Admin)</SelectItem>
                    <SelectItem value="ADMIN">System Administrator</SelectItem>
                    <SelectItem value="HR_DIRECTOR">HR Director</SelectItem>
                    <SelectItem value="MANAGER">Manager/Supervisor</SelectItem>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Department */}
              {(formData.role === 'EMPLOYEE' || formData.role === 'MANAGER') && (
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="department"
                      type="text"
                      placeholder="Enter your department"
                      value={formData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              {/* Title */}
              {(formData.role === 'EMPLOYEE' || formData.role === 'MANAGER') && (
                <div className="space-y-2">
                  <Label htmlFor="title">Job Title</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="title"
                      type="text"
                      placeholder="Enter your job title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      className="pl-10"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <h4 className="font-semibold mb-2">Role Access Levels:</h4>
              <ul className="space-y-1">
                <li>• <strong>Director:</strong> Full system access with no restrictions</li>
                <li>• <strong>System Admin:</strong> Administrative privileges</li>
                <li>• <strong>HR Director:</strong> HR management and oversight</li>
                <li>• <strong>Manager/Supervisor:</strong> Team management features</li>
                <li>• <strong>Employee:</strong> Basic access to personal features</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-yellow-800 mb-2">
                🏢 For Company Directors
              </h4>
              <p className="text-yellow-700 text-sm">
                If you are one of the four company directors mentioned in the business plan, 
                please register with the "Director (Super Admin)" role to access all system features 
                without restrictions.
              </p>
            </div>
          </CardContent>
          
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
