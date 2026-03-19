import { MessageSquare, AlertTriangle, Wrench, Users } from 'lucide-react';
import { MessageType } from '../types';

interface MessageTypeBadgeProps {
  type: MessageType;
  showLabel?: boolean;
}

const typeConfig = {
  inquiry: {
    icon: MessageSquare,
    label: 'Inquiry',
    bgColor: 'bg-slate-700',
    textColor: 'text-slate-300',
    borderColor: 'border-slate-600',
  },
  lead: {
    icon: Users,
    label: 'Lead Qualified',
    bgColor: 'bg-emerald-900/50',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-700',
  },
  emergency: {
    icon: AlertTriangle,
    label: 'Emergency',
    bgColor: 'bg-red-900/50',
    textColor: 'text-red-400',
    borderColor: 'border-red-700',
  },
  maintenance: {
    icon: Wrench,
    label: 'Maintenance',
    bgColor: 'bg-amber-900/50',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-700',
  },
};

export function MessageTypeBadge({ type, showLabel = true }: MessageTypeBadgeProps) {
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
