import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle, 
  Info, 
  X,
  Loader2
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  key?: React.Key;
}

interface ToastItemProps extends Toast {
  onDismiss: (id: string) => void;
  key?: React.Key;
}

const toastConfig: Record<ToastType, { 
  icon: React.ElementType; 
  bg: string; 
  border: string; 
  text: string;
  iconColor: string;
}> = {
  success: {
    icon: CheckCircle,
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    text: 'text-emerald-800 dark:text-emerald-200',
    iconColor: 'text-emerald-500 dark:text-emerald-400',
  },
  error: {
    icon: AlertCircle,
    bg: 'bg-red-50 dark:bg-red-900/30',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-200',
    iconColor: 'text-red-500 dark:text-red-400',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    border: 'border-amber-200 dark:border-amber-800',
    text: 'text-amber-800 dark:text-amber-200',
    iconColor: 'text-amber-500 dark:text-amber-400',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-800',
    text: 'text-blue-800 dark:text-blue-200',
    iconColor: 'text-blue-500 dark:text-blue-400',
  },
  loading: {
    icon: Loader2,
    bg: 'bg-slate-50 dark:bg-slate-800',
    border: 'border-slate-200 dark:border-slate-700',
    text: 'text-slate-800 dark:text-slate-200',
    iconColor: 'text-amber-500 dark:text-amber-400',
  },
};

function ToastItem({ id, message, type, duration = 5000, action, onDismiss }: ToastItemProps) {
  const config = toastConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    if (type === 'loading' || duration === Infinity) return;
    
    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, type, onDismiss]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`pointer-events-auto flex items-start gap-3 w-full max-w-sm p-4 rounded-xl border shadow-lg ${config.bg} ${config.border}`}
    >
      <div className={`flex-shrink-0 mt-0.5 ${config.iconColor}`}>
        <Icon className={`w-5 h-5 ${type === 'loading' ? 'animate-spin' : ''}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${config.text}`}>{message}</p>
        
        {action && (
          <button
            onClick={action.onClick}
            className={`mt-2 text-sm font-medium underline hover:no-underline ${config.text}`}
          >
            {action.label}
          </button>
        )}
      </div>
      
      <button
        onClick={() => onDismiss(id)}
        className={`flex-shrink-0 -mr-1 -mt-1 p-1 rounded-lg opacity-60 hover:opacity-100 transition-opacity ${config.text}`}
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// Toast Container Component
interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
  position?: 'top-left' | 'top-right' | 'top-center' | 'bottom-left' | 'bottom-right' | 'bottom-center';
}

export function ToastContainer({ 
  toasts, 
  onDismiss, 
  position = 'bottom-right' 
}: ToastContainerProps) {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  return (
    <div className={`fixed z-50 flex flex-col gap-2 ${positionClasses[position]}`}>
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} {...toast} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Hook for using toasts
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>) => {
    return addToast({ message, type: 'success', ...options });
  }, [addToast]);

  const error = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>) => {
    return addToast({ message, type: 'error', duration: 8000, ...options });
  }, [addToast]);

  const warning = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>) => {
    return addToast({ message, type: 'warning', ...options });
  }, [addToast]);

  const info = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>) => {
    return addToast({ message, type: 'info', ...options });
  }, [addToast]);

  const loading = useCallback((message: string, options?: Partial<Omit<Toast, 'id' | 'message' | 'type'>>) => {
    return addToast({ message, type: 'loading', duration: Infinity, ...options });
  }, [addToast]);

  const dismiss = useCallback((id: string) => {
    removeToast(id);
  }, [removeToast]);

  const update = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  }, []);

  return {
    toasts,
    success,
    error,
    warning,
    info,
    loading,
    dismiss,
    update,
    removeToast,
  };
}

export default Toast;