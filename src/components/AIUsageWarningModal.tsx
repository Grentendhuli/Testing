import { X, Sparkles, AlertTriangle, ArrowRight, Zap, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AIUsageWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
  used: number;
  freeLimit?: number;
  bonusLimit?: number;
}

export function AIUsageWarningModal({
  isOpen,
  onClose,
  onContinue,
  used,
  freeLimit = Infinity,
  bonusLimit = 0
}: AIUsageWarningModalProps) {
  const navigate = useNavigate();
  
  if (!isOpen) return null;

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
      <div className="relative bg-slate-900 rounded-2xl shadow-2xl border border-emerald-500/30 max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 p-6 border-b border-emerald-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                <Sparkles className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-100">AI is Unlimited</h3>
                <p className="text-emerald-400 text-sm">No limits on free tier</p>
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
          {/* Message */}
          <div className="mb-6 text-center">
            <p className="text-slate-300 text-lg mb-2">
              You have <span className="text-emerald-400 font-semibold">unlimited AI requests</span>.
            </p>
            <p className="text-slate-400 text-sm">
              Use AI as much as you need — no daily limits!
            </p>
          </div>
          
          {/* Benefits */}
          <div className="mb-6">
            <p className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              Included on free tier:
            </p>
            <ul className="space-y-2">
              {[
                'Unlimited AI requests — no limits, ever',
                'Tenant communication assistance',
                'Maintenance request management',
                'Rent collection tracking',
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
              onClick={onContinue}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Sparkles className="w-4 h-4" />
              Continue with Unlimited AI
              <ArrowRight className="w-4 h-4" />
            </button>
            
            <button
              onClick={handleUpgrade}
              className="w-full py-2.5 text-slate-400 hover:text-slate-200 font-medium text-sm transition-colors border border-slate-700 rounded-xl hover:border-slate-600"
            >
              Learn About Concierge
            </button>
          </div>
          
          {/* Friendly note */}
          <p className="mt-4 text-center text-xs text-slate-500">
            Concierge provides hands-on professional support when you need it.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AIUsageWarningModal;
