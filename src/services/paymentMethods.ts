import { supabase } from '@/lib/supabase';

// Payment methods configuration
export const SUPPORTED_PAYMENT_METHODS = {
  PAYPAL: {
    id: 'paypal',
    name: 'PayPal',
    icon: 'Paypal',
    color: '#003087',
    description: 'Accept PayPal payments from tenants',
    setupUrl: 'https://www.paypal.com/business',
    processingFee: '2.9% + $0.30',
    supported: true,
    autoRecord: false, // Placeholder - requires API integration
  },
  ZELLE: {
    id: 'zelle',
    name: 'Zelle',
    icon: 'Zap',
    color: '#6C16D9',
    description: 'Accept Zelle transfers - Free for banks',
    setupUrl: 'https://www.zellepay.com',
    processingFee: 'Free with participating banks',
    supported: true,
    autoRecord: false, // Placeholder - requires bank API integration
  },
  VENMO: {
    id: 'venmo',
    name: 'Venmo',
    icon: 'CreditCard',
    color: '#008CFF',
    description: 'Accept Venmo payments from tenants',
    setupUrl: 'https://venmo.com/business',
    processingFee: '1.9% + $0.10',
    supported: true,
    autoRecord: false, // Placeholder - requires Venmo Business API
  },
  APPLE_CASH: {
    id: 'apple_cash',
    name: 'Apple Cash',
    icon: 'Smartphone',
    color: '#000000',
    description: 'Accept Apple Cash payments',
    setupUrl: 'https://www.apple.com/apple-pay/',
    processingFee: 'Free',
    supported: true,
    autoRecord: false, // Placeholder - Apple Cash API not available for business
  },
  BANK_TRANSFER: {
    id: 'bank_transfer',
    name: 'Bank Transfer (ACH)',
    icon: 'Building2',
    color: '#22C55E',
    description: 'Direct bank transfers',
    setupUrl: null,
    processingFee: 'Free',
    supported: true,
    autoRecord: false,
  },
  CASH: {
    id: 'cash',
    name: 'Cash',
    icon: 'Banknote',
    color: '#F59E0B',
    description: 'Record cash payments manually',
    setupUrl: null,
    processingFee: 'None',
    supported: true,
    autoRecord: false,
  },
  CHECK: {
    id: 'check',
    name: 'Check',
    icon: 'FileText',
    color: '#6B7280',
    description: 'Record check payments manually',
    setupUrl: null,
    processingFee: 'None',
    supported: true,
    autoRecord: false,
  },
} as const;

export type PaymentMethodId = keyof typeof SUPPORTED_PAYMENT_METHODS;

export interface PaymentMethodConfig {
  id: string;
  name: string;
  isEnabled: boolean;
  connectedAccountId?: string;
  webhookUrl?: string;
  autoRecord: boolean;
  notifyOnPayment: boolean;
}

