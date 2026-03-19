import { useState, useEffect } from 'react';
import { FileText, Calendar, AlertTriangle, CheckCircle, Clock, User, Plus, Download, ChevronDown, ChevronUp, Bell, X, Building, RefreshCw, PenTool, MessageSquare, DollarSign } from 'lucide-react';
import { ComplianceFooter } from '../components/ComplianceFooter';
import { TenantConnectCard } from '../components/TenantConnectCard';
import { PaymentRequestModal } from '../components/PaymentRequestModal';
import { DocumentSigning, DocumentStatusTracker, SignedDocumentsList } from '../components/DocumentSigning';
import { PhoneInput } from '../components/PhoneInput';
import { isDocuSealConfigured } from '../services/docuseal';
import { useApp } from '../context/AppContext';
import { useAuth } from '@/features/auth';
import { useFormatDate } from '../hooks';
import { useLeaseRenewalCalendar, useGoogleCalendarStatus } from '../hooks/useGoogleCalendar';
import type { LeaseStatus, LeaseType } from '../types';
import { useSearchParams } from 'react-router-dom';

const statusConfig = {
  active: { label: '● Active', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle, dot: 'bg-emerald-500' },
  expiring: { label: '◐ Expiring Soon', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: Clock, dot: 'bg-amber-500' },
  expired: { label: '○ Expired', color: 'text-slate-500', bg: 'bg-slate-100 border-slate-200', icon: AlertTriangle, dot: 'bg-slate-400' },
  renewed: { label: '● Renewed', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: FileText, dot: 'bg-blue-500' },
  terminated: { label: '✗ Terminated', color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: AlertTriangle, dot: 'bg-red-500' },
  pending: { label: '◌ Pending', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200', icon: Clock, dot: 'bg-purple-500' },
};

function getDaysUntilExpiry(endDate: string): number {
  const end = new Date(endDate);
  const now = new Date();
  // Guard against invalid dates
  if (isNaN(end.getTime())) return 0;
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

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

export function Leases() {
  const { leases, units, addLease, updateLease } = useApp();
  const { userData } = useAuth();
  const { formatDate } = useFormatDate();
  const { isConnected: isCalendarConnected } = useGoogleCalendarStatus();
  const { isCreating, createRenewalReminder } = useLeaseRenewalCalendar();
  const [searchParams, setSearchParams] = useSearchParams();
  const [expandedLease, setExpandedLease] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<LeaseStatus | 'all'>('all');
  const [showNewLeaseModal, setShowNewLeaseModal] = useState(false);
  const [creatingReminderFor, setCreatingReminderFor] = useState<string | null>(null);
  const [inviteLease, setInviteLease] = useState<typeof leases[0] | null>(null);
  const botUsername = userData?.bot_phone_number || '';
  
  // Payment Request Modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedLeaseForPayment, setSelectedLeaseForPayment] = useState<typeof leases[0] | null>(null);

  // New lease form state
  const [newLease, setNewLease] = useState({
    unitId: '',
    unitNumber: '',
    tenantName: '',
    tenantPhone: '',
    tenantEmail: '',
    startDate: '',
    endDate: '',
    rentAmount: '',
    securityDeposit: '',
    leaseType: 'free-market' as LeaseType,
    status: 'active' as LeaseStatus,
    notes: '',
  });

  const filteredLeases = filterStatus === 'all'
    ? leases
    : leases.filter(l => l.status === filterStatus);

  const activeCount = leases.filter(l => l.status === 'active').length;
  const expiringCount = leases.filter(l => l.status === 'expiring').length;
  const expiredCount = leases.filter(l => l.status === 'expired').length;

  const handleCreateLease = () => {
    if (!newLease.unitId || !newLease.tenantName || !newLease.startDate || !newLease.endDate) return;

    const unit = units.find(u => u.id === newLease.unitId);
    if (!unit) return;

    const lease = addLease({
      unitId: unit.id,
      unitNumber: unit.unitNumber,
      tenantName: newLease.tenantName,
      tenantPhone: newLease.tenantPhone,
      tenantEmail: newLease.tenantEmail,
      startDate: newLease.startDate,
      endDate: newLease.endDate,
      rentAmount: parseFloat(newLease.rentAmount) || unit.rentAmount,
      securityDeposit: parseFloat(newLease.securityDeposit) || unit.rentAmount,
      leaseType: newLease.leaseType,
      status: newLease.status,
      notes: newLease.notes,
    });

    setShowNewLeaseModal(false);
    setNewLease({
      unitId: '',
      unitNumber: '',
      tenantName: '',
      tenantPhone: '',
      tenantEmail: '',
      startDate: '',
      endDate: '',
      rentAmount: '',
      securityDeposit: '',
      leaseType: 'free-market',
      status: 'active',
      notes: '',
    });

    // Auto-create renewal reminder if calendar is connected
    // Note: addLease returns Promise<void>, so we can't get the lease ID here
    // The reminder should be set after the lease is created and ID is known
    if (isCalendarConnected) {
      // TODO: Get the newly created lease ID from the leases array after refresh
      console.log('Calendar connected - would set renewal reminder');
    }
  };

  useEffect(() => {
    const unitId = searchParams.get('unitId');
    if (!unitId) return;

    const action = searchParams.get('action');
    const unit = units.find(u => u.id === unitId);

    setNewLease(prev => ({
      ...prev,
      unitId,
      unitNumber: unit?.unitNumber || prev.unitNumber,
      rentAmount: unit ? String(unit.rentAmount) : prev.rentAmount,
      securityDeposit: unit ? String(unit.rentAmount) : prev.securityDeposit,
      leaseType: action === 'renewal' ? 'renewal' : prev.leaseType,
    }));
    setShowNewLeaseModal(true);

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('unitId');
    nextParams.delete('action');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams, units]);

  // Handle setting renewal reminder
  const handleSetRenewalReminder = async (leaseId: string) => {
    const lease = leases.find(l => l.id === leaseId);
    if (!lease) return;

    setCreatingReminderFor(leaseId);
    
    const unit = units.find(u => u.id === lease.unitId);
    
    await createRenewalReminder({
      tenantName: lease.tenantName,
      unitNumber: lease.unitNumber,
      leaseEndDate: lease.endDate,
      location: unit?.address,
      leaseId: lease.id,
    });

    setCreatingReminderFor(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-lb-text-primary">Lease Management</h1>
          <p className="text-lb-text-secondary mt-1">Track lease terms, expirations, and renewals</p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-lb-muted hover:bg-slate-200 text-lb-text-secondary rounded-lg text-sm font-medium transition-colors">
            <Download className="w-4 h-4" />
            Export Leases
          </button>
          <button
            onClick={() => setShowNewLeaseModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Lease
          </button>
        </div>
      </div>

      {/* Alerts */}
      {expiringCount > 0 && (
        <div className="bg-amber-50 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Bell className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-amber-400">{expiringCount} lease(s) expiring soon</p>
            <p className="text-sm text-lb-text-secondary mt-1">
              Review renewal notices and tenant communications. NYC requires 60-90 day notice for renewals under Good Cause Eviction.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">{activeCount}</p>
              <p className="text-sm text-lb-text-muted">Active Leases</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-400">{expiringCount}</p>
              <p className="text-sm text-lb-text-muted">Expiring Soon</p>
            </div>
          </div>
        </div>

        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-400">{expiredCount}</p>
              <p className="text-sm text-lb-text-muted">Expired</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-lb-text-muted">Filter:</span>
        {(['all', 'active', 'expiring', 'expired'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === status
                ? 'bg-amber-500 text-slate-950'
                : 'bg-lb-muted text-lb-text-secondary hover:text-lb-text-primary'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Document Signing Overview */}
      {isDocuSealConfigured() && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DocumentStatusTracker
            leases={leases}
            templateId={(import.meta as any).env.VITE_DOCUSEAL_LEASE_TEMPLATE_ID || 'default-lease-template'}
            landlordEmail={(import.meta as any).env.VITE_LANDLORD_EMAIL || 'landlord@example.com'}
            landlordName="Property Manager"
          />
          <SignedDocumentsList leases={leases} />
        </div>
      )}

      {/* Leases List */}
      <div className="space-y-4">
        {filteredLeases.length === 0 ? (
          <div className="bg-lb-surface border border-lb-border rounded-xl p-12 text-center">
            <div className="w-16 h-16 bg-lb-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Building className="w-8 h-8 text-lb-text-secondary" />
            </div>
            <h3 className="text-lg font-medium text-lb-text-secondary mb-2">No leases yet</h3>
            <p className="text-lb-text-muted mb-6 max-w-md mx-auto">
              {filterStatus === 'all'
                ? "Add a lease to start tracking your tenants. We'll help you keep track of agreements, rent amounts, and renewal dates."
                : `No ${filterStatus} leases found.`}
            </p>
            <button
              onClick={() => setShowNewLeaseModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Your First Lease
            </button>
          </div>
        ) : (
          filteredLeases.map((lease) => {
            const daysLeft = getDaysUntilExpiry(lease.endDate);
            const StatusIcon = statusConfig[lease.status].icon;
            const isExpanded = expandedLease === lease.id;

            return (
              <div
                key={lease.id}
                className="bg-lb-surface border border-lb-border rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setExpandedLease(isExpanded ? null : lease.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-amber-50/50 transition-colors duration-150 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-lb-muted rounded-lg flex items-center justify-center">
                      <span className="text-lb-text-secondary font-semibold">{lease.unitNumber}</span>
                    </div>
                    <div className="text-left flex items-center gap-3">
                      {/* Tenant Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${getAvatarColor(lease.tenantName)}`}>
                        {getInitials(lease.tenantName)}
                      </div>
                      <div>
                        <p className="font-medium text-lb-text-primary">{lease.tenantName}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border ${statusConfig[lease.status].bg} ${statusConfig[lease.status].color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusConfig[lease.status].label}
                          </span>
                          {daysLeft <= 30 && daysLeft > 0 && (
                            <span className="text-xs text-amber-600 italic">Expires in {daysLeft} days — consider reaching out</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-slate-800">${lease.rentAmount.toLocaleString()}/mo</p>
                      <p className="text-sm text-lb-text-muted">Until {formatDate(lease.endDate)}</p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-lb-text-muted" /> : <ChevronDown className="w-5 h-5 text-lb-text-muted" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-lb-border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="space-y-4">
                        <div className="p-4 bg-lb-base rounded-lg">
                          <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                            <User className="w-4 h-4 text-lb-text-secondary" />
                            Tenant Information
                          </h4>
                          <div className="space-y-2 text-sm">
                            <p className="text-lb-text-secondary"><span className="text-lb-text-muted">Name:</span> {lease.tenantName}</p>
                            <p className="text-lb-text-secondary"><span className="text-lb-text-muted">Phone:</span> {lease.tenantPhone}</p>
                            <p className="text-lb-text-secondary"><span className="text-lb-text-muted">Email:</span> {lease.tenantEmail}</p>
                          </div>
                        </div>

                        <div className="p-4 bg-lb-base rounded-lg">
                          <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-lb-text-secondary" />
                            Lease Dates
                          </h4>
                          <div className="space-y-2 text-sm">
                            <p className="text-lb-text-secondary"><span className="text-lb-text-muted">Start:</span> {formatDate(lease.startDate)}</p>
                            <p className="text-lb-text-secondary"><span className="text-lb-text-muted">End:</span> {formatDate(lease.endDate)}</p>
                            {lease.renewalNoticeSent && (
                              <p className="text-amber-400"><span className="text-amber-500">Renewal Notice Sent:</span> {formatDate(lease.renewalNoticeSent)}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                          <h4 className="font-medium text-lb-text-primary mb-3">Financial</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-lb-text-secondary">Monthly Rent</span>
                              <span className="font-medium text-slate-800">${lease.rentAmount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-lb-text-secondary">Security Deposit</span>
                              <span className="font-medium text-slate-800">${lease.securityDeposit.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {lease.notes && (
                          <div className="p-4 bg-lb-base rounded-lg">
                            <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-lb-text-secondary" />
                              Notes
                            </h4>
                            <p className="text-sm text-lb-text-secondary">{lease.notes}</p>
                          </div>
                        )}

                        {/* Document Signing Section */}
                        {isDocuSealConfigured() && (
                          <div className="p-4 bg-lb-base rounded-lg border border-lb-border">
                            <h4 className="font-medium text-slate-800 mb-3 flex items-center gap-2">
                              <PenTool className="w-4 h-4 text-lb-text-secondary" />
                              Digital Signature
                            </h4>
                            <DocumentSigning
                              lease={lease}
                              templateId={(import.meta as any).env.VITE_DOCUSEAL_LEASE_TEMPLATE_ID || 'default-lease-template'}
                              landlordEmail={(import.meta as any).env.VITE_LANDLORD_EMAIL || 'landlord@example.com'}
                              landlordName="Property Manager"
                              onStatusChange={(status) => {
                                console.log('Document status changed:', status);
                              }}
                            />
                          </div>
                        )}

                        <div className="flex gap-2">
                          <button 
                            className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!!lease.renewalNoticeSent}
                            onClick={async () => {
                              if (lease.id) {
                                await updateLease(lease.id, { 
                                  renewalNoticeSent: new Date().toISOString(),
                                  status: 'expiring'
                                });
                                // Show success feedback
                                alert(`Renewal notice recorded for ${lease.tenantName}. A copy has been logged for your records.`);
                              }
                            }}
                          >
                            {lease.renewalNoticeSent ? 'Notice Sent ✓' : 'Send Renewal Notice'}
                          </button>
                          <button className="px-4 py-2 bg-lb-muted hover:bg-lb-base text-lb-text-secondary rounded-lg transition-colors text-sm"
                            onClick={() => {
                              // Generate a simple lease summary view
                              const leaseSummary = `
LEASE AGREEMENT SUMMARY
------------------------
Tenant: ${lease.tenantName}
Unit: ${lease.unitNumber}
Lease Period: ${formatDate(lease.startDate)} - ${formatDate(lease.endDate)}
Monthly Rent: $${lease.rentAmount.toLocaleString()}
Security Deposit: $${lease.securityDeposit.toLocaleString()}
Lease Type: ${lease.leaseType}
Status: ${lease.status}
${lease.renewalNoticeSent ? `Renewal Notice Sent: ${formatDate(lease.renewalNoticeSent)}` : ''}
                              `.trim();
                              
                              // Open in a new window or show alert with summary
                              const newWindow = window.open('', '_blank', 'width=600,height=400');
                              if (newWindow) {
                                newWindow.document.write(`
                                  <html>
                                    <head>
                                      <title>Lease Document - ${lease.tenantName}</title>
                                      <style>
                                        body { font-family: system-ui, sans-serif; padding: 40px; line-height: 1.6; }
                                        pre { background: #f5f5f5; padding: 20px; border-radius: 8px; overflow-x: auto; }
                                        h1 { color: #1E3A5F; }
                                        .print-btn { margin-top: 20px; padding: 10px 20px; background: #1E3A5F; color: white; border: none; border-radius: 6px; cursor: pointer; }
                                        .print-btn:hover { background: #152942; }
                                      </style>
                                    </head>
                                    <body>
                                      <h1>Lease Agreement Summary</h1>
                                      <pre>${leaseSummary}</pre>
                                      <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
                                    </body>
                                  </html>
                                `);
                                newWindow.document.close();
                              } else {
                                alert('Please allow popups to view the lease document.\n\n' + leaseSummary);
                              }
                            }}
                          >
                            View Document
                          </button>
                        </div>

                        {/* Tenant Connect Card Button */}
                        <button
                          onClick={() => setInviteLease(lease)}
                          className="w-full px-4 py-2 border border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4" />
                          📲 Tenant Connect Card
                        </button>

                        {/* Request Payment Button - Only for active leases */}
                        {lease.status === 'active' && (
                          <button
                            onClick={() => {
                              setSelectedLeaseForPayment(lease);
                              setPaymentModalOpen(true);
                            }}
                            className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                          >
                            <DollarSign className="w-4 h-4" />
                            Request Payment
                          </button>
                        )}

                        {/* Set Renewal Reminder Button */}
                        {isCalendarConnected && lease.status === 'active' && (
                          <button
                            onClick={() => handleSetRenewalReminder(lease.id!)}
                            disabled={creatingReminderFor === lease.id}
                            className="w-full px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                          >
                            {creatingReminderFor === lease.id ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Creating Reminder...
                              </>
                            ) : (
                              <>
                                <Bell className="w-4 h-4" />
                                Set Calendar Reminder (60 days before)
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Compliance Note */}
      <div className="bg-lb-surface border border-lb-border rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-lb-text-secondary">
            <p className="text-lb-text-secondary font-medium">NYC Good Cause Eviction Notice Requirements</p>
            <p className="mt-1">
              Under NYC's Good Cause Eviction law, landlords must provide 60-90 days written notice before lease expiration
              if they do not intend to renew. Failure to provide proper notice may result in automatic lease renewal.
            </p>
          </div>
        </div>
      </div>

      {showNewLeaseModal && (
        <div className="fixed inset-0 bg-lb-muted/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-lb-surface border border-lb-border rounded-xl max-w-lg w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-lb-border flex items-center justify-between">
              <h2 className="text-xl font-semibold text-lb-text-primary">New Lease</h2>
              <button
                onClick={() => setShowNewLeaseModal(false)}
                className="p-2 text-lb-text-muted hover:text-lb-text-secondary hover:bg-lb-base rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Unit Selection */}
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-2">Unit *</label>
                <select
                  value={newLease.unitId}
                  onChange={(e) => {
                    const unit = units.find(u => u.id === e.target.value);
                    setNewLease({
                      ...newLease,
                      unitId: e.target.value,
                      unitNumber: unit?.unitNumber || '',
                      rentAmount: unit?.rentAmount?.toString() || '',
                      securityDeposit: unit?.rentAmount?.toString() || '',
                    });
                  }}
                  className="w-full px-3 py-2.5 bg-lb-muted border border-lb-border rounded-lg text-slate-800 focus:outline-none focus:border-amber-500/50"
                >
                  <option value="">Select a unit</option>
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.unitNumber} ({unit.bedrooms}br/{unit.bathrooms}ba, ${unit.rentAmount}/mo)
                    </option>
                  ))}
                </select>
              </div>

              {/* Tenant Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-lb-text-secondary mb-2">Tenant Name *</label>
                  <input
                    type="text"
                    value={newLease.tenantName}
                    onChange={(e) => setNewLease({ ...newLease, tenantName: e.target.value })}
                    placeholder="Full name"
                    className="w-full px-3 py-2.5 bg-lb-muted border border-lb-border rounded-lg text-lb-text-primary focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-lb-text-secondary mb-2">Phone</label>
                  <PhoneInput
                    value={newLease.tenantPhone}
                    onChange={(value) => setNewLease({ ...newLease, tenantPhone: value })}
                    placeholder="(555) 123-4567"
                  />
                  <p className="mt-1 text-xs text-slate-500">We'll never contact your tenant directly — this is for your records.</p>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-2">Email</label>
                <input
                  type="email"
                  value={newLease.tenantEmail}
                  onChange={(e) => setNewLease({ ...newLease, tenantEmail: e.target.value })}
                  placeholder="tenant@email.com"
                  className="w-full px-3 py-2.5 bg-lb-muted border border-lb-border rounded-lg text-slate-800 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Lease Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-lb-text-secondary mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={newLease.startDate}
                    onChange={(e) => setNewLease({ ...newLease, startDate: e.target.value })}
                    className="w-full px-3 py-2.5 bg-lb-muted border border-lb-border rounded-lg text-slate-800 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-lb-text-secondary mb-2">End Date *</label>
                  <input
                    type="date"
                    value={newLease.endDate}
                    onChange={(e) => setNewLease({ ...newLease, endDate: e.target.value })}
                    className="w-full px-3 py-2.5 bg-lb-muted border border-lb-border rounded-lg text-slate-800 focus:outline-none focus:border-amber-500/50"
                  />
                  <p className="mt-1 text-xs text-slate-500">We'll remind you 60 days before this date.</p>
                </div>
              </div>

              {/* Financial */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-lb-text-secondary mb-2">Monthly Rent ($)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lb-text-muted">$</span>
                    <input
                      type="number"
                      value={newLease.rentAmount === '0' ? '' : newLease.rentAmount}
                      onChange={(e) => setNewLease({ ...newLease, rentAmount: e.target.value })}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value);
                        if (isNaN(value) || value < 0) {
                          setNewLease({ ...newLease, rentAmount: '' });
                        }
                      }}
                      placeholder="2500"
                      className="w-full pl-8 pr-3 py-2.5 bg-lb-muted border border-lb-border rounded-lg text-slate-800 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-lb-text-secondary mb-2">Security Deposit ($)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lb-text-muted">$</span>
                    <input
                      type="number"
                      value={newLease.securityDeposit === '0' ? '' : newLease.securityDeposit}
                      onChange={(e) => setNewLease({ ...newLease, securityDeposit: e.target.value })}
                      onBlur={(e) => {
                        const value = parseFloat(e.target.value);
                        if (isNaN(value) || value < 0) {
                          setNewLease({ ...newLease, securityDeposit: '' });
                        }
                      }}
                      placeholder="2500"
                      className="w-full pl-8 pr-3 py-2.5 bg-lb-muted border border-lb-border rounded-lg text-slate-800 focus:outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Lease Type */}
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-2">Lease Type</label>
                <select
                  value={newLease.leaseType}
                  onChange={(e) => setNewLease({ ...newLease, leaseType: e.target.value as LeaseType })}
                  className="w-full px-3 py-2.5 bg-lb-muted border border-lb-border rounded-lg text-slate-800 focus:outline-none focus:border-amber-500/50"
                >
                  <option value="free-market">Free Market</option>
                  <option value="rent-stabilized">Rent Stabilized</option>
                  <option value="fixed-term">Fixed-Term Lease</option>
                  <option value="month-to-month">Month-to-Month</option>
                  <option value="renewal">Renewal</option>
                  <option value="sublease">Sublease</option>
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-2">Notes</label>
                <textarea
                  value={newLease.notes}
                  onChange={(e) => setNewLease({ ...newLease, notes: e.target.value })}
                  placeholder="Add any special terms or conditions..."
                  rows={3}
                  className="w-full px-3 py-2.5 bg-lb-muted border border-lb-border rounded-lg text-lb-text-primary focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowNewLeaseModal(false)}
                  className="flex-1 px-4 py-2.5 bg-lb-muted hover:bg-lb-base text-lb-text-secondary rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateLease}
                  disabled={!newLease.unitId || !newLease.tenantName || !newLease.startDate || !newLease.endDate}
                  className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-lb-text-muted text-slate-950 font-medium rounded-lg transition-colors"
                >
                  Create Lease
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tenant Connect Card Modal */}
      {inviteLease && (
        <TenantConnectCard
          isOpen={!!inviteLease}
          onClose={() => setInviteLease(null)}
          unitNumber={inviteLease.unitNumber}
          unitId={inviteLease.unitId}
          tenantName={inviteLease.tenantName}
          tenantEmail={inviteLease.tenantEmail}
          botUsername={botUsername}
          propertyAddress={userData?.property_address || ''}
        />
      )}

      {/* Payment Request Modal */}
      {selectedLeaseForPayment && (
        <PaymentRequestModal
          isOpen={paymentModalOpen}
          onClose={() => {
            setPaymentModalOpen(false);
            setSelectedLeaseForPayment(null);
          }}
          tenantName={selectedLeaseForPayment.tenantName}
          unitNumber={selectedLeaseForPayment.unitNumber}
          amount={selectedLeaseForPayment.rentAmount}
          venmoHandle={userData?.venmo_handle}
          zelleContact={userData?.zelle_contact}
          cashappTag={userData?.cashapp_tag}
          paypalHandle={userData?.paypal_handle}
          preferredMethod={userData?.preferred_payment_method}
        />
      )}

      <ComplianceFooter />
    </div>
  );
}
