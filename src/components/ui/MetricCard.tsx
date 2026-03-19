import React from 'react';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: {
    value: number;
    period: string;
  };
  icon: LucideIcon;
  color: 'amber' | 'emerald' | 'blue' | 'purple' | 'red';
  trend?: 'up' | 'down' | 'neutral';
  onClick?: () => void;
  className?: string;
}

const colorStyles = {
  amber: {
    bg: 'bg-lb-orange/10',
    border: 'border-lb-orange/20',
    text: 'text-lb-orange',
    iconBg: 'bg-lb-orange/20',
  },
  emerald: {
    bg: 'bg-lb-green/10',
    border: 'border-lb-green/20',
    text: 'text-lb-green',
    iconBg: 'bg-lb-green/20',
  },
  blue: {
    bg: 'bg-lb-blue/10',
    border: 'border-lb-blue/20',
    text: 'text-lb-blue',
    iconBg: 'bg-lb-blue/20',
  },
  purple: {
    bg: 'bg-lb-purple/10',
    border: 'border-lb-purple/20',
    text: 'text-lb-purple',
    iconBg: 'bg-lb-purple/20',
  },
  red: {
    bg: 'bg-lb-red/10',
    border: 'border-lb-red/20',
    text: 'text-lb-red',
    iconBg: 'bg-lb-red/20',
  },
};

export function MetricCard({
  title,
  value,
  subtitle,
  change,
  icon: Icon,
  color,
  trend,
  onClick,
  className,
}: MetricCardProps) {
  const styles = colorStyles[color];
  
  // Determine trend from change value if not explicitly provided
  const determinedTrend = trend || (change?.value != null && change.value > 0 ? 'up' : change?.value != null && change.value < 0 ? 'down' : 'neutral');
  const TrendIcon = determinedTrend === 'up' ? TrendingUp : determinedTrend === 'down' ? TrendingDown : Minus;
  const trendColor = determinedTrend === 'up' ? 'text-lb-green' : determinedTrend === 'down' ? 'text-lb-red' : 'text-lb-text-muted';

  return (
    <div
      className={cn(
        'relative p-5 rounded-xl border transition-all duration-200',
        styles.bg,
        styles.border,
        'hover:border-opacity-60 hover:shadow-lg',
        onClick && 'cursor-pointer hover:-translate-y-0.5',
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="text-sm text-lb-text-secondary mb-1 truncate">{title}</p>
          
          {/* Value */}
          <p className="text-3xl font-bold text-lb-text-primary truncate">{value}</p>
          
          {/* Change indicator */}
          {change && (
            <div className={cn('flex items-center gap-1 mt-2', trendColor)}>
              <TrendIcon className="w-4 h-4" />
              <span className="text-sm font-medium">
                {change.value > 0 ? '+' : ''}{change.value}%
              </span>
              <span className="text-sm text-lb-text-muted ml-1">{change.period}</span>
            </div>
          )}
          
          {/* Subtitle */}
          {subtitle && !change && (
            <p className="text-sm text-lb-text-muted mt-2">{subtitle}</p>
          )}
        </div>

        {/* Icon */}
        <div className={cn('p-3 rounded-xl flex-shrink-0 ml-4', styles.iconBg)}>
          <Icon className={cn('w-5 h-5', styles.text)} />
        </div>
      </div>
    </div>
  );
}

// Compact version for dense layouts
export function MetricCardCompact({
  title,
  value,
  icon: Icon,
  color,
  onClick,
  className,
}: Omit<MetricCardProps, 'subtitle' | 'change' | 'trend'>) {
  const styles = colorStyles[color];

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-xl border transition-all duration-200',
        styles.bg,
        styles.border,
        onClick && 'cursor-pointer hover:shadow-md',
        className
      )}
      onClick={onClick}
    >
      <div className={cn('p-2.5 rounded-lg', styles.iconBg)}>
        <Icon className={cn('w-5 h-5', styles.text)} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-xs text-lb-text-muted uppercase tracking-wide truncate">{title}</p>
        <p className="text-xl font-bold text-lb-text-primary truncate">{value}</p>
      </div>
    </div>
  );
}

// Grid of metrics
export function MetricGrid({
  children,
  className,
  columns = 4,
}: {
  children: React.ReactNode;
  className?: string;
  columns?: 2 | 3 | 4;
}) {
  return (
    <div
      className={cn(
        'grid gap-4',
        columns === 2 && 'grid-cols-1 sm:grid-cols-2',
        columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
        className
      )}
    >
      {children}
    </div>
  );
}

export default MetricCard;
