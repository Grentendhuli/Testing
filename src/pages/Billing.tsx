import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { 
  CreditCard, CheckCircle, Shield, Mail, ExternalLink, X, Sparkles, 
  TrendingUp, Clock, Zap, AlertTriangle, Download, ChevronRight,
  Receipt, ArrowUpRight, Infinity, Phone, UserCog
} from 'lucide-react';
import { ComplianceFooter } from '../components/ComplianceFooter';
import { Button } from '../components/Button';
import { UsageMeter, UsageMetric } from '../components/subscription/UsageMeter';
import { BillingHistory, Invoice } from '../components/subscription/BillingHistory';
import { PaymentMethodCard, PaymentMethod } from '../components/subscription/PaymentMethodCard';
import { useAuth } from '@/features/auth';
import { analytics } from '../utils/analytics';

// Initialize Stripe only if key exists
const stripeKey = (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

// Get pricing IDs from env
const proPriceId = (import.meta as any).env?.VITE_STRIPE_PRO_PRICE_ID;
const scalePriceId = (import.meta as any).env?.VITE_STRIPE_SCALE_PRICE_ID;

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  yearlyPrice?: number;
  features: string[];
  stripePriceId?: string;
}

// Launch pricing - Free, Pro, Scale
const plans: Record<string, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Perfect for DIY landlords getting started',
    price: 0,
    features: [
      '3 units maximum',
      'Basic maintenance tracking',
      'Lead management',
      'Rent collection tracking',
      'Email reminders',
      'NYC compliance built-in',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'AI-powered property management for serious landlords',
    price: 49,
    yearlyPrice: 490, // 2 months free
    features: [
      '25 units included',
      'AI maintenance triage',
      'Smart rent reminders',
      'Lead scoring',
      'Document parsing',
      'Priority email support',
      'NYC compliance built-in',
      '$2/unit over 25',
    ],
    stripePriceId: proPriceId,
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    description: 'White-glove service for portfolio landlords',
    price: 149,
    yearlyPrice: 1490, // 2 months free
    features: [
      '100 units included',
      'Everything in Pro',
      'AI voice calls (late payments)',
      'Predictive analytics',
      'Custom integrations',
      'Bulk operations',
      'Priority phone support',
      'Dedicated account manager',
      'Custom reports',
    ],
    stripePriceId: scalePriceId,
  },
};

// Mock data - replace with actual API calls
const mockUsageMetrics: UsageMetric[] = [
  { name: 'Properties', used: 5, limit: -1, unit: 'unlimited', color: 'emerald' },
  { name: 'AI Requests', used: 127, limit: -1, unit: 'unlimited', color: 'emerald' },
  { name: 'Storage', used: 45, limit: 100, unit: 'MB', color: 'blue' },
];

const mockInvoices: Invoice[] = [
  {
    id: 'inv_1',
    date: '2024-03-01',
    amount: 149.00,
    status: 'paid',
    description: 'scale Plan - Monthly',
    pdfUrl: '#',
  },
  {
    id: 'inv_2',
    date: '2024-02-01',
    amount: 149.00,
    status: 'paid',
    description: 'scale Plan - Monthly',
    pdfUrl: '#',
  },
];

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: 'pm_1',
    type: 'card',
    brand: 'visa',
    last4: '4242',
    expMonth: 12,
    expYear: 2025,
    isDefault: true,
  },
];

