import { AlertTriangle, X, MessageSquare } from 'lucide-react';
import { useState } from 'react';

interface BetaBannerProps {
  onFeedbackClick?: () => void;
}

export function BetaBanner({ onFeedbackClick }: BetaBannerProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="sticky top-0 z-40 w-full bg-amber-900/40 border-b border-amber-700/50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-500 text-slate-950 uppercase tracking-wide">
                Beta
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <p className="text-sm text-amber-200/90">
                This is a beta version. Features may change or break unexpectedly.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onFeedbackClick}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors duration-200"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Give Feedback
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="p-1.5 text-amber-400/70 hover:text-amber-200 hover:bg-amber-800/50 rounded-md transition-colors duration-200"
              aria-label="Dismiss beta banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
