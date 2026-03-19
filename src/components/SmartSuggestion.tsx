import React, { useState, useMemo, useCallback } from 'react';
import { 
  Sparkles, X, Clock, AlertTriangle, TrendingUp, 
  DollarSign, Wrench, FileText, User, Calendar, Zap,
  ChevronRight, Check, Bell, MessageSquare
} from 'lucide-react';
import { ConfidenceBadge, ConfidenceIndicator } from './ConfidenceBadge';

export type SuggestionType = 
  | 'alert' 
  | 'opportunity' 
  | 'task' 
  | 'insight' 
  | 'reminder' 
  | 'anomaly';

export type SuggestionPriority = 'high' | 'medium' | 'low';

export interface SmartSuggestionProps {
  id: string;
  type: SuggestionType;
  priority: SuggestionPriority;
  title: string;
  description: string;
  confidence: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  metadata?: {
    unit?: string;
    amount?: string;
    date?: string;
    impact?: string;
    [key: string]: any;
  };
  reasoning?: string;
  icon?: React.ComponentType<{ className?: string }>;
  onDismiss?: () => void;
  onSnooze?: () => void;
  className?: string;
  compact?: boolean;
  // Allow additional dynamic properties
  [key: string]: any;
}

// Pre-computed type config - moved outside component to prevent recreation
const typeConfig = {
  alert: {
    border: 'border-red-500/30',
    bg: 'bg-red-500/10',
    icon: Bell,
    iconColor: 'text-red-400',
    label: 'Alert'
  },
  opportunity: {
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
    icon: TrendingUp,
    iconColor: 'text-emerald-400',
    label: 'Opportunity'
  },
  task: {
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10',
    icon: Check,
    iconColor: 'text-blue-400',
    label: 'Suggested Task'
  },
  insight: {
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10',
    icon: Sparkles,
    iconColor: 'text-purple-400',
    label: 'AI Insight'
  },
  reminder: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
    icon: Clock,
    iconColor: 'text-amber-400',
    label: 'Reminder'
  },
  anomaly: {
    border: 'border-orange-500/30',
    bg: 'bg-orange-500/10',
    icon: AlertTriangle,
    iconColor: 'text-orange-400',
    label: 'Anomaly Detected'
  }
} as const;

// Memoized component implementation
const SmartSuggestion = React.memo(function SmartSuggestionComponent(props: SmartSuggestionProps) {
  const {
    id,
    type,
    priority,
    title,
    description,
    confidence,
    action,
    secondaryAction,
    metadata,
    reasoning,
    icon,
    onDismiss,
    onSnooze,
    className = '',
    compact = false
  } = props;
  const config = typeConfig[type];
  const Icon = icon || config.icon;

  // Memoize click handlers
  const handleDismiss = useCallback(() => onDismiss?.(), [onDismiss]);
  const handleSnooze = useCallback(() => onSnooze?.(), [onSnooze]);
  const handleAction = useCallback(() => action?.onClick(), [action]);
  const handleSecondaryAction = useCallback(() => secondaryAction?.onClick(), [secondaryAction]);

  if (compact) {
    return (
      <div 
        className={`
          group relative p-3 rounded-lg border ${config.border} ${config.bg}
          hover:shadow-lg transition-all duration-200 cursor-pointer
          ${className}
        `}
        onClick={action?.onClick}
      >
        <div className="flex items-start gap-3">
          <div className={`shrink-0 ${config.iconColor}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200 truncate">{title}</p>
            <p className="text-xs text-slate-400 truncate">{description}</p>
          </div>
          <div className="flex items-center gap-1">
            <ConfidenceIndicator confidence={confidence} />
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`
        relative overflow-hidden rounded-xl border ${config.border} 
        bg-gradient-to-br from-slate-900 to-slate-800
        hover:shadow-2xl hover:shadow-${config.iconColor.split('-')[1]}-500/20
        transition-all duration-300
        ${className}
      `}
    >
      {/* Priority indicator */}
      {priority === 'high' && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-red-500/50 via-orange-500/50 to-red-500/50 animate-pulse" />
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`
              p-3 rounded-xl ${config.bg} border ${config.border}
              shrink-0
            `}>
              <Icon className={`w-6 h-6 ${config.iconColor}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-semibold uppercase tracking-wide ${config.iconColor}`}>
                  {config.label}
                </span>
                <span className="text-slate-600">•</span>
                <ConfidenceBadge confidence={confidence} size="sm" />
              </div>
              
              <h4 className="text-lg font-semibold text-slate-100 mt-1">{title}</h4>
              <p className="text-slate-400 text-sm mt-1 leading-relaxed">{description}</p>

              {/* Metadata */}
              {metadata && (
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  {metadata.unit && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <User className="w-3.5 h-3.5" />
                      <span>Unit {metadata.unit}</span>
                    </div>
                  )}
                  {metadata.amount && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{metadata.amount}</span>
                    </div>
                  )}
                  {metadata.date && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{metadata.date}</span>
                    </div>
                  )}
                  {metadata.impact && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                      <Zap className="w-3.5 h-3.5" />
                      <span>{metadata.impact}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Dismiss actions */}
          <div className="flex items-center gap-1">
            {onSnooze && (
              <button
                onClick={handleSnooze}
                className="p-2 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all"
                title="Snooze"
              >
                <Clock className="w-4 h-4" />
              </button>
            )}
            {onDismiss && (
              <button
                onClick={handleDismiss}
                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Reasoning */}
        {reasoning && (
          <div className="mt-4 p-3 bg-slate-950/50 rounded-lg border border-slate-800">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-slate-400">{reasoning}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center gap-3">
          {action && (
            <button
              onClick={action.onClick}
              className={`
                inline-flex items-center gap-2 px-4 py-2 
                ${type === 'alert' ? 'bg-red-500 hover:bg-red-400' :
                  type === 'opportunity' ? 'bg-emerald-500 hover:bg-emerald-400' :
                  'bg-amber-500 hover:bg-amber-400'}
                text-slate-900 text-sm font-medium rounded-lg 
                transition-all duration-200
                hover:shadow-lg
              `}
            >
              <Sparkles className="w-4 h-4" />
              {action.label}
            </button>
          )}
          
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="inline-flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

// Container for multiple suggestions
interface SmartSuggestionsContainerProps {
  title?: string;
  icon?: React.ReactNode;
  suggestions: SmartSuggestionProps[];
  maxDisplayed?: number;
  className?: string;
}

export function SmartSuggestionsContainer({
  title = 'AI Suggestions',
  icon = <Sparkles className="w-5 h-5 text-amber-400" />,
  suggestions,
  maxDisplayed = 3,
  className = ''
}: SmartSuggestionsContainerProps) {
  const [expanded, setExpanded] = React.useState(false);
  const displayed = expanded ? suggestions : suggestions.slice(0, maxDisplayed);
  const hasMore = suggestions.length > maxDisplayed;

  if (suggestions.length === 0) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        {icon}
        <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
        <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-xs font-medium rounded-full">
          {suggestions.length}
        </span>
      </div>

      {/* Suggestions list */}
      <div className="space-y-3">
        {displayed.map((suggestion) => (
          <SmartSuggestion key={suggestion.id} {...suggestion} />
        ))}
      </div>

      {/* Show more */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          {expanded 
            ? 'Show less' 
            : `Show ${suggestions.length - maxDisplayed} more suggestion${suggestions.length - maxDisplayed > 1 ? 's' : ''}`
          }
        </button>
      )}
    </div>
  );
}

export default SmartSuggestion;
export { SmartSuggestion };
