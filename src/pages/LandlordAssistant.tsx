import { useState, useRef, useEffect } from 'react';
import { 
  Activity, Bot, MessageSquare, Users, Wrench, CheckCircle, 
  Clock, Calendar, Phone, Sparkles, Filter, Download, Trash2, Send, Loader2,
  Lock, ArrowRight
} from 'lucide-react';
import { askLandlordAssistant } from '../services/gemini';
import type { PortfolioContext, GeminiMessage } from '../services/gemini';
import { ComplianceFooter } from '../components/ComplianceFooter';
import { useApp } from '../context/AppContext';
import type { Message, Lead } from '../types';
import { AIUsageBar } from '../components/AIUsageBar';
import { AIUsageWarningModal } from '../components/AIUsageWarningModal';
import { AIUsageExceededModal } from '../components/AIUsageExceededModal';
import { useNavigate } from 'react-router-dom';
import { 
  checkAIQuota, 
  incrementAIUsage, 
  getAIUsageStatus,
  type AIQuotaStatus 
} from '../services/aiUsage';

// Action log entry type
interface ActionLogEntry {
  id: string;
  timestamp: string;
  type: 'message' | 'lead' | 'maintenance' | 'scheduled' | 'follow_up' | 'escalated';
  title: string;
  description: string;
  unitNumber?: string;
  tenantName?: string;
  status: 'completed' | 'pending' | 'in_progress';
  automated: boolean;
}

