import { Metadata } from 'next';
import ClientRecruitment from './client-recruitment';

export const metadata: Metadata = {
  title: 'Recruitment Management',
  description: 'Manage job postings, applications, and hiring process',
};

export default function RecruitmentPage() {
  return <ClientRecruitment />;
}