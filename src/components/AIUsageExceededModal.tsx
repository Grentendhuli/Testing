import { useState } from 'react';
import { X, Sparkles, CheckCircle, Infinity } from 'lucide-react';

interface AIUsageExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRemindTomorrow?: () => void;
  used?: number;
  freeLimit?: number;
  bonusLimit?: number;
}

/**
 * AI Usage Exceeded Modal - DEPRECATED
 * 
 * This modal is no longer used since the free tier now has unlimited AI.
 * It's kept as a stub for backwards compatibility but renders nothing.
 * 
 * Previously: Showed upgrade prompt when user hit 20 AI requests/day limit
 * Now: Free tier has unlimited AI, so this modal should never be triggered
 */
export function AIUsageExceededModal({
  isOpen,
  onClose,
  onRemindTomorrow,
  used = 0,
  freeLimit = 20,
  bonusLimit = 0,
}: AIUsageExceededModalProps) {
  // This modal should never show now that AI is unlimited
  if (!isOpen) return null;

  // If somehow triggered, show a friendly message about unlimited AI
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-slate-900 rounded-2xl shadow-2xl border border-emerald-500/30 max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 p-6 border-b border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                <Infinity className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-100">Unlimited AI</h3>
                <p className="text-emerald-400 text-sm">No limits apply</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="text-center mb-6">
            <p className="text-slate-200 text-lg mb-2">
              Good news! <span className="text-emerald-400 font-semibold">AI is now unlimited</span>
            </p>
            <p className="text-slate-400 text-sm">
              Your free plan includes unlimited AI requests. No upgrade needed!
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={onClose}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Got it!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIUsageExceededModal;
