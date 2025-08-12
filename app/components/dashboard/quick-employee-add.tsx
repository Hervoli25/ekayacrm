'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StableEmployeeForm } from '@/components/employees/stable-employee-form';
import { UserPlus, Users, Building } from 'lucide-react';
import { Role } from '@prisma/client';

interface QuickEmployeeAddProps {
  userRole: Role;
}

export function QuickEmployeeAdd({ userRole }: QuickEmployeeAddProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Only show for authorized roles
  if (!['DIRECTOR', 'HR_MANAGER', 'DEPARTMENT_MANAGER'].includes(userRole)) {
    return null;
  }

  const handleSuccess = () => {
    // Optionally refresh data or show success message
    console.log('Employee added successfully');
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <UserPlus className="mr-2 h-5 w-5 text-blue-600" />
            Quick Add Employee
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 text-sm mb-4">
            Add new employees with complete information including job titles, departments, and system roles.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={() => setIsFormOpen(true)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add New Employee
            </Button>
            
            <div className="flex justify-between text-xs text-gray-500">
              <span className="flex items-center">
                <Users className="mr-1 h-3 w-3" />
                Full Profile
              </span>
              <span className="flex items-center">
                <Building className="mr-1 h-3 w-3" />
                Department Assignment
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <StableEmployeeForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
