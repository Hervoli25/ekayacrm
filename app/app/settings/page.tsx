import { Metadata } from 'next';
import ClientSettings from './client-settings';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'System and user preferences configuration',
};

export default function SettingsPage() {
  return <ClientSettings />;
}