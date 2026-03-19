import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  Users, 
  Wrench, 
  DollarSign,
  Calendar,
  ArrowRight,
  Command,
  Search,
  Plus,
  FileText,
  Phone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { HealthScoreRing } from '../components/HealthScoreRing';
import { AIInsightCard } from '../components/AIInsightCard';
import { FloatingActionButton, createFabActions } from '../components/FloatingActionButton';
import { MetricCard } from '../components/Card';
import { SkeletonDashboard } from '../components/Skeleton';
import { Button } from '../components/Button';
import type { AIInsight } from '../components/AIInsightCard';

// Command Palette Component
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands = [
    { id: 'units', label: 'Go to Units', icon: Building2, shortcut: 'U', action: () => navigate('/units') },
    { id: 'leads', label: 'View Leads', icon: Users, shortcut: 'L', action: () => navigate('/leads') },
    { id: 'maintenance', label: 'Maintenance Requests', icon: Wrench, shortcut: 'M', action: () => navigate('/maintenance') },
    { id: 'rent', label: 'Rent Collection', icon: DollarSign, shortcut: 'R', action: () => navigate('/rent') },
    { id: 'reports', label: 'View Reports', icon: FileText, shortcut: 'P', action: () => navigate('/reports') },
    { id: 'messages', label: 'Messages', icon: Phone, shortcut: 'G', action: () => navigate('/messages') },
    { id: 'add-unit', label: 'Add New Unit', icon: Plus, shortcut: 'N', action: () => navigate('/units') },
  ];

  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-lg z-50"
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-200 dark:border-slate-700">
                <Search className="w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search commands..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
                  autoFocus
                />
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">ESC</kbd>
                </div>
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {filteredCommands.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                    No commands found
                  </div>
                ) : (
                  <div className="py-2">
                    {filteredCommands.map((cmd, index) => {
                      const Icon = cmd.icon;
                      const isSelected = index === selectedIndex;
                      
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => {
                            cmd.action();
                            onClose();
                          }}
                          onMouseEnter={() => setSelectedIndex(index)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                            isSelected 
                              ? 'bg-amber-50 dark:bg-amber-900/20' 
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${
                            isSelected 
                              ? 'bg-amber-100 dark:bg-amber-800/50 text-amber-600 dark:text-amber-400' 
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className={`flex-1 ${
                            isSelected 
                              ? 'text-amber-900 dark:text-amber-100' 
                              : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {cmd.label}
                          </span>
                          <kbd className={`px-2 py-1 text-xs rounded ${
                            isSelected 
                              ? 'bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200' 
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                          }`}>
                            {cmd.shortcut}
                          </kbd>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span>Use <kbd className="px-1 bg-white dark:bg-slate-700 rounded border">↑↓</kbd> to navigate</span>
                  <span><kbd className="px-1 bg-white dark:bg-slate-700 rounded border">Enter</kbd> to select</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const {
    user,
    units = [],
    payments = [],
    leads = [],
    leases = [],
    maintenanceRequests = [],
    isLoading,
  } = useApp();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);

  // Keyboard shortcut for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Calculate portfolio metrics
  const portfolioMetrics = useMemo(() => {
    const occupiedUnits = units.filter(u => u.status === 'occupied').length;
    const totalUnits = units.length;
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    const monthlyRent = units.reduce((sum, u) => sum + (u.rentAmount || 0), 0);
    const annualRent = monthlyRent * 12;

    // Estimate property value (rough estimate: monthly rent x 120 for NYC)
    const portfolioValue = monthlyRent * 120;

    // Calculate cap rate assumption (5% typical for NYC)
    const capRate = 5.0;

    // Count active leases
    const activeLeases = leases.filter(l => l.status === 'active').length;

    // Calculate average rent per unit
    const avgRent = totalUnits > 0 ? monthlyRent / totalUnits : 0;

    // Count pending maintenance requests
    const pendingMaintenance = maintenanceRequests.filter(r => r.status === 'open' || r.status === 'in_progress').length;

    // Count new leads this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newLeads = leads.filter(l => 
      new Date(l.createdAt || 0) > oneWeekAgo
    ).length;

    // Calculate collection rate (last month)
    const lastMonthPayments = payments.filter(p => {
      const paymentDate = new Date(p.dueDate);
      const now = new Date();
      return paymentDate.getMonth() === now.getMonth() - 1 && 
             paymentDate.getFullYear() === now.getFullYear();
    });
    const collectedAmount = lastMonthPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    const expectedAmount = lastMonthPayments.reduce((sum, p) => sum + p.amount, 0);
    const collectionRate = expectedAmount > 0 ? (collectedAmount / expectedAmount) * 100 : 100;

    return {
      totalUnits,
      occupiedUnits,
      occupancyRate,
      monthlyRent,
      annualRent,
      estimatedValue: portfolioValue,
      capRate,
      activeLeases,
      avgRent,
      pendingMaintenance,
      newLeads,
      collectionRate,
    };
  }, [units, payments, leads, leases, maintenanceRequests]);

  // Portfolio Health Calculation
  const occupancyRate = portfolioMetrics.totalUnits > 0 ? (portfolioMetrics.occupiedUnits / portfolioMetrics.totalUnits) * 100 : 0;
  const collectionRate = portfolioMetrics.collectionRate;
  const maintenanceHealth = maintenanceRequests.filter(r => r.status === 'open' || r.priority === 'urgent').length === 0 ? 100 : 
    maintenanceRequests.filter(r => r.priority === 'urgent').length > 0 ? 40 :
    maintenanceRequests.filter(r => r.status === 'open').length > 2 ? 60 : 80;
  const portfolioHealth = Math.round(occupancyRate * 0.4 + collectionRate * 0.3 + maintenanceHealth * 0.3);

  // Generate AI Insights
  useEffect(() => {
    if (isLoading) return;
    
    const generatedInsights: AIInsight[] = [
      {
        id: '1',
        title: 'Portfolio Health Alert',
        body: `Your portfolio health is at ${portfolioHealth}%. Based on occupancy (${Math.round(occupancyRate)}%), collections (${Math.round(collectionRate)}%), and maintenance status, ${portfolioHealth >= 80 ? 'you are performing excellently!' : portfolioHealth >= 60 ? 'there is room for improvement in some areas.' : 'immediate attention is required to improve performance.'}`,
        severity: portfolioHealth >= 80 ? 'positive' : portfolioHealth >= 60 ? 'info' : 'warning',
        actions: [{ label: 'View Details', onClick: () => navigate('/analytics'), variant: 'primary' }],
        generatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: 'Rent Collection Insights',
        body: `Your collection rate stands at ${Math.round(collectionRate)}%. ${collectionRate >= 95 ? 'Outstanding payment discipline across your portfolio!' : collectionRate >= 85 ? 'Strong collection performance with minor gaps to address.' : 'Consider implementing automated reminders and reviewing late fee policies to improve cash flow.'}`,
        severity: collectionRate >= 90 ? 'positive' : collectionRate >= 75 ? 'info' : 'warning',
        actions: [{ label: 'Review Payments', onClick: () => navigate('/rent'), variant: 'primary' }],
        generatedAt: new Date().toISOString(),
      },
      {
        id: '3',
        title: 'Operational Efficiency',
        body: `You have ${portfolioMetrics.pendingMaintenance} maintenance request${portfolioMetrics.pendingMaintenance !== 1 ? 's' : ''} pending. ${portfolioMetrics.pendingMaintenance === 0 ? 'Great job staying on top of maintenance!' : portfolioMetrics.pendingMaintenance <= 2 ? 'Minor maintenance backlog - manageable.' : 'Significant maintenance queue building up. Consider scheduling dedicated maintenance days.'}`,
        severity: portfolioMetrics.pendingMaintenance === 0 ? 'positive' : portfolioMetrics.pendingMaintenance <= 3 ? 'info' : 'warning',
        actions: [{ label: 'View Maintenance', onClick: () => navigate('/maintenance'), variant: 'primary' }],
        generatedAt: new Date().toISOString(),
      }
    ];

    setInsights(generatedInsights);
  }, [portfolioHealth, occupancyRate, collectionRate, portfolioMetrics.pendingMaintenance, navigate, isLoading]);

  const handleDismiss = (id: string) => {
    setInsights(prev => prev.filter(i => i.id !== id));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 pb-24 px-6 pt-6">
        <SkeletonDashboard />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 pb-24">
      {/* Welcome Banner */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-amber-500/10 to-amber-600/5 border-b border-amber-500/20"
          >
            <div className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Welcome back{user?.firstName ? `, ${user.firstName}` : ''}! 
                    Your portfolio is looking {portfolioHealth >= 80 ? 'great' : 'good'} today.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowWelcome(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                ×
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-6 pt-6 pb-4">
        {/* Header with Command Palette Trigger */}
        <div className="flex items-center justify-between mb-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-white">
              Dashboard
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Here's what's happening with your portfolio
            </p>
          </motion.div>
          
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => setIsCommandPaletteOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:border-amber-500/50 transition-all"
          >
            <Command className="w-4 h-4" />
            <span className="text-sm">Quick Actions</span>
            <kbd className="px-1.5 py-0.5 text-xs bg-slate-100 dark:bg-slate-700 rounded">⌘K</kbd>
          </motion.button>
        </div>

        {/* Portfolio Health Section - Large Ring */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center py-6"
        >
          <HealthScoreRing 
            score={portfolioHealth} 
            size="lg" 
            label="Portfolio Health" 
            sublabel={`Based on ${portfolioMetrics.totalUnits} units`}
            showSparkle={portfolioHealth >= 80}
          />
        </motion.div>

        {/* Three Metric Rings */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-3 gap-4 px-6 mb-8"
        >
          <HealthScoreRing 
            score={Math.round(occupancyRate)} 
            size="md" 
            label="Occupancy" 
          />
          <HealthScoreRing 
            score={Math.round(collectionRate)} 
            size="md" 
            label="Financial" 
          />
          <HealthScoreRing 
            score={maintenanceHealth} 
            size="md" 
            label="Operational" 
          />
        </motion.div>

        {/* Quick Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 px-6 mb-8"
        >
          <MetricCard
            title="Monthly Rent"
            value={`$${portfolioMetrics.monthlyRent.toLocaleString()}`}
            icon={<DollarSign className="w-5 h-5" />}
            variant="success"
          />
          <MetricCard
            title="Est. Value"
            value={`$${(portfolioMetrics.estimatedValue / 1000000).toFixed(1)}M`}
            icon={<Building2 className="w-5 h-5" />}
            variant="info"
          />
          <MetricCard
            title="New Leads"
            value={portfolioMetrics.newLeads}
            change={{ value: 12, trend: 'up' }}
            icon={<Users className="w-5 h-5" />}
            variant="warning"
          />
          <MetricCard
            title="Pending Maint."
            value={portfolioMetrics.pendingMaintenance}
            icon={<Wrench className="w-5 h-5" />}
            variant={portfolioMetrics.pendingMaintenance > 3 ? 'danger' : 'default'}
          />
        </motion.div>

        {/* AI Insights Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="px-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <Sparkles className="w-5 h-5 text-amber-500" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                AI Insights
              </h2>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/assistant')}
              icon={<ArrowRight className="w-4 h-4" />}
              iconPosition="right"
            >
              View All
            </Button>
          </div>
          
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {insights.map((insight, index) => (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <AIInsightCard 
                    insight={insight} 
                    onDismiss={handleDismiss} 
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            
            
            {insights.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-slate-500 dark:text-slate-400"
              >
                <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No new insights at the moment</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Command Palette */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
      />

      {/* Floating Action Button */}
      <FloatingActionButton actions={createFabActions(navigate)} />
    </div>
  );
}

export default Dashboard;
