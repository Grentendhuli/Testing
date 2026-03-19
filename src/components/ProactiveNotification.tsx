import React, { useState, useEffect } from 'react';
import { 
  Bell, X, Clock, TrendingDown, TrendingUp, AlertTriangle,
  DollarSign, Wrench, Calendar, User, MessageSquare,
  ChevronRight, Check, CheckCircle2, Sparkles
} from 'lucide-react';
import { ConfidenceBadge } from './ConfidenceBadge';

export type NotificationType = 
  | 'payment' 
  | 'maintenance' 
  | 'lease' 
  | 'market'
  | 'anomaly' 
  | 'suggestion';

export type NotificationPriority = 'urgent' | 'high' | 'medium' | 'low';

export interface ProactiveNotification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  confidence: number;
  timestamp: Date;
  metadata?: {
    unit?: string;
    tenantName?: string;
    amount?: number;
    date?: string;
    daysOverdue?: number;
    trend?: 'up' | 'down';
    percentage?: number;
  };
  actions?: {
    primary: {
      label: string;
      onClick: () => void;
    };
    secondary?: {
      label: string;
      onClick: () => void;
    };
  };
  read?: boolean;
  dismissed?: boolean;
}

interface ProactiveNotificationCardProps {
  notification: ProactiveNotification;
  onDismiss?: (id: string) => void;
  onSnooze?: (id: string) => void;
  compact?: boolean;
  // Allow additional dynamic properties
  [key: string]: any;
}

const typeConfig = {
  payment: {
    icon: DollarSign,
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    label: 'Payment'
  },
  maintenance: {
    icon: Wrench,
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    label: 'Maintenance'
  },
  lease: {
    icon: Calendar,
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    label: 'Lease'
  },
  market: {
    icon: TrendingUp,
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    label: 'Market'
  },
  anomaly: {
    icon: AlertTriangle,
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    label: 'Anomaly'
  },
  suggestion: {
    icon: Sparkles,
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/30',
    text: 'text-pink-400',
    label: 'AI Suggestion'
  }
};

