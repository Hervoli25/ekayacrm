import { Metadata } from 'next';
import ClientPerformance from './client-performance';

export const metadata: Metadata = {
  title: 'Performance Management',
  description: 'Employee performance reviews, goals, and development tracking',
};

export default function PerformancePage() {
  return <ClientPerformance />;
}