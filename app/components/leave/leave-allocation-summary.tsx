'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  Clock, 
  TrendingUp, 
  Award,
  User,
  Building2,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LeaveAllocation {
  employee: {
    id: string;
    name: string;
    employeeId: string;
    department: string;
    hireDate: string;
    yearsOfService: number;
    role: string;
  };
  entitlements: Record<string, number>;
  balances: Record<string, {
    entitled: number;
    accrued: number;
    used: number;
    pending: number;
    remaining: number;
  }>;
  currentYear: number;
  allocationDetails: {
    baseAllocation: number;
    roleBonus: number;
    tenureBonus: number;
    totalAnnualLeave: number;
    monthsWorked: number;
    accruedToDate: number;
  };
}

export function LeaveAllocationSummary({ userId }: { userId?: string }) {
  const [allocation, setAllocation] = useState<LeaveAllocation | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllocation();
  }, [userId]);

  const fetchAllocation = async () => {
    try {
      setLoading(true);
      const url = userId 
        ? `/api/leave-balance/enhanced?userId=${userId}`
        : '/api/leave-balance/enhanced';
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch allocation');
      
      const data = await response.json();
      
      // Calculate allocation details
      const hireDate = new Date(data.employee.hireDate);
      const currentDate = new Date();
      const yearStart = new Date(data.currentYear, 0, 1);
      const startOfAccrual = hireDate > yearStart ? hireDate : yearStart;
      const monthsWorked = Math.max(1, 
        ((currentDate.getTime() - startOfAccrual.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
      );

      const baseAllocation = 21; // BCEA minimum
      const totalAnnualLeave = data.entitlements.VACATION || 21;
      const roleBonus = totalAnnualLeave - Math.min(35, baseAllocation + Math.floor(data.employee.yearsOfService / 5) * 5);
      const tenureBonus = totalAnnualLeave - baseAllocation - Math.max(0, roleBonus);

      setAllocation({
        ...data,
        allocationDetails: {
          baseAllocation,
          roleBonus: Math.max(0, roleBonus),
          tenureBonus: Math.max(0, tenureBonus),
          totalAnnualLeave,
          monthsWorked: Math.round(monthsWorked * 10) / 10,
          accruedToDate: data.accruals.VACATION || 0
        }
      });
    } catch (error) {
      console.error('Error fetching leave allocation:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch leave allocation',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!allocation) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No leave allocation data available</p>
        </CardContent>
      </Card>
    );
  }

  const { employee, balances, allocationDetails } = allocation;
  const vacationBalance = balances.VACATION || {};
  const utilizationRate = vacationBalance.entitled > 0 
    ? Math.round((vacationBalance.used / vacationBalance.entitled) * 100) 
    : 0;

  const getRoleDescription = (role: string) => {
    const descriptions = {
      'SUPER_ADMIN': 'Executive Level - 35 days annual leave',
      'DIRECTOR': 'Senior Management - 30 days annual leave',
      'HR_DIRECTOR': 'Senior Management - 30 days annual leave', 
      'DEPARTMENT_MANAGER': 'Middle Management - 27 days annual leave',
      'HR_MANAGER': 'Middle Management - 27 days annual leave',
      'SUPERVISOR': 'First-line Management - 25 days annual leave',
      'SENIOR_EMPLOYEE': 'Senior Staff - Base + 2 days bonus',
      'EMPLOYEE': 'Standard Employee - 21 days base + tenure bonus',
      'INTERN': 'Intern - Reduced allocation (15 days minimum)'
    };
    return descriptions[role] || 'Standard allocation based on tenure';
  };

  return (
    <div className="space-y-6">
      {/* Employee Info Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <User className="mr-2 h-6 w-6 text-blue-600" />
            Leave Allocation Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center">
              <Building2 className="h-5 w-5 text-gray-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Employee</p>
                <p className="font-semibold">{employee.name}</p>
                <p className="text-xs text-gray-500">{employee.employeeId}</p>
              </div>
            </div>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Hire Date</p>
                <p className="font-semibold">{new Date(employee.hireDate).toLocaleDateString()}</p>
                <p className="text-xs text-gray-500">{employee.yearsOfService} years service</p>
              </div>
            </div>
            <div className="flex items-center">
              <Award className="h-5 w-5 text-gray-500 mr-2" />
              <div>
                <p className="text-sm text-gray-600">Role</p>
                <p className="font-semibold">{employee.role.replace('_', ' ')}</p>
                <Badge variant="outline" className="text-xs mt-1">
                  {employee.department}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Allocation Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-green-600" />
              Annual Leave Allocation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Base Allocation (BCEA)</span>
                <span className="font-semibold">{allocationDetails.baseAllocation} days</span>
              </div>
              
              {allocationDetails.roleBonus > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Role Bonus</span>
                  <span className="font-semibold text-blue-600">+{allocationDetails.roleBonus} days</span>
                </div>
              )}
              
              {allocationDetails.tenureBonus > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tenure Bonus</span>
                  <span className="font-semibold text-green-600">+{allocationDetails.tenureBonus} days</span>
                </div>
              )}
              
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Annual Allocation</span>
                  <span className="text-xl font-bold text-blue-600">{allocationDetails.totalAnnualLeave} days</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <Info className="h-4 w-4 inline mr-1" />
                {getRoleDescription(employee.role)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5 text-orange-600" />
              Current Year Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Months Worked</span>
                <span className="font-semibold">{allocationDetails.monthsWorked} months</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Accrued to Date</span>
                <span className="font-semibold text-green-600">{allocationDetails.accruedToDate} days</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Used</span>
                <span className="font-semibold text-red-600">{vacationBalance.used || 0} days</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pending</span>
                <span className="font-semibold text-yellow-600">{vacationBalance.pending || 0} days</span>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Remaining Available</span>
                  <span className="text-xl font-bold text-green-600">{vacationBalance.remaining || 0} days</span>
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Utilization Rate</span>
                <span>{utilizationRate}%</span>
              </div>
              <Progress value={utilizationRate} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Information */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-green-800 mb-2">✓ Dynamic Allocation Features:</h4>
              <ul className="space-y-1 text-green-700">
                <li>• Pro-rated for mid-year hires</li>
                <li>• Role-based managerial bonuses</li>
                <li>• Tenure-based progression</li>
                <li>• South African labor law compliant</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-green-800 mb-2">✓ Automatic Balance Management:</h4>
              <ul className="space-y-1 text-green-700">
                <li>• Real-time deduction on approval</li>
                <li>• Automatic restoration on cancellation</li>
                <li>• Accurate pending leave tracking</li>
                <li>• Monthly accrual calculations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
