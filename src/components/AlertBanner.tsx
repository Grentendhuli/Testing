import { AlertTriangle, Clock, CheckCircle, X } from 'lucide-react';
import { useState, useEffect } from 'react';

type AlertType = 'success' | 'warning' | 'error' | 'info';

interface AlertBannerProps {
  type: AlertType;
  title: string;
  message: string;
  autoDismiss?: boolean;
  dismissDuration?: number;
  onDismiss?: () => void;
}

const alertStyles = {
  success: {
    border: 'border-emerald-700',
    bg: 'bg-emerald-900/30',
    icon: CheckCircle,
    iconColor: 'text-emerald-400',
  },
  warning: {
    border: 'border-amber-700',
    bg: 'bg-amber-900/30',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
  },
  error: {
    border: 'border-red-700',
    bg: 'bg-red-900/30',
    icon: AlertTriangle,
    iconColor: 'text-red-400',
  },
  info: {
    border: 'border-blue-700',
    bg: 'bg-blue-900/30',
    icon: Clock,
    iconColor: 'text-blue-400',
  },
};

export function AlertBanner({
  type,
  title,
  message,
  autoDismiss = true,
  dismissDuration = 8000,
  onDismiss,
}: AlertBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const styles = alertStyles[type];
  const Icon = styles.icon;

  useEffect(() => {
    if (autoDismiss) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, dismissDuration);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, dismissDuration, onDismiss]);

  if (!isVisible) return null;

  return (
    <div
      className={`animate-slide-in fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl mx-4 ${styles.bg} border ${styles.border} rounded-lg shadow-xl backdrop-blur-sm`}
    >
      <div className="flex items-start gap-3 p-4">
        <div className={`flex-shrink-0 ${styles.iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-200">{title}</p>
          <p className="text-sm text-slate-400 mt-1">{message}</p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            onDismiss?.();
          }}
          className="flex-shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
