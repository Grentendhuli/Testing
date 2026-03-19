import React from 'react';
import { Check, Minus } from 'lucide-react';

export interface FeatureItem {
  name: string;
  description?: string;
  included: boolean | string;
}

interface FeatureListProps {
  features: FeatureItem[];
  showTooltips?: boolean;
}

export function FeatureList({ features, showTooltips = false }: FeatureListProps) {
  return (
    <ul className="space-y-3">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start gap-3">
          {feature.included === true ? (
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Check className="w-3 h-3 text-emerald-400" />
            </div>
          ) : feature.included === false ? (
            <div className="w-5 h-5 rounded-full bg-lb-muted flex items-center justify-center flex-shrink-0 mt-0.5">
              <Minus className="w-3 h-3 text-lb-text-muted" />
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-medium text-amber-400">{feature.included}</span>
            </div>
          )}
          
          <div className="flex-1">
            <span className={`text-sm ${
              feature.included ? 'text-lb-text-primary' : 'text-lb-text-muted'
            }`}>
              {feature.name}
            </span>
            {feature.description && showTooltips && (
              <p className="text-xs text-lb-text-muted mt-0.5">
                {feature.description}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default FeatureList;
