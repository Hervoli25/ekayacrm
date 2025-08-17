// Service Worker registration and management utilities

interface ServiceWorkerConfig {
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  onError?: (error: Error) => void;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

const isLocalhost = () => {
  if (typeof window === 'undefined') return false;
  return Boolean(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
  );
};

/**
 * Register the service worker
 */
export function register(config?: ServiceWorkerConfig): void {
  if ('serviceWorker' in navigator) {
    const publicUrl = new URL(process.env.PUBLIC_URL || '', window.location.href);
    if (publicUrl.origin !== window.location.origin) {
      return;
    }

    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/sw.js`;

      if (isLocalhost()) {
        checkValidServiceWorker(swUrl, config);
        navigator.serviceWorker.ready.then(() => {
          console.log(
            'This web app is being served cache-first by a service worker.'
          );
        });
      } else {
        registerValidSW(swUrl, config);
      }
    });
  }
}

/**
 * Register a valid service worker
 */
function registerValidSW(swUrl: string, config?: ServiceWorkerConfig): void {
  navigator.serviceWorker
    .register(swUrl)
    .then((registration) => {
      console.log('Service Worker registered successfully:', registration);
      
      registration.onupdatefound = () => {
        const installingWorker = registration.installing;
        if (installingWorker == null) {
          return;
        }

        installingWorker.onstatechange = () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              console.log(
                'New content is available and will be used when all tabs for this page are closed.'
              );
              if (config && config.onUpdate) {
                config.onUpdate(registration);
              }
            } else {
              console.log('Content is cached for offline use.');
              if (config && config.onSuccess) {
                config.onSuccess(registration);
              }
            }
          }
        };
      };
    })
    .catch((error) => {
      console.error('Error during service worker registration:', error);
      if (config && config.onError) {
        config.onError(error);
      }
    });
}

/**
 * Check if service worker is valid
 */
function checkValidServiceWorker(swUrl: string, config?: ServiceWorkerConfig): void {
  fetch(swUrl, {
    headers: { 'Service-Worker': 'script' },
  })
    .then((response) => {
      const contentType = response.headers.get('content-type');
      if (
        response.status === 404 ||
        (contentType != null && contentType.indexOf('javascript') === -1)
      ) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.unregister().then(() => {
            window.location.reload();
          });
        });
      } else {
        registerValidSW(swUrl, config);
      }
    })
    .catch(() => {
      console.log('No internet connection found. App is running in offline mode.');
    });
}

/**
 * Unregister the service worker
 */
export function unregister(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
        console.log('Service Worker unregistered');
      })
      .catch((error) => {
        console.error('Error unregistering service worker:', error);
      });
  }
}

/**
 * Update the service worker
 */
export function updateServiceWorker(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration.update().then(() => {
            console.log('Service Worker updated');
            resolve();
          });
        })
        .catch((error) => {
          console.error('Error updating service worker:', error);
          reject(error);
        });
    } else {
      reject(new Error('Service Worker not supported'));
    }
  });
}

/**
 * Check if there's a service worker update available
 */
export function checkForUpdates(): Promise<boolean> {
  return new Promise((resolve) => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((registration) => {
          registration.update().then(() => {
            const hasUpdate = registration.waiting !== null;
            resolve(hasUpdate);
          });
        })
        .catch(() => {
          resolve(false);
        });
    } else {
      resolve(false);
    }
  });
}

/**
 * Send message to service worker
 */
export function sendMessageToSW(message: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };
      
      navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
    } else {
      reject(new Error('Service Worker not available'));
    }
  });
}

/**
 * Get service worker version
 */
export async function getServiceWorkerVersion(): Promise<string> {
  try {
    const response = await sendMessageToSW({ type: 'GET_VERSION' });
    return response.version || 'unknown';
  } catch (error) {
    console.error('Error getting service worker version:', error);
    return 'unknown';
  }
}

/**
 * Install prompt management
 */
export class InstallPromptManager {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstallable = false;
  private isInstalled = false;

  constructor() {
    this.init();
  }

  private init(): void {
    if (typeof window === 'undefined') return;
    
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.isInstallable = true;
      this.dispatchInstallableEvent();
    });

    // Listen for the appinstalled event
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.isInstalled = true;
      this.deferredPrompt = null;
      this.isInstallable = false;
      this.dispatchInstalledEvent();
    });

    // Check if already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
    }
  }

  public getInstallable(): boolean {
    return this.isInstallable;
  }

  public getInstalled(): boolean {
    return this.isInstalled;
  }

  public async promptInstall(): Promise<{ outcome: 'accepted' | 'dismissed'; platform: string } | null> {
    if (!this.deferredPrompt) {
      return null;
    }

    try {
      await this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      this.deferredPrompt = null;
      this.isInstallable = false;
      
      return choiceResult;
    } catch (error) {
      console.error('Error showing install prompt:', error);
      return null;
    }
  }

  private dispatchInstallableEvent(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pwa-installable'));
    }
  }

  private dispatchInstalledEvent(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pwa-installed'));
    }
  }
}

/**
 * Notification utilities
 */
export class NotificationManager {
  public static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  public static async showNotification(
    title: string,
    options?: NotificationOptions
  ): Promise<void> {
    const permission = await this.requestPermission();
    
    if (permission === 'granted' && 'serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        ...options,
      });
    }
  }
}

/**
 * PWA utilities object
 */
export const PWAUtils = {
  register,
  unregister,
  updateServiceWorker,
  checkForUpdates,
  sendMessageToSW,
  getServiceWorkerVersion,
  InstallPromptManager,
  NotificationManager,
};