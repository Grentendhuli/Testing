import { motion } from 'framer-motion';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

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

export interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  as?: 'div' | 'article' | 'section';
  animate?: boolean;
  delay?: number;
}

export function Card({
  className,
  variant,
  size,
  as: Component = 'div',
  animate = false,
  delay = 0,
  children,
  ...props
}: CardProps) {
  const cardContent = (
    <Component
      className={cn(cardVariants({ variant, size }), className)}
      {...props}
    >
      {children}
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

// Card Header
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function CardHeader({ 
  className, 
  title, 
  description, 
  action,
  children,
  ...props 
}: CardHeaderProps) {
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

// Card Content
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean;
}

export function CardContent({ 
  className, 
  noPadding = false,
  children,
  ...props 
}: CardContentProps) {
  return (
    <div 
      className={cn(
        !noPadding && 'p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Card Footer
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'center' | 'right';
}

export function CardFooter({ 
  className, 
  align = 'right',
  children,
  ...props 
}: CardFooterProps) {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

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

// Metric Card
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  loading?: boolean;
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  icon,
  variant = 'default',
  loading = false,
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
              {loading ? '—' : value}
            </span>
            {change && !loading && (
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

// Empty State Card
interface EmptyStateCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyStateCard({
  title,
  description,
  icon,
  action,
  className = '',
}: EmptyStateCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center',
        className
      )}
    >
      {icon && (
        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
          <div className="text-slate-400 dark:text-slate-500">{icon}</div>
        </div>
      )}
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}
      
      {action && (
        <div className="flex justify-center">{action}</div>
      )}
    </motion.div>
  );
}

export default Card;
