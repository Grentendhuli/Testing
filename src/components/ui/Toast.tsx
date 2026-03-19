import React, { createContext, useContext, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  key?: React.Key;
}

interface ToastContextType {
  success: (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'message'>>) => void;
  error: (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'message'>>) => void;
  warning: (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'message'>>) => void;
  info: (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'message'>>) => void;
  promise: <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => Promise<T>;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: 'border-l-4 border-l-lb-green',
  error: 'border-l-4 border-l-lb-red',
  warning: 'border-l-4 border-l-lb-orange',
  info: 'border-l-4 border-l-lb-blue',
};

const iconStyles = {
  success: 'text-lb-green',
  error: 'text-lb-red',
  warning: 'text-lb-orange',
  info: 'text-lb-blue',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss
    if (toast.duration !== 0) {
      setTimeout(() => {
        dismiss(id);
      }, toast.duration || 5000);
    }

    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const success = useCallback(
    (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'message'>>) => {
      addToast({ type: 'success', title, message, ...options });
    },
    [addToast]
  );

  const error = useCallback(
    (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'message'>>) => {
      addToast({ type: 'error', title, message, duration: 0, ...options });
    },
    [addToast]
  );

  const warning = useCallback(
    (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'message'>>) => {
      addToast({ type: 'warning', title, message, ...options });
    },
    [addToast]
  );

  const info = useCallback(
    (title: string, message?: string, options?: Partial<Omit<Toast, 'id' | 'type' | 'title' | 'message'>>) => {
      addToast({ type: 'info', title, message, ...options });
    },
    [addToast]
  );

  const promise = useCallback(
    async function promiseWrapper<T>(
      promise: Promise<T>,
      messages: { loading: string; success: string; error: string }
    ): Promise<T> {
      const id = addToast({
        type: 'info',
        title: messages.loading,
        duration: 0,
      });

      try {
        const result = await promise;
        dismiss(id);
        success(messages.success);
        return result;
      } catch (err) {
        dismiss(id);
        error(messages.error);
        throw err;
      }
    },
    [addToast, dismiss, success, error]
  );

  return (
    <ToastContext.Provider value={{ success, error, warning, info, promise, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({
  toast,
  onDismiss,
}: ToastItemProps) {
  const Icon = icons[toast.type];

  return (
    <div
      className={cn(
        'relative flex items-start gap-3 p-4 bg-lb-surface border border-lb-border rounded-lg shadow-xl min-w-[320px] max-w-[480px] animate-slide-in-right',
        styles[toast.type]
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', iconStyles[toast.type])} />
      
      <div className="flex-1 min-w-0">
        <p className="font-medium text-lb-text-primary">{toast.title}</p>
        {toast.message && (
          <p className="text-sm text-lb-text-secondary mt-1">{toast.message}</p>
        )}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="mt-2 text-sm font-medium text-lb-orange hover:text-lb-orange-hover transition-colors"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 p-1 text-lb-text-muted hover:text-lb-text-primary hover:bg-lb-muted rounded transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress bar for auto-dismiss */}
      {toast.duration !== 0 && (
        <div
          className="absolute bottom-0 left-0 h-0.5 bg-current opacity-20"
          style={{
            width: '100%',
            animation: `toastProgress ${toast.duration || 5000}ms linear forwards`,
          }}
        />
      )}
    </div>
  );
}

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-[80] flex flex-col gap-3">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>,
    document.body
  );
}

// Standalone Toast component for custom usage
export function Toast({
  type,
  title,
  message,
  action,
  onDismiss,
}: {
  type: ToastType;
  title: string;
  message?: string;
  action?: { label: string; onClick: () => void };
  onDismiss?: () => void;
}) {
  const Icon = icons[type];

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 bg-lb-surface border border-lb-border rounded-lg shadow-lg',
        styles[type]
      )}
      role="alert"
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', iconStyles[type])} />
      <div className="flex-1">
        <p className="font-medium text-lb-text-primary">{title}</p>
        {message && <p className="text-sm text-lb-text-secondary mt-1">{message}</p>}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-sm font-medium text-lb-orange hover:text-lb-orange-hover"
          >
            {action.label}
          </button>
        )}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 text-lb-text-muted hover:text-lb-text-primary"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
