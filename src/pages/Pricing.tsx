import React, { useState } from 'react';
import { 
  Building2, CheckCircle, Shield, Mail, Sparkles, 
  HelpCircle, ChevronDown, ChevronUp, Check, Infinity, Phone, UserCog, LineChart
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { PlanCard, Plan } from '../components/subscription/PlanCard';
import { FeatureList, FeatureItem } from '../components/subscription/FeatureList';
import { useAuth } from '@/features/auth';
import { analytics } from '../utils/analytics';

// Pricing plans configuration - Simplified: Free and Concierge only
const plans: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Everything you need to manage your properties — completely free',
    price: 0,
    priceUnit: '/month',
    billingPeriod: 'monthly',
    ctaText: 'Get Started Free',
    isPopular: true,
    features: [
      { name: 'Unlimited properties', included: true },
      { name: 'Unlimited AI requests', included: true },
      { name: 'Rent & expense tracking', included: true },
      { name: 'Maintenance management', included: true },
      { name: 'Tenant management', included: true },
      { name: 'NYC compliance alerts', included: true },
      { name: 'Financial reports', included: true },
      { name: 'All 6 API integrations', included: true },
      { name: 'Email support', included: true },
      { name: 'Dedicated account manager', included: false },
    ],
  },
  {
    id: 'concierge',
    name: 'Concierge',
    description: 'White-glove service for portfolio landlords',
    price: 149,
    priceUnit: '/month',
    billingPeriod: 'monthly',
    yearlyDiscount: 17, // ~$1490/year vs $1788 = ~17% savings
    ctaText: 'Contact Sales',
    isPopular: false,
    features: [
      { name: 'Everything in Free', included: true },
      { name: 'Dedicated account manager', included: true },
      { name: 'Priority phone support', included: true },
      { name: 'Custom integrations', included: true },
      { name: 'Advanced analytics', included: true },
      { name: 'White-label options', included: true },
      { name: 'Full API access', included: true },
      { name: 'Bulk operations', included: true },
      { name: 'Custom reports', included: true },
      { name: 'Training sessions', included: true },
    ],
  },
];

// Feature comparison data - simplified for 2 tiers
interface ComparisonFeature {
  category: string;
  items: {
    name: string;
    description?: string;
    values: Record<string, string | boolean>;
  }[];
}

