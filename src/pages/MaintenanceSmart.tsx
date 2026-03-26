import { useState, useMemo, useEffect } from 'react';
import { 
  AlertTriangle, CheckCircle, Wrench, Plus, Camera, X, Home, User, 
  Sparkles, Brain, Clock, TrendingUp, MessageSquare, Zap, 
  ShieldAlert, Filter, ChevronDown, Lightbulb, Lock, ArrowRight,
  Calendar, RefreshCw, DollarSign
} from 'lucide-react';
import { ComplianceFooter } from '../components/ComplianceFooter';
import { useApp } from '../context/AppContext';
import { AIActionButton } from '../components/AIActionButton';
import { SmartSuggestion, type SmartSuggestionProps } from '../components/SmartSuggestion';
import { SmartCostEstimate } from '../components/SmartCostEstimate';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { AutoCompleteInput } from '../components/AutoCompleteInput';
import { AIUsageBar } from '../components/AIUsageBar';
import { AIUsageWarningModal } from '../components/AIUsageWarningModal';
import { AIUsageExceededModal } from '../components/AIUsageExceededModal';
import { useMaintenanceCalendar, useGoogleCalendarStatus } from '../hooks/useGoogleCalendar';
import { openVendorSearch, type VendorCategory } from '../services/vendorSearch';
import { useAuth } from '@/features/auth';
import type { MaintenanceRequest, MaintenanceStatus, MaintenancePriority } from '../types';
import { useNavigate } from 'react-router-dom';

const statusConfig: Record<MaintenanceStatus, { label: string; color: string; bg: string; icon: any }> = {
  open: { 
    label: 'Open', 
    color: 'text-amber-400', 
    bg: 'bg-amber-500/10 border-amber-500/20',
    icon: AlertTriangle
  },
  in_progress: { 
    label: 'In Progress', 
    color: 'text-blue-400', 
    bg: 'bg-blue-500/10 border-blue-500/20',
    icon: Wrench
  },
  completed: { 
    label: 'Completed', 
    color: 'text-emerald-400', 
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    icon: CheckCircle
  },
  cancelled: { 
    label: 'Cancelled', 
    color: 'text-lb-text-muted', 
    bg: 'bg-lb-base0/10 border-slate-500/20',
    icon: X
  },
};

const priorityConfig: Record<MaintenancePriority, { label: string; color: string; bg: string }> = {
  emergency: { label: '🚨 Emergency', color: 'text-red-600', bg: 'bg-red-50' },
  urgent: { label: '⚡ Urgent', color: 'text-amber-600', bg: 'bg-amber-50' },
  high: { label: '⚡ High', color: 'text-orange-600', bg: 'bg-orange-50' },
  medium: { label: '🔧 Medium', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  low: { label: '🔧 Low', color: 'text-slate-600', bg: 'bg-slate-50' },
  routine: { label: '🔧 Routine', color: 'text-slate-600', bg: 'bg-slate-50' },
};

// AI category detection keywords
const categoryKeywords: Record<string, string[]> = {
  plumbing: ['water', 'leak', 'drip', ' pipe', 'faucet', 'toilet', 'clog', 'drain', 'shower', 'sink'],
  electrical: ['light', 'outlet', 'breaker', 'electric', 'power', 'hot', 'spark', 'flicker'],
  hvac: ['heat', 'ac', 'cool', 'air', 'temperature', 'thermostat', 'furnace', 'vent'],
  appliance: ['refrigerator', 'fridge', 'stove', 'oven', 'dishwasher', 'washer', 'dryer'],
  structural: ['wall', 'ceiling', 'floor', 'window', 'door', 'lock', 'paint'],
};

// AI priority detection
const detectPriority = (description: string): { priority: MaintenancePriority; confidence: number; reason: string } => {
  const text = description.toLowerCase();
  
  // Emergency keywords
  const emergencyKeywords = ['flood', 'no heat', 'no water', 'fire', 'gas smell', 'electrical hazard', 'sewage'];
  if (emergencyKeywords.some(k => text.includes(k))) {
    return { priority: 'emergency', confidence: 95, reason: 'Keywords suggest immediate safety/habitability issue' };
  }
  
  // Urgent keywords
  const urgentKeywords = ['leak', 'broken', 'not working', 'stuck', 'major'];
  if (urgentKeywords.some(k => text.includes(k))) {
    return { priority: 'urgent', confidence: 82, reason: 'Keywords suggest functional impairment' };
  }
  
  // Default to routine
  return { priority: 'routine', confidence: 75, reason: 'No urgency indicators detected' };
};

// AI category detection
const detectCategory = (description: string): { category: string; confidence: number } => {
  const text = description.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    const matches = keywords.filter(k => text.includes(k)).length;
    if (matches > 0) {
      const confidence = Math.min(70 + matches * 10, 95);
      return { category, confidence };
    }
  }
  
  return { category: 'general', confidence: 45 };
};

