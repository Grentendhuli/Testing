import { useState, useEffect } from 'react';
import { X, Copy, Printer, Mail, MessageSquare, Building2, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TenantConnectCardProps {
  isOpen: boolean;
  onClose: () => void;
  unitNumber: string;
  unitId: string;
  tenantName?: string;
  botUsername: string;
  propertyAddress: string;
  tenantEmail?: string;
}

export function TenantConnectCard({
  isOpen,
  onClose,
  unitNumber,
  unitId,
  tenantName,
  botUsername,
  propertyAddress,
  tenantEmail,
}: TenantConnectCardProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const [emailInput, setEmailInput] = useState(tenantEmail || '');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const inviteLink = `https://t.me/${botUsername}?start=unit_${unitId}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteLink)}&color=1E3A5F&bgcolor=ffffff&margin=2`;

  useEffect(() => {
    if (isOpen) {
      setCopiedLink(false);
      setShowEmailInput(false);
      setEmailInput(tenantEmail || '');
      setEmailStatus('idle');
    }
  }, [isOpen, tenantEmail]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    if (!emailInput.trim()) return;
    
    setEmailStatus('sending');
    
    try {
      const { error } = await supabase.functions.invoke('send-tenant-invite', {
        body: {
          toEmail: emailInput,
          toName: tenantName || 'Tenant',
          unitNumber,
          propertyAddress,
          inviteLink,
          botUsername,
          fromName: 'Your Landlord',
        },
      });
      
      if (error) throw error;
      
      setEmailStatus('sent');
      setTimeout(() => {
        setShowEmailInput(false);
        setEmailStatus('idle');
      }, 2000);
    } catch (e) {
      setEmailStatus('error');
    }
  };

  const handleSMS = () => {
    const body = encodeURIComponent(
      `Hi ${tenantName || 'there'}! Your landlord has set up a direct messaging system for your building. Tap this link to connect: ${inviteLink}`
    );
    window.open(`sms:?body=${body}`);
  };

  if (!isOpen) return null;

  // Guard: if botUsername is empty, show warning
  if (!botUsername) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-800">Bot Not Connected</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
            <p className="text-amber-800">
              Set up your Telegram bot in Settings before inviting tenants.
            </p>
          </div>
          <a
            href="/config"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium rounded-lg transition-colors"
          >
            Go to Settings →
          </a>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #tenant-card-${unitId}, #tenant-card-${unitId} * {
            visibility: visible;
          }
          #tenant-card-${unitId} {
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>

      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold text-slate-800">
              Tenant Connect Card — Unit {unitNumber}
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-6">
            {/* Printable Card */}
            <div
              id={`tenant-card-${unitId}`}
              className="bg-white max-w-sm mx-auto rounded-2xl border border-slate-200 shadow-lg p-6"
            >
              {/* Card Header */}
              <div className="bg-[#1E3A5F] rounded-xl p-4 mb-4">
                <p className="text-white/80 text-xs truncate">🏢 {propertyAddress}</p>
                <p className="text-white font-bold text-xl mt-1">Unit {unitNumber}</p>
                {tenantName && (
                  <p className="text-amber-300 text-sm mt-1">For {tenantName}</p>
                )}
              </div>

              {/* QR Code */}
              <div className="text-center">
                <img
                  src={qrUrl}
                  width={200}
                  height={200}
                  alt="QR Code"
                  className="rounded-xl border border-slate-100 p-2 mx-auto"
                />
                <p className="text-xs text-slate-400 font-mono mt-2 truncate px-4">
                  {inviteLink}
                </p>
              </div>

              {/* Instructions */}
              <div className="mt-4">
                <h3 className="text-slate-800 font-semibold text-center mb-3">
                  Connect to your building's messenger
                </h3>
                <div className="space-y-2">
                  {[
                    'Scan the QR code with your phone camera',
                    'Tap the link — Telegram opens automatically',
                    'Tap Start to begin messaging',
                  ].map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-sm text-slate-600">{step}</p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 text-center mt-3">
                  No camera? Type: t.me/{botUsername}
                </p>
              </div>

              {/* Footer */}
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-1 text-slate-400 text-xs">
                  <Building2 className="w-3 h-3" />
                  <span>Powered by LandlordBot</span>
                </div>
                <span className="text-slate-400 text-xs">Free · Secure · Private</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              >
                {copiedLink ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Invite Link
                  </>
                )}
              </button>

              {/* Print */}
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors"
              >
                <Printer className="w-4 h-4" />
                🖨 Print Card
              </button>

              {/* Email */}
              <button
                onClick={() => setShowEmailInput(!showEmailInput)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#1E3A5F] hover:bg-slate-800 text-white font-medium rounded-lg transition-colors"
              >
                <Mail className="w-4 h-4" />
                📧 Email to Tenant
              </button>

              {/* SMS - hidden on desktop */}
              <button
                onClick={handleSMS}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium rounded-lg transition-colors sm:hidden"
              >
                <MessageSquare className="w-4 h-4" />
                💬 Share via Text
              </button>
            </div>

            {/* Email Input */}
            {showEmailInput && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="tenant@email.com"
                    className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={handleSendEmail}
                    disabled={emailStatus === 'sending' || !emailInput.trim()}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-slate-950 font-medium rounded-lg transition-colors"
                  >
                    {emailStatus === 'sending' ? 'Sending...' : 'Send'}
                  </button>
                </div>
                {emailStatus === 'sent' && (
                  <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    ✓ Email sent!
                  </p>
                )}
                {emailStatus === 'error' && (
                  <p className="text-sm text-red-500 mt-2">
                    Could not send email — copy the link and share it manually
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
