import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AlertProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'destructive';
  onClose?: () => void;
}

const variantStyles = {
  default: 'bg-lb-surface border-lb-border text-lb-text-primary [&>svg]:text-lb-orange',
  destructive: 'bg-red-50 border-red-200 text-red-900 dark:bg-red-950/30 dark:border-red-900 dark:text-red-200 [&>svg]:text-red-600 dark:[&>svg]:text-red-400',
};

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ children, className, variant = 'default', onClose, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(
          'relative w-full rounded-lg border p-4 [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:h-4 [&>svg]:w-4',
          variantStyles[variant],
          onClose && 'pr-10',
          className
        )}
        {...props}
      >
        <AlertCircle className="h-4 w-4" />
        {onClose && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Close alert"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <div className="pl-6">{children}</div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export interface AlertTitleProps {
  children: React.ReactNode;
  className?: string;
}

export const AlertTitle = React.forwardRef<HTMLHeadingElement, AlertTitleProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <h5
        ref={ref}
        className={cn('mb-1 font-medium leading-none tracking-tight', className)}
        {...props}
      >
        {children}
      </h5>
    );
  }
);

AlertTitle.displayName = 'AlertTitle';

export interface AlertDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export const AlertDescription = React.forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn('text-sm opacity-90', className)}
        {...props}
      >
        {children}
      </p>
    );
  }
);

AlertDescription.displayName = 'AlertDescription';

export default Alert;