const comparisonFeatures: ComparisonFeature[] = [
  {
    category: 'Properties & Units',
    items: [
      { name: 'Number of properties', description: 'Track and manage your rental units', values: { free: 'Unlimited', concierge: 'Unlimited' } },
      { name: 'Units per property', description: 'Multiple units supported per property', values: { free: true, concierge: true } },
      { name: 'Unit photos', description: 'Upload images for each property', values: { free: 'Unlimited', concierge: 'Unlimited' } },
      { name: 'Document storage', description: 'Store leases, receipts, and documents', values: { free: 'Unlimited', concierge: 'Unlimited' } },
    ],
  },
  {
    category: 'AI Features',
    items: [
      { name: 'AI requests', description: 'Daily AI-powered actions', values: { free: 'Unlimited', concierge: 'Unlimited' } },
      { name: 'Smart suggestions', description: 'AI-powered recommendations', values: { free: true, concierge: true } },
      { name: 'Document analysis', description: 'AI reads and analyzes documents', values: { free: true, concierge: true } },
      { name: 'Market insights', description: 'Rent trends and market data', values: { free: true, concierge: true } },
      { name: 'Priority AI processing', description: 'Faster AI response times', values: { free: false, concierge: true } },
    ],
  },
  {
    category: 'Core Features',
    items: [
      { name: 'Rent tracking', description: 'Track rent payments and due dates', values: { free: true, concierge: true } },
      { name: 'Maintenance requests', description: 'Manage maintenance tickets', values: { free: true, concierge: true } },
      { name: 'Tenant management', description: 'Store tenant information', values: { free: true, concierge: true } },
      { name: 'Financial reports', description: 'Generate income/expense reports', values: { free: true, concierge: true } },
      { name: 'NYC compliance alerts', description: 'HPD, DOB, and violation alerts', values: { free: true, concierge: true } },
      { name: 'SendGrid integration', description: 'Email notifications', values: { free: true, concierge: true } },
      { name: 'Google Calendar sync', description: 'Calendar integration', values: { free: true, concierge: true } },
      { name: 'Zillow integration', description: 'Market data and listings', values: { free: true, concierge: true } },
      { name: 'DocuSeal integration', description: 'E-signatures', values: { free: true, concierge: true } },
    ],
  },
  {
    category: 'Concierge Services',
    items: [
      { name: 'Dedicated account manager', description: 'Personal point of contact', values: { free: false, concierge: true } },
      { name: 'Priority phone support', description: 'Call for urgent help', values: { free: false, concierge: true } },
      { name: 'Custom integrations', description: 'Build custom connections', values: { free: false, concierge: true } },
      { name: 'Advanced analytics', description: 'Portfolio-level insights', values: { free: false, concierge: true } },
      { name: 'White-label options', description: 'Branded experience', values: { free: false, concierge: true } },
      { name: 'API access', description: 'Full API for custom builds', values: { free: false, concierge: true } },
      { name: 'Bulk operations', description: 'Mass actions across portfolio', values: { free: false, concierge: true } },
      { name: 'Custom reports', description: 'Tailored reporting', values: { free: false, concierge: true } },
      { name: 'Training sessions', description: '1-on-1 training', values: { free: false, concierge: true } },
    ],
  },
  {
    category: 'Support',
    items: [
      { name: 'Email support', description: 'Get help via email', values: { free: true, concierge: true } },
      { name: 'Response time', description: 'Average support response time', values: { free: '48 hours', concierge: '1 hour' } },
      { name: 'Chat support', description: 'Live chat assistance', values: { free: false, concierge: true } },
      { name: 'Phone support', description: 'Call for urgent help', values: { free: false, concierge: true } },
    ],
  },
];

// FAQ data
const faqs = [
  {
    question: 'Is the free plan really free forever?',
    answer: 'Yes! Our free plan is completely free forever with no credit card required. You get unlimited properties, unlimited AI requests, and all core features. We believe every landlord deserves access to great tools, regardless of budget.',
  },
  {
    question: 'What\'s the difference between Free and Concierge?',
    answer: 'The Free plan includes everything you need to manage your properties: unlimited units, unlimited AI, all core features, and email support. Concierge adds white-glove services like a dedicated account manager, priority phone support, custom integrations, advanced analytics, and training sessions.',
  },
  {
    question: 'Why is there only one paid tier?',
    answer: 'We believe in simplicity. Instead of confusing tiered pricing, we offer a generous free plan with everything you need. If you want premium services like dedicated support and custom integrations, Concierge is available.',
  },
  {
    question: 'What\'s included in the Concierge service?',
    answer: 'Concierge gives you a dedicated account manager, priority phone and chat support, custom integrations, advanced portfolio analytics, white-label options, full API access, bulk operations, custom reports, and personalized training sessions.',
  },
  {
    question: 'Do you offer yearly billing for Concierge?',
    answer: 'Yes! Concierge is $149/month or $1,490/year (save ~17%). You\'ll see the yearly option when you contact sales.',
  },
  {
    question: 'Is my payment information secure?',
    answer: 'We use Stripe, a PCI-compliant payment processor trusted by millions of businesses worldwide. We never store your credit card details on our servers. All payments are encrypted and processed securely.',
  },
];

