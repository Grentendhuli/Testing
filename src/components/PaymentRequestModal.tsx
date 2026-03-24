import { useState } from 'react';
import { X, DollarSign, MessageSquare, CheckCircle, Copy, Calendar, FileText } from 'lucide-react';

interface PaymentRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantName: string;
  unitNumber: string;
  amount: number;
  paymentId?: string;
  month?: string;
  venmoHandle?: string;
  zelleContact?: string;
  cashappTag?: string;
  paypalHandle?: string;
  preferredMethod?: string;
  onMarkPaid?: (paymentId: string, method: string, note?: string) => void;
}

export function PaymentRequestModal({
  isOpen,
  onClose,
  tenantName,
  unitNumber,
  amount,
  paymentId,
  month,
  venmoHandle,
  zelleContact,
  cashappTag,
  paypalHandle,
  preferredMethod = 'venmo',
  onMarkPaid,
}: PaymentRequestModalProps) {
  const [zelleCopied, setZelleCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [buttonClicked, setButtonClicked] = useState(false);
  const [showCashForm, setShowCashForm] = useState(false);
  const [cashNote, setCashNote] = useState('');
  const [cashDate, setCashDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState(preferredMethod);

  if (!isOpen) return null;

  const encodedNote = encodeURIComponent(`Rent Unit ${unitNumber} ${month || ''}`);
  const currentMonth = month || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handleVenmoClick = () => {
    if (!venmoHandle) return;
    const url = `https://venmo.com/${venmoHandle}?txn=pay&amount=${amount}&note=${encodedNote}`;
    window.open(url, '_blank');
    setButtonClicked(true);
  };

  const handleCashAppClick = () => {
    if (!cashappTag) return;
    const url = `https://cash.app/${cashappTag}/${amount}`;
    window.open(url, '_blank');
    setButtonClicked(true);
  };

  const handlePayPalClick = () => {
    if (!paypalHandle) return;
    const url = `https://paypal.me/${paypalHandle}/${amount}`;
    window.open(url, '_blank');
    setButtonClicked(true);
  };

  const handleZelleCopy = () => {
    if (!zelleContact) return;
    const message = `Please send $${amount} via Zelle to ${zelleContact}. Memo: Rent Unit ${unitNumber} ${month || ''}`;
    navigator.clipboard.writeText(message);
    setZelleCopied(true);
    setTimeout(() => setZelleCopied(false), 2000);
  };

  const handleMarkAsPaid = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      if (onMarkPaid && paymentId) {
        await onMarkPaid(paymentId, selectedMethod, showCashForm ? cashNote : undefined);
        setSuccess(true);
        setTimeout(onClose, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasAnyHandle = venmoHandle || zelleContact || cashappTag || paypalHandle;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">
            Request Rent - Unit {unitNumber}
          </h3>
          <p className="text-slate-500 text-sm">
            {tenantName} • ${amount.toLocaleString()}/mo
          </p>
        </div>

        {/* Amount Display */}
        <div className="text-center py-4 border-b border-slate-100 mb-4">
          <p className="text-3xl font-bold text-slate-900">
            ${amount.toLocaleString()}
          </p>
          <p className="text-sm text-slate-500">{currentMonth}</p>
        </div>

        {/* Payment Buttons Section */}
        {hasAnyHandle && (
          <div className="mb-6">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">
              Send Payment Request Via
            </p>

            <div className="space-y-2">
              {/* Venmo */}
              {venmoHandle && (
                <button
                  onClick={handleVenmoClick}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-amber-500 transition-colors bg-white"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg">
                    V
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-slate-900">Venmo</p>
                    <p className="text-xs text-slate-500">@{venmoHandle}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </button>
              )}

              {/* Cash App */}
              {cashappTag && (
                <button
                  onClick={handleCashAppClick}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-amber-500 transition-colors bg-white"
                >
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-lg">
                    $
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-slate-900">Cash App</p>
                    <p className="text-xs text-slate-500">{cashappTag}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </button>
              )}

              {/* PayPal */}
              {paypalHandle && (
                <button
                  onClick={handlePayPalClick}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-amber-500 transition-colors bg-white"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                    P
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-slate-900">PayPal</p>
                    <p className="text-xs text-slate-500">{paypalHandle}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </button>
              )}

              {/* Zelle */}
              {zelleContact && (
                <button
                  onClick={handleZelleCopy}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-amber-500 transition-colors bg-white"
                >
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                    Z
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-slate-900">Zelle</p>
                    <p className="text-xs text-slate-500">{zelleContact}</p>
                  </div>
                  {zelleCopied ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Send via Text */}
        <div className="mb-6">
          <button
            onClick={() => {
              const message = `Hi ${tenantName}, your rent of $${amount} for Unit ${unitNumber} is due. Payment options: ${hasAnyHandle ? 'Venmo, Cash App, PayPal, Zelle' : 'Please contact me for payment options'}.`;
              navigator.clipboard.writeText(message);
              setLinkCopied(true);
              setTimeout(() => setLinkCopied(false), 2000);
            }}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-slate-200 hover:border-amber-500 transition-colors bg-slate-50"
          >
            <MessageSquare className="w-4 h-4 text-slate-600" />
            <span className="text-slate-700 font-medium">Send via Text</span>
            {linkCopied && <span className="text-xs text-green-600 ml-2">✓ Copied</span>}
          </button>
        </div>

        {/* Mark as Paid Section */}
        {paymentId && onMarkPaid && (
          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">
              Or Record Payment
            </p>

            {!showCashForm ? (
              <button
                onClick={() => setShowCashForm(true)}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Mark as Paid
              </button>
            ) : (
              <div className="space-y-3">
                {success && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    ✓ Payment recorded successfully!
                  </div>
                )}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    ✗ {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Payment Method
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['venmo', 'zelle', 'cashapp', 'paypal', 'cash', 'check'].map((method) => (
                      <button
                        key={method}
                        onClick={() => setSelectedMethod(method)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                          selectedMethod === method
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {method.charAt(0).toUpperCase() + method.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={cashDate}
                    onChange={(e) => setCashDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Note (optional)
                  </label>
                  <textarea
                    value={cashNote}
                    onChange={(e) => setCashNote(e.target.value)}
                    placeholder="e.g., Received in person, Check #1234"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCashForm(false)}
                    className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleMarkAsPaid}
                    disabled={isSubmitting}
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white rounded-lg font-medium transition-colors"
                  >
                    {isSubmitting ? 'Recording...' : 'Confirm Payment'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* No handles warning */}
        {!hasAnyHandle && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>No payment handles configured.</strong> Go to Config → Rent Collection Setup to add your Venmo, Zelle, Cash App, or PayPal handles.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ExternalLink icon component
function ExternalLink({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      width="16"
      height="16"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}
