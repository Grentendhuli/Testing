import { useState, useEffect, useCallback } from 'react';
import { billingService } from '../services/billingService';
import type { 
  BillingInfo, 
  PaymentMethod, 
  Invoice, 
  UsageMetrics,
  SubscriptionTier 
} from '../types/billing.types';

interface UseBillingReturn {
  billingInfo: BillingInfo | null;
  paymentMethods: PaymentMethod[];
  invoices: Invoice[];
  usageMetrics: UsageMetrics | null;
  isLoading: boolean;
  error: string | null;
  refreshBilling: () => Promise<void>;
  updateSubscription: (tier: SubscriptionTier) => Promise<boolean>;
  cancelSubscription: (reason?: string) => Promise<boolean>;
}

export function useBilling(userId: string | undefined): UseBillingReturn {
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [usageMetrics, setUsageMetrics] = useState<UsageMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBillingData = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all billing data in parallel
      const [billingResult, paymentsResult, invoicesResult, usageResult] = await Promise.all([
        billingService.getBillingInfo(userId),
        billingService.getPaymentMethods(userId),
        billingService.getInvoices(userId),
        billingService.getUsageMetrics(userId),
      ]);

      if (billingResult.success) {
        setBillingInfo(billingResult.data);
      } else {
        setError(billingResult.error?.message || 'Failed to fetch billing info');
      }

      if (paymentsResult.success) {
        setPaymentMethods(paymentsResult.data);
      }

      if (invoicesResult.success) {
        setInvoices(invoicesResult.data);
      }

      if (usageResult.success) {
        setUsageMetrics(usageResult.data);
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Billing fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  const updateSubscription = useCallback(async (tier: SubscriptionTier): Promise<boolean> => {
    if (!userId) return false;

    setIsLoading(true);
    try {
      const result = await billingService.updateSubscriptionTier(userId, tier);
      if (result.success) {
        await fetchBillingData(); // Refresh data
        return true;
      } else {
        setError(result.error?.message || 'Failed to update subscription');
        return false;
      }
    } catch (err) {
      setError('Failed to update subscription');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, fetchBillingData]);

  const cancelSubscription = useCallback(async (reason?: string): Promise<boolean> => {
    if (!userId) return false;

    setIsLoading(true);
    try {
      const result = await billingService.cancelSubscription(userId, reason);
      if (result.success) {
        await fetchBillingData(); // Refresh data
        return true;
      } else {
        setError(result.error?.message || 'Failed to cancel subscription');
        return false;
      }
    } catch (err) {
      setError('Failed to cancel subscription');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, fetchBillingData]);

  return {
    billingInfo,
    paymentMethods,
    invoices,
    usageMetrics,
    isLoading,
    error,
    refreshBilling: fetchBillingData,
    updateSubscription,
    cancelSubscription,
  };
}