// Generate mock action logs from app data
function generateActionLogs(
  messages: Message[], 
  leads: Lead[]
): ActionLogEntry[] {
  const logs: ActionLogEntry[] = [];
  
  // Convert messages to action logs
  messages.slice(0, 20).forEach((msg, idx) => {
    logs.push({
      id: `msg_${idx}`,
      timestamp: msg.timestamp,
      type: msg.type === 'emergency' ? 'escalated' : 'message',
      title: msg.type === 'inquiry' ? 'Tenant Inquiry Answered' : 
             msg.type === 'lead' ? 'New Lead Qualified' :
             msg.type === 'emergency' ? 'Emergency Escalated' : 'Maintenance Issue Logged',
      description: msg.botResponse.substring(0, 100) + (msg.botResponse.length > 100 ? '...' : ''),
      tenantName: msg.tenantPhone,
      status: msg.escalated ? 'pending' : 'completed',
      automated: true,
    });
  });
  
  // Convert leads to action logs
  leads.slice(0, 10).forEach((lead, idx) => {
    logs.push({
      id: `lead_${idx}`,
      timestamp: lead.createdAt || new Date().toISOString(),
      type: 'lead',
      title: 'Lead Qualification Complete',
      description: `${lead.name} - Budget: $${lead.budget || 'N/A'} | Move-in: ${lead.moveInPreference || 'Flexible'}`,
      status: lead.status === 'closed' ? 'completed' : 'in_progress',
      automated: true,
    });
  });
  
  // Sort by timestamp descending
  return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function LandlordAssistant() {
  const navigate = useNavigate();
  const { botStatus, messages, leads, user } = useApp();
  const { units, leases, payments, maintenanceRequests } = useApp();
  const [filter, setFilter] = useState<'all' | 'message' | 'lead' | 'maintenance' | 'escalated'>('all');
  const [actionLogs] = useState<ActionLogEntry[]>(
    generateActionLogs(messages, leads)
  );

  // AI Usage state from database
  const [quota, setQuota] = useState<AIQuotaStatus | null>(null);
  const [isLoadingQuota, setIsLoadingQuota] = useState(true);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showExceededModal, setShowExceededModal] = useState(false);
  const [warningShown, setWarningShown] = useState(false);

  // Fetch quota on mount and periodically
  useEffect(() => {
    const fetchQuota = async () => {
      if (!user?.id) return;
      
      try {
        const result = await checkAIQuota(user.id);
        if (result.success) {
          setQuota(result.data);
          
          // Show warning modal if at 80% threshold and not yet shown
          if (result.data.showWarning && !warningShown) {
            setShowWarningModal(true);
            setWarningShown(true);
          }
          
          // Show exceeded modal if at limit
          if (result.data.showExceeded) {
            setShowExceededModal(true);
          }
        }
      } catch (error) {
        console.error('Error fetching AI quota:', error);
      } finally {
        setIsLoadingQuota(false);
      }
    };

    fetchQuota();
    
    // Refresh quota every minute
    const interval = setInterval(fetchQuota, 60000);
    return () => clearInterval(interval);
  }, [user?.id, warningShown]);

  // Check if user can use AI
  const canUseAI = quota?.canProceed ?? true;
  const isUnlimited = quota?.isUnlimited ?? false;

  // Chat state
  interface ChatMsg {
    role: 'user' | 'assistant';
    text: string;
    ts: string;
  }
  
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([
    {
      role: 'assistant',
      text: "Hi! I'm your AI property manager. Ask me anything about your portfolio, tenants, or NYC housing law.",
      ts: new Date().toISOString()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Increment AI usage and refresh quota
  const trackAIUsage = async () => {
    if (!user?.id) return;
    
    try {
      await incrementAIUsage(user.id);
      
      // Refresh quota after increment
      const result = await checkAIQuota(user.id);
      if (result.success) {
        setQuota(result.data);
        
        // Show warning at 80% threshold
        if (result.data.showWarning && !warningShown) {
          setShowWarningModal(true);
          setWarningShown(true);
        }
        
        // Show exceeded modal at limit
        if (result.data.showExceeded) {
          setShowExceededModal(true);
        }
      }
    } catch (error) {
      console.error('Error tracking AI usage:', error);
    }
  };

  const buildPortfolioCtx = (): PortfolioContext => ({
    totalUnits: units.length,
    occupiedUnits: units.filter(u => u.status === 'occupied').length,
    monthlyRent: units.reduce((s, u) => s + (u.rentAmount || 0), 0),
    openMaintenance: maintenanceRequests.filter(m => m.status === 'open' || m.status === 'in_progress').length,
    expiringSoon: leases.filter(l => {
      const d = Math.ceil((new Date(l.endDate).getTime() - Date.now()) / 86400000);
      return d > 0 && d <= 60;
    }).length,
    overduePayments: payments.filter(p => p.status === 'overdue').length,
  });

  const handleChatSend = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    
    // Check if user can proceed
    if (!canUseAI) {
      setShowExceededModal(true);
      return;
    }
    
    setChatInput('');
    const userMsg: ChatMsg = { role: 'user', text, ts: new Date().toISOString() };
    setChatHistory(prev => [...prev, userMsg]);
    setChatLoading(true);
    
    try {
      const geminiHistory: GeminiMessage[] = chatHistory
        .filter(m => m.role !== 'assistant' || chatHistory.indexOf(m) > 0)
        .map(m => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] }));
      const reply = await askLandlordAssistant(text, buildPortfolioCtx(), geminiHistory);
      const replyText = reply.success && reply.data?.success && reply.data.data 
        ? reply.data.data 
        : (reply.error?.message || reply.data?.error || 'AI unavailable. Please try again.');
      setChatHistory(prev => [...prev, { role: 'assistant', text: replyText, ts: new Date().toISOString() }]);
      
      // Track usage
      await trackAIUsage();
    } catch (e) {
      setChatHistory(prev => [...prev, { role: 'assistant', text: 'AI is temporarily unavailable. Please try again shortly.', ts: new Date().toISOString() }]);
    }
    setChatLoading(false);
  };
  
  const filteredLogs = filter === 'all' 
    ? actionLogs 
    : actionLogs.filter(log => filter === 'escalated' ? log.type === 'escalated' : log.type === filter);
  
  const stats = {
    totalActions: actionLogs.length,
    automated: actionLogs.filter(l => l.automated && l.status === 'completed').length,
    escalated: actionLogs.filter(l => l.type === 'escalated').length,
    pending: actionLogs.filter(l => l.status === 'pending').length,
  };
  
  const getActionIcon = (type: ActionLogEntry['type']) => {
    switch (type) {
      case 'message': return MessageSquare;
      case 'lead': return Users;
      case 'maintenance': return Wrench;
      case 'escalated': return Sparkles;
      case 'scheduled': return Calendar;
      case 'follow_up': return Clock;
      default: return Activity;
    }
  };
  
  const getActionColor = (type: ActionLogEntry['type']) => {
    switch (type) {
      case 'message': return 'text-blue-400 bg-blue-500/20';
      case 'lead': return 'text-emerald-400 bg-emerald-500/20';
      case 'maintenance': return 'text-amber-400 bg-amber-500/20';
      case 'escalated': return 'text-red-400 bg-red-500/20';
      case 'scheduled': return 'text-purple-400 bg-purple-500/20';
      case 'follow_up': return 'text-slate-400 bg-slate-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  // Chat is disabled when limit is reached
  const isChatDisabled = !canUseAI;

  return (
    <div className="space-y-6">
      {/* AI Usage Warning Modal */}
      <AIUsageWarningModal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        onContinue={() => setShowWarningModal(false)}
        quota={quota}
      />
      
      {/* AI Usage Exceeded Modal */}
      <AIUsageExceededModal
        isOpen={showExceededModal}
        onClose={() => setShowExceededModal(false)}
        onRemindTomorrow={() => {
          setShowExceededModal(false);
        }}
        quota={quota}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-amber-500/20 to-purple-500/20 rounded-xl">
            <Bot className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-100">Landlord Assistant</h1>
            <p className="text-slate-400 mt-1">Your AI-powered property management partner</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
            botStatus?.isRunning 
              ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400'
              : 'bg-red-900/20 border-red-500/30 text-red-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${botStatus?.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-sm font-medium">
              {botStatus?.isRunning ? 'Assistant Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Assistant Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <p className="text-3xl font-bold text-slate-100">{stats.totalActions}</p>
          <p className="text-sm text-slate-500">Total Actions</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <p className="text-3xl font-bold text-emerald-400">{stats.automated}</p>
          <p className="text-sm text-slate-500">Auto-Completed</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <p className="text-3xl font-bold text-amber-400">{stats.pending}</p>
          <p className="text-sm text-slate-500">Pending Review</p>
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <p className="text-3xl font-bold text-red-400">{stats.escalated}</p>
          <p className="text-sm text-slate-500">Escalated</p>
        </div>
      </div>

      {/* Time Saved Card */}
      <div className="bg-gradient-to-r from-amber-900/20 to-purple-900/20 border border-amber-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/20 rounded-lg">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-100">Time Saved This Month</p>
              <p className="text-slate-400">Estimated hours you didn't spend on routine tasks</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-amber-400">{botStatus?.timeSavedHours || 0}h</p>
            <p className="text-sm text-slate-500">~${(botStatus?.timeSavedHours || 0) * 75} value</p>
          </div>
        </div>
      </div>

      {/* AI Chat Panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mb-6">
        {/* AI Usage Bar */}
        <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/50">
          <AIUsageBar
            quota={quota}
            showUpgradePrompt={quota?.showWarning || quota?.showExceeded}
          />
        </div>
        
        <div className="flex items-center gap-3 p-4 border-b border-slate-800">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h2 className="text-slate-100 font-semibold">AI Property Assistant</h2>
          <span className="ml-auto text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">Live</span>
        </div>
        
        <div className="h-72 overflow-y-auto p-4 space-y-3">
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                msg.role === 'user' ? 'bg-amber-500 text-slate-950 rounded-br-sm' : 'bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-slate-700 px-4 py-2 rounded-2xl rounded-bl-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                <span className="text-slate-400 text-sm">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>
        
        {/* Chat Input Area */}
        {isChatDisabled ? (
          /* Upgrade prompt when limit reached */
          <div className="p-4 border-t border-slate-800 bg-gradient-to-r from-amber-900/20 to-red-900/20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/20 rounded-lg">
                  <Lock className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <p className="text-slate-200 font-medium">AI Limit Reached</p>
                  <p className="text-slate-400 text-sm">You've used all {quota?.limit} requests for today</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/billing')}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-medium transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Upgrade for More
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Normal chat input */
          <div className="flex gap-2 p-3 border-t border-slate-800">
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleChatSend()}
              placeholder="Ask about your tenants, leases, NYC law..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-slate-200 text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={handleChatSend}
              disabled={!chatInput.trim() || chatLoading}
              className="p-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 rounded-xl transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        )}
        <p className="text-xs text-center text-slate-400 dark:text-slate-600 mt-2 pb-2">
          {isUnlimited 
            ? 'AI assistant is unlimited on your plan' 
            : `AI assistant: ${quota?.remaining ?? 50} requests remaining today`}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All Actions', icon: Activity },
            { key: 'message', label: 'Messages', icon: MessageSquare },
            { key: 'lead', label: 'Leads', icon: Users },
            { key: 'maintenance', label: 'Maintenance', icon: Wrench },
            { key: 'escalated', label: 'Escalated', icon: Sparkles },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-colors">
            <Download className="w-4 h-4" />
            Export Log
          </button>
        </div>
      </div>

      {/* Action Log Feed */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-amber-400" />
          Activity Log
          <span className="text-sm font-normal text-slate-500 ml-2">({filteredLogs.length} actions)</span>
        </h2>
        
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No actions found for this filter.</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const Icon = getActionIcon(log.type);
              const colorClass = getActionColor(log.type);
              
              return (
                <div 
                  key={log.id} 
                  className="flex items-start gap-4 p-4 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                  <div className={`p-2 rounded-lg flex-shrink-0 ${colorClass}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-slate-200 font-medium">{log.title}</p>
                        <p className="text-slate-400 text-sm mt-1">{log.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                          {log.unitNumber && <span>• Unit {log.unitNumber}</span>}
                          {log.tenantName && <span>• {log.tenantName}</span>}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {log.status === 'completed' ? (
                          <span className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Done
                          </span>
                        ) : log.status === 'in_progress' ? (
                          <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                            <Clock className="w-3 h-3" />
                            In Progress
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                            <Clock className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                        
                        {log.automated && (
                          <span className="px-2 py-1 text-xs text-slate-500 bg-slate-700/50 rounded-full">
                            AI
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* What the Assistant Can Do */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          What Your Assistant Handles
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: MessageSquare, title: 'Tenant Inquiries', desc: 'Answers questions 24/7 via SMS' },
            { icon: Users, title: 'Lead Qualification', desc: 'Screens prospects and schedules showings' },
            { icon: Wrench, title: 'Maintenance Triage', desc: 'Logs issues and dispatches vendors' },
            { icon: Phone, title: 'Rent Reminders', desc: 'Sends automated payment reminders' },
            { icon: Calendar, title: 'Move-in/Out', desc: 'Coordinates transitions and inspections' },
            { icon: Trash2, title: 'Issue Escalation', desc: 'Alerts you to urgent situations' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 p-3 bg-slate-800/30 rounded-lg">
              <div className="p-2 bg-slate-700/50 rounded-lg">
                <Icon className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300">{title}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ComplianceFooter />
    </div>
  );
}

export default LandlordAssistant;
