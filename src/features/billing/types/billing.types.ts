// Billing Feature Types

export type SubscriptionTier = 'free' | 'pro' | 'concierge';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled';

export interface BillingInfo {
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  trialStartDate?: string;
  trialDaysRemaining?: number;
  storageUsed: number;
  storageLimit: number;
  maxUnits: number;
  unitsCount: number;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_transfer';
  last4: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
  isDefault: boolean;
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  createdAt: string;
  paidAt?: string;
  pdfUrl?: string;
}

export interface UsageMetrics {
  aiCallsUsed: number;
  aiCallsLimit: number;
  storageUsed: number;
  storageLimit: number;
  unitsUsed: number;
  unitsLimit: number;
}
