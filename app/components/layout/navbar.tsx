
'use client';

import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Building2, User, LogOut, Users, Calendar, DollarSign, BarChart3, Receipt } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Building2 },
    { name: 'Employees', href: '/employees', icon: Users },
    { name: 'Leave Requests', href: '/leave-requests', icon: Calendar },
    ...(session?.user?.role === 'ADMIN' ? [
      { name: 'Finance', href: '/finance', icon: DollarSign },
      { name: 'Reports', href: '/finance/reports', icon: BarChart3 },
      { name: 'Receipts', href: '/finance/receipts', icon: Receipt },
    ] : [])
  ];

  if (!session) return null;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <div className="bg-blue-600 p-2 rounded-lg mr-3">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Ekhaya Intel Trading</h1>
                <p className="text-xs text-gray-500">HR Management</p>
              </div>
            </div>

            {/* Navigation */}
            <div className="hidden sm:ml-8 sm:flex sm:space-x-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User menu */}
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-100">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:block text-sm font-medium">
                    {session?.user?.name || session?.user?.email}
                  </span>
                  <span className="text-xs text-gray-500 hidden sm:block">
                    ({session?.user?.role})
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5 text-sm text-gray-600">
                  <div className="font-medium">{session?.user?.name || 'User'}</div>
                  <div className="text-xs text-gray-500">{session?.user?.email}</div>
                  <div className="text-xs text-blue-600 mt-1">Role: {session?.user?.role}</div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="cursor-pointer">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
