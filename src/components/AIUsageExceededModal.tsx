import { useState } from 'react';
import { X, Sparkles, Lock, ArrowRight, Zap, CheckCircle, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AIQuotaStatus } from '../services/aiUsage';

interface AIUsageExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRemindTomorrow?: () => void;
  quota?: AIQuotaStatus | null;
}

/**
 * AI Usage Exceeded Modal
 * 
 * Shows when user hits their daily AI request limit
 * Prompts upgrade to Pro for more requests
 */
export function AIUsageExceededModal({
  isOpen,
  onClose,
  onRemindTomorrow,
  quota
}: AIUsageExceededModalProps) {
  const navigate = useNavigate();
  const [reminderSet, setReminderSet] = useState(false);
  
  if (!isOpen) return null;

  const used = quota?.used ?? 0;
  const limit = quota?.limit ?? 50;
  const tier = quota?.tier ?? 'free';

  const handleUpgrade = () => {
    onClose();
    navigate('/billing');
  };

  const handleRemindTomorrow = () => {
    // Set a reminder in localStorage
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // 9 AM tomorrow
    localStorage.setItem('landlordbot_ai_reminder', tomorrow.toISOString());
    setReminderSet(true);
    
    if (onRemindTomorrow) {
      onRemindTomorrow();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative bg-slate-900 rounded-2xl shadow-2xl border border-red-500/30 max-w-md w-full overflow-hidden">
        <div className="bg-gradient-to-r from-red-500/20 to-red-600/20 p-6 border-b border-red-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center border border-red-500/30">
                <Lock className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-100">Limit Reached</h3>
                <p className="text-red-400 text-sm">Daily AI requests exhausted</p>
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
          {/* Usage display */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/10 rounded-full mb-4">
              <span className="text-2xl font-bold text-red-400">{used}</span>
            </div>
            <p className="text-slate-200 text-lg mb-2">
              You've used all {limit} requests
            </p>
            <p className="text-slate-400 text-sm">
              Your daily limit has been reached. Upgrade to Pro for 10x more requests or try again tomorrow.
            </p>
          </div>
          
          {/* Upgrade benefits */}
          <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
            <p className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Upgrade to Pro:
            </p>
            <ul className="space-y-2">
              {[
                '500 AI requests/day (10x more!)',
                'Priority processing',
                'Advanced analytics',
                'Priority support'
              ].map((benefit, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
          
          {/* CTAs */}
          <div className="space-y-3">
            <button
              onClick={handleUpgrade}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
            >
              <Sparkles className="w-4 h-4" />
              Upgrade to Pro
              <ArrowRight className="w-4 h-4" />
            </button>
            
            {!reminderSet ? (
              <button
                onClick={handleRemindTomorrow}
                className="w-full py-2.5 text-slate-400 hover:text-slate-200 font-medium text-sm transition-colors border border-slate-700 rounded-xl hover:border-slate-600 flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Remind Me Tomorrow
              </button>
            ) : (
              <div className="w-full py-2.5 text-emerald-400 font-medium text-sm border border-emerald-500/30 rounded-xl flex items-center justify-center gap-2 bg-emerald-500/10">
                <CheckCircle className="w-4 h-4" />
                Reminder set for 9 AM tomorrow
              </div>
            )}
          </div>
          
          {/* Reset info */}
          <p className="mt-4 text-center text-xs text-slate-500">
            Your limit resets in 24 hours from your first request today.
            <br />
            Current plan: <span className="capitalize">{tier}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default AIUsageExceededModal;
