import { useState, useMemo, useCallback } from 'react';
import { DollarSign, Calendar, AlertTriangle, CheckCircle, Clock, Download, Filter, TrendingUp, CreditCard, Home, ChevronDown, ChevronUp, X, Plus, Send, Sparkles } from 'lucide-react';
import { ComplianceFooter } from '../components/ComplianceFooter';
import { PaymentRequestModal } from '../components/PaymentRequestModal';
import { SmartReminderModal } from '../components/SmartReminderModal';
import { useApp } from '../context/AppContext';
import { useAuth } from '@/features/auth';
import { useFormatDate } from '../hooks';
import { Payment, PaymentMethod, PaymentStatus } from '../types';
import { sendRentReceiptEmail } from '../services/sendgrid';

const statusConfig = {
  paid: { label: '✓ Paid', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
  pending: { label: '⏳ Due Soon', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  failed: { label: '✗ Failed', color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: AlertTriangle },
  late: { label: '⚠️ Late', color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: AlertTriangle },
  overdue: { label: '⚠️ Overdue', color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: AlertTriangle },
  cancelled: { label: '— Cancelled', color: 'text-slate-500', bg: 'bg-slate-100 border-slate-200', icon: X },
};

const methodLabels: Record<PaymentMethod, string> = {
  cash: 'Cash',
  check: 'Check',
  bank_transfer: 'Bank Transfer',
  online: 'Online Payment',
  zelle: 'Zelle',
  venmo: 'Venmo',
  other: 'Other',
};

// Helper to get initials from name
function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

// Helper to get avatar background color based on first letter
function getAvatarColor(name: string): string {
  const firstLetter = name.charAt(0).toUpperCase();
  if ('ABCDEF'.includes(firstLetter)) return 'bg-blue-100 text-slate-700';
  if ('GHIJKL'.includes(firstLetter)) return 'bg-green-100 text-slate-700';
  if ('MNOPQR'.includes(firstLetter)) return 'bg-amber-100 text-slate-700';
  return 'bg-purple-100 text-slate-700';
}

export function RentCollection() {
  const { units, payments, addPayment, updatePayment } = useApp();
  const { userData } = useAuth();
  const { formatDate } = useFormatDate();
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'all' | 'overdue'>('all');
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showRecordModal, setShowRecordModal] = useState(false);
  
  // Payment Request Modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentForRequest, setSelectedPaymentForRequest] = useState<Payment | null>(null);
  
  // Smart Reminder Modal state
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [selectedPaymentForReminder, setSelectedPaymentForReminder] = useState<Payment | null>(null);

  // Form state for recording payment
  const [newPayment, setNewPayment] = useState({
    unitId: '',
    unitNumber: '',
    tenantName: '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    method: 'online' as PaymentMethod,
    status: 'paid' as PaymentStatus,
    notes: '',
  });

  // Convert payments to display format - memoized
  const rentRecords = useMemo(() => 
    payments.map(payment => ({
      id: payment.id,
      unitNumber: payment.unitNumber,
      tenantName: payment.tenantName,
      amount: payment.amount,
      dueDate: payment.dueDate,
      paidDate: payment.status === 'paid' ? payment.paymentDate : undefined,
      status: payment.status === 'late' ? 'overdue' : payment.status === 'pending' ? 'pending' : 'paid',
      method: payment.method,
      notes: payment.notes,
    })) as any[],
    [payments]
  );

  const filteredRecords = useMemo(() => 
    filterStatus === 'all' 
      ? rentRecords 
      : rentRecords.filter(r => {
          if (filterStatus === 'overdue') return r.status === 'overdue' || r.status === 'late';
          return r.status === filterStatus;
        }),
    [rentRecords, filterStatus]
  );

  // Current month for calculations
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const { totalExpected, totalCollected, outstanding, lateFees } = useMemo(() => {
    const totalExpected = units.reduce((sum, u) => sum + u.rentAmount, 0);
    
    const totalCollected = payments
      .filter(p => p.paymentDate?.startsWith(currentMonth) && p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const outstanding = totalExpected - payments
      .filter(p => p.paymentDate?.startsWith(currentMonth) && p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const lateFees = payments
      .filter(p => p.paymentDate?.startsWith(currentMonth) && p.status === 'late')
      .reduce((sum, p) => sum + p.amount * 0.05, 0); // 5% late fee

    return { totalExpected, totalCollected, outstanding, lateFees };
  }, [units, payments, currentMonth]);

  const groupedByMonth = useMemo(() => 
    filteredRecords.reduce((groups, record) => {
      const date = new Date(record.dueDate);
      const monthKey = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[monthKey]) groups[monthKey] = [];
      groups[monthKey].push(record);
      return groups;
    }, {} as Record<string, typeof rentRecords>),
    [filteredRecords]
  );

  const handleRecordPayment = async () => {
    if (!newPayment.unitId || !newPayment.amount) return;
    
    const unit = units.find(u => u.id === newPayment.unitId);
    if (!unit) return;

    const paymentAmount = parseFloat(newPayment.amount);
    
    addPayment({
      unitId: unit.id,
      unitNumber: unit.unitNumber,
      tenantId: unit.tenant?.id,
      tenantName: unit.tenant?.name || 'Vacant',
      amount: paymentAmount,
      paymentDate: newPayment.paymentDate,
      dueDate: newPayment.dueDate || newPayment.paymentDate,
      method: newPayment.method,
      status: newPayment.status,
      createdAt: new Date().toISOString(),
      notes: newPayment.notes,
    });

    // Send rent receipt email if payment is marked as paid and tenant has email
    if (newPayment.status === 'paid' && unit.tenant?.email) {
      try {
        const methodLabels: Record<PaymentMethod, string> = {
          cash: 'Cash',
          check: 'Check',
          bank_transfer: 'Bank Transfer',
          online: 'Online Payment',
          zelle: 'Zelle',
          venmo: 'Venmo',
          other: 'Other',
        };

        await sendRentReceiptEmail(unit.tenant.email, {
          tenantName: unit.tenant.name || 'Tenant',
          unitNumber: unit.unitNumber,
          amount: paymentAmount,
          paymentDate: newPayment.paymentDate,
          paymentMethod: methodLabels[newPayment.method] || newPayment.method,
          receiptNumber: `RCP-${Date.now()}`,
        });
        console.log('[RentCollection] Rent receipt email sent to:', unit.tenant.email);
      } catch (emailError) {
        console.error('[RentCollection] Failed to send rent receipt email:', emailError);
        // Don't fail payment recording if email fails
      }
    }

    setShowRecordModal(false);
    setNewPayment({
      unitId: '',
      unitNumber: '',
      tenantName: '',
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      method: 'online',
      status: 'paid',
      notes: '',
    });
  };

  const exportCSV = () => {
    const headers = ['Date', 'Unit', 'Tenant', 'Amount', 'Status', 'Method'];
    const rows = payments.map(p => [
      p.paymentDate,
      p.unitNumber,
      p.tenantName,
      p.amount.toString(),
      p.status,
      methodLabels[p.method || 'other'],
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'rent-collection.csv';
    a.click();
  };

  const [showCelebration, setShowCelebration] = useState(true);

  // Memoized event handlers
  const handleDismissCelebration = useCallback(() => setShowCelebration(false), []);
  const handleOpenRecordModal = useCallback(() => setShowRecordModal(true), []);
  const handleCloseRecordModal = useCallback(() => {
    setShowRecordModal(false);
    setNewPayment({
      unitId: '',
      unitNumber: '',
      tenantName: '',
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      method: 'online' as PaymentMethod,
      status: 'paid' as PaymentStatus,
      notes: '',
    });
  }, []);

  // Calculate collection rate for celebration banner
  const currentMonthPayments = payments.filter(p => 
    p.paymentDate?.startsWith(currentMonth) && (p.status === 'paid' || p.status === 'pending')
  );
  const paidThisMonth = currentMonthPayments.filter(p => p.status === 'paid').length;
  // Guard against divide-by-zero
  const totalDuePayments = currentMonthPayments.length || 1;
  const collectionRate = (paidThisMonth / totalDuePayments) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-lb-text-primary">Rent Collection</h1>
          <p className="text-lb-text-secondary mt-1">Track rent payments, due dates, and late fees</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={exportCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-lb-muted hover:bg-slate-200 text-lb-text-secondary rounded-lg text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <button 
            onClick={handleOpenRecordModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium rounded-lg transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            Record Payment
          </button>
        </div>
      </div>

      {/* Celebration Banner */}
      {collectionRate === 100 && showCelebration && currentMonthPayments.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎉</span>
            <span className="text-sm font-medium text-green-700">All rent collected this month. Great work!</span>
          </div>
          <button 
            onClick={handleDismissCelebration}
            className="p-1 text-green-600 hover:text-green-800 transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-lb-surface border border-lb-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-sm text-lb-text-secondary">Collected (Feb)</span>
          </div>
          <p className="text-2xl font-bold text-emerald-400">${totalCollected.toLocaleString()}</p>
        </div>

        <div className="bg-lb-surface border border-lb-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <span className="text-sm text-lb-text-secondary">Outstanding</span>
          </div>
          <p className="text-2xl font-bold text-amber-400">${outstanding.toLocaleString()}</p>
        </div>

        <div className="bg-lb-surface border border-lb-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-sm text-lb-text-secondary">Late Fees</span>
          </div>
          <p className="text-2xl font-bold text-red-400">${lateFees.toLocaleString()}</p>
        </div>

        <div className="bg-lb-surface border border-lb-border rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Home className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-sm text-lb-text-secondary">Expected (Feb)</span>
          </div>
          <p className="text-2xl font-bold text-lb-text-primary">${totalExpected.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-lb-text-muted" />
        {(['all', 'paid', 'pending', 'overdue'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === status
                ? 'bg-amber-500 text-slate-950'
                : 'bg-lb-muted text-lb-text-secondary hover:text-slate-800'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Rent Records by Month */}
      <div className="space-y-4">
        {Object.entries(groupedByMonth).length === 0 ? (
          <div className="bg-lb-surface border border-lb-border rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-lb-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-lb-text-secondary" />
            </div>
            <h3 className="text-lg font-medium text-lb-text-secondary mb-2">No payment records yet</h3>
            <p className="text-lb-text-muted mb-6 max-w-md mx-auto">
              Add your first payment to start tracking. We'll help you monitor cash flow and spot late payments.
            </p>
            <button 
              onClick={() => setShowRecordModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Record Your First Payment
            </button>
          </div>
        ) : (
          (Object.entries(groupedByMonth) as [string, any[]][]).map(([month, records]) => (
            <div key={month} className="bg-lb-surface border border-lb-border rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedMonth(expandedMonth === month ? null : month)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-lb-base transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-amber-400" />
                  <span className="font-medium text-slate-800">{month}</span>
                  <span className="text-sm text-lb-text-muted">({records.length} records)</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-lb-text-secondary">
                    Total: <span className="text-amber-400 font-semibold">
                      ${records.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
                    </span>
                  </span>
                  {expandedMonth === month ? <ChevronUp className="w-5 h-5 text-lb-text-muted" /> : <ChevronDown className="w-5 h-5 text-lb-text-muted" />}
                </div>
              </button>

              {expandedMonth === month && (
                <div className="border-t border-lb-border">
                  <div className="divide-y divide-lb-border">
                    {records.map((record) => {
                      const statusKey = record.status as keyof typeof statusConfig;
                      const StatusIcon = statusConfig[statusKey]?.icon || Clock;
                      return (
                        <div
                          key={record.id}
                          onClick={() => setSelectedPayment(payments.find(p => p.id === record.id) || null)}
                          className="px-6 py-4 flex items-center justify-between hover:bg-amber-50/50 cursor-pointer transition-colors duration-150"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-lb-muted rounded-lg flex items-center justify-center">
                              <span className="text-lb-text-secondary font-medium">{record.unitNumber}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {/* Tenant Avatar */}
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${getAvatarColor(record.tenantName || '')}`}>
                                {getInitials(record.tenantName || '')}
                              </div>
                              <div>
                                <p className="font-medium text-lb-text-primary">{record.tenantName}</p>
                                <p className="text-sm text-lb-text-muted">Due: {formatDate(record.dueDate)}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className="font-semibold text-slate-800">${record.amount.toLocaleString()}</p>
                            </div>

                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${statusConfig[statusKey]?.bg || 'bg-lb-base0/10 border-slate-500/20'} ${statusConfig[statusKey]?.color || 'text-lb-text-secondary'}`}>
                              <StatusIcon className="w-4 h-4" />
                              {statusConfig[statusKey]?.label || record.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Payment Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-lb-muted/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-lb-surface border border-lb-border rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-lb-border flex items-center justify-between">
              <h2 className="text-xl font-semibold text-lb-text-primary">Payment Details</h2>
              <button 
                onClick={() => setSelectedPayment(null)}
                className="p-1 text-lb-text-muted hover:text-lb-text-secondary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-4 bg-lb-base rounded-lg">
                <span className="text-lb-text-secondary">Unit</span>
                <span className="font-semibold text-lb-text-primary">{selectedPayment.unitNumber}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-lb-base rounded-lg">
                <span className="text-lb-text-secondary">Tenant</span>
                <span className="font-semibold text-lb-text-primary">{selectedPayment.tenantName}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-500/30 rounded-lg">
                <span className="text-lb-text-secondary">Amount</span>
                <span className="font-bold text-amber-400">${selectedPayment.amount.toLocaleString()}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-lb-base rounded-lg">
                  <p className="text-sm text-lb-text-muted">Payment Date</p>
                  <p className="font-medium text-slate-800">{formatDate(selectedPayment.paymentDate || '')}</p>
                </div>
                <div className="p-3 bg-lb-base rounded-lg">
                  <p className="text-sm text-lb-text-muted">Due Date</p>
                  <p className="font-medium text-slate-800">{formatDate(selectedPayment.dueDate)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-lb-base rounded-lg">
                <span className="text-lb-text-secondary">Payment Method</span>
                <span className="font-medium text-lb-text-primary">{methodLabels[selectedPayment.method || 'other']}</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-lb-base rounded-lg">
                <span className="text-lb-text-secondary">Status</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border ${statusConfig[selectedPayment.status]?.bg || 'bg-lb-base0/10 border-slate-500/20'} ${statusConfig[selectedPayment.status]?.color || 'text-lb-text-secondary'}`}>
                  {(() => {
                    const config = statusConfig[selectedPayment.status as keyof typeof statusConfig];
                    if (!config?.icon) return null;
                    const IconComponent = config.icon;
                    return <IconComponent className="w-4 h-4" />;
                  })()}
                  {statusConfig[selectedPayment.status as keyof typeof statusConfig]?.label || selectedPayment.status}
                </span>
              </div>

              {selectedPayment.notes && (
                <div className="p-4 bg-lb-base rounded-lg">
                  <p className="text-sm text-lb-text-muted mb-1">Notes</p>
                  <p className="text-sm text-lb-text-secondary">{selectedPayment.notes}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setSelectedPayment(null)}
                  className="flex-1 px-4 py-2 bg-lb-muted hover:bg-slate-200 text-lb-text-secondary rounded-lg transition-colors"
                >
                  Close
                </button>
                {selectedPayment.status !== 'paid' && (
                  <>
                    <button 
                      onClick={() => {
                        // Update payment status to paid
                        if (selectedPayment.id) {
                          updatePayment(selectedPayment.id, { 
                            status: 'paid',
                            paymentDate: new Date().toISOString().split('T')[0]
                          });
                        }
                        setSelectedPayment(null);
                      }}
                      className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-medium rounded-lg transition-colors"
                    >
                      Mark as Paid
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedPaymentForReminder(selectedPayment);
                        setReminderModalOpen(true);
                        setSelectedPayment(null);
                      }}
                      className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      AI Reminder
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedPaymentForRequest(selectedPayment);
                        setPaymentModalOpen(true);
                        setSelectedPayment(null);
                      }}
                      className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Request
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showRecordModal && (
        <div className="fixed inset-0 bg-lb-muted/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-lb-surface border border-lb-border rounded-xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-lb-border flex items-center justify-between">
              <h2 className="text-xl font-semibold text-lb-text-primary">Record Payment</h2>
              <button 
                onClick={handleCloseRecordModal}
                className="p-2 text-lb-text-muted hover:text-lb-text-secondary hover:bg-lb-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Unit Selection */}
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-2">Unit *</label>
                <select
                  value={newPayment.unitId}
                  onChange={(e) => {
                    const unit = units.find(u => u.id === e.target.value);
                    setNewPayment({
                      ...newPayment,
                      unitId: e.target.value,
                      unitNumber: unit?.unitNumber || '',
                      tenantName: unit?.tenant?.name || 'Vacant',
                      amount: unit?.rentAmount?.toString() || '',
                    });
                  }}
                  className="w-full px-3 py-2.5 bg-lb-muted border border-lb-border rounded-lg text-slate-800 focus:outline-none focus:border-amber-500/50"
                >
                  <option value="">Select a unit</option>
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.unitNumber} - {unit.tenant?.name || 'Vacant'} (${unit.rentAmount}/mo)
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-2">Amount *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lb-text-muted">$</span>
                  <input
                    type="number"
                    value={newPayment.amount === '0' ? '' : newPayment.amount}
                    onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value);
                      if (isNaN(value) || value < 0) {
                        setNewPayment({ ...newPayment, amount: '' });
                      }
                    }}
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-2.5 bg-lb-muted border border-lb-border rounded-lg text-lb-text-primary focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-lb-text-secondary mb-2">Payment Date *</label>
                  <input
                    type="date"
                    value={newPayment.paymentDate}
                    onChange={(e) => setNewPayment({ ...newPayment, paymentDate: e.target.value })}
                    className="w-full px-3 py-2.5 bg-lb-muted border border-lb-border rounded-lg text-slate-800 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-lb-text-secondary mb-2">Due Date *</label>
                  <input
                    type="date"
                    value={newPayment.dueDate}
                    onChange={(e) => setNewPayment({ ...newPayment, dueDate: e.target.value })}
                    className="w-full px-3 py-2.5 bg-lb-muted border border-lb-border rounded-lg text-slate-800 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              {/* Method & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-lb-text-secondary mb-2">Payment Method</label>
                  <select
                    value={newPayment.method}
                    onChange={(e) => setNewPayment({ ...newPayment, method: e.target.value as PaymentMethod })}
                    className="w-full px-3 py-2.5 bg-lb-muted border border-lb-border rounded-lg text-slate-800 focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="online">Online Payment</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="cash">Cash</option>
                    <option value="zelle">Zelle</option>
                    <option value="venmo">Venmo</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-lb-text-secondary mb-2">Status</label>
                  <select
                    value={newPayment.status}
                    onChange={(e) => setNewPayment({ ...newPayment, status: e.target.value as PaymentStatus })}
                    className="w-full px-3 py-2.5 bg-lb-muted border border-lb-border rounded-lg text-slate-800 focus:outline-none focus:border-amber-500/50"
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="late">Late</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-2">Notes</label>
                <textarea
                  value={newPayment.notes}
                  onChange={(e) => setNewPayment({ ...newPayment, notes: e.target.value })}
                  placeholder="Add any notes about this payment..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-lb-muted border border-lb-border rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleCloseRecordModal}
                  className="flex-1 px-4 py-2.5 bg-lb-muted hover:bg-slate-200 text-lb-text-secondary rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecordPayment}
                  disabled={!newPayment.unitId || !newPayment.amount}
                  className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-lb-text-muted text-slate-950 font-medium rounded-lg transition-colors"
                >
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Request Modal */}
      {selectedPaymentForRequest && (
        <PaymentRequestModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedPaymentForRequest(null);
          }}
          tenantName={selectedPaymentForRequest.tenantName || 'Tenant'}
          unitNumber={selectedPaymentForRequest.unitNumber || 'Unknown'}
          amount={selectedPaymentForRequest.amount}
          paymentId={selectedPaymentForRequest.id}
          venmoHandle={userData?.venmo_handle || ''}
          zelleContact={userData?.zelle_contact || ''}
          cashappTag={userData?.cashapp_tag || ''}
          paypalHandle={userData?.paypal_handle || ''}
          preferredMethod={userData?.preferred_payment_method || 'venmo'}
          onMarkPaid={(paymentId, method, note) => {
            updatePayment(paymentId, {
              status: 'paid',
              paymentDate: new Date().toISOString().split('T')[0],
              method: method as PaymentMethod,
              notes: note,
            });
          }}
        />
      )}

      {/* Smart Reminder Modal */}
      {selectedPaymentForReminder && (
        <SmartReminderModal
          isOpen={reminderModalOpen}
          onClose={() => {
            setReminderModalOpen(false);
            setSelectedPaymentForReminder(null);
          }}
          payment={selectedPaymentForReminder}
          tenantName={selectedPaymentForReminder.tenantName || 'Tenant'}
          unitNumber={selectedPaymentForReminder.unitNumber || 'Unknown'}
          amount={selectedPaymentForReminder.amount}
          daysOverdue={selectedPaymentForReminder.dueDate 
            ? Math.max(0, Math.ceil((new Date().getTime() - new Date(selectedPaymentForReminder.dueDate).getTime()) / (1000 * 60 * 60 * 24)))
            : 0}
          onSend={(message) => {
            // Message is copied to clipboard, user can paste into Telegram/SMS
            console.log('[SmartReminder] Generated message:', message);
          }}
        />
      )}

      <ComplianceFooter />
    </div>
  );
}

