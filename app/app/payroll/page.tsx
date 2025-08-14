import { Metadata } from 'next';
import ClientPayroll from './client-payroll';

export const metadata: Metadata = {
  title: 'Payroll Management',
  description: 'Manage employee payroll, generate payslips, and process payments',
};

export default function PayrollPage() {
  return <ClientPayroll />;
}