// Map AI categories to VendorCategory
const categoryToVendor: Record<string, VendorCategory> = {
  plumbing: 'plumber',
  electrical: 'electrician',
  hvac: 'hvac',
  appliance: 'contractor',
  structural: 'contractor',
  general: 'contractor',
};

// Mock vendor matching
const suggestVendor = (category: string): { name: string; confidence: number; specialty: string } | null => {
  const vendors: Record<string, { name: string; specialty: string }> = {
    plumbing: { name: 'Mike\'s Plumbing', specialty: 'Licensed plumber, 4.9★' },
    electrical: { name: 'Bright Spark Electric', specialty: '24/7 emergency service' },
    hvac: { name: 'Comfort Zone HVAC', specialty: 'Heating/AC specialist' },
    appliance: { name: 'Appliance Repair Pro', specialty: 'All brands, same day' },
    structural: { name: 'HandyPro Services', specialty: 'General maintenance' },
  };
  
  return vendors[category] ? { ...vendors[category], confidence: 88 } : null;
};

// AI Usage constants
const FREE_LIMIT = 20;
const BONUS_LIMIT = 5;
const TOTAL_LIMIT = FREE_LIMIT + BONUS_LIMIT;

export function MaintenanceSmart() {
  const navigate = useNavigate();
  const { units, maintenanceRequests, addMaintenanceRequest, updateMaintenanceRequest, user } = useApp();
  const { userData } = useAuth();
  const { isConnected: isCalendarConnected } = useGoogleCalendarStatus();
  const { isScheduling, scheduleMaintenance } = useMaintenanceCalendar();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [filter, setFilter] = useState<MaintenanceStatus | 'all'>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'ai-suggested'>('all');

  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    date: '',
    time: '',
    duration: 60, // minutes
    notes: '',
  });

  // AI Usage state
  const [aiUsageCount, setAiUsageCount] = useState(() => {
    const saved = localStorage.getItem('landlordbot_ai_usage');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.count === 'number' && typeof parsed.timestamp === 'number') {
          const hoursSince = (Date.now() - parsed.timestamp) / (1000 * 60 * 60);
          if (hoursSince >= 24) {
            localStorage.removeItem('landlordbot_ai_usage');
            return 0;
          }
          return parsed.count;
        }
      } catch (e) {
        console.error('Error parsing AI usage:', e);
        localStorage.removeItem('landlordbot_ai_usage');
      }
    }
    return 0;
  });
  
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showExceededModal, setShowExceededModal] = useState(false);
  const [warningShown, setWarningShown] = useState(false);
  const [justCompleted, setJustCompleted] = useState<string | null>(null);
  
  // AI Cost Estimate state
  const [showCostEstimateModal, setShowCostEstimateModal] = useState(false);
  const [selectedRequestForEstimate, setSelectedRequestForEstimate] = useState<MaintenanceRequest | null>(null);

  // Check if user is on free tier
  const isFreeTier = !user || (user.subscriptionTier === 'free');

  // Form state with AI suggestions
  const [newRequest, setNewRequest] = useState<any>({
    unitId: '',
    description: '',
    priority: 'routine',
    aiDetected: null as any,
    useAISuggestion: true,
  });

  // Save usage to localStorage
  const saveUsage = (count: number) => {
    localStorage.setItem('landlordbot_ai_usage', JSON.stringify({
      count,
      timestamp: Date.now()
    }));
  };

  // Increment AI usage
  const incrementUsage = () => {
    const newCount = aiUsageCount + 1;
    setAiUsageCount(newCount);
    saveUsage(newCount);
    
    if (newCount === FREE_LIMIT && !warningShown) {
      setShowWarningModal(true);
      setWarningShown(true);
    }
    
    if (newCount >= TOTAL_LIMIT) {
      setShowExceededModal(true);
    }
  };

  // Check if AI features are available
  const canUseAI = !isFreeTier || aiUsageCount < TOTAL_LIMIT;

  // AI analysis of current description
  const aiAnalysis = useMemo(() => {
    if (newRequest.description.length < 10) return null;
    
    // Check usage before providing AI analysis
    if (isFreeTier && aiUsageCount >= TOTAL_LIMIT) {
      return null;
    }
    
    const priority = detectPriority(newRequest.description);
    const category = detectCategory(newRequest.description);
    const vendor = suggestVendor(category.category);
    
    return {
      priority,
      category,
      vendor,
      overallConfidence: Math.round((priority.confidence + category.confidence) / 2),
    };
  }, [newRequest.description, aiUsageCount, isFreeTier]);

  // Stats
  const openRequests = maintenanceRequests.filter(r => r.status === 'open').length;
  const inProgressRequests = maintenanceRequests.filter(r => r.status === 'in_progress').length;
  const completedRequests = maintenanceRequests.filter(r => r.status === 'completed').length;
  const emergencyRequests = maintenanceRequests.filter(r => r.priority === 'emergency' && r.status !== 'completed').length;

  const filteredRequests = filter === 'all' 
    ? maintenanceRequests 
    : maintenanceRequests.filter(r => r.status === filter);

  // AI Suggestions for batch actions (computed from real data)
  const aiSuggestions = useMemo(() => {
    // Don't show AI suggestions if limit reached
    if (isFreeTier && aiUsageCount >= TOTAL_LIMIT) {
      return [] as SmartSuggestionProps[];
    }
    
    const suggestions: SmartSuggestionProps[] = [];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Units with 2+ requests in 30 days
    const recent = maintenanceRequests.filter(r => new Date(r.createdAt||0) > thirtyDaysAgo);
    const counts: Record<string, { count: number; unitNumber: string }> = {};
    recent.forEach(r => {
      if (!r.unitId) return;
      const unit = units.find(u => u.id === r.unitId);
      if (!counts[r.unitId]) counts[r.unitId] = { count:0, unitNumber: unit?.unitNumber||r.unitId };
      counts[r.unitId].count++;
    });
    const highVolume = Object.values(counts).filter(v => v.count >= 2).sort((a,b) => b.count - a.count);
    if (highVolume.length > 0) {
      const top = highVolume[0];
      suggestions.push({ id:'pattern', type:'insight', priority:'low', title:'Repeat Requests Detected', description:`Unit ${top.unitNumber} had ${top.count} requests this month. Preventive inspection recommended.`, confidence: 79 });
    }

    // Batchable categories
    const openCats: Record<string, number> = {};
    maintenanceRequests.filter(r=>r.status==='open').forEach(r => {
      const cat = r.category||'general';
      openCats[cat] = (openCats[cat]||0)+1;
    });
    const batchable = Object.entries(openCats).find(([,n]: [string, number]) => n >= 2);
    if (batchable) {
      const [category, count] = batchable as [string, number];
      suggestions.push({ id:'batch', type:'task', priority:'medium', title:'Similar Requests Can Be Batched', description:`${count} open ${category} requests. One vendor visit may reduce cost.`, confidence: 85, action:{ label:'Review', onClick:()=>{} } });
    }

    return suggestions;
  }, [maintenanceRequests, units, aiUsageCount, isFreeTier]);

  const handleAddRequest = () => {
    if (!newRequest.unitId || !newRequest.description) return;

    const unit = units.find(u => u.id === newRequest.unitId);
    if (!unit) return;

    const aiPriority = newRequest.useAISuggestion && aiAnalysis && canUseAI
      ? aiAnalysis.priority.priority 
      : newRequest.priority;

    const request = addMaintenanceRequest({
      unitId: unit.id,
      unitNumber: unit.unitNumber,
      tenantId: unit.tenant?.id,
      tenantName: unit.tenant?.name || 'Unknown',
      tenantPhone: unit.tenant?.phone || '',
      title: aiAnalysis?.category.category && canUseAI
        ? `${aiAnalysis.category.category.charAt(0).toUpperCase() + aiAnalysis.category.category.slice(1)} Issue`
        : 'Maintenance Request',
      description: newRequest.description,
      priority: aiPriority,
      status: 'open',
      category: aiAnalysis?.category.category || 'general',
      photos: [],
      aiAnalysis: aiAnalysis && canUseAI ? JSON.stringify({
        priorityConfidence: aiAnalysis.priority.confidence,
        categoryConfidence: aiAnalysis.category.confidence,
        autoCategorized: newRequest.useAISuggestion,
      }) : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Increment usage if AI was used
    if (isFreeTier && newRequest.useAISuggestion && aiAnalysis) {
      incrementUsage();
    }

    setNewRequest({
      unitId: '',
      description: '',
      priority: 'routine',
      useAISuggestion: true,
    });
    setShowAddModal(false);

    // Show schedule modal if calendar is connected
    // Note: addMaintenanceRequest returns Promise<void>
    if (isCalendarConnected && selectedRequest) {
      setShowScheduleModal(true);
    }
  };

  // Handle schedule in calendar
  const handleScheduleInCalendar = async () => {
    if (!selectedRequest || !scheduleForm.date || !scheduleForm.time) return;

    const unit = units.find(u => u.id === selectedRequest.unitId);
    if (!unit) return;

    // Parse date and time
    const [hours, minutes] = scheduleForm.time.split(':').map(Number);
    const startDate = new Date(scheduleForm.date);
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + scheduleForm.duration);

    const success = await scheduleMaintenance({
      summary: `Maintenance: ${selectedRequest.title}`,
      description: `${selectedRequest.description}\n\nTenant: ${selectedRequest.tenantName}\nUnit: ${selectedRequest.unitNumber}\nPriority: ${selectedRequest.priority}\n\n${scheduleForm.notes ? `Notes: ${scheduleForm.notes}` : ''}`,
      location: unit.address || `Unit ${unit.unitNumber}`,
      startDateTime: startDate.toISOString(),
      endDateTime: endDate.toISOString(),
      tenantName: selectedRequest.tenantName || 'Unknown',
      unitNumber: selectedRequest.unitNumber || '',
      issue: selectedRequest.description,
      priority: selectedRequest.priority,
    });

    if (success) {
      setShowScheduleModal(false);
      setSelectedRequest(null);
      setScheduleForm({ date: '', time: '', duration: 60, notes: '' });
    }
  };

  // Open schedule modal for existing request
  const openScheduleModal = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setShowScheduleModal(true);
  };

  // Check if AI analysis should be shown in modal
  const showAIAnalysis = canUseAI && newRequest.description.length >= 10;

  return (
    <div className="space-y-6">
      {/* AI Usage Modals */}
      <AIUsageWarningModal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        onContinue={() => setShowWarningModal(false)}
        quota={{ used: aiUsageCount, limit: FREE_LIMIT + BONUS_LIMIT }}
      />
      
      <AIUsageExceededModal
        isOpen={showExceededModal}
        onClose={() => setShowExceededModal(false)}
        onRemindTomorrow={() => {
          setShowExceededModal(false);
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          localStorage.setItem('landlordbot_ai_reminder', tomorrow.toISOString());
        }}
        quota={{ used: aiUsageCount, limit: FREE_LIMIT + BONUS_LIMIT }}
      />

      {/* Header with AI branding */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-amber-500/20 to-amber-600/20 rounded-xl">
            <Brain className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-lb-text-primary">
              AI Maintenance Assistant
            </h1>
            <p className="text-lb-text-secondary text-sm">
              Auto-categorization • Smart prioritization • Vendor matching
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-lb-text-primary rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Request
        </button>
      </div>

      {/* AI Usage Bar - only show for free tier when AI is used */}
      {isFreeTier && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <AIUsageBar
            quota={{ used: aiUsageCount, limit: FREE_LIMIT + BONUS_LIMIT }}
            onClick={() => {
              if (aiUsageCount >= FREE_LIMIT && aiUsageCount < TOTAL_LIMIT) {
                setShowWarningModal(true);
              } else if (aiUsageCount >= TOTAL_LIMIT) {
                setShowExceededModal(true);
              }
            }}
          />
        </div>
      )}

      {/* AI Smart Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl bg-lb-surface">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-sm text-red-400 font-medium">Emergency</span>
          </div>
          <p className="text-2xl font-bold text-lb-text-primary">{emergencyRequests}</p>
          <p className="text-xs text-lb-text-muted">Require immediate attention</p>
        </div>

        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-amber-400 font-medium">Open</span>
          </div>
          <p className="text-2xl font-bold text-lb-text-primary">{openRequests}</p>
          <p className="text-xs text-lb-text-muted">Awaiting assignment</p>
        </div>

        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <Wrench className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-400 font-medium">In Progress</span>
          </div>
          <p className="text-2xl font-bold text-lb-text-primary">{inProgressRequests}</p>
          <p className="text-xs text-lb-text-muted">Being worked on</p>
        </div>

        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-sm text-emerald-400 font-medium">Completion</span>
          </div>
          <p className="text-2xl font-bold text-lb-text-primary">
            {maintenanceRequests.length > 0 
              ? Math.round((completedRequests / maintenanceRequests.length) * 100) 
              : 0}%
          </p>
          <p className="text-xs text-lb-text-muted">This month</p>
        </div>
      </div>

      {/* AI Suggestions */}
      {openRequests > 0 && aiSuggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-medium text-lb-text-secondary">AI Suggestions</h3>
          </div>
          
          {aiSuggestions.map(suggestion => (
            <SmartSuggestion
              key={suggestion.id}
              {...suggestion}
              onDismiss={() => console.log('dismiss')}
            />
          ))}
        </div>
      )}

      {/* AI Limit Warning Banner */}
      {isFreeTier && aiUsageCount >= TOTAL_LIMIT && (
        <div className="p-4 bg-gradient-to-r from-red-900/20 to-amber-900/20 border border-red-500/30 rounded-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Lock className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-slate-200 font-medium">AI Features Limited</p>
                <p className="text-slate-400 text-sm">You've used all {TOTAL_LIMIT} AI requests. Upgrade for unlimited access.</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/billing')}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-medium transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Upgrade
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-lb-muted rounded-lg p-1">
          {(['all', 'open', 'in_progress', 'completed'] as const).map((status) => {
            const config = (statusConfig as any)[status] || { icon: Filter, color: 'text-lb-text-primary', bg: 'bg-lb-base0/10' };
            const Icon = config.icon;
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                  ${filter === status 
                    ? `${config.color} ${config.bg}` 
                    : 'text-lb-text-secondary hover:text-lb-text-primary'}
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                {status === 'in_progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== 'all' && (
                  <span className="px-1.5 py-0.5 text-[10px] bg-lb-muted rounded-full text-lb-text-secondary">
                    {maintenanceRequests.filter(r => r.status === status).length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Maintenance List */}
      <div className="space-y-3">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-lb-muted rounded-full flex items-center justify-center">
              <Wrench className="w-8 h-8 text-lb-text-secondary" />
            </div>
            <p className="text-lb-text-secondary">No {filter !== 'all' ? filter : ''} requests</p>
            <p className="text-sm text-lb-text-muted mt-1">Create a new request to get started</p>
          </div>
        ) : (
          filteredRequests.map((request) => {
            const statusConf = statusConfig[request.status];
            const priorityConf = priorityConfig[request.priority];
            
            return (
              <div 
                key={request.id}
                className={`group p-4 bg-lb-surface border rounded-xl transition-all duration-300 hover:shadow-sm ${
                  request.status === 'completed' 
                    ? 'border-l-4 border-l-emerald-500 border-emerald-200' 
                    : 'border-lb-border hover:border-lb-border'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${statusConf.bg}`}>
                      <statusConf.icon className={`w-5 h-5 ${statusConf.color}`} />
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-lb-text-primary">{request.title}</h3>
                        
                        <span className={`text-xs px-2 py-0.5 rounded-full ${priorityConf.bg} ${priorityConf.color}`}>
                          {priorityConf.label}
                        </span>
                        
                        {(() => {
                          try {
                            const parsed = request.aiAnalysis ? JSON.parse(request.aiAnalysis) : null;
                            return parsed?.autoCategorized;
                          } catch {
                            return false;
                          }
                        })() && (
                          <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            <Sparkles className="w-3 h-3" />
                            AI Categorized
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-lb-text-secondary mt-1">{request.description}</p>
                      
                      {/* Find Vendors Link */}
                      {request.status === 'open' && (
                        <button
                          onClick={() => {
                            const category = detectCategory(request.description).category;
                            const vendorCat = categoryToVendor[category] || 'contractor';
                            openVendorSearch(vendorCat, userData?.property_address || 'New York, NY');
                          }}
                          className="mt-2 text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                        >
                          <Wrench className="w-3 h-3" />
                          Find {(() => {
                            const cat = detectCategory(request.description).category;
                            return cat === 'plumbing' ? 'Plumbers' :
                                   cat === 'electrical' ? 'Electricians' :
                                   cat === 'hvac' ? 'HVAC Contractors' :
                                   cat === 'appliance' ? 'Appliance Repair' :
                                   'Local Vendors';
                          })()} near you →
                        </button>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-lb-text-muted">
                        <span className="flex items-center gap-1">
                          <Home className="w-3 h-3" />
                          Unit {request.unitNumber}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {request.tenantName}
                        </span>
                        <span>Submitted {new Date(request.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {request.status === 'open' && canUseAI && (
                      <AIActionButton
                        confidence={85}
                        onAction={() => updateMaintenanceRequest(request.id!, { status: 'in_progress' })}
                        variant="secondary"
                        size="sm"
                        reasoning="AI suggests starting work based on priority and tenant history"
                      >
                        Start Work
                      </AIActionButton>
                    )}
                    
                    {request.status === 'open' && !canUseAI && (
                      <button
                        onClick={() => updateMaintenanceRequest(request.id!, { status: 'in_progress' })}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
                      >
                        Start Work
                      </button>
                    )}
                    
                    {request.status === 'in_progress' && (
                      <button
                        onClick={() => {
                          updateMaintenanceRequest(request.id!, { status: 'completed' });
                          setJustCompleted(request.id!);
                          setTimeout(() => setJustCompleted(null), 1000);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        {justCompleted === request.id ? (
                          <>
                            <CheckCircle className="w-4 h-4 animate-bounce" />
                            Done!
                          </>
                        ) : (
                          'Complete'
                        )}
                      </button>
                    )}

                    {/* AI Cost Estimate Button */}
                    {request.status !== 'completed' && request.status !== 'cancelled' && (
                      <button
                        onClick={() => {
                          setSelectedRequestForEstimate(request);
                          setShowCostEstimateModal(true);
                        }}
                        className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm rounded-lg transition-colors flex items-center gap-1.5"
                        title="Get AI cost estimate"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        Estimate
                      </button>
                    )}

                    {/* Schedule in Calendar Button */}
                    {isCalendarConnected && request.status !== 'completed' && request.status !== 'cancelled' && (
                      <button
                        onClick={() => openScheduleModal(request)}
                        disabled={isScheduling}
                        className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-sm rounded-lg transition-colors flex items-center gap-1.5"
                        title="Schedule in Google Calendar"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Schedule
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Request Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-lb-muted/80 backdrop-blur-sm"
            onClick={() => setShowAddModal(false)}
          />
          
          <div className="relative w-full max-w-lg bg-lb-surface border border-lb-border rounded-2xl shadow-2xl">
            <div className="p-6 border-b border-lb-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-lb-text-primary">New Maintenance Request</h2>
                  <p className="text-sm text-lb-text-muted">AI will auto-categorize and prioritize</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-lb-text-secondary hover:text-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* AI Usage Warning in Modal */}
              {isFreeTier && aiUsageCount >= TOTAL_LIMIT && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-red-400 shrink-0" />
                    <div>
                      <p className="text-slate-200 font-medium">AI Features Unavailable</p>
                      <p className="text-slate-400 text-sm">You've used all {TOTAL_LIMIT} AI requests. Manual entry only.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Unit Selection */}
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-2">Unit</label>
                <select
                  value={newRequest.unitId}
                  onChange={(e) => setNewRequest({ ...newRequest, unitId: e.target.value })}
                  className="w-full px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-lb-text-primary"
                >
                  <option value="">Select unit...</option>
                  {units.map(unit => (
                    <option key={unit.id} value={unit.id}>Unit {unit.unitNumber}</option>
                  ))}
                </select>
              </div>

              {/* AI-Assisted Description */}
              <AutoCompleteInput
                label="Description"
                placeholder="Describe the issue (AI will analyze and categorize)..."
                value={newRequest.description}
                onChange={(value) => setNewRequest({ ...newRequest, description: value })}
                type="textarea"
                context={{ formType: 'description' }}
                helpText={canUseAI ? "Be specific. AI will detect urgency and suggest category." : "AI categorization unavailable. Manual entry only."}
              />

              {/* AI Analysis Preview */}
              {showAIAnalysis && (
                <div className="p-4 bg-lb-base rounded-xl border border-lb-border animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-slate-800">AI Analysis</span>
                    <ConfidenceBadge confidence={aiAnalysis!.overallConfidence} size="sm" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-lb-text-secondary">Priority</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${priorityConfig[aiAnalysis!.priority.priority].color}`}>
                          {priorityConfig[aiAnalysis!.priority.priority].label}
                        </span>
                        <ConfidenceBadge confidence={aiAnalysis!.priority.confidence} size="sm" />
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-lb-text-secondary">Category</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-lb-text-primary capitalize">
                          {aiAnalysis!.category.category}
                        </span>
                        <ConfidenceBadge confidence={aiAnalysis!.category.confidence} size="sm" />
                      </div>
                    </div>
                    
                    {aiAnalysis!.vendor && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-lb-text-secondary">Suggested Vendor</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-amber-400">
                            {aiAnalysis!.vendor.name}
                          </span>
                          <ConfidenceBadge confidence={aiAnalysis!.vendor.confidence} size="sm" />
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-lb-border">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="use-ai"
                          checked={newRequest.useAISuggestion}
                          onChange={(e) => setNewRequest({ ...newRequest, useAISuggestion: e.target.checked })}
                          className="w-4 h-4 rounded border-slate-400 bg-slate-200 text-amber-500"
                        />
                        <label htmlFor="use-ai" className="text-sm text-lb-text-secondary">
                          Use AI suggestions for priority & category
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-lb-border flex items-center justify-between">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-lb-text-secondary hover:text-lb-text-primary transition-colors"
              >
                Cancel
              </button>
              
              <AIActionButton
                confidence={75}
                onAction={handleAddRequest}
                disabled={!newRequest.unitId || !newRequest.description}
                reasoning={canUseAI ? "AI will auto-categorize and set priority based on description" : "Manual entry - AI features limited"}
              >
                Create Request
              </AIActionButton>
            </div>
          </div>
        </div>
      )}

      {/* Schedule in Calendar Modal */}
      {showScheduleModal && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-lb-muted/80 backdrop-blur-sm"
            onClick={() => setShowScheduleModal(false)}
          />
          
          <div className="relative w-full max-w-md bg-lb-surface border border-lb-border rounded-2xl shadow-2xl">
            <div className="p-6 border-b border-lb-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Calendar className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-lb-text-primary">Schedule Maintenance</h2>
                  <p className="text-sm text-lb-text-muted">Add to Google Calendar</p>
                </div>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-2 text-lb-text-secondary hover:text-lb-text-primary rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Request Summary */}
              <div className="p-3 bg-lb-base rounded-lg">
                <p className="text-sm font-medium text-lb-text-primary">{selectedRequest.title}</p>
                <p className="text-xs text-lb-text-secondary mt-1 line-clamp-2">{selectedRequest.description}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-lb-text-muted">
                  <span className="flex items-center gap-1">
                    <Home className="w-3 h-3" />
                    Unit {selectedRequest.unitNumber}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {selectedRequest.tenantName}
                  </span>
                </div>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={scheduleForm.date}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-lb-text-primary focus:outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Time Selection */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-lb-text-secondary mb-2">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.time}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                    className="w-full px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-lb-text-primary focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-lb-text-secondary mb-2">
                    Duration
                  </label>
                  <select
                    value={scheduleForm.duration}
                    onChange={(e) => setScheduleForm({ ...scheduleForm, duration: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-lb-text-primary focus:outline-none focus:border-amber-500/50"
                  >
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                    <option value={180}>3 hours</option>
                    <option value={240}>4 hours</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-lb-text-secondary mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={scheduleForm.notes}
                  onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
                  placeholder="Add any notes for the calendar event..."
                  rows={3}
                  className="w-full px-3 py-2 bg-lb-muted border border-lb-border rounded-lg text-lb-text-primary focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-lb-border flex items-center justify-between">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-2 text-lb-text-secondary hover:text-lb-text-primary transition-colors"
              >
                Cancel
              </button>
              
              <button
                onClick={handleScheduleInCalendar}
                disabled={!scheduleForm.date || !scheduleForm.time || isScheduling}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-lb-text-muted text-slate-950 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {isScheduling ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4" />
                    Schedule in Calendar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Cost Estimate Modal */}
      {selectedRequestForEstimate && (
        <SmartCostEstimate
          request={selectedRequestForEstimate}
          onClose={() => {
            setShowCostEstimateModal(false);
            setSelectedRequestForEstimate(null);
          }}
        />
      )}

      <ComplianceFooter />
    </div>
  );
}

export default MaintenanceSmart;