// Service for managing payment methods
export const paymentMethodsService = {
  /**
   * Get user's configured payment methods
   */
  async getUserPaymentMethods(userId: string): Promise<PaymentMethodConfig[]> {
    try {
      const { data, error } = await (supabase as any)
        .from('user_payment_methods')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.warn('[PaymentMethods] Error fetching payment methods:', error);
        // Return default configuration
        return this.getDefaultPaymentMethods();
      }

      return data || this.getDefaultPaymentMethods();
    } catch (err) {
      console.warn('[PaymentMethods] Exception fetching payment methods:', err);
      return this.getDefaultPaymentMethods();
    }
  },

  /**
   * Get default payment methods configuration
   */
  getDefaultPaymentMethods(): PaymentMethodConfig[] {
    return [
      { id: 'cash', name: 'Cash', isEnabled: true, autoRecord: false, notifyOnPayment: false },
      { id: 'check', name: 'Check', isEnabled: true, autoRecord: false, notifyOnPayment: false },
      { id: 'bank_transfer', name: 'Bank Transfer', isEnabled: true, autoRecord: false, notifyOnPayment: false },
      { id: 'zelle', name: 'Zelle', isEnabled: false, autoRecord: false, notifyOnPayment: true },
      { id: 'venmo', name: 'Venmo', isEnabled: false, autoRecord: false, notifyOnPayment: true },
      { id: 'paypal', name: 'PayPal', isEnabled: false, autoRecord: false, notifyOnPayment: true },
      { id: 'apple_cash', name: 'Apple Cash', isEnabled: false, autoRecord: false, notifyOnPayment: false },
    ];
  },

  /**
   * Update payment method configuration
   */
  async updatePaymentMethod(
    userId: string,
    methodId: string,
    config: Partial<PaymentMethodConfig>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if Supabase table exists, if not just store in localStorage for now
      const { error } = await (supabase as any)
        .from('user_payment_methods')
        .upsert({
          user_id: userId,
          method_id: methodId,
          ...config,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id,method_id'
        });

      if (error) {
        // If table doesn't exist, store in localStorage as fallback
        if (error.code === '42P01') {
          const key = `payment_method_${userId}_${methodId}`;
          localStorage.setItem(key, JSON.stringify(config));
          return { success: true };
        }
        throw error;
      }

      return { success: true };
    } catch (err: any) {
      console.error('[PaymentMethods] Error updating payment method:', err);
      
      // Fallback to localStorage
      const key = `payment_method_${userId}_${methodId}`;
      localStorage.setItem(key, JSON.stringify(config));
      return { success: true };
    }
  },

  /**
   * Get payment instruction text for tenant
   */
  getPaymentInstructions(
    methodId: PaymentMethodId,
    tenantInfo: { name: string; unitNumber: string; rentAmount: number },
    landlordInfo: { paypalEmail?: string; zelleEmail?: string; venmoHandle?: string }
  ): string {
    const { name, unitNumber, rentAmount } = tenantInfo;
    
    const instructions: Record<PaymentMethodId, string> = {
      PAYPAL: `PayPal Payment Instructions:\n\nPayable to: ${landlordInfo.paypalEmail || '[Your PayPal Email]'}\nAmount: $${rentAmount.toLocaleString()}\nNote: "Rent for Unit ${unitNumber} - ${name}"\n\nPlease send screenshot of confirmation after payment.`,
      
      ZELLE: `Zelle Payment Instructions:\n\nPayable to: ${landlordInfo.zelleEmail || '[Your Zelle Email/Phone]'}\nAmount: $${rentAmount.toLocaleString()}\nNote: "Unit ${unitNumber} - ${name}"\n\nZelle is free with most major banks.`,
      
      VENMO: `Venmo Payment Instructions:\n\nPayable to: ${landlordInfo.venmoHandle || '[Your Venmo @username]'}\nAmount: $${rentAmount.toLocaleString()}\nNote: "Unit ${unitNumber} - ${name}"\n\nPlease mark as "Goods/Services" for payment protection.`,
      
      APPLE_CASH: `Apple Cash Payment Instructions:\n\nSend via Messages to: [Your Apple ID Phone/Email]\nAmount: $${rentAmount.toLocaleString()}\nNote: "Unit ${unitNumber} Rent"\n\nMake sure to confirm "Goods/Services" when sending.`,
      
      BANK_TRANSFER: `Bank Transfer Instructions:\n\nPlease contact us for account details.\nAmount: $${rentAmount.toLocaleString()}\nNote: Reference Unit ${unitNumber}, ${name}\n\nACH transfers typically take 1-3 business days.`,
      
      CASH: `Cash Payment Instructions:\n\nAmount: $${rentAmount.toLocaleString()}\nDue Date: 1st of each month\n\nPlease obtain a receipt for all cash payments.`,
      
      CHECK: `Check Payment Instructions:\n\nPayable to: [Landlord Name]\nMemo: "Unit ${unitNumber} - ${name}"\nAmount: $${rentAmount.toLocaleString()}\n\nMail or drop off at property office.`,
    };

    return instructions[methodId] || instructions.CHECK;
  },

  /**
   * Record a payment manually
   */
  async recordPayment(
    userId: string,
    paymentData: {
      unitId: string;
      tenantId?: string;
      amount: number;
      method: string;
      date: string;
      notes?: string;
      isLate?: boolean;
      lateFee?: number;
    }
  ): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    try {
      const { data, error } = await (supabase as any)
        .from('payments')
        .insert({
          user_id: userId,
          unit_id: paymentData.unitId,
          tenant_id: paymentData.tenantId,
          amount: paymentData.amount,
          method: paymentData.method,
          paid_date: paymentData.date,
          status: 'paid',
          notes: paymentData.notes,
          late_fee: paymentData.isLate ? paymentData.lateFee : 0,
        })
        .select('id')
        .single();

      if (error) {
        console.error('[PaymentMethods] Error recording payment:', error);
        return { success: false, error: error.message };
      }

      return { success: true, paymentId: data.id };
    } catch (err: any) {
      console.error('[PaymentMethods] Exception recording payment:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Check if a payment method is available (placeholder for future API checks)
   */
  async checkMethodAvailability(methodId: PaymentMethodId): Promise<{ available: boolean; message?: string }> {
    // Placeholder - in the future this could check API connectivity
    const method = SUPPORTED_PAYMENT_METHODS[methodId];
    if (!method) {
      return { available: false, message: 'Unknown payment method' };
    }

    if (!method.supported) {
      return { available: false, message: `${method.name} integration coming soon` };
    }

    return { available: true };
  },
};

export default paymentMethodsService;
