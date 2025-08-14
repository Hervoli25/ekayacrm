import { Metadata } from 'next';
import ExecutiveDashboard from '@/components/reports/executive-dashboard';

export const metadata: Metadata = {
  title: 'Executive Reports',
  description: 'Comprehensive business analytics and executive dashboard',
};

export default function ReportsPage() {
  return (
    <div className="container mx-auto py-8">
      <ExecutiveDashboard />
    </div>
  );
}