export function Pricing() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Track current plan
  const currentPlanId = userData?.subscription_tier || 'free';

  const handlePlanSelect = (plan: Plan) => {
    analytics.trackEvent('pricing_plan_selected', {
      plan_id: plan.id,
      plan_name: plan.name,
      price: plan.price,
      is_yearly: isYearly,
      current_plan: currentPlanId,
    });

    if (plan.id === 'concierge') {
      // Concierge needs contact
      window.location.href = 'mailto:concierge@landlordbot.app?subject=Concierge%20Services%20Inquiry';
    } else {
      navigate('/signup');
    }
  };

  // Mark current plan
  const plansWithCurrent = plans.map(p => ({
    ...p,
    isCurrentPlan: p.id === currentPlanId,
  }));

  return (
    <div className="min-h-screen bg-lb-base">
      {/* Header */}
      <div className="pt-8 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full mb-6">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">
              Unlimited everything — completely free
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-lb-text-primary mb-4">
            Simple, generous pricing
          </h1>
          <p className="text-lg text-lb-text-secondary max-w-2xl mx-auto mb-8">
            LandlordBot is completely free with unlimited properties and AI. 
            Upgrade to Concierge only if you want white-glove service.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="px-4 sm:px-6 lg:px-8 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {plansWithCurrent.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onSelect={handlePlanSelect}
                isYearly={isYearly}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Feature Comparison */}
      <div className="px-4 sm:px-6 lg:px-8 py-12 bg-lb-muted/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-serif font-bold text-lb-text-primary text-center mb-8">
            Compare all features
          </h2>

          <div className="bg-lb-surface border border-lb-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-lb-border">
                    <th className="text-left py-4 px-6 text-sm font-medium text-lb-text-secondary">Feature</th>
                    <th className="text-center py-4 px-4 text-sm font-medium text-emerald-400">Free</th>
                    <th className="text-center py-4 px-4 text-sm font-medium text-amber-400">Concierge</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((category, catIdx) => (
                    <React.Fragment key={catIdx}>
                      <tr>
                        <td
                          colSpan={3}
                          className="py-3 px-6 bg-lb-muted/50 text-xs font-semibold text-lb-text-secondary uppercase tracking-wider"
                        >
                          {category.category}
                        </td>
                      </tr>
                      {category.items.map((item, itemIdx) => (
                        <tr key={itemIdx} className="border-b border-lb-border/50 hover:bg-lb-muted/20">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-lb-text-primary">{item.name}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center bg-emerald-500/5">
                            <ComparisonCell value={item.values.free} />
                          </td>
                          <td className="py-4 px-4 text-center bg-amber-500/5">
                            <ComparisonCell value={item.values.concierge} />
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Shield, label: 'Stripe Secure', sub: 'PCI compliant' },
              { icon: CheckCircle, label: 'Cancel Anytime', sub: 'No commitments' },
              { icon: Mail, label: 'Email Support', sub: '48hr response' },
              { icon: Building2, label: 'NYC Focused', sub: 'Built for locals' },
            ].map((badge) => (
              <div key={badge.label} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-lb-muted flex items-center justify-center">
                  <badge.icon className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-lb-text-primary">{badge.label}</p>
                  <p className="text-xs text-lb-text-muted">{badge.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="px-4 sm:px-6 lg:px-8 py-12 bg-lb-muted/30">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-serif font-bold text-lb-text-primary text-center mb-8">
            Frequently asked questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-lb-surface border border-lb-border rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-lb-muted/20 transition-colors"
                >
                  <span className="font-medium text-lb-text-primary pr-4">{faq.question}</span>
                  {openFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-lb-text-secondary flex-shrink-0" />
                  )}
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-sm text-lb-text-secondary leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-serif font-bold text-lb-text-primary mb-4">
            Ready to get started?
          </h2>
          <p className="text-lb-text-secondary mb-8">
            Join thousands of NYC landlords managing their properties smarter — for free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/signup')}
              size="lg"
              className="gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Get Started Free
            </Button>
            <Button
              onClick={() => window.location.href = 'mailto:concierge@landlordbot.app?subject=Concierge%20Services%20Inquiry'}
              variant="outline"
              size="lg"
              className="gap-2"
            >
              <Phone className="w-5 h-5" />
              Contact Concierge Sales
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for comparison table cells
function ComparisonCell({ value }: { value: boolean | string }) {
  if (value === true) {
    return <Check className="w-5 h-5 text-emerald-400 mx-auto" />;
  }
  if (value === false) {
    return <span className="text-lb-text-muted">—</span>;
  }
  return <span className="text-sm text-lb-text-primary font-medium">{value}</span>;
}

export default Pricing;
