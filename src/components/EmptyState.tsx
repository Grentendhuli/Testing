import React from 'react';
import { Home, Plus, ArrowRight } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionText = 'Get Started',
  onAction,
  icon = <Home className="w-12 h-12 text-slate-300" />,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 min-h-[400px]">
      <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-500 max-w-sm mb-6">{description}</p>
      {onAction && (
        <Button onClick={onAction} className="gap-2" size="lg">
          <Plus className="w-4 h-4" />
          {actionText}
          <ArrowRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
