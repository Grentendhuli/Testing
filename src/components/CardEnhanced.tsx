import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';
import { Skeleton, SkeletonCard } from './ui/Skeleton';
import { EmptyState } from './ui/EmptyState';
import { ButtonEnhanced } from './ButtonEnhanced';
import { AlertCircle, RefreshCw, Loader2 } from 'lucide-react';

// Card variants using class-variance-authority
const cardVariants = cva(
  'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'hover:border-slate-300 dark:hover:border-slate-600',
        elevated: 'shadow-card hover:shadow-card-hover hover:-translate-y-0.5',
        outlined: 'border-2',
        ghost: 'border-transparent bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50',
        interactive: 'cursor-pointer hover:border-amber-500/50 dark:hover:border-amber-400/50 hover:shadow-lg hover:-translate-y-0.5',
      },
      size: {
        default: 'p-6',
        sm: 'p-4',
        lg: 'p-8',
        none: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

// Loading state wrapper
interface CardLoadingProps {
  children: React.ReactNode;
  isLoading: boolean;
  skeleton?: React.ReactNode;
  minHeight?: string;
}

export function CardLoading({
  children,
  isLoading,
  skeleton,
  minHeight = '200px',
}: CardLoadingProps) {
  if (isLoading) {
    return (
      <div style={{ minHeight }}>
        {skeleton || <SkeletonCard />}
      </div>
    );
  }
  return <>{children}</>;
}

// Error state wrapper
interface CardErrorProps {
  children: React.ReactNode;
  error: string | null | undefined;
  onRetry?: () => void;
  minHeight?: string;
}

export function CardError({
  children,
  error,
  onRetry,
  minHeight = '200px',
}: CardErrorProps) {
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center p-8 text-center"
        style={{ minHeight }}
      >
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Something went wrong
        </h3>
        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
          {error}
        </p>
        {onRetry && (
          <ButtonEnhanced
            variant="secondary"
            onClick={onRetry}
            icon={<RefreshCw className="w-4 h-4" />}
          >
            Try Again
          </ButtonEnhanced>
        )}
      </motion.div>
    );
  }
  return <>{children}</>;
}

// Empty state wrapper
interface CardEmptyProps {
  children: React.ReactNode;
  isEmpty: boolean;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  illustration?: 'units' | 'maintenance' | 'leads' | 'payments' | 'leases' | 'search' | 'generic';
  minHeight?: string;
}

export function CardEmpty({
  children,
  isEmpty,
  title,
  description,
  action,
  illustration = 'generic',
  minHeight = '300px',
}: CardEmptyProps) {
  if (isEmpty) {
    return (
      <div style={{ minHeight }}>
        <EmptyState
          illustration={illustration}
          title={title}
          description={description}
          action={action}
        />
      </div>
    );
  }
  return <>{children}</>;
}

// Main Card component with data states
export interface CardEnhancedProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  as?: 'div' | 'article' | 'section';
  animate?: boolean;
  delay?: number;
  /** Loading state - shows skeleton */
  isLoading?: boolean;
  /** Error state - shows error message */
  error?: string | null;
  /** Empty state - shows empty message */
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; onClick: () => void };
  emptyIllustration?: 'units' | 'maintenance' | 'leads' | 'payments' | 'leases' | 'search' | 'generic';
  /** Retry handler for error state */
  onRetry?: () => void;
  /** Custom skeleton component */
  skeleton?: React.ReactNode;
  /** CTA button at bottom of card */
  cta?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    loading?: boolean;
  };
  /** Maximum height of card content */
  maxHeight?: string;
}

export function CardEnhanced({
  className,
  variant,
  size,
  as: Component = 'div',
  animate = false,
  delay = 0,
  isLoading = false,
  error,
  isEmpty = false,
  emptyTitle = 'No data',
  emptyDescription = 'There is nothing to show here yet.',
  emptyAction,
  emptyIllustration = 'generic',
  onRetry,
  skeleton,
  cta,
  maxHeight,
  children,
  ...props
}: CardEnhancedProps) {
  const [isHovered, setIsHovered] = useState(false);

  const renderContent = () => {
    // Error state takes precedence
    if (error) {
      return (
        <CardError error={error} onRetry={onRetry}>
          {children}
        </CardError>
      );
    }

    // Loading state
    if (isLoading) {
      return (
        <CardLoading isLoading={true} skeleton={skeleton}>
          {children}
        </CardLoading>
      );
    }

    // Empty state
    if (isEmpty) {
      return (
        <CardEmpty
          isEmpty={true}
          title={emptyTitle}
          description={emptyDescription}
          action={emptyAction}
          illustration={emptyIllustration}
        >
          {children}
        </CardEmpty>
      );
    }

    return (
      <>
        {children}
        {cta && (
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
            <ButtonEnhanced
              variant={cta.variant || 'primary'}
              fullWidth
              onClick={cta.onClick}
              loading={cta.loading}
            >
              {cta.label}
            </ButtonEnhanced>
          </div>
        )}
      </>
    );
  };

  const cardContent = (
    <Component
      className={cn(cardVariants({ variant, size }), className)}
      style={maxHeight ? { maxHeight, overflow: 'auto' } : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {renderContent()}
    </Component>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.4,
          delay,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
}

// Card Header with loading state
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  isLoading?: boolean;
}

export function CardHeader({
  className,
  title,
  description,
  action,
  isLoading = false,
  children,
  ...props
}: CardHeaderProps) {
  if (isLoading) {
    return (
      <div className={cn('pb-4 border-b border-slate-200 dark:border-slate-700', className)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <Skeleton width={150} height={24} />
            <Skeleton width={200} height={16} />
          </div>
          <Skeleton width={80} height={32} variant="rounded" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700',
        className
      )}
      {...props}
    >
      <div className="flex-1 min-w-0">
        {title && (
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
        )}
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {description}
          </p>
        )}
        {children}
      </div>
      {action && (
        <div className="flex-shrink-0">{action}</div>
      )}
    </div>
  );
}

