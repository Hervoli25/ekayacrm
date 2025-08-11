
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2, Mail, Phone, Calendar, Users as UsersIcon } from 'lucide-react';
import { Employee } from '@/lib/types';
import { Role } from '@prisma/client';
import { format } from 'date-fns';

interface EmployeeTableProps {
  employees: Employee[];
  loading: boolean;
  userRole: Role;
  onEdit: (employee: Employee) => void;
  onDelete: (employeeId: string) => void;
}

export function EmployeeTable({
  employees,
  loading,
  userRole,
  onEdit,
  onDelete,
}: EmployeeTableProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex space-x-4">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!employees || employees.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <UsersIcon className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
          <p className="text-gray-500">
            {['SUPER_ADMIN', 'ADMIN', 'HR_DIRECTOR'].includes(userRole)
              ? 'Get started by adding your first employee.' 
              : 'No employees match your search criteria.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Hire Date</TableHead>
                {['SUPER_ADMIN', 'ADMIN', 'HR_DIRECTOR', 'MANAGER'].includes(userRole) && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => (
                <TableRow key={employee?.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    <Badge variant="secondary" className="font-mono text-xs">
                      {(employee as any)?.employeeId || 'N/A'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <UsersIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="font-medium">{employee?.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{employee?.title}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{employee?.department}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{employee?.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {employee?.phone ? (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">{employee?.phone}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Not provided</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      className={
                        (employee as any)?.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : (employee as any)?.status === 'TERMINATED'
                          ? 'bg-red-100 text-red-800'
                          : (employee as any)?.status === 'ON_LEAVE'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }
                    >
                      {(employee as any)?.status?.replace('_', ' ') || 'ACTIVE'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        {format(new Date(employee?.hireDate), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </TableCell>
                  {['SUPER_ADMIN', 'ADMIN', 'HR_DIRECTOR', 'MANAGER'].includes(userRole) && (
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(employee)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {['SUPER_ADMIN', 'ADMIN'].includes(userRole) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDelete(employee?.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
