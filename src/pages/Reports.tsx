import { useState, useMemo } from 'react';
import { 
  FileText, Download, Calendar, TrendingUp, MessageSquare, Users, 
  Wrench, DollarSign, Clock, ChevronLeft, ChevronRight, Filter, 
  BarChart3, PieChart, ArrowUpRight, Printer, Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ComplianceFooter } from '../components/ComplianceFooter';
import { UpgradeModal } from '../components/UpgradeModal';
import { Button } from '../components/Button';
import { Card, MetricCard, EmptyStateCard } from '../components/Card';
import { PageHeader } from '../components/Breadcrumb';
import { Skeleton } from '../components/Skeleton';
import { useApp } from '../context/AppContext';
import { useAuth } from '@/features/auth';
import { useFormatDate } from '../hooks';

interface WeeklyReport {
  id: string;
  weekStarting: string;
  weekEnding: string;
  messagesHandled: number;
  leadsQualified: number;
  maintenanceRequests: number;
  rentCollected: number;
  rentExpected: number;
  timeSavedHours: number;
  topInquiries: string[];
  escalations: number;
  status: 'generated' | 'scheduled';
}

// Simple bar chart component
function SimpleBarChart({ data, maxValue }: { data: { label: string; value: number; color: string }[]; maxValue: number }) {
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-center gap-3"
        >
          <span className="w-20 text-sm text-slate-500 dark:text-slate-400 text-right">{item.label}</span>
          <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / maxValue) * 100}%` }}
              transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
              className={`h-full rounded-lg ${item.color}`}
            />
          </div>
          <span className="w-12 text-sm font-medium text-slate-900 dark:text-slate-100">{item.value}</span>
        </motion.div>
      ))}
    </div>
  );
}

// Donut chart component
function DonutChart({ 
  data, 
  total 
}: { 
  data: { label: string; value: number; color: string }[]; 
  total: number;
}) {
  const circumference = 2 * Math.PI * 40;
  let currentOffset = 0;
  
  // Guard against zero or negative total
  const safeTotal = total > 0 ? total : 1;

  return (
    <div className="relative w-40 h-40 mx-auto">
      <svg viewBox="0 0 100 100" className="transform -rotate-90">
        {data.map((item, index) => {
          const percentage = item.value / safeTotal;
          const strokeDasharray = `${percentage * circumference} ${circumference}`;
          const strokeDashoffset = -currentOffset;
          currentOffset += percentage * circumference;

          return (
            <motion.circle
              key={item.label}
              cx="50"
              cy="50"
              r="40"
              fill="none"
              strokeWidth="12"
              stroke={item.color}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={circumference}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">{total}</span>
          <span className="block text-xs text-slate-500">Total</span>
        </div>
      </div>
    </div>
  );
}

export function Reports() {
  const { formatDate } = useFormatDate();
  const { userData } = useAuth();
  const { units, payments, leads, maintenanceRequests, messages, isLoading } = useApp();
  const [selectedReport, setSelectedReport] = useState<WeeklyReport | null>(null);
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'financial' | 'maintenance' | 'leads'>('overview');

  // Check if user is on free tier
  const isFreeTier = !userData || userData.subscription_tier === 'free';

  // Compute weekly stats from real data
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const weeklyStats = useMemo(() => ({
    messagesHandled: messages.filter(m => new Date(m.timestamp || 0) >= startOfWeek).length,
    newLeads: leads.filter(l => new Date(l.createdAt || 0) >= startOfWeek).length,
    maintenanceThisWeek: maintenanceRequests.filter(r => new Date(r.createdAt || 0) >= startOfWeek).length,
    rentCollected: payments
      .filter(p => p.status === 'paid' && new Date(p.paymentDate || 0) >= startOfWeek)
      .reduce((s, p) => s + (p.amount || 0), 0),
    rentExpected: units.reduce((s, u) => s + (u.rentAmount || 0), 0),
    openMaintenance: maintenanceRequests.filter(r => 
      r.status === 'open' || r.status === 'in_progress').length,
    totalUnits: units.length,
    occupiedUnits: units.filter(u => u.status === 'occupied').length,
    collectionRate: 0,
  }), [units, payments, leads, maintenanceRequests, messages, startOfWeek]);

  // Calculate collection rate with zero-guard
  weeklyStats.collectionRate = weeklyStats.rentExpected > 0 
    ? Math.round((weeklyStats.rentCollected / weeklyStats.rentExpected) * 100) 
    : 0;

  // Chart data
  const occupancyData = [
    { label: 'Occupied', value: weeklyStats.occupiedUnits, color: 'bg-emerald-500' },
    { label: 'Vacant', value: Math.max(0, weeklyStats.totalUnits - weeklyStats.occupiedUnits), color: 'bg-amber-500' },
  ];

  const maintenanceData = [
    { label: 'Open', value: weeklyStats.openMaintenance, color: 'bg-red-500' },
    { label: 'Completed', value: maintenanceRequests.filter(r => r.status === 'completed').length, color: 'bg-emerald-500' },
  ];

  const handleGenerateReport = () => {
    if (isFreeTier) {
      setShowUpgradeModal(true);
      return;
    }
    // Generate report logic
  };

  const handleExport = (format: 'csv' | 'pdf' | 'print') => {
    if (format === 'pdf' && isFreeTier) {
      setShowUpgradeModal(true);
      return;
    }

    if (format === 'csv') {
      const rows = [
        ['Metric', 'Value'],
        ['Total Units', units.length],
        ['Occupied Units', weeklyStats.occupiedUnits],
        ['Monthly Rent Expected', weeklyStats.rentExpected],
        ['Rent Collected This Week', weeklyStats.rentCollected],
        ['Open Maintenance Requests', weeklyStats.openMaintenance],
        ['Active Leads', leads.filter(l => l.status !== 'converted' && l.status !== 'closed').length],
        ['Messages This Week', weeklyStats.messagesHandled],
        ['New Leads This Week', weeklyStats.newLeads],
      ];
      const csv = rows.map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `landlordbot-report-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'print') {
      window.print();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 px-6 py-6">
        <PageHeader title="Reports" description="Loading..." />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={100} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-6 py-6">
      <PageHeader
        title="Reports & Analytics"
        description="Track your portfolio performance and bot activity"
      >
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => handleExport('csv')}
            icon={<Download className="w-4 h-4" />}
          >
            Export CSV
          </Button>
          
          <Button
            onClick={handleGenerateReport}
            icon={<FileText className="w-4 h-4" />}
          >
            Generate Report
          </Button>
        </div>
      </PageHeader>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg w-fit">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'financial', label: 'Financial', icon: DollarSign },
          { id: 'maintenance', label: 'Maintenance', icon: Wrench },
          { id: 'leads', label: 'Leads', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-700 text-amber-500 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                title="Messages"
                value={weeklyStats.messagesHandled}
                change={{ value: 12, trend: 'up' }}
                icon={<MessageSquare className="w-5 h-5" />}
                variant="info"
              />
              
              <MetricCard
                title="New Leads"
                value={weeklyStats.newLeads}
                icon={<Users className="w-5 h-5" />}
                variant="success"
              />
              
              <MetricCard
                title="Maintenance"
                value={weeklyStats.maintenanceThisWeek}
                icon={<Wrench className="w-5 h-5" />}
                variant={weeklyStats.maintenanceThisWeek > 3 ? 'warning' : 'default'}
              />
              
              <MetricCard
                title="Rent Collected"
                value={`$${weeklyStats.rentCollected.toLocaleString()}`}
                icon={<DollarSign className="w-5 h-5" />}
                variant="success"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Occupancy Chart */}
              <Card variant="elevated">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">Occupancy</h3>
                    <span className="text-sm text-slate-500">
                      {Math.round((weeklyStats.occupiedUnits / weeklyStats.totalUnits) * 100) || 0}% occupied
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <DonutChart data={occupancyData} total={Math.max(1, weeklyStats.totalUnits)} />
                    
                    <div className="flex-1 space-y-3">
                      {occupancyData.map((item) => (
                        <div key={item.label} className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${item.color}`} />
                          <span className="text-sm text-slate-600 dark:text-slate-400">{item.label}</span>
                          <span className="ml-auto text-sm font-medium text-slate-900 dark:text-slate-100">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Weekly Activity */}
              <Card variant="elevated">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">Weekly Activity</h3>
                    <div className="flex gap-2">
                      <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <SimpleBarChart 
                    data={[
                      { label: 'Messages', value: weeklyStats.messagesHandled, color: 'bg-blue-500' },
                      { label: 'Leads', value: weeklyStats.newLeads, color: 'bg-emerald-500' },
                      { label: 'Maint.', value: weeklyStats.maintenanceThisWeek, color: 'bg-amber-500' },
                    ]}
                    maxValue={Math.max(weeklyStats.messagesHandled, weeklyStats.newLeads, weeklyStats.maintenanceThisWeek, 1)}
                  />
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === 'financial' && (
          <motion.div
            key="financial"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                title="Monthly Rent Expected"
                value={`$${weeklyStats.rentExpected.toLocaleString()}`}
                icon={<DollarSign className="w-5 h-5" />}
                variant="info"
              />
              
              <MetricCard
                title="Rent Collected (Week)"
                value={`$${weeklyStats.rentCollected.toLocaleString()}`}
                icon={<TrendingUp className="w-5 h-5" />}
                variant="success"
              />
              
              <MetricCard
                title="Collection Rate"
                value={`${weeklyStats.collectionRate}%`}
                change={{ value: 5, trend: 'up' }}
                icon={<BarChart3 className="w-5 h-5" />}
                variant={weeklyStats.collectionRate >= 90 ? 'success' : 'warning'}
              />
            </div>

            <Card variant="elevated">
              <div className="p-6">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-6">Rent Collection Progress</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-500">Collected</span>
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        ${weeklyStats.rentCollected.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${weeklyStats.collectionRate}%` }}
                        transition={{ duration: 0.8 }}
                        className={`h-full rounded-full ${
                          weeklyStats.collectionRate >= 90 ? 'bg-emerald-500' : 
                          weeklyStats.collectionRate >= 70 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-sm pt-4 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-500">Expected</span>
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      ${weeklyStats.rentExpected.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === 'maintenance' && (
          <motion.div
            key="maintenance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                title="Open Requests"
                value={weeklyStats.openMaintenance}
                icon={<Wrench className="w-5 h-5" />}
                variant={weeklyStats.openMaintenance > 3 ? 'warning' : 'default'}
              />
              
              <MetricCard
                title="This Week"
                value={weeklyStats.maintenanceThisWeek}
                icon={<Clock className="w-5 h-5" />}
                variant="info"
              />
              
              <MetricCard
                title="Avg Response Time"
                value="2.4 days"
                icon={<TrendingUp className="w-5 h-5" />}
                variant="success"
              />
            </div>

            <Card variant="elevated">
              <div className="p-6">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-6">Maintenance Status</h3>
                
                <div className="flex items-center gap-8">
                  <DonutChart 
                    data={maintenanceData} 
                    total={maintenanceRequests.length || 1} 
                  />
                  
                  <div className="flex-1 space-y-4">
                    {maintenanceData.map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${item.color}`} />
                          <span className="text-slate-600 dark:text-slate-400">{item.label}</span>
                        </div>
                        <span className="font-medium text-slate-900 dark:text-slate-100">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === 'leads' && (
          <motion.div
            key="leads"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                title="New Leads"
                value={weeklyStats.newLeads}
                change={{ value: 25, trend: 'up' }}
                icon={<Users className="w-5 h-5" />}
                variant="success"
              />
              
              <MetricCard
                title="Conversion Rate"
                value="32%"
                change={{ value: 8, trend: 'up' }}
                icon={<TrendingUp className="w-5 h-5" />}
                variant="success"
              />
              
              <MetricCard
                title="Avg Response Time"
                value="5 min"
                icon={<Clock className="w-5 h-5" />}
                variant="info"
              />
            </div>

            <Card variant="elevated">
              <div className="p-6">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-6">Lead Sources</h3>
                
                <SimpleBarChart 
                  data={[
                    { label: 'Bot', value: 45, color: 'bg-amber-500' },
                    { label: 'Website', value: 30, color: 'bg-blue-500' },
                    { label: 'Referral', value: 15, color: 'bg-emerald-500' },
                    { label: 'Other', value: 10, color: 'bg-slate-400' },
                  ]}
                  maxValue={50}
                />
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="Export Reports"
        featureDescription="Export all reports as PDFs and access historical data. Available with Concierge."
      />

      <ComplianceFooter />
    </div>
  );
}

export default Reports;
