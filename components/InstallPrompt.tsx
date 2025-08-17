'use client';

import { useState, useEffect } from 'react';
import { InstallPromptManager } from '../utils/serviceWorker';

interface InstallPromptProps {
  onInstall?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function InstallPrompt({ onInstall, onDismiss, className = '' }: InstallPromptProps) {
  const [installManager] = useState(() => new InstallPromptManager());
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if running on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Check if already installed (standalone mode)
    const isInStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone === true;
    setIsStandalone(isInStandalone);

    // Initial state check
    setIsInstallable(installManager.getInstallable());
    setIsInstalled(installManager.getInstalled());

    // Listen for installable event
    const handleInstallable = () => {
      setIsInstallable(true);
      setIsInstalled(false);
    };

    // Listen for installed event
    const handleInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      onInstall?.();
    };

    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('pwa-installed', handleInstalled);

    // Check localStorage for dismissal
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, [installManager, onInstall]);

  const handleInstall = async () => {
    if (isIOS && !isStandalone) {
      setShowIOSInstructions(true);
      return;
    }

    try {
      const result = await installManager.promptInstall();
      
      if (result?.outcome === 'accepted') {
        setIsInstallable(false);
        onInstall?.();
      } else if (result?.outcome === 'dismissed') {
        handleDismiss();
      }
    } catch (error) {
      console.error('Install failed:', error);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
    onDismiss?.();
  };

  const handleDismissForSession = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // Don't show if installed, dismissed, or not installable
  if (isInstalled || isStandalone || isDismissed) {
    return null;
  }

  // Show for iOS users even if not installable via prompt
  if (!isInstallable && !isIOS) {
    return null;
  }

  return (
    <>
      {/* Main install prompt */}
      <div className={`install-prompt ${className}`}>
        <div className="install-prompt-content">
          <div className="install-prompt-icon">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"
                fill="currentColor"
              />
            </svg>
          </div>
          
          <div className="install-prompt-text">
            <h3>Install Ekhaya HR</h3>
            <p>
              {isIOS 
                ? 'Add this app to your home screen for a better experience.'
                : 'Install our app for faster access and offline functionality.'
              }
            </p>
          </div>

          <div className="install-prompt-actions">
            <button
              onClick={handleInstall}
              className="install-button"
              type="button"
            >
              {isIOS ? 'How to Install' : 'Install'}
            </button>
            
            <button
              onClick={handleDismissForSession}
              className="dismiss-button"
              type="button"
              aria-label="Dismiss install prompt"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      {/* iOS Installation Instructions Modal */}
      {showIOSInstructions && (
        <div className="ios-install-modal-overlay">
          <div className="ios-install-modal">
            <div className="ios-install-header">
              <h3>Install Ekhaya HR</h3>
              <button
                onClick={() => setShowIOSInstructions(false)}
                className="close-button"
                type="button"
                aria-label="Close instructions"
              >
                ×
              </button>
            </div>
            
            <div className="ios-install-content">
              <p>To install this app on your iOS device:</p>
              
              <ol className="ios-install-steps">
                <li>
                  <div className="step-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  </div>
                  <span>Tap the <strong>Share</strong> button in your browser</span>
                </li>
                
                <li>
                  <div className="step-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                    </svg>
                  </div>
                  <span>Select <strong>"Add to Home Screen"</strong></span>
                </li>
                
                <li>
                  <div className="step-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                    </svg>
                  </div>
                  <span>Tap <strong>"Add"</strong> to install the app</span>
                </li>
              </ol>

              <div className="ios-install-note">
                <p>
                  <strong>Note:</strong> Make sure you're using Safari browser for the best installation experience.
                </p>
              </div>

              <div className="ios-install-actions">
                <button
                  onClick={() => setShowIOSInstructions(false)}
                  className="got-it-button"
                  type="button"
                >
                  Got it!
                </button>
                
                <button
                  onClick={handleDismiss}
                  className="dont-show-again-button"
                  type="button"
                >
                  Don't show again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .install-prompt {
          position: fixed;
          bottom: 16px;
          left: 16px;
          right: 16px;
          max-width: 400px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          border: 1px solid #e1e5e9;
          z-index: 1000;
          animation: slideUp 0.3s ease-out;
        }

        @media (min-width: 768px) {
          .install-prompt {
            left: auto;
            right: 16px;
            bottom: 16px;
            max-width: 320px;
          }
        }

        .install-prompt-content {
          display: flex;
          align-items: center;
          padding: 16px;
          gap: 12px;
        }

        .install-prompt-icon {
          flex-shrink: 0;
          width: 40px;
          height: 40px;
          background: #0066cc;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .install-prompt-text {
          flex: 1;
          min-width: 0;
        }

        .install-prompt-text h3 {
          margin: 0 0 4px 0;
          font-size: 16px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .install-prompt-text p {
          margin: 0;
          font-size: 14px;
          color: #666;
          line-height: 1.4;
        }

        .install-prompt-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .install-button {
          background: #0066cc;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .install-button:hover {
          background: #0052a3;
        }

        .dismiss-button {
          background: none;
          border: none;
          color: #999;
          font-size: 20px;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: color 0.2s;
          line-height: 1;
        }

        .dismiss-button:hover {
          color: #666;
        }

        .ios-install-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1001;
          padding: 16px;
        }

        .ios-install-modal {
          background: white;
          border-radius: 12px;
          max-width: 400px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .ios-install-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 20px 0 20px;
          border-bottom: 1px solid #e1e5e9;
          margin-bottom: 20px;
        }

        .ios-install-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 24px;
          color: #999;
          cursor: pointer;
          padding: 0;
          line-height: 1;
        }

        .ios-install-content {
          padding: 0 20px 20px 20px;
        }

        .ios-install-content p {
          margin: 0 0 16px 0;
          color: #666;
        }

        .ios-install-steps {
          list-style: none;
          padding: 0;
          margin: 0 0 20px 0;
        }

        .ios-install-steps li {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .ios-install-steps li:last-child {
          border-bottom: none;
        }

        .step-icon {
          flex-shrink: 0;
          width: 32px;
          height: 32px;
          background: #f8f9fa;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #0066cc;
        }

        .ios-install-note {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 20px;
        }

        .ios-install-note p {
          margin: 0;
          font-size: 14px;
          color: #666;
        }

        .ios-install-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .got-it-button {
          background: #0066cc;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          flex: 1;
        }

        .dont-show-again-button {
          background: none;
          color: #666;
          border: 1px solid #ddd;
          padding: 12px 24px;
          border-radius: 6px;
          font-size: 14px;
          cursor: pointer;
          flex: 1;
        }

        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @media (prefers-color-scheme: dark) {
          .install-prompt {
            background: #2a2a2a;
            border-color: #404040;
          }

          .install-prompt-text h3 {
            color: white;
          }

          .install-prompt-text p {
            color: #ccc;
          }

          .ios-install-modal {
            background: #2a2a2a;
          }

          .ios-install-header {
            border-color: #404040;
          }

          .ios-install-header h3 {
            color: white;
          }

          .ios-install-content p {
            color: #ccc;
          }

          .step-icon {
            background: #404040;
          }

          .ios-install-steps li {
            border-color: #404040;
          }

          .ios-install-note {
            background: #404040;
          }

          .dont-show-again-button {
            border-color: #555;
            color: #ccc;
          }
        }
      `}</style>
    </>
  );
}