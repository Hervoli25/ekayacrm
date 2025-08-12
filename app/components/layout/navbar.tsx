
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Building2, User, LogOut, Users, Calendar, DollarSign, BarChart3, Receipt, Menu, X, Clock, BookOpen } from 'lucide-react';
import { AnimatedBrand } from '@/components/ui/animated-brand';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { showConfirmation } from '@/lib/sweetalert';

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Building2 },
    { name: 'Employees', href: '/employees', icon: Users },
    { name: 'Time Tracking', href: '/time-tracking', icon: Clock },
    { name: 'Onboarding', href: '/onboarding', icon: BookOpen },
    { name: 'Leave Requests', href: '/leave-requests', icon: Calendar },
    ...(['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '') ? [
      { name: 'Finance', href: '/finance', icon: DollarSign },
      { name: 'Reports', href: '/finance/reports', icon: BarChart3 },
      { name: 'Receipts', href: '/finance/receipts', icon: Receipt },
    ] : [])
  ];

  if (!session) return null;

  const handleSignOut = async () => {
    const result = await showConfirmation(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      'Yes, sign out',
      'Cancel'
    );

    if (result.isConfirmed) {
      signOut({ callbackUrl: '/auth/signin' });
    }
  };

  return (
    <nav className="bg-white/95 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50 shadow-lg" ref={mobileMenuRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <AnimatedBrand size="sm" showIcon={true} compact={true} />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 transform hover:scale-105 ${
                      isActive
                        ? 'bg-gradient-to-r from-red-100 to-blue-100 text-red-700 shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-red-50 hover:to-blue-50'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Desktop User menu & Mobile hamburger */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <div className="sm:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-red-50 hover:to-blue-50 transition-all duration-300"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </Button>
            </div>

            {/* Desktop User menu */}
            <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gradient-to-r hover:from-red-50 hover:to-blue-50 rounded-lg transition-all duration-300 transform hover:scale-105">
                    <div className="bg-gradient-to-r from-red-500 to-blue-500 p-2 rounded-full">
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900">
                        {session?.user?.name || session?.user?.email}
                      </div>
                      <div className="text-xs text-gray-500">
                        {session?.user?.role}
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-white/95 backdrop-blur-sm shadow-xl border-0 rounded-xl">
                  <div className="px-3 py-2 text-sm text-gray-600 bg-gradient-to-r from-red-50 to-blue-50 rounded-t-xl">
                    <div className="font-medium text-gray-900">{session?.user?.name || 'User'}</div>
                    <div className="text-xs text-gray-500">{session?.user?.email}</div>
                    <div className="text-xs bg-gradient-to-r from-red-600 to-blue-600 bg-clip-text text-transparent font-semibold mt-1">
                      Role: {session?.user?.role}
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="cursor-pointer hover:bg-gradient-to-r hover:from-red-50 hover:to-blue-50 transition-all duration-300 rounded-lg mx-1 my-1"
                  >
                    <LogOut className="h-4 w-4 mr-2 text-red-500" />
                    <span className="text-gray-700 font-medium">Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`sm:hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen
            ? 'max-h-screen opacity-100 visible'
            : 'max-h-0 opacity-0 invisible overflow-hidden'
        }`}>
          <div className="px-2 pt-2 pb-3 space-y-1 bg-gradient-to-r from-red-50/50 to-blue-50/50 rounded-lg mt-2 backdrop-blur-sm">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`group flex items-center px-3 py-3 text-base font-medium rounded-lg transition-all duration-300 transform hover:scale-105 ${
                    isActive
                      ? 'bg-gradient-to-r from-red-100 to-blue-100 text-red-700 shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-red-100/50 hover:to-blue-100/50'
                  }`}
                >
                  <Icon className={`h-5 w-5 mr-3 transition-colors duration-300 ${
                    isActive ? 'text-red-600' : 'text-gray-500 group-hover:text-gray-700'
                  }`} />
                  {item.name}
                </Link>
              );
            })}

            {/* Mobile User Info & Sign Out */}
            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="flex items-center px-3 py-2">
                <div className="bg-gradient-to-r from-red-500 to-blue-500 p-2 rounded-full">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">
                    {session?.user?.name || session?.user?.email}
                  </div>
                  <div className="text-xs text-gray-500">
                    {session?.user?.role}
                  </div>
                </div>
              </div>
              <Button
                onClick={handleSignOut}
                variant="ghost"
                className="w-full justify-start px-3 py-3 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gradient-to-r hover:from-red-100/50 hover:to-blue-100/50 rounded-lg transition-all duration-300"
              >
                <LogOut className="h-5 w-5 mr-3 text-red-500" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
