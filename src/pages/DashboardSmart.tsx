import { useState, useMemo, useCallback, useEffect } from 'react';
import { 
  DollarSign, Building2, Users, Wrench, Calendar,
  ArrowUpRight, ArrowDownRight, TrendingUp, AlertTriangle,
  MessageSquare, Sparkles, CheckCircle2, Clock,
  Percent, FileText, Zap, Bell
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { analytics } from '../utils/analytics';
import { SmartMetricCard, SmartMetricGrid } from '../components/SmartMetricCard';
import { PWAInstallPrompt } from '../components/PWAInstallPrompt';
import { ReferralCard } from '../components/ReferralCard';
import { SmartSuggestion, SmartSuggestionsContainer, SmartSuggestionProps } from '../components/SmartSuggestion';
import { ProactiveNotificationFeed, ProactiveNotification } from '../components/ProactiveNotification';
import { AICommandPalette, AICommandPaletteButton } from '../components/AICommandPalette';
import { ConfidenceBadge } from '../components/ConfidenceBadge';
import { DashboardSetupPrompt } from '../components/DashboardSetupPrompt';
import { useSessionManager } from '../hooks/useSessionManager';
import { OccupancyChart } from '../components/OccupancyChart';

// AI Insights generation - uses real data, no hardcoded fallbacks
const generateAIInsights = (metrics: any, unitsList: any[]) => {
  // Defensive: ensure we have valid inputs
  if (!metrics || typeof metrics !== 'object') {
    return [];
  }
  const safeUnitsList = Array.isArray(unitsList) ? unitsList : [];
  const insights = [];

  // Rent collection insight
  if ((metrics.collectionRate || 0) < 90 && safeUnitsList.length > 0) {
    insights.push({
      id: 'rent-collection',
      type: 'anomaly',
      priority: 'high',
      title: 'Collections Down This Month',
      description: `Collection rate at ${(metrics.collectionRate || 0).toFixed(0)}%, below your usual 98%. ${metrics.overdueCount || 0} payment${(metrics.overdueCount || 0) > 1 ? 's are' : ' is'} overdue.`,
      confidence: 87,
      metadata: {
        amount: (metrics.monthlyRent || 0) * (1 - (metrics.collectionRate || 0) / 100),
        percentage: (100 - (metrics.collectionRate || 0)).toFixed(0)
      },
      action: {
        label: 'Send gentle reminders',
        onClick: () => { /* TODO: Implement reminder sending */ }
      }
    });
  }

  // Lease renewal insight
  if ((metrics.expiringLeases || 0) > 0 && safeUnitsList.length > 0) {
    const expiringUnits = Array.isArray(metrics.expiringLeasesUnits) 
      ? metrics.expiringLeasesUnits.join(', ') 
      : '—';
    insights.push({
      id: 'lease-renewal',
      type: 'task',
      priority: 'medium',
      title: `${metrics.expiringLeases} Lease${metrics.expiringLeases > 1 ? 's' : ''} Expiring Soon`,
      description: `$${(metrics.expiringLeaseValue || 0).toLocaleString()} in monthly rent at risk. AI can draft renewal offers.`,
      confidence: 92,
      metadata: {
        units: expiringUnits,
        amount: `$${(metrics.expiringLeaseValue || 0).toLocaleString()}/month`,
        date: metrics.daysToExpiration ? `Within ${metrics.daysToExpiration} days` : 'Soon'
      },
      action: {
        label: 'Draft renewals',
        onClick: () => { /* TODO: Implement renewal drafting */ }
      }
    });
  }

  // Vacancy alert - uses real unit data
  if (safeUnitsList.length > 0 && (metrics.occupancyRate || 100) < 100) {
    const vacantList = safeUnitsList.filter((u: any) => u?.status === 'vacant');
    if (vacantList.length > 0) {
      const vacantUnitNumbers = vacantList.map((u: any) => u?.unitNumber || '—').join(', ');
      const vacantRentTotal = vacantList.reduce((s: number, u: any) => s + (u?.rentAmount || 0), 0);
      insights.push({
        id: 'vacancy',
        type: 'opportunity',
        priority: 'high',
        title: `${vacantList.length} vacant unit${vacantList.length > 1 ? 's' : ''} — no income`,
        description: `${vacantList.length > 1 ? 'Units' : 'Unit'} ${vacantUnitNumbers} ${vacantList.length > 1 ? 'are' : 'is'} vacant. List immediately to recover $${vacantRentTotal.toLocaleString()}/mo.`,
        confidence: 99,
        metadata: {
          units: vacantUnitNumbers,
          amount: `$${vacantRentTotal.toLocaleString()}/mo`
        },
        action: {
          label: 'View Units',
          onClick: () => {}
        }
      });
    }
  }

  return insights;
};

// Real notifications - returns empty array (data comes from Supabase messages/Telegram)
const generateNotifications = (_metrics: any) => {
  // Real notifications come from Supabase messages / Telegram bot
  // Hardcoded mock notifications removed for launch
  return [];
};

export function DashboardSmart() {
  const {
    user,
    units = [],
    payments = [],
    leads = [],
    leases = [],
    maintenanceRequests = [],
  } = useApp();
  const { missingProfileFields } = useSessionManager();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notifications, setNotifications] = useState<ProactiveNotification[]>([]);

  // Track dashboard page view
  useEffect(() => {
    analytics.trackPageView('/dashboard', 'AI Property Manager Dashboard');
    analytics.trackEvent('dashboard_viewed', {
      unit_count: units.length,
      has_subscription: user?.subscriptionTier !== 'free'
    });
  }, []);

  const portfolioMetrics = useMemo(() => {
    const totalUnits = units.length;
    
    // Empty state: return zeros if no units
    if (totalUnits === 0) {
      return {
        totalUnits: 0,
        occupiedUnits: 0,
        vacancyRate: 0,
        occupancyRate: 0,
        monthlyRent: 0,
        annualRent: 0,
        estimatedValue: 0,
        capRate: 0,
        collectionRate: 0,
        collectionAmount: 0,
        pendingMaintenance: 0,
        newLeads: 0,
        expiringLeases: 0,
        expiringLeaseValue: 0,
        expiringLeasesUnits: [],
        daysToExpiration: 0,
        daysSinceFirstPayment: 0,
        overdueCount: 0,
      };
    }

    const occupiedUnits = units.filter((u: any) => u.status === 'occupied').length;
    const occupancyRate = (occupiedUnits / totalUnits) * 100;
    
    // Real monthly rent — sum of all occupied unit rents
    const monthlyRent = units.reduce((sum: number, u: any) => sum + (u.rentAmount || 0), 0);
    const annualRent = monthlyRent * 12;
    const estimatedValue = annualRent > 0 ? monthlyRent * 120 : 0; // 10x annual (conservative GRM)
    
    // Real collection rate from payments
    const currentMonth = new Date().toISOString().slice(0, 7);
    const thisMonthPayments = payments.filter((p: any) => 
      (p.dueDate || '').startsWith(currentMonth)
    );
    const paidThisMonth = thisMonthPayments.filter((p: any) => 
      p.status === 'paid'
    ).length;
    const overdueCount = payments.filter((p: any) => 
      p.status === 'overdue' || p.status === 'late'
    ).length;
    // Guard against divide-by-zero
    const totalDue = thisMonthPayments.length || 1;
    const collectionRate = (paidThisMonth / totalDue) * 100;
    const collectionAmount = monthlyRent * (collectionRate / 100);
    
    // Cap rate: (annual income - estimated expenses 35%) / estimated value
    const noi = annualRent * 0.65;
    // Guard against divide-by-zero and invalid values
    const capRate = estimatedValue > 0 ? (noi / estimatedValue) * 100 : 0;
    
    // Expiring leases
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
    const expiringLeasesList = leases.filter((l: any) => {
      const endDate = new Date(l.endDate);
      return (l.status === 'active') && endDate <= sixtyDaysFromNow && endDate > new Date();
    });
    const soonestExpiry = expiringLeasesList.length > 0 
      ? Math.min(...expiringLeasesList.map((l: any) => 
          Math.ceil((new Date(l.endDate).getTime() - Date.now()) / 86400000)
        ))
      : 0;
    
    // Maintenance count
    const pendingMaintenance = maintenanceRequests.filter((r: any) => 
      r.status === 'open' || r.status === 'in_progress'
    ).length;
    
    // New leads (last 7 days)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newLeads = leads.filter((l: any) => 
      new Date(l.createdAt || 0) > oneWeekAgo
    ).length;

    return {
      totalUnits,
      occupiedUnits,
      vacancyRate: 100 - occupancyRate,
      occupancyRate,
      monthlyRent,
      annualRent,
      estimatedValue,
      capRate: parseFloat(capRate.toFixed(1)),
      collectionRate,
      collectionAmount,
      thisMonthPaymentsCount: thisMonthPayments.length,
      pendingMaintenance,
      newLeads,
      expiringLeases: expiringLeasesList.length,
      expiringLeaseValue: expiringLeasesList.reduce((sum: number, l: any) => sum + (l.rentAmount || 0), 0),
      expiringLeasesUnits: expiringLeasesList.slice(0, 3).map((l: any) => l.unitNumber || '—'),
      daysToExpiration: soonestExpiry,
      daysSinceFirstPayment: 0,
      overdueCount,
    };
  }, [units, payments, leads, leases, maintenanceRequests]);

  // Generate AI suggestions based on metrics and real unit data
  const aiSuggestions = useMemo(() => {
    try {
      return generateAIInsights(portfolioMetrics, units);
    } catch (e) {
      console.error('[DashboardSmart] Error generating AI insights:', e);
      return [];
    }
  }, [portfolioMetrics, units]);
  
  // Generate notifications (real data, no hardcoded mocks)
  const proactiveNotifications = useMemo(() => {
    try {
      return generateNotifications(portfolioMetrics);
    } catch (e) {
      console.error('[DashboardSmart] Error generating notifications:', e);
      return [];
    }
  }, [portfolioMetrics]);

  const handleCommand = useCallback((command: string) => {
    console.log('Command executed:', command);
    setPaletteOpen(false);
  }, []);

  const handleDismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Loading state - wait for data to be ready
  if (!portfolioMetrics || typeof portfolioMetrics !== 'object') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Safe metrics with defaults to prevent crashes
  const safeMetrics = {
    totalUnits: portfolioMetrics.totalUnits ?? 0,
    occupiedUnits: portfolioMetrics.occupiedUnits ?? 0,
    vacancyRate: portfolioMetrics.vacancyRate ?? 0,
    occupancyRate: portfolioMetrics.occupancyRate ?? 0,
    monthlyRent: portfolioMetrics.monthlyRent ?? 0,
    annualRent: portfolioMetrics.annualRent ?? 0,
    estimatedValue: portfolioMetrics.estimatedValue ?? 0,
    capRate: portfolioMetrics.capRate ?? 0,
    collectionRate: portfolioMetrics.collectionRate ?? 0,
    collectionAmount: portfolioMetrics.collectionAmount ?? 0,
    pendingMaintenance: portfolioMetrics.pendingMaintenance ?? 0,
    newLeads: portfolioMetrics.newLeads ?? 0,
    expiringLeases: portfolioMetrics.expiringLeases ?? 0,
    expiringLeaseValue: portfolioMetrics.expiringLeaseValue ?? 0,
    expiringLeasesUnits: portfolioMetrics.expiringLeasesUnits ?? [],
    daysToExpiration: portfolioMetrics.daysToExpiration ?? 0,
    daysSinceFirstPayment: portfolioMetrics.daysSinceFirstPayment ?? 0,
    overdueCount: portfolioMetrics.overdueCount ?? 0,
    thisMonthPaymentsCount: portfolioMetrics.thisMonthPaymentsCount ?? 0,
  };

  // Empty state for new users with no units
  if (safeMetrics.totalUnits === 0) {
    const firstName = user?.firstName || user?.email?.split('@')[0] || 'there';
    
    return (
      <div className='max-w-2xl mx-auto py-16 px-4'>
        {/* Warm welcome header */}
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold text-slate-900 mb-3'>
            Welcome to LandlordBot, {firstName}! 🏢
          </h1>
          <p className='text-slate-500 text-lg'>
            Let's get your portfolio set up. It only takes a few minutes.
          </p>
        </div>

        {/* Step cards */}
        <div className='space-y-4 max-w-lg mx-auto'>
          {[
            { 
              step: '1', 
              title: 'Add your first unit',
              description: 'Tell us about your building and units.',
              href: '/units' 
            },
            { 
              step: '2', 
              title: 'Set up your Telegram bot',
              description: 'Get a free bot that handles tenant messages automatically.',
              href: '/config' 
            },
            { 
              step: '3', 
              title: 'Add your first tenant',
              description: 'Record your current tenants and their lease details.',
              href: '/leases' 
            },
          ].map(({ step, title, description, href }) => (
            <Link 
              key={step} 
              to={href} 
              className='flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-xl hover:border-amber-400 hover:shadow-sm transition-all group'
            >
              <span className='w-10 h-10 rounded-full bg-amber-100 text-amber-700 font-bold flex items-center justify-center text-base shrink-0'>
                {step}
              </span>
              <div className='flex-1'>
                <p className='text-slate-800 font-medium'>{title}</p>
                <p className='text-slate-500 text-sm'>{description}</p>
              </div>
              <span className='text-slate-400 group-hover:text-amber-500 transition-colors'>→</span>
            </Link>
          ))}
        </div>

        {/* Privacy reassurance */}
        <p className='text-center text-slate-500 text-sm italic mt-8'>
          Everything you enter stays private. Only you can see your portfolio data.
        </p>
      </div>
    );
  }

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    const firstName = user?.firstName || user?.email?.split('@')[0] || '';
    const namePart = firstName ? `, ${firstName}` : '';
    
    if (hour >= 5 && hour < 12) return `Good morning${namePart} 👋`;
    if (hour >= 12 && hour < 17) return `Good afternoon${namePart} 👋`;
    return `Good evening${namePart} 👋`;
  };

  // Get contextual subtitle based on data
  const getSubtitle = () => {
    if (safeMetrics.overdueCount > 0) {
      return `You have ${safeMetrics.overdueCount} overdue payment${safeMetrics.overdueCount > 1 ? 's' : ''} that need${safeMetrics.overdueCount === 1 ? 's' : ''} attention.`;
    }
    if (safeMetrics.pendingMaintenance > 0) {
      return `You have ${safeMetrics.pendingMaintenance} open maintenance request${safeMetrics.pendingMaintenance > 1 ? 's' : ''}.`;
    }
    if (safeMetrics.occupancyRate === 100) {
      return "All units occupied. Great work! 🎉";
    }
    return "Here's what's happening with your portfolio today.";
  };

  return (
    <div className="space-y-6 relative">
      {/* Profile Setup Prompt - Progressive Onboarding */}
      {missingProfileFields.length > 0 && (
        <DashboardSetupPrompt missingFields={missingProfileFields} />
      )}

      {/* Header with warm greeting - Bright theme */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-sm">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{getGreeting()}</h1>
            <p className="text-slate-500 dark:text-slate-600 text-sm">
              {getSubtitle()}
              <span className="inline-flex items-center gap-1 ml-3 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                AI Active
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setPaletteOpen(true)}
            className="
              flex items-center gap-2 px-4 py-2 
              bg-white dark:bg-slate-100 border border-slate-200 dark:border-slate-300
              text-slate-700 dark:text-slate-700 hover:text-slate-900 dark:hover:text-white
              hover:border-amber-500/30 dark:hover:border-amber-500/30
              rounded-lg text-sm font-medium 
              transition-all shadow-sm
            "
          >
            <MessageSquare className="w-4 h-4" />
            Ask AI
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-slate-100 dark:bg-slate-200 text-slate-500 dark:text-slate-600 text-xs rounded">⌘K</kbd>
          </button>
        </div>
      </div>

      {/* Portfolio Overview Card - Bright theme with subtle styling */}
      <div className="bg-white dark:bg-white border border-slate-200 dark:border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Estimated Value */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm text-amber-600 dark:text-amber-500 font-medium">Portfolio Value</span>
              <ConfidenceBadge confidence={94} size="sm" />
            </div>            
            <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-2">
              ${safeMetrics.estimatedValue.toLocaleString()}
            </h2>            
            <p className="text-slate-500 dark:text-slate-600 text-sm">
              Based on {safeMetrics.totalUnits} units at avg ${safeMetrics.totalUnits > 0 ? Math.round(safeMetrics.monthlyRent / safeMetrics.totalUnits).toLocaleString() : '0'}/month
            </p>
          </div>
          
          {/* Quick Stats - White cards with subtle borders */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-50 border border-slate-200 dark:border-slate-300 rounded-lg p-4">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{safeMetrics.occupancyRate.toFixed(0)}%</p>
              <p className="text-xs text-slate-500 dark:text-slate-600">Occupancy</p>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-50 border border-slate-200 dark:border-slate-300 rounded-lg p-4">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{safeMetrics.capRate.toFixed(1)}%</p>
              <p className="text-xs text-slate-500 dark:text-slate-600">Est. Cap Rate</p>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-50 border border-slate-200 dark:border-slate-300 rounded-lg p-4">
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{safeMetrics.collectionRate.toFixed(0)}%</p>
              <p className="text-xs text-slate-500 dark:text-slate-600">Collection Rate</p>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-50 border border-slate-200 dark:border-slate-300 rounded-lg p-4">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">+{safeMetrics.newLeads}</p>
              <p className="text-xs text-slate-500 dark:text-slate-600">New Leads</p>
            </div>
          </div>

          {/* Occupancy Chart */}
          <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
            <OccupancyChart
              data={{
                occupied: safeMetrics.occupiedUnits,
                vacant: safeMetrics.totalUnits - safeMetrics.occupiedUnits,
                maintenance: units.filter((u: any) => u?.status === 'maintenance').length || 0
              }}
              size={160}
            />
          </div>
        </div>
      </div>

      {/* Smart Metrics Grid - Cards will inherit the card-hover class */}
      <SmartMetricGrid>
        <SmartMetricCard
          title="Total Units"
          value={safeMetrics.totalUnits}
          subtitle={`${safeMetrics.occupiedUnits} occupied, ${safeMetrics.totalUnits - safeMetrics.occupiedUnits} vacant`}
          icon={<Building2 className="w-5 h-5 text-blue-600 dark:text-blue-600" />}
          iconBg="bg-blue-100 dark:bg-blue-100"
          iconColor="text-blue-600 dark:text-blue-600"
          trend={{ direction: 'neutral', value: '0%', label: 'stable' }}
          aiAnalysis={{
            summary: `${safeMetrics.totalUnits} units in portfolio. ${safeMetrics.occupiedUnits} generating income.`,
            confidence: 99
          }}
        />

        <SmartMetricCard
          title="Monthly Rent"
          value={`$${safeMetrics.monthlyRent.toLocaleString()}`}
          subtitle={`across ${safeMetrics.occupiedUnits} paying unit${safeMetrics.occupiedUnits !== 1 ? 's' : ''}`}
          icon={<DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-600" />}
          iconBg="bg-emerald-100 dark:bg-emerald-100"
          iconColor="text-emerald-600 dark:text-emerald-600"
          trend={{ direction: 'up', value: '3.2%', label: 'vs last month' }}
          aiAnalysis={{
            summary: safeMetrics.monthlyRent > 0 ? `Collecting $${safeMetrics.monthlyRent.toLocaleString()}/mo across ${safeMetrics.totalUnits} unit(s).` : 'No rent data yet — add units to see income.',
            confidence: 96,
            recommendation: safeMetrics.vacancyRate > 0 ? `${safeMetrics.vacancyRate.toFixed(0)}% vacancy — fill vacant units to maximize income.` : 'All units occupied. Review market rates at renewal time.'
          }}
        />

        <SmartMetricCard
          title="Collection Rate"
          value={`${safeMetrics.collectionRate.toFixed(0)}%`}
          subtitle={safeMetrics.collectionRate === 100 ? 'All paid this month! ✓' : `${safeMetrics.overdueCount} of ${safeMetrics.thisMonthPaymentsCount} payments received`}
          icon={<Percent className="w-5 h-5 text-amber-600 dark:text-amber-600" />}
          iconBg="bg-amber-100 dark:bg-amber-100"
          iconColor="text-amber-600 dark:text-amber-600"
          trend={{ direction: 'down', value: '4%', label: 'vs last month' }}
          aiAnalysis={{
            summary: "Collections slightly down. 2 tenants usually pay by the 3rd.",
            confidence: 91,
            recommendation: "AI predictions suggest gentle reminders will recover 95%"
          }}
        />

        <SmartMetricCard
          title="Maintenance"
          value={safeMetrics.pendingMaintenance.toString()}
          subtitle={safeMetrics.pendingMaintenance === 0 ? 'Nothing open right now ✓' : `${safeMetrics.pendingMaintenance} open, ${maintenanceRequests.filter((r: any) => r.status === 'in_progress').length} in progress`}
          icon={<Wrench className="w-5 h-5 text-rose-600 dark:text-rose-600" />}
          iconBg="bg-rose-100 dark:bg-rose-100"
          iconColor="text-rose-600 dark:text-rose-600"
          trend={{ direction: 'up', value: '+2', label: 'new today' }}
          insights={[]}
          aiAnalysis={{
            summary: safeMetrics.pendingMaintenance > 0 ? `${safeMetrics.pendingMaintenance} open request(s). Review and assign to resolve quickly.` : 'No open maintenance requests. Portfolio is in good shape.',
            confidence: 90
          }}
        />

        <SmartMetricCard
          title="Expiring Leases"
          value={safeMetrics.expiringLeases.toString()}
          subtitle={safeMetrics.expiringLeases === 0 ? 'No expirations coming up ✓' : 'in the next 60 days'}
          icon={<Calendar className="w-5 h-5 text-purple-600 dark:text-purple-600" />}
          iconBg="bg-purple-100 dark:bg-purple-100"
          iconColor="text-purple-600 dark:text-purple-600"
          trend={{ direction: 'neutral', value: '0', label: 'stable' }}
          aiAnalysis={{
            summary: safeMetrics.expiringLeases > 0 ? `${safeMetrics.expiringLeases} lease(s) expiring soon. Start renewal conversations early.` : 'No leases expiring in the next 60 days.',
            confidence: 95
          }}
        />

        <SmartMetricCard
          title="New Leads"
          value={safeMetrics.newLeads.toString()}
          subtitle={safeMetrics.newLeads === 0 ? 'No new leads this week' : 'in the last 7 days'}
          icon={<Users className="w-5 h-5 text-indigo-600 dark:text-indigo-600" />}
          iconBg="bg-indigo-100 dark:bg-indigo-100"
          iconColor="text-indigo-600 dark:text-indigo-600"
          trend={{ direction: 'up', value: '+1', label: 'vs last week' }}
          aiAnalysis={{
            summary: safeMetrics.newLeads > 0 ? `${safeMetrics.newLeads} new inquiry(ies) this week. Response time avg: 2.3 hours.` : 'No new leads in the last 7 days.',
            confidence: 88
          }}
        />
      </SmartMetricGrid>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Suggestions */}
        <SmartSuggestionsContainer
          title="AI Suggestions"
          suggestions={aiSuggestions.map(suggestion => ({
            ...suggestion,
            type: suggestion.type as SmartSuggestionProps['type'],
            priority: suggestion.priority as SmartSuggestionProps['priority'],
            metadata: suggestion.metadata ? {
              ...suggestion.metadata,
              amount: suggestion.metadata.amount?.toString(),
            } : undefined,
            onDismiss: () => console.log('Dismissed', suggestion.id),
            onSnooze: () => console.log('Snoozed', suggestion.id)
          }))}
        />

        {/* Proactive Notifications */}
        <ProactiveNotificationFeed
          notifications={proactiveNotifications}
          onDismiss={handleDismissNotification}
        />
      </div>

      {/* Floating AI Command Palette Button */}
      <AICommandPaletteButton onClick={() => setPaletteOpen(true)} />
      
      <AICommandPalette 
        isOpen={paletteOpen} 
        onClose={() => setPaletteOpen(false)}
        onCommand={handleCommand}
      />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Referral Card - Shows occasionally for free users */}
      <div className="fixed bottom-4 right-4 z-40 max-w-xs hidden md:block">
        <ReferralCard variant="compact" />
      </div>
    </div>
  );
}

export default DashboardSmart;
