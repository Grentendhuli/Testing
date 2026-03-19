import React from 'react';
import { Building2, Wrench, Users, DollarSign, FileText, Search, LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../Button';

interface EmptyStateProps {
  icon?: LucideIcon;
  illustration?: 'units' | 'maintenance' | 'leads' | 'payments' | 'leases' | 'search' | 'generic';
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const illustrations: Record<string, { icon: LucideIcon; color: string }> = {
  units: { icon: Building2, color: 'text-lb-orange' },
  maintenance: { icon: Wrench, color: 'text-lb-blue' },
  leads: { icon: Users, color: 'text-lb-green' },
  payments: { icon: DollarSign, color: 'text-lb-green' },
  leases: { icon: FileText, color: 'text-lb-purple' },
  search: { icon: Search, color: 'text-lb-text-muted' },
  generic: { icon: Building2, color: 'text-lb-text-muted' },
};

export function EmptyState({
  icon: CustomIcon,
  illustration = 'generic',
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  const { icon: IllustrationIcon, color } = illustrations[illustration];
  const Icon = CustomIcon || IllustrationIcon;

  return (
    <div
      className={cn(
        'flex flex-col items-center text-center p-8 sm:p-12',
        'bg-lb-surface border-2 border-dashed border-lb-border rounded-xl',
        className
      )}
    >
      {/* Icon */}
      <div className="w-20 h-20 bg-lb-muted rounded-full flex items-center justify-center mb-6">
        <Icon className={cn('w-10 h-10', color)} />
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-lb-text-primary mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-base text-lb-text-secondary max-w-sm mb-6">
        {description}
      </p>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {action && (
          <Button
            onClick={action.onClick}
            variant={action.variant || 'primary'}
            size="lg"
          >
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button
            onClick={secondaryAction.onClick}
            variant="ghost"
            size="lg"
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}

// Specialized empty states for common scenarios
export function EmptyUnits({ action, secondaryAction, className }: Omit<EmptyStateProps, 'illustration' | 'icon' | 'title' | 'description'>) {
  return (
    <EmptyState
      illustration="units"
      title="No units yet"
      description="Add your first property unit to start managing your portfolio."
      action={action}
      secondaryAction={secondaryAction}
      className={className}
    />
  );
}

export function EmptyMaintenance({ action, secondaryAction, className }: Omit<EmptyStateProps, 'illustration' | 'icon' | 'title' | 'description'>) {
  return (
    <EmptyState
      illustration="maintenance"
      title="No maintenance requests"
      description="All caught up! New requests will appear here."
      action={action}
      secondaryAction={secondaryAction}
      className={className}
    />
  );
}

export function EmptyLeads({ action, secondaryAction, className }: Omit<EmptyStateProps, 'illustration' | 'icon' | 'title' | 'description'>) {
  return (
    <EmptyState
      illustration="leads"
      title="No leads yet"
      description="Prospective tenants will appear here when they inquire."
      action={action}
      secondaryAction={secondaryAction}
      className={className}
    />
  );
}

export function EmptySearch({
  query,
  onClear,
  className,
}: {
  query: string;
  onClear: () => void;
  className?: string;
}) {
  return (
    <EmptyState
      illustration="search"
      title="No results found"
      description={`We couldn't find anything matching "${query}"`}
      action={{
        label: 'Clear search',
        onClick: onClear,
        variant: 'outline',
      }}
      className={className}
    />
  );
}

export default EmptyState;
