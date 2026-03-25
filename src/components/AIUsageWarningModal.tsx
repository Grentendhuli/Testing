import { X, Sparkles, AlertTriangle, ArrowRight, Zap, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { AIQuotaStatus } from '../services/aiUsage';

interface AIUsageWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  quota?: AIQuotaStatus | null;
}

export function AIUsageWarningModal({
  isOpen,
  onClose,
  onContinue,
  quota
}: AIUsageWarningModalProps) {
  const navigate = useNavigate();
  
  if (!isOpen) return null;

  const used = quota?.used ?? 0;
  const limit = quota?.limit ?? 50;
  const remaining = quota?.remaining ?? 0;
  const tier = quota?.tier ?? 'free';
  const percentUsed = quota?.percentUsed ?? 0;

  const handleUpgrade = () => {
    onClose();
    navigate('/billing');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-900 rounded-2xl shadow-2xl border border-amber-500/30 max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 p-6 border-b border-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-500/30">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-100">Approaching Limit</h3>
                <p className="text-amber-400 text-sm">{remaining} requests remaining today</p>
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
          {/* Usage progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Daily Usage</span>
              <span className="text-amber-400 font-medium">{used} / {limit}</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${Math.min(100, percentUsed)}%` }}
              />
            </div>
            <p className="mt-2 text-sm text-slate-400">
              You've used {Math.round(percentUsed)}% of your daily AI requests
            </p>
          </div>
          
          {/* Message */}
          <div className="mb-6 text-center">
            <p className="text-slate-300 text-lg mb-2">
              You're approaching your daily limit
            </p>
            <p className="text-slate-400 text-sm">
              Upgrade to Pro for 10x more requests (500/day) and unlock premium features.
            </p>
          </div>
          
          {/* Benefits */}
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Pro Plan includes:
            </p>
            <ul className="space-y-2">
              {[
                '500 AI requests/day (10x more)',
                'Advanced analytics & reports',
                'Priority support',
                'Custom document templates',
                'API access'
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
            
            <button
              onClick={onContinue}
              className="w-full py-2.5 text-slate-400 hover:text-slate-200 font-medium text-sm transition-colors border border-slate-700 rounded-xl hover:border-slate-600"
            >
              Continue with Current Plan
            </button>
          </div>
          
          {/* Friendly note */}
          <p className="mt-4 text-center text-xs text-slate-500">
            Your limit will reset in 24 hours from your first request today.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AIUsageWarningModal;
