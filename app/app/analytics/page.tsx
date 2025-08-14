import { Metadata } from 'next';
import ClientAnalytics from './client-analytics';

export const metadata: Metadata = {
  title: 'Analytics Dashboard',
  description: 'HR analytics and business intelligence dashboard',
};

export default function AnalyticsPage() {
  return <ClientAnalytics />;
}