import { useState } from 'react';
import { Sparkles, CheckCircle, Infinity } from 'lucide-react';

interface AIUsageBarProps {
  used?: number;
  isUnlimited?: boolean;
  freeLimit?: number;
  bonusLimit?: number;
  onClick?: () => void;
  className?: string;
}

/**
 * AI Usage Bar - Now shows unlimited status since free tier has unlimited AI
 * This component is kept for UI consistency but no longer enforces limits
 */
export function AIUsageBar({
  used = 0,
  isUnlimited = true,
  freeLimit = 20,
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
            AI Unlimited
          </span>
          <CheckCircle className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex items-center gap-1 text-xs text-lb-text-muted">
          <Infinity className="w-3 h-3" />
          <span>Unlimited</span>
        </div>
      </div>
      
      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50">
          <div className="text-sm text-slate-300">
            <p className="font-medium text-slate-200 mb-1">Unlimited AI Requests</p>
            <p>Your free plan includes unlimited AI assistance.</p>
            <p className="mt-2 text-emerald-400">No daily limits, no restrictions.</p>
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

// Compact version for inline use - shows unlimited status
export function AIUsageBarCompact({
  className = ''
}: Omit<AIUsageBarProps, 'used'>) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Sparkles className="w-3 h-3 text-emerald-400" />
      <span className="text-xs text-emerald-400">Unlimited</span>
    </div>
  );
}

export default AIUsageBar;
