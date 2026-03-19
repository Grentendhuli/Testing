import { useState } from 'react';
import { Sparkles, CheckCircle, Infinity, Info } from 'lucide-react';

interface AIUsageBarProps {
  used?: number;
  isUnlimited?: boolean;
  freeLimit?: number;
  bonusLimit?: number;
  onClick?: () => void;
  className?: string;
}

/**
 * AI Usage Bar - Shows AI query limits disclosure
 * Free tier: up to 10,000 daily queries
 * Concierge: unlimited
 */
export function AIUsageBar({
  used = 0,
  isUnlimited = true,
  freeLimit = 10000,
  bonusLimit = 0,
  onClick,
  className = ''
}: AIUsageBarProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-medium text-emerald-400">
            AI Active
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-lb-text-muted">
          <span>Up to 10K/day</span>
        </div>
      </div>
      
      {/* AI Disclosure */}
      <div className="flex items-center gap-1 mt-1.5 text-[10px] text-slate-500">
        <Info className="w-3 h-3 flex-shrink-0" />
        <span>Up to 10,000 daily queries free. Unlimited for Concierge upgrade.</span>
      </div>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50">
          <div className="text-sm text-slate-300">
            <p className="font-medium text-slate-200 mb-1">AI Query Limits</p>
            <p>Free Plan: Up to 10,000 daily queries</p>
            <p className="mt-1">Concierge: Unlimited queries</p>
            <p className="mt-2 text-xs text-slate-400">AI requests are processed fairly across all users.</p>
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
export function AIUsageBarCompact({
  className = ''
}: Omit<AIUsageBarProps, 'used'>) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Sparkles className="w-3 h-3 text-emerald-400" />
      <span className="text-[10px] text-emerald-400">AI: Up to 10K/day</span>
    </div>
  );
}

export default AIUsageBar;
