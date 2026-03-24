import React from 'react';
import { LucideIcon, Building2, TrendingUp, AlertCircle, DollarSign, Wrench } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
  onClick?: () => void;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon = TrendingUp,
  trend,
  trendValue,
  className = '',
  onClick,
}: MetricCardProps) {
  const trendColors = {
    up: 'text-emerald-500',
    down: 'text-red-500',
    neutral: 'text-slate-500',
  };

  const IconToUse = Icon;

  return (
    <div
      onClick={onClick}
      className={`
        bg-white border border-slate-200 rounded-xl p-6 
        ${onClick ? 'cursor-pointer hover:border-amber-500/50 hover:shadow-lg transition-all duration-200' : ''}
        ${className}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-slate-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${trendColors[trend]}`}>
              <span>{trend === 'up' ? '↑' : trend === 'down' ? '↓' : '−'}</span>
              <span>{trendValue}</span>
            </div>
          )}
        </div>
        <div className="p-3 bg-amber-50 rounded-lg">
          <IconToUse className="w-5 h-5 text-amber-600" />
        </div>
      </div>
    </div>
  );
}

interface EmptyStateCardProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyStateCard({
  title,
  description,
  icon: Icon = Building2,
  action,
  className = '',
}: EmptyStateCardProps) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-8 text-center ${className}`}>
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      {description && (
        <p className="text-slate-500 mb-6 max-w-sm mx-auto">{description}</p>
      )}
      {action && (
        <div className="flex justify-center">{action}</div>
      )}
    </div>
  );
}

// Generic Card component
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({
  children,
  className = '',
  padding = 'md',
  shadow = 'sm',
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  return (
    <div
      className={`
        bg-white border border-slate-200 rounded-xl
        ${paddingClasses[padding]}
        ${shadowClasses[shadow]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export default Card;
