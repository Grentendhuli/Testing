import { useState } from 'react';
import { Sparkles, CheckCircle, Infinity, Info, AlertTriangle } from 'lucide-react';
import type { AIQuotaStatus, SubscriptionTier } from '../services/aiUsage';

interface AIUsageBarProps {
  quota?: AIQuotaStatus | null;
  onClick?: () => void;
  className?: string;
  showUpgradePrompt?: boolean;
}

/**
 * AI Usage Bar - Shows AI query limits based on subscription tier
 * Free tier: 50 daily queries
 * Pro tier: 500 daily queries
 * Concierge: Unlimited
 */
export function AIUsageBar({
  quota,
  onClick,
  className = '',
  showUpgradePrompt = false
}: AIUsageBarProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Default to free tier if no quota provided
  const isUnlimited = quota?.isUnlimited ?? false;
  const used = quota?.used ?? 0;
  const limit = quota?.limit ?? 50;
  const remaining = quota?.remaining ?? 50;
  const percentUsed = quota?.percentUsed ?? 0;
  const tier = quota?.tier ?? 'free';
  const showWarning = quota?.showWarning ?? false;
  const showExceeded = quota?.showExceeded ?? false;

  // Determine color based on usage
  const getProgressColor = () => {
    if (showExceeded) return 'bg-red-500';
    if (showWarning) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const getTextColor = () => {
    if (showExceeded) return 'text-red-400';
    if (showWarning) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className={`w-4 h-4 ${getTextColor()}`} />
          <span className={`text-sm font-medium ${getTextColor()}`}>
            AI Active
          </span>
          {showWarning && (
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          )}
        </div>
        <div className="flex items-center gap-1 text-xs text-lb-text-muted">
          {isUnlimited ? (
            <span className="flex items-center gap-1">
              <Infinity className="w-3 h-3" />
              Unlimited
            </span>
          ) : (
            <span className={showExceeded ? 'text-red-400' : showWarning ? 'text-amber-400' : ''}>
              {used}/{limit} used
            </span>
          )}
        </div>
      </div>
      
      {/* Progress bar for limited tiers */}
      {!isUnlimited && (
        <div className="mt-2">
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full ${getProgressColor()} transition-all duration-300`}
              style={{ width: `${Math.min(100, percentUsed)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className={`text-[10px] ${showExceeded ? 'text-red-400' : showWarning ? 'text-amber-400' : 'text-slate-500'}`}>
              {showExceeded 
                ? 'Limit reached' 
                : showWarning 
                  ? `${remaining} remaining` 
                  : `${remaining} remaining today`}
            </span>
            <span className="text-[10px] text-slate-500 capitalize">{tier} Plan</span>
          </div>
        </div>
      )}

      {/* Upgrade prompt */}
      {showUpgradePrompt && !isUnlimited && (
        <div className="mt-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <p className="text-[10px] text-amber-400">
            {showExceeded 
              ? 'Daily limit reached. Upgrade to Pro for 10x more requests.'
              : 'Approaching limit. Upgrade to Pro for 10x more requests.'}
          </p>
        </div>
      )}
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50">
          <div className="text-sm text-slate-300">
            <p className="font-medium text-slate-200 mb-2">AI Query Limits by Plan</p>
            <ul className="space-y-1.5">
              <li className={`flex items-center justify-between ${tier === 'free' ? 'text-emerald-400' : 'text-slate-400'}`}>
                <span>Free Plan</span>
                <span>50 requests/day</span>
              </li>
              <li className={`flex items-center justify-between ${tier === 'pro' ? 'text-emerald-400' : 'text-slate-400'}`}>
                <span>Pro Plan</span>
                <span>500 requests/day</span>
              </li>
              <li className={`flex items-center justify-between ${tier === 'concierge' ? 'text-emerald-400' : 'text-slate-400'}`}>
                <span>Concierge</span>
                <span className="flex items-center gap-1">
                  <Infinity className="w-3 h-3" />
                  Unlimited
                </span>
              </li>
            </ul>
            {!isUnlimited && (
              <p className="mt-2 text-xs text-slate-500">
                Resets every 24 hours from your first request
              </p>
            )}
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
            <div className="w-2 h-2 bg-slate-800 border-r border-b border-slate-700 rotate-45" />
          </div>
        </div>
      )}
    </div>
  );
}

// Compact version for inline use - shows AI status with disclosure
interface AIUsageBarCompactProps {
  quota?: AIQuotaStatus | null;
  className?: string;
}

export function AIUsageBarCompact({
  quota,
  className = ''
}: AIUsageBarCompactProps) {
  const isUnlimited = quota?.isUnlimited ?? false;
  const remaining = quota?.remaining ?? 50;
  const showWarning = quota?.showWarning ?? false;
  const showExceeded = quota?.showExceeded ?? false;

  const getColorClass = () => {
    if (showExceeded) return 'text-red-400';
    if (showWarning) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Sparkles className={`w-3 h-3 ${getColorClass()}`} />
      <span className={`text-[10px] ${getColorClass()}`}>
        {isUnlimited 
          ? 'AI: Unlimited' 
          : showExceeded 
            ? 'AI: Limit reached'
            : `AI: ${remaining} left`}
      </span>
    </div>
  );
}

export default AIUsageBar;