// Card Content with loading state
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
  isLoading?: boolean;
  skeletonCount?: number;
}

export function CardContent({
  className,
  noPadding = false,
  isLoading = false,
  skeletonCount = 3,
  children,
  ...props
}: CardContentProps) {
  if (isLoading) {
    return (
      <div className={cn(!noPadding && 'p-6', className)}>
        <div className="space-y-3">
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <Skeleton key={i} width={i === skeletonCount - 1 ? '60%' : '100%'} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(!noPadding && 'p-6', className)}
      {...props}
    >
      {children}
    </div>
  );
}

// Card Footer with loading state
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'center' | 'right';
  isLoading?: boolean;
}

export function CardFooter({
  className,
  align = 'right',
  isLoading = false,
  children,
  ...props
}: CardFooterProps) {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700', alignClasses[align], className)}>
        <Skeleton width={80} height={36} variant="rounded" />
        <Skeleton width={80} height={36} variant="rounded" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700',
        alignClasses[align],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Data Card - A complete card with data fetching states
interface DataCardProps extends Omit<CardEnhancedProps, 'children'> {
  data: any[] | null | undefined;
  renderItem: (item: any, index: number) => React.ReactNode;
  keyExtractor: (item: any) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: { label: string; onClick: () => void };
  errorMessage?: string;
  onRetry?: () => void;
  maxHeight?: string;
}

export function DataCard({
  data,
  renderItem,
  keyExtractor,
  emptyTitle = 'No items',
  emptyDescription = 'There are no items to display.',
  emptyAction,
  errorMessage,
  onRetry,
  maxHeight,
  ...cardProps
}: DataCardProps) {
  const isLoading = data === undefined;
  const isEmpty = !isLoading && (!data || data.length === 0);
  const hasError = !!errorMessage;

  return (
    <CardEnhanced
      {...cardProps}
      isLoading={isLoading && !hasError}
      isEmpty={isEmpty && !hasError}
      error={hasError ? errorMessage : undefined}
      onRetry={onRetry}
      emptyTitle={emptyTitle}
      emptyDescription={emptyDescription}
      emptyAction={emptyAction}
    >
      {!isLoading && !isEmpty && !hasError && (
        <div className={cn('space-y-3', maxHeight && 'overflow-y-auto')} style={{ maxHeight }}>
          {data.map((item, index) => (
            <motion.div
              key={keyExtractor(item)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {renderItem(item, index)}
            </motion.div>
          ))}
        </div>
      )}
    </CardEnhanced>
  );
}

// Metric Card with loading and error states
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function MetricCardEnhanced({
  title,
  value,
  change,
  icon,
  variant = 'default',
  isLoading = false,
  error,
  onRetry,
  className = '',
}: MetricCardProps) {
  const variantStyles = {
    default: {
      bg: 'bg-slate-50 dark:bg-slate-700/50',
      iconBg: 'bg-slate-100 dark:bg-slate-600',
      iconColor: 'text-slate-600 dark:text-slate-400',
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
      iconBg: 'bg-emerald-100 dark:bg-emerald-800/50',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      iconBg: 'bg-amber-100 dark:bg-amber-800/50',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    danger: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      iconBg: 'bg-red-100 dark:bg-red-800/50',
      iconColor: 'text-red-600 dark:text-red-400',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      iconBg: 'bg-blue-100 dark:bg-blue-800/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
  };

  const styles = variantStyles[variant];

  if (isLoading) {
    return (
      <div className={cn(
        'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5',
        className
      )}>
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <Skeleton width={100} variant="text" className="h-4" />
            <Skeleton width={80} height={36} />
            <Skeleton width={60} variant="text" className="h-3" />
          </div>
          <Skeleton variant="circular" width={48} height={48} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        'bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 rounded-xl p-5',
        className
      )}>
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-sm text-red-600 dark:text-red-400">Failed to load</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 text-sm text-amber-600 hover:text-amber-500 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {value}
            </span>
            {change && (
              <span className={cn(
                'text-sm font-medium',
                change.trend === 'up' && 'text-emerald-600 dark:text-emerald-400',
                change.trend === 'down' && 'text-red-600 dark:text-red-400',
                change.trend === 'neutral' && 'text-slate-500 dark:text-slate-400'
              )}>
                {change.trend === 'up' && '↑'}
                {change.trend === 'down' && '↓'}
                {change.value}%
              </span>
            )}
          </div>
        </div>

        {icon && (
          <div className={cn('p-2.5 rounded-lg', styles.iconBg, styles.iconColor)}>
            {icon}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default CardEnhanced;
