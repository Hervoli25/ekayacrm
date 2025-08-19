'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Building2,
  User,
  LogOut,
  Users,
  Calendar,
  DollarSign,
  BarChart3,
  Receipt,
  Clock,
  ChevronLeft,
  ChevronRight,
  Home,
  FileText,
  Settings,
  Shield,
  Briefcase,
  TrendingUp,
  Award,
  UserCheck,
  Bell,
  HelpCircle,
  Key,
  BookOpen,
  Car,
  Search,
  Activity,
  TrendingUp as TrendingUpIcon
} from 'lucide-react';
import { AnimatedBrand } from '@/components/ui/animated-brand';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { showConfirmation } from '@/lib/sweetalert';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Navigation items organized by category
  const navigationSections = [
    {
      title: 'Main',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: Home, color: 'text-blue-600' },
        { name: 'Time Tracking', href: '/time-tracking', icon: Clock, color: 'text-green-600' },
      ]
    },
    {
      title: 'HR Management',
      items: [
        { name: 'Employees', href: '/employees', icon: Users, color: 'text-purple-600' },
        { name: 'Onboarding', href: '/onboarding', icon: BookOpen, color: 'text-blue-600' },
        { name: 'Leave Requests', href: '/leave-requests', icon: Calendar, color: 'text-orange-600' },
        { name: 'Performance', href: '/performance', icon: Award, color: 'text-yellow-600' },
        { name: 'Recruitment', href: '/recruitment', icon: UserCheck, color: 'text-indigo-600' },
      ]
    },
    {
      title: 'Finance',
      items: [
        ...((['ADMIN', 'SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER'].includes(session?.user?.role || '')) ? [
          { name: 'Finance', href: '/finance', icon: DollarSign, color: 'text-emerald-600' },
          { name: 'Reports', href: '/finance/reports', icon: BarChart3, color: 'text-blue-600' },
          { name: 'Receipts', href: '/finance/receipts', icon: Receipt, color: 'text-gray-600' },
          { name: 'Payroll', href: '/payroll', icon: Briefcase, color: 'text-red-600' },
        ] : [])
      ]
    },
    {
      title: 'CRM',
      items: [
        ...((['ADMIN', 'SUPER_ADMIN', 'DIRECTOR', 'HR_MANAGER'].includes(session?.user?.role || '')) ? [
          { name: 'CRM Dashboard', href: '/crm', icon: Car, color: 'text-blue-600' },
          { name: 'Search Bookings', href: '/crm/search', icon: Search, color: 'text-green-600' },
          { name: 'Capacity Monitor', href: '/crm/capacity', icon: Activity, color: 'text-purple-600' },
          { name: 'Customer Tools', href: '/crm/customers', icon: Users, color: 'text-indigo-600' },
          { name: 'Analytics', href: '/crm/analytics', icon: TrendingUpIcon, color: 'text-orange-600' },
        ] : [])
      ]
    },
    {
      title: 'Administration',
      items: [
        ...((['SUPER_ADMIN'].includes(session?.user?.role || '')) ? [
          { name: 'Credentials', href: '/credentials', icon: Key, color: 'text-yellow-600' },
        ] : []),
        ...((['SUPER_ADMIN', 'DIRECTOR'].includes(session?.user?.role || '')) ? [
          { name: 'Security', href: '/security', icon: Shield, color: 'text-red-600' },
          { name: 'Analytics', href: '/analytics', icon: TrendingUp, color: 'text-pink-600' },
          { name: 'Documents', href: '/documents', icon: FileText, color: 'text-slate-600' },
          { name: 'Settings', href: '/settings', icon: Settings, color: 'text-gray-600' },
        ] : [])
      ]
    }
  ];

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

  if (!session) return null;

  return (
    <div className={cn(
      'fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col',
      isCollapsed ? 'w-16' : 'w-64',
      isMobile && 'shadow-xl'
    )}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className={cn('flex items-center', isCollapsed && 'justify-center w-full')}>
          <Link href="/dashboard" className="flex items-center">
            <AnimatedBrand 
              size="sm" 
              showIcon={true} 
              compact={isCollapsed} 
              showText={!isCollapsed}
            />
          </Link>
        </div>
        
        {!isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="p-1 h-8 w-8 hover:bg-gray-100"
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-6">
          {navigationSections.map((section) => (
            section.items.length > 0 && (
              <div key={section.title}>
                {!isCollapsed && (
                  <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {section.title}
                  </h3>
                )}
                
                <div className="space-y-1 px-2">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                          isActive
                            ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 shadow-sm border border-blue-100'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                          isCollapsed && 'justify-center'
                        )}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <Icon className={cn(
                          'h-5 w-5 transition-colors duration-200',
                          isActive ? item.color : 'text-gray-500 group-hover:text-gray-700',
                          !isCollapsed && 'mr-3'
                        )} />
                        
                        {!isCollapsed && (
                          <span className="truncate">{item.name}</span>
                        )}
                        
                        {!isCollapsed && isActive && (
                          <div className="ml-auto w-2 h-2 bg-blue-600 rounded-full" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )
          ))}
        </nav>
      </div>

      {/* User Profile Section */}
      <div className="border-t border-gray-200 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={cn(
                'w-full flex items-center space-x-3 hover:bg-gray-50 rounded-lg p-3 transition-all duration-200',
                isCollapsed && 'justify-center p-2'
              )}
            >
              <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-2 rounded-full">
                <User className="h-4 w-4 text-white" />
              </div>
              
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {session?.user?.name || session?.user?.email}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {session?.user?.role}
                  </div>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent 
            align={isCollapsed ? "center" : "end"} 
            className="w-64 bg-white/95 backdrop-blur-sm shadow-xl border-0 rounded-xl"
          >
            <div className="px-3 py-2 text-sm text-gray-600 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
              <div className="font-medium text-gray-900">{session?.user?.name || 'User'}</div>
              <div className="text-xs text-gray-500">{session?.user?.email}</div>
              <div className="text-xs bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent font-semibold mt-1">
                Role: {session?.user?.role}
              </div>
            </div>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem className="cursor-pointer hover:bg-gray-50 transition-all duration-200 rounded-lg mx-1 my-1">
              <Settings className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-gray-700 font-medium">Profile Settings</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem className="cursor-pointer hover:bg-gray-50 transition-all duration-200 rounded-lg mx-1 my-1">
              <Bell className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-gray-700 font-medium">Notifications</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem className="cursor-pointer hover:bg-gray-50 transition-all duration-200 rounded-lg mx-1 my-1">
              <HelpCircle className="h-4 w-4 mr-2 text-gray-500" />
              <span className="text-gray-700 font-medium">Help & Support</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer hover:bg-red-50 transition-all duration-200 rounded-lg mx-1 my-1"
            >
              <LogOut className="h-4 w-4 mr-2 text-red-500" />
              <span className="text-red-700 font-medium">Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}