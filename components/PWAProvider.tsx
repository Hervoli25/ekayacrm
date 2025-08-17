'use client';

import { useEffect } from 'react';
import { register } from '../utils/serviceWorker';

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      register({
        onSuccess: (registration) => {
          console.log('SW registered: ', registration);
        },
        onUpdate: (registration) => {
          console.log('SW updated: ', registration);
          // Optionally show a toast or notification to user about update
          if (confirm('New version available! Reload to update?')) {
            window.location.reload();
          }
        },
        onError: (error) => {
          console.error('SW registration failed: ', error);
        },
      });
    }
  }, []);

  return <>{children}</>;
}