import React from 'react';
import { TrendingUp, Users, Wrench, Clock, MessageSquare } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  color: 'amber' | 'emerald' | 'blue' | 'purple' | 'red';
  key?: React.Key;
}

const colorStyles = {
  amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
  blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
  purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  red: 'bg-red-500/10 border-red-500/20 text-red-400',
};

function StatCard({ title, value, subtitle, icon: Icon, color }: StatCardProps) {
  return (
    <div className={`p-4 sm:p-6 rounded-xl border ${colorStyles[color]} transition-all duration-200`}>
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-slate-400 mb-1 truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-slate-100 truncate">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
        </div>
        <div className="p-2 sm:p-3 rounded-lg bg-slate-800/50 flex-shrink-0">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" />
        </div>
      </div>
    </div>
  );
}

export function StatsOverview() {
  const { botStatus, dailyStats } = useApp();

  if (!botStatus) return null;

  const cards = [
    {
      title: 'Messages This Month',
      value: botStatus.messagesThisMonth,
      subtitle: `${botStatus.messagesThisWeek} this week`,
      icon: MessageSquare,
      color: 'amber' as const,
    },
    {
      title: 'Leads Qualified',
      value: botStatus.leadsQualified,
      subtitle: 'Pre-screened prospects',
      icon: Users,
      color: 'emerald' as const,
    },
    {
      title: 'Maintenance Logged',
      value: botStatus.maintenanceLogged,
      subtitle: 'Tracked for follow-up',
      icon: Wrench,
      color: 'blue' as const,
    },
    {
      title: 'Time Saved',
      value: `~${botStatus.timeSavedHours}h`,
      subtitle: 'This month',
      icon: Clock,
      color: 'purple' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
}

export function DailyStats() {
  const { dailyStats } = useApp();

  if (!dailyStats) return null;

  return (
    <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <TrendingUp className="w-5 h-5 text-emerald-400" />
        <h3 className="font-medium text-slate-200">Today's Activity</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-slate-900/50 rounded-lg">
          <p className="text-2xl font-bold text-amber-400">{dailyStats.messagesHandled}</p>
          <p className="text-xs text-slate-500">Messages Handled</p>
        </div>
        <div className="text-center p-3 bg-slate-900/50 rounded-lg">
          <p className="text-2xl font-bold text-emerald-400">{dailyStats.leadsQualified}</p>
          <p className="text-xs text-slate-500">Leads Qualified</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Time saved today</span>
          <span className="text-lg font-semibold text-emerald-400">~{Math.round(dailyStats.timeSavedMinutes / 60 * 10) / 10}h</span>
        </div>
      </div>
    </div>
  );
}
