import { useEffect, useCallback } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/Button';
import { useNavigate, useLocation } from 'react-router-dom';

interface SessionExpiredModalProps {
  isOpen: boolean;
  onClose?: () => void;
  currentPath?: string;
}

/**
 * Session Expired Modal
 * Shows when Supabase JWT expires
 * Preserves current URL so user can return after re-login
 */
export function SessionExpiredModal({ 
  isOpen, 
  onClose,
  currentPath: propCurrentPath 
}: SessionExpiredModalProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use provided path or current location
  const currentPath = propCurrentPath || location.pathname + location.search;

  const handleSignIn = useCallback(() => {
    // Preserve current URL to return after login
    const returnUrl = encodeURIComponent(currentPath);
    const loginUrl = `/login?reason=session_expired&return_to=${returnUrl}`;
    
    // Close modal if handler provided
    onClose?.();
    
    // Navigate to login with return URL
    navigate(loginUrl, { replace: true });
  }, [navigate, currentPath, onClose]);

  // Close modal on escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Don't allow escape to close - user must sign in
        e.preventDefault();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
            aria-hidden="true"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="session-expired-title"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
              {/* Header with icon */}
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 p-6 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h2 
                  id="session-expired-title"
                  className="text-2xl font-bold text-white"
                >
                  Your session has expired
                </h2>
              </div>
              
              {/* Content */}
              <div className="p-6 text-center">
                <p className="text-slate-600 dark:text-slate-400 mb-2">
                  Please sign in again to continue
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-500 mb-6">
                  For security reasons, we ask you to sign back in. Your work will be right where you left it.
                </p>
                
                {/* Actions */}
                <div className="flex flex-col gap-3">
                  <Button
                    onClick={handleSignIn}
                    size="lg"
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold"
                  >
                    Sign in
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
              
              {/* Footer hint */}
              <div className="px-6 pb-4 text-center">
                <p className="text-xs text-slate-400 dark:text-slate-600">
                  You'll be redirected back to: {currentPath === '/' || currentPath === '/login' ? 'Dashboard' : currentPath.split('?')[0]}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default SessionExpiredModal;
