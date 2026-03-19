import { useState, useEffect } from 'react';
import { X, Smartphone, Share2, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PWAInstallPromptProps {
  position?: 'top' | 'bottom' | 'sidebar';
}

export function PWAInstallPrompt({ position = 'bottom' }: PWAInstallPromptProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    // Check if already dismissed
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    
    if (dismissedTime && Date.now() - dismissedTime < oneWeek) {
      setIsDismissed(true);
      return;
    }

    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    if (isIOS) {
      setDeviceType('ios');
    } else if (isAndroid) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }

    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    
    if (!isStandalone) {
      // Show after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  const handleInstall = () => {
    // For Android, try to trigger the install prompt
    if (deviceType === 'android') {
      // The beforeinstallprompt event should be handled at the app level
      const event = (window as any).deferredPrompt;
      if (event) {
        event.prompt();
        event.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === 'accepted') {
            setIsVisible(false);
            localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
          }
          (window as any).deferredPrompt = null;
        });
      }
    }
  };

  if (isDismissed || !isVisible) return null;

  // Desktop version - just show a message
  if (deviceType === 'desktop') {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 right-4 z-50 max-w-sm"
          >
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Smartphone className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                    Install LandlordBot
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Add to your home screen for quick access on mobile devices
                  </p>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // iOS version
  if (deviceType === 'ios') {
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`z-50 ${position === 'sidebar' ? 'relative' : 'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm'}`}
          >
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Smartphone className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                    Add to Home Screen
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Install LandlordBot for quick access
                  </p>
                  
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <span>Tap</span>
                      <Share2 className="w-4 h-4 text-blue-500" />
                      <span>then</span>
                      <span className="font-medium">Add to Home Screen</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Android version
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`z-50 ${position === 'sidebar' ? 'relative' : 'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm'}`}
        >
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Smartphone className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm">
                  Add to Home Screen
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Install LandlordBot for quick access
                </p>
                
                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                    <span>Tap</span>
                    <MoreVertical className="w-4 h-4 text-slate-500" />
                    <span>then</span>
                    <span className="font-medium">Add to Home Screen</span>
                  </div>
                </div>

                {(window as any).deferredPrompt && (
                  <button
                    onClick={handleInstall}
                    className="mt-3 w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Install Now
                  </button>
                )}
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default PWAInstallPrompt;
