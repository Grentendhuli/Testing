import React from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '../Button';

export interface PlanFeature {
  name: string;
  included: boolean;
  tooltip?: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  priceUnit: string;
  billingPeriod: 'monthly' | 'yearly';
  yearlyDiscount?: number;
  features: PlanFeature[];
  ctaText: string;
  isPopular?: boolean;
  isCurrentPlan?: boolean;
  disabled?: boolean;
}

interface PlanCardProps {
  plan: Plan;
  onSelect: (plan: Plan) => void;
  isYearly?: boolean;
  // Allow additional dynamic properties
  [key: string]: any;
}

export function PlanCard({ plan, onSelect, isYearly = false }: PlanCardProps) {
  const displayPrice = isYearly && plan.yearlyDiscount
    ? Math.round(plan.price * 12 * (1 - plan.yearlyDiscount / 100))
    : plan.price;
  
  const periodLabel = isYearly ? '/year' : plan.priceUnit;

  return (
    <div
      className={`relative rounded-2xl p-6 transition-all duration-200 ${
        plan.isPopular
          ? 'bg-gradient-to-b from-amber-500/10 to-transparent border-2 border-amber-500 shadow-lg shadow-amber-500/10'
          : plan.isCurrentPlan
          ? 'bg-emerald-50/50 border-2 border-emerald-400'
          : 'bg-lb-surface border border-lb-border hover:border-amber-500/50'
      }`}
    >
      {/* Badges */}
      {plan.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500 text-slate-950 text-xs font-semibold rounded-full">
            <Sparkles className="w-3 h-3" />
            Most Popular
          </span>
        </div>
      )}
      
      {plan.isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center px-3 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full">
            Current Plan
          </span>
        </div>
      )}

      {/* Plan Header */}
      <div className="text-center mb-6">
        <h3 className={`text-xl font-semibold ${
          plan.isPopular ? 'text-amber-400' : 'text-lb-text-primary'
        }`}>
          {plan.name}
        </h3>
        <p className="text-sm text-lb-text-secondary mt-1">{plan.description}</p>
      </div>

      {/* Price */}
      <div className="text-center mb-6">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl font-bold text-lb-text-primary">
            ${displayPrice}
          </span>
          <span className="text-lb-text-secondary">{periodLabel}</span>
        </div>
        {plan.yearlyDiscount && isYearly && (
          <p className="text-sm text-emerald-400 mt-1">
            Save {plan.yearlyDiscount}% with yearly billing
          </p>
        )}
        {!isYearly && plan.price > 0 && (
          <p className="text-xs text-lb-text-muted mt-1">
            Billed monthly
          </p>
        )}
      </div>

      {/* CTA Button */}
      <Button
        onClick={() => onSelect(plan)}
        variant={plan.isPopular ? 'primary' : plan.isCurrentPlan ? 'secondary' : 'outline'}
        className="w-full mb-6"
        disabled={plan.disabled || plan.isCurrentPlan}
      >
        {plan.isCurrentPlan ? 'Current Plan' : plan.ctaText}
      </Button>

      {/* Features List */}
      <ul className="space-y-3">
        {plan.features.map((feature, index) => (
          <li
            key={index}
            className={`flex items-start gap-3 text-sm ${
              feature.included ? 'text-lb-text-primary' : 'text-lb-text-muted'
            }`}
          >
            <Check
              className={`w-5 h-5 flex-shrink-0 ${
                feature.included
                  ? plan.isPopular ? 'text-amber-400' : 'text-emerald-400'
                  : 'text-lb-text-muted'
              }`}
            />
            <span className={feature.included ? '' : 'line-through'}>
              {feature.name}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default PlanCard;
