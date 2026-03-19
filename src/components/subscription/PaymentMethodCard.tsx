import React from 'react';
import { CreditCard, Trash2, Shield } from 'lucide-react';

export interface PaymentMethod {
  id: string;
  type: 'card';
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

interface PaymentMethodCardProps {
  method: PaymentMethod;
  onRemove?: (method: PaymentMethod) => void;
  onSetDefault?: (method: PaymentMethod) => void;
}

export function PaymentMethodCard({ method, onRemove, onSetDefault }: PaymentMethodCardProps) {
  const getBrandIcon = (brand: string) => {
    // Simplified brand display - in production, use actual brand icons
    const brands: Record<string, { color: string; label: string }> = {
      visa: { color: 'bg-blue-500', label: 'Visa' },
      mastercard: { color: 'bg-orange-500', label: 'Mastercard' },
      amex: { color: 'bg-indigo-500', label: 'Amex' },
      discover: { color: 'bg-orange-600', label: 'Discover' },
    };
    
    const brandInfo = brands[brand.toLowerCase()] || { color: 'bg-slate-500', label: 'Card' };
    return brandInfo;
  };

  const brandInfo = getBrandIcon(method.brand);
  const isExpired = new Date(method.expYear, method.expMonth - 1) < new Date();

  return (
    <div className={`relative p-4 rounded-xl border transition-all ${
      method.isDefault
        ? 'bg-amber-500/5 border-amber-500/30'
        : 'bg-lb-surface border-lb-border hover:border-amber-500/30'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Card Icon */}
          <div className={`w-12 h-8 rounded-md ${brandInfo.color} flex items-center justify-center`}>
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          
          {/* Card Details */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-lb-text-primary">
                {brandInfo.label} •••• {method.last4}
              </span>
              {method.isDefault && (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                  Default
                </span>
              )}
              {isExpired && (
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                  Expired
                </span>
              )}
            </div>
            <p className="text-sm text-lb-text-secondary mt-0.5">
              Expires {method.expMonth.toString().padStart(2, '0')}/{method.expYear}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {!method.isDefault && onSetDefault && (
            <button
              onClick={() => onSetDefault(method)}
              className="px-3 py-1.5 text-sm text-amber-400 hover:text-amber-300 transition-colors"
            >
              Set as default
            </button>
          )}
          {onRemove && (
            <button
              onClick={() => onRemove(method)}
              className="p-2 text-lb-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Remove payment method"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Security Badge */}
      {method.isDefault && (
        <div className="absolute -top-2 -right-2">
          <div className="w-6 h-6 rounded-full bg-lb-surface border border-amber-500/30 flex items-center justify-center">
            <Shield className="w-3 h-3 text-amber-400" />
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentMethodCard;
