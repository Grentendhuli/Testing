import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({
  message,
  type,
  isVisible,
  onClose,
  duration = 5000,
}: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  const config = {
    success: {
      icon: CheckCircle,
      bg: 'bg-emerald-500',
      border: 'border-emerald-400',
      text: 'text-white',
    },
    error: {
      icon: XCircle,
      bg: 'bg-red-500',
      border: 'border-red-400',
      text: 'text-white',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-amber-500',
      border: 'border-amber-400',
      text: 'text-white',
    },
    info: {
      icon: Info,
      bg: 'bg-blue-500',
      border: 'border-blue-400',
      text: 'text-white',
    },
  };

  const { icon: Icon, bg, border, text } = config[type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: -50, x: '-50%' }}
          transition={{ duration: 0.3 }}
          className={`fixed top-4 left-1/2 z-[100] ${bg} ${border} border rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 min-w-[300px] max-w-md`}
        >
          <Icon className={`w-5 h-5 ${text}`} />
          <p className={`flex-1 text-sm font-medium ${text}`}>{message}</p>
          <button
            onClick={onClose}
            className={`${text} opacity-80 hover:opacity-100 transition-opacity`}
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for managing toast state
import { useState, useCallback } from 'react';

interface ToastState {
  message: string;
  type: ToastType;
  isVisible: boolean;
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type, isVisible: true });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, isVisible: false }));
  }, []);

  const showSuccess = useCallback((message: string) => {
    showToast(message, 'success');
  }, [showToast]);

  const showError = useCallback((message: string) => {
    showToast(message, 'error');
  }, [showToast]);

  const showWarning = useCallback((message: string) => {
    showToast(message, 'warning');
  }, [showToast]);

  return {
    toast,
    showToast,
    hideToast,
    showSuccess,
    showError,
    showWarning,
  };
}

export default Toast;
