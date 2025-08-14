import { Metadata } from 'next';
import ClientDocuments from './client-documents';

export const metadata: Metadata = {
  title: 'Document Management',
  description: 'Manage employee documents, contracts, and HR files',
};

export default function DocumentsPage() {
  return <ClientDocuments />;
}