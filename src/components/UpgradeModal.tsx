import { useState } from 'react';
import { 
  X, Sparkles, CheckCircle, AlertTriangle, 
  Shield, Clock, ArrowRight, Check, Phone, UserCog
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './Button';

export interface UpgradeReason {
  title: string;
  description: string;
}

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: 'concierge_feature' | 'dedicated_manager' | 'phone_support' | 'custom_integration' | 'advanced_analytics';
  currentPlan?: string;
  // Legacy props for backwards compatibility
  featureName?: string;
  featureDescription?: string;
}

const conciergeFeatures = {
  dedicated_manager: {
    title: 'Dedicated Account Manager',
    description: 'Get a personal point of contact who knows your portfolio and can help optimize your operations.',
    icon: UserCog,
  },
  phone_support: {
    title: 'Priority Phone Support',
    description: 'Skip the queue and speak directly with our NYC property experts.',
    icon: Phone,
  },
  custom_integration: {
    title: 'Custom Integrations',
    description: 'Need to connect with a specific system? We\'ll build it for you.',
    icon: Sparkles,
  },
  advanced_analytics: {
    title: 'Advanced Analytics',
    description: 'Portfolio-level insights and custom reporting for serious investors.',
    icon: CheckCircle,
  },
  concierge_feature: {
    title: 'Concierge Feature',
    description: 'This feature is included with our Concierge service.',
    icon: Sparkles,
  },
};

const defaultBenefits = [
  'Dedicated account manager',
  'Priority phone & chat support',
  'Custom integrations & API access',
  'Advanced analytics & reporting',
  'White-label options',
  'Bulk operations across portfolio',
  'Training sessions',
];

export function UpgradeModal({
  isOpen,
  onClose,
  reason = 'concierge_feature',
  currentPlan = 'free',
  featureName,
  featureDescription,
}: UpgradeModalProps) {
  const navigate = useNavigate();
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const feature = featureName 
    ? { title: featureName, description: featureDescription || 'Concierge feature', icon: Sparkles }
    : conciergeFeatures[reason];

  const FeatureIcon = feature.icon;

  const handleContactSales = () => {
    window.location.href = 'mailto:concierge@landlordbot.app?subject=Concierge%20Services%20Inquiry';
    onClose();
  };

  const handleMaybeLater = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-lb-surface rounded-2xl shadow-2xl border border-lb-border max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500/20 to-amber-600/20 p-6 border-b border-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-500/30">
                <FeatureIcon className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-lb-text-primary">
                  Concierge Feature
                </h3>
                <p className="text-amber-400 text-sm">{feature.title}</p>
              </div>
            </div>
            
            <button
              onClick={onClose}
              className="text-lb-text-muted hover:text-lb-text-primary transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Reason */}
          <p className="text-lb-text-secondary mb-6">{feature.description}</p>
          
          {/* Plan Card */}
          <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/30 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-lg font-semibold text-amber-400">Concierge</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-lb-text-primary">$149</span>
                <span className="text-lb-text-secondary">/month</span>
              </div>
            </div>
            
            <p className="text-sm text-lb-text-secondary mb-2">
              White-glove service for portfolio landlords
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 rounded-full">
              <CheckCircle className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-medium text-amber-400">Everything + Premium Services</span>
            </div>
          </div>
          
          {/* Benefits */}
          <div className="mb-6">
            <p className="text-sm font-medium text-lb-text-primary mb-3">What's included:</p>
            <ul className="space-y-2">
              {defaultBenefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-lb-text-secondary">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
          
          {/* CTAs */}
          <div className="space-y-3">
            <Button
              onClick={handleContactSales}
              className="w-full gap-2"
            >
              <Phone className="w-4 h-4" />
              Contact Sales
              <ArrowRight className="w-4 h-4" />
            </Button>
            
            <button
              onClick={handleMaybeLater}
              className="w-full py-2.5 text-lb-text-secondary hover:text-lb-text-primary font-medium text-sm transition-colors"
            >
              Maybe later
            </button>
          </div>
          
          {/* Trust Badges */}
          <div className="mt-6 pt-4 border-t border-lb-border">
            <div className="flex items-center justify-center gap-4 text-xs text-lb-text-muted">
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                <span>No commitment</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Cancel anytime</span>
              </div>
            </div>          
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpgradeModal;
