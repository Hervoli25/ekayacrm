import { Metadata } from 'next';
import DepartmentManagement from '@/components/departments/department-management';

export const metadata: Metadata = {
  title: 'Department Management',
  description: 'Manage organizational departments, budgets, and employee assignments',
};

export default function DepartmentsPage() {
  return (
    <div className="container mx-auto py-8">
      <DepartmentManagement />
    </div>
  );
}