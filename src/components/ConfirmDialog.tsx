import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'warning' | 'info';
  showReasonInput?: boolean;
  reasonValue?: string;
  onReasonChange?: (value: string) => void;
  reasonPlaceholder?: string;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  variant = 'danger',
  showReasonInput = false,
  reasonValue = '',
  onReasonChange,
  reasonPlaceholder = 'Enter reason...',
}: ConfirmDialogProps) {
  const modalRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  const variantConfig = {
    danger: {
      iconColor: 'text-red-500',
      iconBg: 'bg-red-500/20',
      buttonVariant: 'danger' as const,
    },
    warning: {
      iconColor: 'text-amber-500',
      iconBg: 'bg-amber-500/20',
      buttonVariant: 'primary' as const,
    },
    info: {
      iconColor: 'text-blue-500',
      iconBg: 'bg-blue-500/20',
      buttonVariant: 'primary' as const,
    },
  };

  const config = variantConfig[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === modalRef.current && !isLoading) {
              onClose();
            }
          }}
          ref={modalRef}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl max-w-md w-full shadow-2xl"
          >
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${config.iconBg}`}>
                  <AlertTriangle className={`w-6 h-6 ${config.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    {message}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {showReasonInput && onReasonChange && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Reason (optional)
                  </label>
                  <textarea
                    value={reasonValue}
                    onChange={(e) => onReasonChange(e.target.value)}
                    placeholder={reasonPlaceholder}
                    rows={3}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                  />
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1"
                >
                  {cancelText}
                </Button>
                <Button
                  variant={config.buttonVariant}
                  onClick={onConfirm}
                  disabled={isLoading}
                  loading={isLoading}
                  className="flex-1"
                >
                  {confirmText}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ConfirmDialog;
