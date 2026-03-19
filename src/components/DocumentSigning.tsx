import { useState, useEffect } from 'react';
import { FileText, Send, Download, Clock, CheckCircle, AlertCircle, RefreshCw, X, Eye, Bell } from 'lucide-react';
import { Button } from './Button';
import { 
  sendLeaseForSignature, 
  getDocumentStatus, 
  getSignedDocumentUrl,
  sendReminder,
  cancelSubmission,
  type DocumentSubmission,
  type SigningStatus 
} from '../services/docuseal';
import type { Lease } from '../types';

interface DocumentSigningProps {
  lease: Lease;
  templateId: string;
  landlordEmail: string;
  landlordName: string;
  onStatusChange?: (status: SigningStatus) => void;
}

interface PendingSignature {
  id: string;
  leaseId: string;
  tenantName: string;
  tenantEmail: string;
  unitNumber: string;
  status: 'pending' | 'signed' | 'completed' | 'expired';
  sentAt: string;
  expiresAt?: string;
  submissionId?: string;
}

/**
 * Document Signing Component
 * 
 * Features:
 * - Send lease for signature
 * - Track signing status
 * - Download signed documents
 * - Send reminders
 * - List pending signatures
 */
export function DocumentSigning({ 
  lease, 
  templateId, 
  landlordEmail, 
  landlordName,
  onStatusChange 
}: DocumentSigningProps) {
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submission, setSubmission] = useState<DocumentSubmission | null>(null);
  const [status, setStatus] = useState<SigningStatus | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Load stored submission from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(`docuseal_submission_${lease.id}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid stored submission data');
        }
        setSubmission(parsed);
        // Fetch current status
        fetchStatus(parsed.id);
      } catch (e) {
        console.error('Failed to parse stored submission:', e);
      }
    }
  }, [lease.id]);

  // Fetch document status
  const fetchStatus = async (submissionId: string) => {
    try {
      const currentStatus = await getDocumentStatus(submissionId);
      setStatus(currentStatus);
      onStatusChange?.(currentStatus);
    } catch (err) {
      console.error('Failed to fetch status:', err);
    }
  };

  // Send lease for signature
  const handleSendForSignature = async () => {
    if (!lease.tenantEmail) {
      setError('Tenant email is required to send for signature');
      return;
    }

    setIsSending(true);
    setError(null);
    setSuccess(null);

    try {
      const newSubmission = await sendLeaseForSignature(
        lease,
        templateId,
        landlordEmail,
        landlordName,
        {
          subject: `Lease Agreement for ${lease.unitNumber} - Signature Required`,
          message: `Hello ${lease.tenantName},\n\nPlease review and sign your lease agreement for ${lease.unitNumber}. The monthly rent is $${lease.rentAmount.toLocaleString()}.\n\nClick the link below to review and sign the document.`,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        }
      );

      setSubmission(newSubmission);
      localStorage.setItem(`docuseal_submission_${lease.id}`, JSON.stringify(newSubmission));
      setSuccess(`Lease sent to ${lease.tenantEmail} for signature`);
      
      // Fetch initial status
      if (newSubmission.id) {
        await fetchStatus(newSubmission.id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send for signature');
    } finally {
      setIsSending(false);
    }
  };

  // Download signed document
  const handleDownload = async () => {
    if (!submission?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const url = await getSignedDocumentUrl(submission.id);
      
      // Open in new tab or download
      window.open(url, '_blank');
      setSuccess('Document opened for download');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download document');
    } finally {
      setIsLoading(false);
    }
  };

  // Send reminder
  const handleSendReminder = async () => {
    if (!submission?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      await sendReminder(submission.id);
      setSuccess('Reminder sent successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reminder');
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel submission
  const handleCancel = async () => {
    if (!submission?.id) return;
    if (!confirm('Are you sure you want to cancel this signing request?')) return;

    setIsLoading(true);
    setError(null);

    try {
      await cancelSubmission(submission.id);
      localStorage.removeItem(`docuseal_submission_${lease.id}`);
      setSubmission(null);
      setStatus(null);
      setSuccess('Signing request cancelled');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel request');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh status
  const handleRefresh = async () => {
    if (!submission?.id) return;
    setIsLoading(true);
    await fetchStatus(submission.id);
    setIsLoading(false);
  };

  // Get status display
  const getStatusDisplay = () => {
    if (!status) return { label: 'Not Sent', color: 'text-gray-400', bg: 'bg-gray-500/10', icon: FileText };
    
    switch (status.status) {
      case 'completed':
        return { label: 'Fully Signed', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle };
      case 'signed':
        return { label: 'Partially Signed', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Clock };
      case 'pending':
        return { label: 'Awaiting Signature', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Clock };
      case 'expired':
        return { label: 'Expired', color: 'text-red-400', bg: 'bg-red-500/10', icon: AlertCircle };
      default:
        return { label: 'Unknown', color: 'text-gray-400', bg: 'bg-gray-500/10', icon: FileText };
    }
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;
  const isCompleted = status?.status === 'completed';
  const isPending = status?.status === 'pending' || !status;
  const isExpired = status?.status === 'expired';

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <div className={`p-4 rounded-xl border ${statusDisplay.bg} border-current`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${statusDisplay.bg}`}>
              <StatusIcon className={`w-5 h-5 ${statusDisplay.color}`} />
            </div>
            <div>
              <p className={`font-medium ${statusDisplay.color}`}>{statusDisplay.label}</p>
              {submission?.createdAt && (
                <p className="text-sm text-lb-text-muted">
                  Sent {new Date(submission.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {submission && (
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-2 text-lb-text-secondary hover:text-lb-text-primary hover:bg-lb-base rounded-lg transition-colors"
                title="Refresh status"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            )}
            {submission && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="p-2 text-lb-text-secondary hover:text-lb-text-primary hover:bg-lb-base rounded-lg transition-colors"
                title="View details"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Signer Status */}
        {showDetails && status?.submitters && status.submitters.length > 0 && (
          <div className="mt-4 pt-4 border-t border-lb-border">
            <p className="text-sm font-medium text-lb-text-secondary mb-2">Signer Status</p>
            <div className="space-y-2">
              {status.submitters.map((signer, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-lb-text-secondary">{signer.name || signer.email}</span>
                  <span className={`flex items-center gap-1 ${
                    signer.status === 'signed' ? 'text-emerald-400' : 
                    signer.status === 'opened' ? 'text-amber-400' : 'text-gray-400'
                  }`}>
                    {signer.status === 'signed' && <CheckCircle className="w-3 h-3" />}
                    {signer.status === 'opened' && <Eye className="w-3 h-3" />}
                    {signer.status === 'pending' && <Clock className="w-3 h-3" />}
                    {signer.status.charAt(0).toUpperCase() + signer.status.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {!submission ? (
          <Button
            onClick={handleSendForSignature}
            disabled={isSending || !lease.tenantEmail}
            className="flex items-center gap-2"
          >
            {isSending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send for Signature
              </>
            )}
          </Button>
        ) : (
          <>
            {isCompleted && (
              <Button
                onClick={handleDownload}
                disabled={isLoading}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Signed
              </Button>
            )}
            
            {(status?.status === 'pending' || status?.status === 'signed') && (
              <Button
                onClick={handleSendReminder}
                disabled={isLoading}
                variant="secondary"
                className="flex items-center gap-2"
              >
                <Bell className="w-4 h-4" />
                Send Reminder
              </Button>
            )}
            
            {!isCompleted && (
              <Button
                onClick={handleCancel}
                disabled={isLoading}
                variant="danger"
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
            )}
          </>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-emerald-400 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          {success}
        </div>
      )}

      {!lease.tenantEmail && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2 text-amber-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Tenant email required to send for signature
        </div>
      )}
    </div>
  );
}

/**
 * Document Status Tracker
 * Shows a list of all pending document signatures
 */
export function DocumentStatusTracker({ 
  leases,
  templateId,
  landlordEmail,
  landlordName 
}: { 
  leases: Lease[];
  templateId: string;
  landlordEmail: string;
  landlordName: string;
}) {
  const [pendingSignatures, setPendingSignatures] = useState<PendingSignature[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load all pending signatures from localStorage
    const pending: PendingSignature[] = [];
    
    leases.forEach(lease => {
      const stored = localStorage.getItem(`docuseal_submission_${lease.id}`);
      if (stored) {
        try {
          const submission = JSON.parse(stored);
          if (!submission || typeof submission !== 'object') {
            throw new Error('Invalid stored submission data');
          }
          pending.push({
            id: submission.id,
            leaseId: lease.id!,
            tenantName: lease.tenantName,
            tenantEmail: lease.tenantEmail,
            unitNumber: lease.unitNumber,
            status: submission.status || 'pending',
            sentAt: submission.createdAt,
            expiresAt: submission.expiresAt,
            submissionId: submission.id,
          });
        } catch (e) {
          console.error('Failed to parse submission:', e);
        }
      }
    });

    setPendingSignatures(pending);
    setIsLoading(false);
  }, [leases]);

  if (isLoading) {
    return (
      <div className="p-4 text-center text-lb-text-muted">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
        Loading signatures...
      </div>
    );
  }

  if (pendingSignatures.length === 0) {
    return (
      <div className="p-6 text-center bg-lb-surface border border-lb-border rounded-xl">
        <FileText className="w-8 h-8 text-lb-text-muted mx-auto mb-2" />
        <p className="text-lb-text-secondary">No pending signatures</p>
        <p className="text-sm text-lb-text-muted mt-1">
          Send lease agreements for signature to see them here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-lb-text-primary flex items-center gap-2">
        <Clock className="w-4 h-4 text-amber-400" />
        Pending Signatures ({pendingSignatures.length})
      </h3>
      
      <div className="space-y-2">
        {pendingSignatures.map((sig) => (
          <div 
            key={sig.id}
            className="p-3 bg-lb-surface border border-lb-border rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                sig.status === 'completed' ? 'bg-emerald-400' :
                sig.status === 'signed' ? 'bg-amber-400' :
                sig.status === 'expired' ? 'bg-red-400' :
                'bg-blue-400'
              }`} />
              <div>
                <p className="font-medium text-lb-text-primary text-sm">{sig.tenantName}</p>
                <p className="text-xs text-lb-text-muted">Unit {sig.unitNumber}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs px-2 py-1 rounded-full ${
                sig.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                sig.status === 'signed' ? 'bg-amber-500/10 text-amber-400' :
                sig.status === 'expired' ? 'bg-red-500/10 text-red-400' :
                'bg-blue-500/10 text-blue-400'
              }`}>
                {sig.status.charAt(0).toUpperCase() + sig.status.slice(1)}
              </span>
              <p className="text-xs text-lb-text-muted mt-1">
                Sent {new Date(sig.sentAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Signed Documents List
 * Shows all completed signed documents
 */
export function SignedDocumentsList({ leases }: { leases: Lease[] }) {
  const [signedDocs, setSignedDocs] = useState<Array<{
    leaseId: string;
    tenantName: string;
    unitNumber: string;
    completedAt: string;
    submissionId: string;
  }>>([]);

  useEffect(() => {
    const completed: typeof signedDocs = [];
    
    leases.forEach(lease => {
      const stored = localStorage.getItem(`docuseal_submission_${lease.id}`);
      if (stored) {
        try {
          const submission = JSON.parse(stored);
          if (!submission || typeof submission !== 'object') {
            throw new Error('Invalid stored submission data');
          }
          if (submission.status === 'completed') {
            completed.push({
              leaseId: lease.id!,
              tenantName: lease.tenantName,
              unitNumber: lease.unitNumber,
              completedAt: submission.completedAt || submission.updatedAt,
              submissionId: submission.id,
            });
          }
        } catch (e) {
          console.error('Failed to parse submission:', e);
        }
      }
    });

    // Sort by completion date (newest first)
    completed.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    setSignedDocs(completed);
  }, [leases]);

  const handleDownload = async (submissionId: string) => {
    try {
      const url = await getSignedDocumentUrl(submissionId);
      window.open(url, '_blank');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to download document');
    }
  };

  if (signedDocs.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-lb-text-primary flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-emerald-400" />
        Signed Documents ({signedDocs.length})
      </h3>
      
      <div className="space-y-2">
        {signedDocs.map((doc) => (
          <div 
            key={doc.submissionId}
            className="p-3 bg-lb-surface border border-lb-border rounded-lg flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <FileText className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-lb-text-primary text-sm">{doc.tenantName}</p>
                <p className="text-xs text-lb-text-muted">Unit {doc.unitNumber}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-lb-text-muted">
                {new Date(doc.completedAt).toLocaleDateString()}
              </span>
              <button
                onClick={() => handleDownload(doc.submissionId)}
                className="p-2 text-lb-text-secondary hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                title="Download signed document"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DocumentSigning;