export function Billing() {
  const { user, userData } = useAuth();
  const [showContactModal, setShowContactModal] = useState(false);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'history' | 'payment'>('overview');
  const [showCancelModal, setShowCancelModal] = useState(false);

  const currentPlanId = userData?.subscription_tier || 'free';
  const currentPlan = plans[currentPlanId] || plans.free;
  const isScale = currentPlanId === 'scale';

  // Track page view
  useEffect(() => {
    analytics.trackPageView('/billing', 'Billing & Subscription');
    analytics.trackEvent('subscription_viewed', { 
      current_tier: currentPlanId,
      has_payment_config: !!(import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY
    });
  }, []);

  // Check for success/cancel query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      setShowSuccessBanner(true);
      analytics.trackEvent('subscription_payment_success');
      window.history.replaceState({}, '', '/billing');
    }
  }, []);

  const handleUpgrade = async (planId: string) => {
    setIsLoading(true);
    setError('');
    
    analytics.trackEvent('upgrade_clicked', { 
      from_tier: currentPlanId,
      to_tier: planId
    });

    if (planId === 'free') {
      // Downgrade to free - handle via API
      setIsLoading(false);
      return;
    }

    // Check if Stripe is configured
    if (!stripePromise || !plans[planId]?.stripePriceId) {
      setError('Payment system not configured. Please contact support.');
      setIsLoading(false);
      return;
    }

    try {
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      // Get user ID from auth
      const userId = user?.id;
      if (!userId) {
        throw new Error('User not authenticated');
      }

      // Create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId: plans[planId].stripePriceId,
          userId,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();

      // Redirect to Stripe Checkout
      const result = stripe ? (stripe as any).redirectToCheckout({ sessionId }) : null;
      if (!result) throw new Error('Stripe not initialized');
      const { error: stripeError } = await result;
      
      if (stripeError) {
        throw new Error(stripeError.message);
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to start checkout. Please try again.');
      // @ts-ignore - checkout_error is a valid event
      analytics.trackEvent('checkout_error', { error: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    analytics.trackEvent('subscription_cancelled', {
      current_tier: currentPlanId,
      stage: 'initiated'
    });
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    // Call cancel endpoint
    analytics.trackEvent('subscription_cancelled', {
      tier: currentPlanId,
    });
    setShowCancelModal(false);
    // Show confirmation toast
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    analytics.trackEvent('page_view', {
      page_path: `/invoice/${invoice.id}`,
      page_title: `Invoice ${invoice.id}`
    });
    window.open(invoice.pdfUrl, '_blank');
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className="bg-lb-surface border border-lb-border rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-400 uppercase tracking-wider">Current Plan</span>
            </div>
            <h2 className="text-2xl font-bold text-lb-text-primary">{currentPlan.name}</h2>
            <p className="text-lb-text-secondary mt-1">{currentPlan.description}</p>
            <div className="flex items-baseline gap-1 mt-4">
              <span className="text-3xl font-bold text-lb-text-primary">${currentPlan.price}</span>
              <span className="text-lb-text-secondary">/month</span>
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            {isScale && (
              <button
                onClick={handleCancel}
                className="text-sm text-lb-text-muted hover:text-red-400 transition-colors mb-2"
              >
                Cancel Subscription
              </button>
            )}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              currentPlanId === 'free' 
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-amber-500/10 text-amber-400'
            }`}>
              <CheckCircle className="w-3.5 h-3.5" />
              {currentPlanId === 'free' ? 'Free Forever' : 'Active'}
            </span>
          </div>
        </div>

        {/* Plan Features */}
        <div className="mt-6 pt-6 border-t border-lb-border">
          <p className="text-sm font-medium text-lb-text-secondary mb-3">What's included:</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {currentPlan.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-lb-text-primary">
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Upgrade Prompt - Only show for free users */}
        {!isScale && (
          <div className="mt-6 p-4 bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-lb-text-primary">
                  <strong>Want white-glove service?</strong> — Upgrade to scale for dedicated 
                  account management, priority support, and custom integrations.
                </p>
                <Button
                  onClick={() => setActiveTab('plans')}
                  className="mt-3 gap-1"
                  size="sm"
                >
                  View scale
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Usage Metrics - Show unlimited for free tier */}
      <div className="bg-lb-surface border border-lb-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-lb-text-primary">Usage</h3>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded-full text-xs text-emerald-400">
            <Infinity className="w-3 h-3" />
            Unlimited
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-lb-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-lb-text-primary">AI Requests</p>
                <p className="text-xs text-lb-text-secondary">Unlimited</p>
              </div>
            </div>
            <span className="text-sm text-emerald-400 font-medium">Unlimited</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-lb-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-lb-text-primary">Properties</p>
                <p className="text-xs text-lb-text-secondary">Unlimited</p>
              </div>
            </div>
            <span className="text-sm text-emerald-400 font-medium">Unlimited</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-lb-border">
          <div className="flex items-center gap-2 text-sm text-lb-text-secondary">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Your free plan includes unlimited properties and AI requests</span>
          </div>
        </div>
      </div>

      {/* Upcoming Invoice Preview - Only for scale */}
      {isScale && (
        <div className="bg-lb-surface border border-lb-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-lb-text-primary">Upcoming Invoice</h3>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-lb-border">
            <span className="text-lb-text-primary">{currentPlan.name} Plan</span>
            <span className="font-medium text-lb-text-primary">${currentPlan.price.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-lb-border">
            <span className="text-lb-text-secondary">Tax (estimated)</span>
            <span className="text-lb-text-secondary">${(currentPlan.price * 0.088875).toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between pt-3">
            <span className="font-medium text-lb-text-primary">Estimated total</span>
            <span className="text-xl font-bold text-lb-text-primary">
              ${(currentPlan.price * 1.088875).toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-lb-text-muted mt-3">
            Next billing date: April 1, 2024
          </p>
        </div>
      )}
    </div>
  );

  const renderPlans = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.values(plans).map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          
          return (
            <div
              key={plan.id}
              className={`relative rounded-xl p-6 border transition-all ${
                isCurrent
                  ? 'bg-emerald-50/5 border-emerald-500/50'
                  : plan.id === 'scale'
                  ? 'bg-amber-50/5 border-amber-500/30'
                  : 'bg-lb-surface border-lb-border hover:border-amber-500/30'
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                  <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full">
                    Current
                  </span>
                </div>
              )}
              
              {plan.id === 'scale' && !isCurrent && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-slate-950 text-xs rounded-full">
                    <Sparkles className="w-3 h-3" />
                    Premium
                  </span>
                </div>
              )}

              <h4 className="font-semibold text-lb-text-primary">{plan.name}</h4>
              <p className="text-sm text-lb-text-secondary mt-1">{plan.description}</p>
              
              <div className="flex items-baseline gap-1 my-4">
                <span className="text-2xl font-bold text-lb-text-primary">${plan.price}</span>
                <span className="text-sm text-lb-text-secondary">/month</span>
              </div>

              <ul className="space-y-2 mb-5">
                {plan.features.slice(0, 6).map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-lb-text-secondary">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleUpgrade(plan.id)}
                variant={isCurrent ? 'secondary' : plan.id === 'scale' ? 'primary' : 'outline'}
                className="w-full"
                disabled={isCurrent || isLoading}
              >
                {isCurrent ? 'Current Plan' : plan.id === 'scale' ? 'Contact Sales' : 'Select Free'}
              </Button>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-slate-400 text-center mt-6">
        * AI limits reset daily. Heavy usage during peak hours may experience brief delays.
      </p>
    </div>
  );

  const renderHistory = () => (
    <div className="bg-lb-surface border border-lb-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold text-lb-text-primary">Billing History</h3>
        </div>
        {isScale && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => { window.open('https://billing.stripe.com', '_blank'); }}
          >
            <ExternalLink className="w-4 h-4" />
            Stripe Portal
          </Button>
        )}
      </div>

      {isScale ? (
        <BillingHistory 
          invoices={mockInvoices}
          onDownload={handleDownloadInvoice}
        />
      ) : (
        <div className="text-center py-12">
          <Receipt className="w-12 h-12 mx-auto mb-4 text-lb-text-muted" />
          <p className="text-lb-text-secondary">No billing history — your plan is free!</p>
        </div>
      )}
    </div>
  );

  const renderPayment = () => (
    <div className="space-y-6">
      <div className="bg-lb-surface border border-lb-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-lb-text-primary">Payment Methods</h3>
          </div>
          {isScale && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* Add payment method modal */}}
            >
              + Add Payment Method
            </Button>
          )}
        </div>

        {isScale ? (
          <div className="space-y-3">
            {mockPaymentMethods.map((method) => (
              <PaymentMethodCard
                key={method.id}
                method={method}
                onRemove={() => {/* Handle remove */}}
                onSetDefault={() => {/* Handle set default */}}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-lb-text-muted" />
            <p className="text-lb-text-secondary">No payment methods needed for free plan</p>
          </div>
        )}

        <div className="mt-6 p-4 bg-lb-muted/50 rounded-lg">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-lb-text-primary">Secure Payments</p>
              <p className="text-sm text-lb-text-secondary mt-1">
                All payments are processed securely through Stripe. We never store 
                your full card details on our servers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      {showSuccessBanner && (
        <div className="bg-emerald-50/10 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-emerald-400">Payment Successful!</h3>
            <p className="text-sm text-lb-text-secondary mt-1">
              Your subscription has been updated. You'll receive a confirmation email shortly.
            </p>
          </div>
          <button
            onClick={() => setShowSuccessBanner(false)}
            className="text-lb-text-muted hover:text-lb-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-400">{error}</p>
          </div>
          <button
            onClick={() => setError('')}
            className="text-lb-text-muted hover:text-lb-text-primary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-lb-text-primary">
          Billing & Subscription
        </h1>
        <p className="text-lb-text-secondary mt-1">
          Manage your plan and billing history
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-lb-border">
        <nav className="flex gap-6">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'plans', label: 'Plans' },
            { id: 'history', label: 'History' },
            { id: 'payment', label: 'Payment Methods' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`pb-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-amber-400'
                  : 'text-lb-text-secondary hover:text-lb-text-primary'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'plans' && renderPlans()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'payment' && renderPayment()}
      </div>

      <ComplianceFooter />

      {/* Contact Modal for scale */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-lb-surface border border-amber-500/30 rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Sparkles className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-xl font-semibold text-lb-text-primary">scale Services</h3>
              </div>
              <button
                onClick={() => setShowContactModal(false)}
                className="text-lb-text-muted hover:text-lb-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-lb-text-secondary mb-6">
              Our scale service includes personalized support from licensed NYC property 
              professionals. We'd love to learn more about your needs.
            </p>
            
            <div className="space-y-3">
              <a
                href="mailto:scale@landlordbot.app?subject=scale%20Services%20Inquiry"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-lg text-center transition-colors block"
              >
                Email scale@landlordbot.app
              </a>
              <button
                onClick={() => setShowContactModal(false)}
                className="w-full py-2.5 text-lb-text-secondary hover:text-lb-text-primary transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-lb-surface border border-lb-border rounded-xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
              <h3 className="text-xl font-semibold text-lb-text-primary">Cancel Subscription?</h3>
            </div>
            
            <p className="text-lb-text-secondary mb-4">
              You'll keep access to {currentPlan.name} features until the end of your billing period. 
              After that, your account will switch to the Free plan with unlimited features.
            </p>
            
            <ul className="space-y-2 mb-6 text-sm text-lb-text-secondary">
              <li>• You'll keep unlimited properties and AI on the free plan</li>
              <li>• You'll lose the dedicated account manager and priority support</li>
              <li>• You can resubscribe to scale anytime</li>
              <li>• Your data will not be deleted</li>
            </ul>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCancelModal(false)}
              >
                Keep Subscription
              </Button>
              <Button
                variant="secondary"
                className="flex-1 text-red-400 hover:text-red-300"
                onClick={confirmCancel}
              >
                Cancel Subscription
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Billing;
