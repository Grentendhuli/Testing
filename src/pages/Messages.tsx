import { useState } from 'react';
import { Search, Filter, Download, AlertTriangle, MessageSquare, CheckCircle, Clock, Lock, Send, Phone, Copy } from 'lucide-react';
import { Message } from '../types';
import { MessageTypeBadge } from '../components/MessageTypeBadge';
import { ComplianceFooter } from '../components/ComplianceFooter';
import { UpgradeModal } from '../components/UpgradeModal';
import { useApp } from '../context/AppContext';
import { useAuth } from '@/features/auth';
import { useFormatDate, useDebounce } from '../hooks';

const filterOptions = [
  { value: 'all', label: 'All Messages' },
  { value: 'inquiry', label: 'Inquiries' },
  { value: 'lead', label: 'Leads' },
  { value: 'emergency', label: 'Emergencies' },
  { value: 'maintenance', label: 'Maintenance' },
];

export function Messages() {
  const { messages, markMessageResponded } = useApp();
  const { userData } = useAuth();
  const { formatDate, formatTime } = useFormatDate();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const debouncedSearch = useDebounce(searchTerm, 300);
  const isFreeTier = !userData || userData.subscription_tier === 'free';

  const filteredMessages = messages.filter(msg => {
    // Filter by type
    if (filterType !== 'all' && msg.type !== filterType) {
      return false;
    }
    
    // Filter by search
    if (debouncedSearch) {
      const search = debouncedSearch.toLowerCase();
      return (
        msg.tenantMessage.toLowerCase().includes(search) ||
        msg.botResponse.toLowerCase().includes(search)
      );
    }
    
    return true;
  });

  const exportCSV = () => {
    const headers = ['Date', 'Time', 'Type', 'Tenant Message', 'Bot Response', 'Escalated'];
    const rows = filteredMessages.map(msg => [
      new Date(msg.timestamp).toLocaleDateString(),
      new Date(msg.timestamp).toLocaleTimeString(),
      msg.type,
      msg.tenantMessage,
      msg.botResponse,
      msg.escalated ? 'Yes' : 'No',
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'message-log.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-lb-text-primary">Message Log</h1>
          <p className="text-lb-text-secondary mt-1">
            Complete audit trail of all tenant-bot interactions
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 bg-lb-muted hover:bg-slate-200 text-lb-text-secondary rounded-lg text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-lb-surface border border-lb-border rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-lb-text-muted" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-lb-muted border border-lb-border rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-lb-text-muted" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2.5 bg-lb-muted border border-lb-border rounded-lg text-lb-text-secondary focus:outline-none focus:border-amber-500/50"
            >
              {filterOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-lb-text-muted">
        Showing {filteredMessages.length} of {messages.length} messages
      </div>

      {/* Messages List */}
      <div className="space-y-4">
        {filteredMessages.map((message) => (
          <div
            key={message.id}
            onClick={() => setSelectedMessage(message)}
            className={`group bg-lb-surface border rounded-xl p-5 cursor-pointer transition-all duration-200 hover:shadow-lg ${
              message.escalated
                ? 'border-red-700/50 hover:bg-red-900/10'
                : 'border-lb-border hover:border-lb-border'
            }`}
          >
            {/* Header Row */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <MessageTypeBadge type={message.type} />
                <span className="text-sm text-lb-text-muted">
                  {formatDate(message.timestamp)}
                </span>
                {message.escalated && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-700/30 rounded text-xs font-medium text-red-400">
                    <AlertTriangle className="w-3 h-3" />
                    Escalated
                  </span>
                )}
              </div>
            </div>

            {/* Message Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Tenant Message */}
              <div className="space-y-2">
                <span className="text-xs text-lb-text-muted font-medium uppercase tracking-wide">Tenant</span>
                <p className="text-lb-text-secondary italic">"{message.tenantMessage}"</p>
                {message.tenantPhone && (
                  <p className="text-xs text-lb-text-muted">{message.tenantPhone}</p>
                )}
              </div>

              {/* Bot Response */}
              <div className="bg-lb-muted/50 border-l-2 border-amber-500/30 pl-4 space-y-2">
                <span className="text-xs text-amber-500/70 font-mono uppercase tracking-wide">Bot</span>
                <p className="text-lb-text-secondary font-mono text-sm leading-relaxed">{message.botResponse}</p>
              </div>
            </div>

            {message.tenantPhone && (
              <div className="flex items-center gap-3 mt-3">
                <a
                  href={`sms:${message.tenantPhone}?body=Hi, `}
                  className="inline-flex items-center gap-1.5 text-xs text-[#1E3A5F] dark:text-blue-400 hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone className="w-3 h-3" />
                  Reply via SMS
                </a>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(message.tenantPhone || '');
                  }}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
                >
                  <Copy className="w-3 h-3" />
                  Copy number
                </button>
              </div>
            )}

            {/* Actions */}
            {message.escalated && !message.landlordResponded && (
              <div className="mt-4 pt-4 border-t border-lb-border flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Waiting for your response</span>
                </div>
                {isFreeTier ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUpgradeModal(true);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-lb-muted hover:bg-slate-200 text-lb-text-secondary text-sm rounded-lg transition-colors"
                  >
                    <Lock className="w-4 h-4" />
                    Reply (Concierge)
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markMessageResponded(message.id);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-sm rounded-lg transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Responded
                  </button>
                )}
              </div>
            )}

            {message.landlordResponded && (
              <div className="mt-4 pt-4 border-t border-lb-border flex items-center gap-2 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">You responded</span>
              </div>
            )}
          </div>
        ))}

        {filteredMessages.length === 0 && (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 mx-auto mb-4 bg-blue-50 rounded-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-800 mb-2">No messages yet</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-6">
              Tenant messages from your Telegram bot will appear here in real time. 
              You'll be able to read and respond to them directly.
            </p>
            <a 
              href="/config" 
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-medium rounded-lg transition-colors"
            >
              Configure your bot →
            </a>
          </div>
        )}
      </div>

      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="Reply to Messages"
        featureDescription="Respond directly to tenant messages from the dashboard. Maintain full communication history in one place."
      />

      <ComplianceFooter />
    </div>
  );
}
