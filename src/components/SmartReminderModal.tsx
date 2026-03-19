import { useState, useCallback } from 'react';
import { Sparkles, Copy, Check, RefreshCw, MessageSquare, Clock, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/features/auth';
import { useApp } from '../context/AppContext';
import { generateText } from '../services/gemini';
import type { Payment } from '../types';

interface SmartReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  tenantName: string;
  unitNumber: string;
  amount: number;
  daysOverdue: number;
  onSend: (message: string) => void;
}

interface GeneratedReminder {
  message: string;
  tone: string;
  confidence: number;
  reasoning: string;
}

export function SmartReminderModal({
  isOpen,
  onClose,
  payment,
  tenantName,
  unitNumber,
  amount,
  daysOverdue,
  onSend,
}: SmartReminderModalProps) {
  const { userData } = useAuth();
  const { payments } = useApp();
  const [generatedMessage, setGeneratedMessage] = useState<GeneratedReminder | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get tenant payment history
  const getTenantHistory = useCallback(() => {
    if (!payment?.tenantId) return { onTimeCount: 0, lateCount: 0, totalPayments: 0 };
    
    const tenantPayments = payments.filter(p => p.tenantId === payment.tenantId);
    const onTimeCount = tenantPayments.filter(p => p.status === 'paid' && !p.lateFee).length;
    const lateCount = tenantPayments.filter(p => p.status === 'paid' && p.lateFee).length;
    
    return {
      onTimeCount,
      lateCount,
      totalPayments: tenantPayments.length,
      isReliable: onTimeCount > lateCount,
    };
  }, [payments, payment]);

  // Generate AI reminder
  const generateReminder = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const history = getTenantHistory();
      const tone = userData?.subscription_tier === 'concierge' ? 'warm' : 'friendly';
      const preferredMethod = userData?.preferred_payment_method || 'any';

      const prompt = `Generate a payment reminder message for a tenant.

Tenant Information:
- Name: ${tenantName}
- Unit: ${unitNumber}
- Amount Due: $${amount}
- Days Overdue: ${daysOverdue}
- Payment History: ${history.onTimeCount} on-time, ${history.lateCount} late out of ${history.totalPayments} total payments
- Tenant Reliability: ${history.isReliable ? 'Reliable payer' : 'Has had some late payments'}

Landlord Preferences:
- Tone: ${tone}
- Preferred Payment Method: ${preferredMethod}

Requirements:
1. Be ${tone} but clear about the urgency
2. Mention the specific amount and unit
3. Include payment method options (Venmo, Zelle, Cash App, PayPal, check, cash)
4. Keep it under 300 characters for SMS compatibility
5. Don't be accusatory or threatening
6. Offer help if they're having trouble
7. Include a clear call to action

Return ONLY the message text, no quotes, no explanation.`;

      const result = await generateText(prompt, {
        temperature: 0.7,
        maxOutputTokens: 200,
      });

      if (result.success && result.data?.success && result.data.data) {
        setGeneratedMessage({
          message: result.data.data.trim(),
          tone: tone,
          confidence: history.isReliable ? 85 : 75,
          reasoning: history.isReliable 
            ? 'Tenant has good payment history — gentle reminder appropriate'
            : 'Tenant has had late payments — firmer but still friendly tone',
        });
      } else {
        // Fallback message if AI fails
        setGeneratedMessage({
          message: `Hi ${tenantName}, just a friendly reminder that rent of $${amount} for ${unitNumber} is ${daysOverdue > 0 ? `${daysOverdue} days overdue` : 'due soon'}. Please let me know if you need any help with payment options. Thanks!`,
          tone: tone,
          confidence: 60,
          reasoning: 'AI generation failed — using fallback template',
        });
      }
    } catch (err) {
      setError('Failed to generate reminder. Using fallback.');
      setGeneratedMessage({
        message: `Hi ${tenantName}, just a friendly reminder that rent of $${amount} for ${unitNumber} is ${daysOverdue > 0 ? `${daysOverdue} days overdue` : 'due soon'}. Please let me know if you need any help with payment options. Thanks!`,
        tone: 'friendly',
        confidence: 60,
        reasoning: 'Error occurred — using fallback template',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (generatedMessage?.message) {
      navigator.clipboard.writeText(generatedMessage.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSend = () => {
    if (generatedMessage?.message) {
      onSend(generatedMessage.message);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                AI Payment Reminder
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Personalized message for {tenantName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Payment Context */}
          <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Payment Status
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400">Amount:</span>
                <span className="ml-2 font-medium text-slate-900 dark:text-slate-100">
                  ${amount.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400">Overdue:</span>
                <span className={`ml-2 font-medium ${daysOverdue > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                  {daysOverdue > 0 ? `${daysOverdue} days` : 'Not yet'}
                </span>
              </div>
            </div>
          </div>

          {/* Generate Button */}
          {!generatedMessage && !isGenerating && (
            <button
              onClick={generateReminder}
              className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Generate AI Reminder
            </button>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto"></div>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                Analyzing tenant history and generating personalized message...
              </p>
            </div>
          )}

          {/* Generated Message */}
          {generatedMessage && (
            <div className="space-y-4">
              {/* Message Preview */}
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Generated Message
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {generatedMessage.message.length} chars
                    </span>
                    <button
                      onClick={handleCopy}
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                  {generatedMessage.message}
                </p>
              </div>

              {/* AI Reasoning */}
              <div className="flex items-start gap-3 text-sm">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-slate-600 dark:text-slate-300">
                    {generatedMessage.reasoning}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Tone: {generatedMessage.tone}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      Confidence: {generatedMessage.confidence}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={generateReminder}
                  className="flex-1 py-2.5 px-4 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Regenerate
                </button>
                <button
                  onClick={handleSend}
                  className="flex-1 py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium rounded-xl transition-colors"
                >
                  Copy & Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
