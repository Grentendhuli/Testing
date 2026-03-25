import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
}

const variantStyles = {
  default: 'bg-lb-orange text-white border-transparent hover:bg-lb-orange/90',
  secondary: 'bg-lb-slate text-lb-text-primary border-transparent hover:bg-lb-slate/80',
  destructive: 'bg-red-500 text-white border-transparent hover:bg-red-500/90',
  outline: 'bg-transparent text-lb-text-secondary border-lb-border hover:bg-lb-muted/50',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ children, className, variant = 'default', ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors border',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