export function ProactiveNotificationCard({
  notification,
  onDismiss,
  onSnooze,
  compact = false
}: ProactiveNotificationCardProps) {
  const config = typeConfig[notification.type];
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`
        group relative p-3 rounded-lg border ${config.border} ${config.bg}
        hover:shadow-lg transition-all duration-200
      `}>
        <div className="flex items-start gap-3">
          <div className={`shrink-0 ${config.text}`}>
            <Icon className="w-4 h-4" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-200">{notification.title}</p>
            <p className="text-xs text-slate-400 mt-0.5">{notification.message}</p>
            
            {notification.actions && (
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={notification.actions.primary.onClick}
                  className="text-xs font-medium text-amber-400 hover:text-amber-300"
                >
                  {notification.actions.primary.label}
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <div className={`
              w-2 h-2 rounded-full
              ${notification.confidence >= 90 ? 'bg-emerald-500' :
                notification.confidence >= 70 ? 'bg-blue-500' :
                notification.confidence >= 50 ? 'bg-amber-500' : 'bg-slate-500'}
            `} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`
      relative overflow-hidden rounded-xl border ${config.border}
      bg-slate-900/80 backdrop-blur-sm
      hover:shadow-xl transition-all duration-300
    `}>
      {/* Priority indicator */}
      {notification.priority === 'urgent' && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-red-500 via-orange-500 to-red-500 animate-pulse" />
      )}
      {notification.priority === 'high' && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-500 to-orange-500" />
      )}

      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`
            shrink-0 w-10 h-10 rounded-xl 
            ${config.bg} border ${config.border}
            flex items-center justify-center
          `}>
            <Icon className={`w-5 h-5 ${config.text}`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-semibold uppercase tracking-wide ${config.text}`}>
                    {config.label}
                  </span>
                  <ConfidenceBadge confidence={notification.confidence} size="sm" />
                  {notification.priority === 'urgent' && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500/20 text-red-400 rounded">
                      URGENT
                    </span>
                  )}
                </div>
                
                <h4 className="text-base font-semibold text-slate-100 mt-1">{notification.title}</h4>
              </div>

              {/* Dismiss actions */}
              <div className="flex items-center gap-1">
                {onSnooze && (
                  <button
                    onClick={() => onSnooze(notification.id)}
                    className="p-1.5 text-slate-500 hover:text-amber-400 hover:bg-amber-500/10 rounded transition-all"
                    title="Snooze"
                  >
                    <Clock className="w-3.5 h-3.5" />
                  </button>
                )}
                {onDismiss && (
                  <button
                    onClick={() => onDismiss(notification.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                    title="Dismiss"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
            
            <p className="text-sm text-slate-400 mt-1">{notification.message}</p>

            {/* Metadata tags */}
            {notification.metadata && (
              <div className="flex flex-wrap items-center gap-3 mt-3">
                {notification.metadata.unit && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded">
                    <User className="w-3 h-3" />
                    <span>Unit {notification.metadata.unit}</span>
                  </div>
                )}
                {notification.metadata.tenantName && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded">
                    <User className="w-3 h-3" />
                    <span>{notification.metadata.tenantName}</span>
                  </div>
                )}
                {notification.metadata.amount && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded">
                    <DollarSign className="w-3 h-3" />
                    <span>${notification.metadata.amount.toLocaleString()}</span>
                  </div>
                )}
                {notification.metadata.date && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-800/50 px-2 py-1 rounded">
                    <Calendar className="w-3 h-3" />
                    <span>{notification.metadata.date}</span>
                  </div>
                )}
                {notification.metadata.daysOverdue && (
                  <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded">
                    <Clock className="w-3 h-3" />
                    <span>{notification.metadata.daysOverdue} days overdue</span>
                  </div>
                )}
                {notification.metadata.trend && (
                  <div className={`
                    flex items-center gap-1.5 text-xs px-2 py-1 rounded
                    ${notification.metadata.trend === 'down' 
                      ? 'text-red-400 bg-red-500/10' 
                      : 'text-emerald-400 bg-emerald-500/10'}
                  `}>
                    {notification.metadata.trend === 'down' 
                      ? <TrendingDown className="w-3 h-3" /> 
                      : <TrendingUp className="w-3 h-3" />}
                    <span>{notification.metadata.percentage}% {notification.metadata.trend}</span>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            {notification.actions && (
              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={notification.actions.primary.onClick}
                  className={`
                    inline-flex items-center gap-2 px-4 py-2 
                    text-sm font-medium rounded-lg
                    transition-all duration-200
                    ${notification.type === 'payment' 
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-900' :
                      notification.type === 'maintenance' || notification.type === 'anomaly'
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-900' :
                      'bg-amber-500 hover:bg-amber-400 text-slate-900'}
                  `}
                >
                  {notification.actions.primary.label}
                  <ChevronRight className="w-4 h-4" />
                </button>
                
                {notification.actions.secondary && (
                  <button
                    onClick={notification.actions.secondary.onClick}
                    className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {notification.actions.secondary.label}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Notification feed container
interface ProactiveNotificationFeedProps {
  notifications: ProactiveNotification[];
  onDismiss?: (id: string) => void;
  onSnooze?: (id: string) => void;
  onMarkRead?: (id: string) => void;
  maxDisplayed?: number;
  className?: string;
}

export function ProactiveNotificationFeed({
  notifications,
  onDismiss,
  onSnooze,
  onMarkRead,
  maxDisplayed = 5,
  className = ''
}: ProactiveNotificationFeedProps) {
  const [expanded, setExpanded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<NotificationType | 'all'>('all');

  const unreadCount = notifications.filter((n: ProactiveNotification) => !n.read).length;
  const urgentCount = notifications.filter((n: ProactiveNotification) => n.priority === 'urgent').length;

  const filteredNotifications = activeFilter === 'all' 
    ? notifications 
    : notifications.filter((n: ProactiveNotification) => n.type === activeFilter);

  const displayedNotifications = expanded 
    ? filteredNotifications 
    : filteredNotifications.slice(0, maxDisplayed);

  const hasMore = filteredNotifications.length > maxDisplayed;

  if (notifications.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-800/50 rounded-full flex items-center justify-center">
          <Bell className="w-8 h-8 text-slate-600" />
        </div>
        <p className="text-slate-500">No proactive notifications</p>
        <p className="text-sm text-slate-600 mt-1">AI is monitoring your portfolio for opportunities</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-slate-200">AI Notifications</h3>
          
          {(unreadCount > 0 || urgentCount > 0) && (
            <div className="flex items-center gap-2">
              {urgentCount > 0 && (
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full">
                  {urgentCount} urgent
                </span>
              )}
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-semibold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { id: 'all', label: 'All' },
          { id: 'payment', label: 'Payments' },
          { id: 'maintenance', label: 'Maintenance' },
          { id: 'lease', label: 'Leases' },
          { id: 'suggestion', label: 'AI Tips' }
        ].map(filter => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id as any)}
            className={`
              px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap
              transition-all duration-200
              ${activeFilter === filter.id
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-300'}
            `}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Notifications list */}
      <div className="space-y-3">
        {displayedNotifications.map((notification: ProactiveNotification) => (
          <ProactiveNotificationCard
            key={notification.id}
            notification={notification}
            onDismiss={onDismiss}
            onSnooze={onSnooze}
          />
        ))}
      </div>

      {/* Show more/less */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-3 text-sm text-slate-500 hover:text-slate-300 transition-colors"
        >
          {expanded 
            ? 'Show fewer notifications' 
            : `Show ${filteredNotifications.length - maxDisplayed} more notification${filteredNotifications.length - maxDisplayed > 1 ? 's' : ''}`
          }
        </button>
      )}
    </div>
  );
}

// Floating notification bell with badge
export function AICommandPaletteButton({ onClick, unreadCount = 0 }: { onClick: () => void; unreadCount?: number }) {
  return (
    <button
      onClick={onClick}
      className="
        relative p-3 rounded-xl
        bg-slate-800 hover:bg-slate-700
        text-slate-400 hover:text-slate-200
        transition-all duration-200
        group
      "
    >
      <Bell className="w-5 h-5" />
      
      {unreadCount > 0 && (
        <span className="
          absolute -top-1 -right-1
          w-5 h-5 flex items-center justify-center
          bg-red-500 text-white text-xs font-bold rounded-full
          animate-bounce
        ">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
      
      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-slate-400 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
        Notifications
      </span>
    </button>
  );
}

export default ProactiveNotificationCard;
