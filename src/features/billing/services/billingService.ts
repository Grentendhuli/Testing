import { supabase } from '@/lib/supabase';
import { Result, createError } from '@/types/result';
import type { Database } from '@/lib/database.types';
import type { 
  BillingInfo, 
  PaymentMethod, 
  Invoice, 
  UsageMetrics,
  SubscriptionTier 
} from '../types/billing.types';

// Type helpers for database tables
type UsersRow = Database['public']['Tables']['users']['Row'];
type PaymentMethodsRow = Database['public']['Tables']['payment_methods']['Row'];
type InvoicesRow = Database['public']['Tables']['invoices']['Row'];
type AiUsageRow = Database['public']['Tables']['ai_usage']['Row'];

const BILLING_TABLE = 'billing_subscriptions';
const INVOICES_TABLE = 'invoices';

export interface BillingService {
  getBillingInfo(userId: string): Promise<Result<BillingInfo>>;
  updateSubscriptionTier(userId: string, tier: SubscriptionTier): Promise<Result<void>>;
  getPaymentMethods(userId: string): Promise<Result<PaymentMethod[]>>;
  getInvoices(userId: string): Promise<Result<Invoice[]>>;
  getUsageMetrics(userId: string): Promise<Result<UsageMetrics>>;
  cancelSubscription(userId: string, reason?: string): Promise<Result<void>>;
}

export const billingService: BillingService = {
  async getBillingInfo(userId: string) {
    try {
      // Get user data which includes subscription info
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('subscription_tier, subscription_status, storage_used, storage_limit, max_units')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Get unit count
      const { count: unitsCount, error: countError } = await supabase
        .from('units')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) throw countError;

      // Type assertion needed due to Supabase type inference issue
      const user = userData as UsersRow;
      const billingInfo: BillingInfo = {
        subscriptionTier: user.subscription_tier as SubscriptionTier,
        subscriptionStatus: user.subscription_status as BillingInfo['subscriptionStatus'],
        storageUsed: user.storage_used || 0,
        storageLimit: user.storage_limit || 1073741824, // 1GB default
        maxUnits: user.max_units || -1, // -1 = unlimited
        unitsCount: unitsCount || 0,
      };

      return Result.ok(billingInfo);
    } catch (error) {
      console.error('Error fetching billing info:', error);
      return Result.err(createError('BILLING_FETCH_ERROR', 'Failed to fetch billing information'));
    }
  },

  async updateSubscriptionTier(userId: string, tier: SubscriptionTier) {
    try {
      const { error } = await (supabase
        .from('users') as any)
        .update({ 
          subscription_tier: tier,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;
      return Result.ok(undefined);
    } catch (error) {
      console.error('Error updating subscription tier:', error);
      return Result.err(createError('SUBSCRIPTION_UPDATE_ERROR', 'Failed to update subscription'));
    }
  },

  async getPaymentMethods(userId: string) {
    try {
      // Payment methods would be stored in a separate table or fetched from Stripe
      // For now, return empty array - implement when Stripe is integrated
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });

      if (error) {
        // Table might not exist yet, return empty
        return Result.ok([]);
      }

      const paymentMethods: PaymentMethod[] = ((data || []) as PaymentMethodsRow[]).map(pm => ({
        id: pm.id,
        type: pm.type as 'card' | 'bank_transfer',
        last4: pm.last4 || '',
        brand: pm.brand || undefined,
        expMonth: pm.exp_month || undefined,
        expYear: pm.exp_year || undefined,
        isDefault: pm.is_default || false,
      }));

      return Result.ok(paymentMethods);
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return Result.ok([]); // Return empty on error
    }
  },

  async getInvoices(userId: string) {
    try {
      const { data, error } = await supabase
        .from(INVOICES_TABLE)
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        // Table might not exist yet
        return Result.ok([]);
      }

      const invoices: Invoice[] = ((data || []) as InvoicesRow[]).map(inv => ({
        id: inv.id,
        amount: inv.amount,
        currency: inv.currency || 'usd',
        status: inv.status as 'paid' | 'open' | 'void' | 'uncollectible',
        createdAt: inv.created_at,
        paidAt: inv.paid_at || undefined,
        pdfUrl: inv.pdf_url || undefined,
      }));

      return Result.ok(invoices);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return Result.ok([]);
    }
  },

  async getUsageMetrics(userId: string) {
    try {
      // Get AI usage
      const { data: aiUsage, error: aiError } = await supabase
        .from('ai_usage')
        .select('requests_used, requests_limit')
        .eq('user_id', userId)
        .eq('request_date', new Date().toISOString().split('T')[0])
        .single();

      // Get user data for storage/units
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('storage_used, storage_limit, max_units')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Get unit count
      const { count: unitsCount, error: countError } = await supabase
        .from('units')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Type assertions for Supabase data
      const ai = aiUsage as AiUsageRow | null;
      const user = userData as UsersRow;

      const metrics: UsageMetrics = {
        aiCallsUsed: ai?.requests_used || 0,
        aiCallsLimit: ai?.requests_limit || 50,
        storageUsed: user?.storage_used || 0,
        storageLimit: user?.storage_limit || 1073741824,
        unitsUsed: unitsCount || 0,
        unitsLimit: user?.max_units || -1,
      };

      return Result.ok(metrics);
    } catch (error) {
      console.error('Error fetching usage metrics:', error);
      return Result.err(createError('USAGE_FETCH_ERROR', 'Failed to fetch usage metrics'));
    }
  },

  async cancelSubscription(userId: string, reason?: string) {
    try {
      // Update subscription status to canceled
      const { error } = await (supabase
        .from('users') as any)
        .update({ 
          subscription_status: 'canceled',
          cancellation_reason: reason || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Log cancellation event (could also send to analytics)
      console.log(`Subscription canceled for user ${userId}. Reason: ${reason || 'Not provided'}`);

      return Result.ok(undefined);
    } catch (error) {
      console.error('Error canceling subscription:', error);
      return Result.err(createError('CANCELLATION_ERROR', 'Failed to cancel subscription'));
    }
  }
};

// Re-export for convenience
export { billingService as default };
