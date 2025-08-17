
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { PWAProvider } from '../../components/PWAProvider';
import { InstallPrompt } from '../../components/InstallPrompt';

const inter = Inter({ subsets: ['latin'] });

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: 'Ekhaya Intel Trading - HR Management',
  description: 'Professional HR Management System for Ekhaya Intel Trading',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/icons/icon.svg', type: 'image/svg+xml' },
      { url: '/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/icons/icon.svg',
        color: '#1f2937',
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ekhaya HR',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'msapplication-TileImage': '/icons/icon-144x144.png',
    'msapplication-TileColor': '#1f2937',
    'msapplication-config': '/browserconfig.xml',
  },
  openGraph: {
    type: 'website',
    siteName: 'Ekhaya HR',
    title: 'Ekhaya Intel Trading - HR Management',
    description: 'Professional HR Management System for Ekhaya Intel Trading',
    images: [
      {
        url: '/icons/icon-512x512.png',
        width: 512,
        height: 512,
        alt: 'Ekhaya HR Logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Ekhaya Intel Trading - HR Management',
    description: 'Professional HR Management System for Ekhaya Intel Trading',
    images: ['/icons/icon-512x512.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <PWAProvider>
            {children}
            <InstallPrompt />
          </PWAProvider>
        </Providers>
      </body>
    </html>
  );
}
