import React, { useState, useMemo, useCallback } from 'react';
import { 
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  Sparkles, Lightbulb, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronUp, Target, Zap, Info
} from 'lucide-react';
import { ConfidenceBadge, ConfidenceIndicator } from './ConfidenceBadge';
import { AIActionButton } from './AIActionButton';

export type MetricTrend = 'up' | 'down' | 'neutral';
export type MetricInsightType = 'positive' | 'warning' | 'critical' | 'opportunity';

export interface MetricInsight {
  id: string;
  type: MetricInsightType;
  title: string;
  description: string;
  confidence: number;
  value?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface SmartMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    direction: MetricTrend;
    value: string;
    label: string;
  };
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  insights?: MetricInsight[];
  aiAnalysis?: {
    summary: string;
    confidence: number;
    recommendation?: string;
  };
  onClick?: () => void;
  className?: string;
  compact?: boolean;
  sparklineData?: number[];
}

// Pre-computed color maps to avoid recreating objects on each render
const TREND_COLORS: Record<MetricTrend, { text: string; bg: string }> = {
  up: { text: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  down: { text: 'text-red-400', bg: 'bg-red-500/10' },
  neutral: { text: 'text-slate-400', bg: 'bg-slate-500/10' },
};

const INSIGHT_COLORS: Record<MetricInsightType, { border: string; bg: string; text: string }> = {
  positive: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  warning: { border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  critical: { border: 'border-red-500/30', bg: 'bg-red-500/10', text: 'text-red-400' },
  opportunity: { border: 'border-blue-500/30', bg: 'bg-blue-500/10', text: 'text-blue-400' },
};

// Memoized component to prevent unnecessary re-renders
const SmartMetricCardComponent = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  iconBg = 'bg-slate-800',
  iconColor = 'text-slate-400',
  insights = [],
  aiAnalysis,
  onClick,
  className = '',
  compact = false,
  sparklineData = []
}: SmartMetricCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [showAllInsights, setShowAllInsights] = useState(false);

  // Memoize callbacks to prevent unnecessary re-renders of child components
  const handleExpandClick = useCallback(() => setExpanded(prev => !prev), []);
  const handleShowMoreClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowAllInsights(true);
  }, []);

  // Memoize displayed insights
  const displayedInsights = useMemo(() => 
    showAllInsights ? insights : insights.slice(0, 2),
    [insights, showAllInsights]
  );
  
  const hasMoreInsights = insights.length > 2;

  if (compact) {
    return (
      <div 
        onClick={onClick}
        className={`
          p-4 rounded-2xl border border-slate-200 dark:border-slate-200
          bg-white dark:bg-white hover:shadow-md
          transition-all duration-200 cursor-pointer shadow-sm
          ${className}
        `}
      >
        <div className="flex items-start justify-between">
          <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
            {icon}
          </div>
          
          {trend && (
            <div className={`flex items-center gap-1 text-sm ${TREND_COLORS[trend.direction].text}`}>
              {trend.direction === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{trend.value}</span>
            </div>
          )}
        </div>
        
        <div className="mt-3">
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          <p className="text-sm text-slate-500">{title}</p>
        </div>

        {/* Mini sparkline */}
        {sparklineData.length > 0 && (
          <div className="mt-3 h-8 flex items-end gap-0.5">
            {sparklineData.map((dataPoint, i) => (
              <div
                key={i}
                className="flex-1 bg-amber-500/30 rounded-t"
                style={{ height: `${dataPoint}%` }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`
      overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-200
      bg-white dark:bg-white hover:shadow-md
      transition-all duration-300 shadow-sm
      ${onClick ? 'cursor-pointer' : ''}
      ${className}
    `}>
      {/* Main content */}
      <div className="p-5" onClick={onClick}>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
              <span className={iconColor}>{icon}</span>
            </div>
            
            <div>
              <p className="text-sm text-slate-500">{title}</p>
              <p className="text-3xl sm:text-4xl font-bold text-slate-900 mt-1">{value}</p>
              
              {subtitle && (
                <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            {trend && (
              <div className={`
                flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
                ${TREND_COLORS[trend.direction].bg}
              `}>
                {trend.direction === 'up' ? 
                  <TrendingUp className={`w-4 h-4 ${TREND_COLORS[trend.direction].text}`} /> : 
                  trend.direction === 'down' ?
                  <TrendingDown className={`w-4 h-4 ${TREND_COLORS[trend.direction].text}`} /> :
                  <ArrowUpRight className={`w-4 h-4 ${TREND_COLORS[trend.direction].text}`} />
                }
                <span className={`text-sm font-medium ${TREND_COLORS[trend.direction].text}`}>
                  {trend.value}
                </span>
              </div>
            )}
            
            {aiAnalysis && (
              <ConfidenceIndicator confidence={aiAnalysis.confidence} />
            )}
          </div>
        </div>

        {/* AI Analysis */}
        {aiAnalysis && expanded && (
          <div className="mt-4 p-4 bg-slate-950/50 rounded-lg border border-slate-800 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-slate-300">{aiAnalysis.summary}</p>
                
                {aiAnalysis.recommendation && (
                  <div className="mt-2 flex items-center gap-2">
                    <Lightbulb className="w-3.5 h-3.5 text-yellow-500" />
                    <span className="text-sm text-slate-400">{aiAnalysis.recommendation}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Insights */}
        {insights.length > 0 && (
          <div className="mt-4 space-y-2">
            {displayedInsights.map(insight => {
              const colors = INSIGHT_COLORS[insight.type];
              return (
                <div 
                  key={insight.id}
                  className={`
                    p-3 rounded-lg border ${colors.border} ${colors.bg}
                    animate-in fade-in slide-in-from-left-2
                  `}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2">
                      {insight.type === 'positive' && <CheckCircle2 className={`w-4 h-4 ${colors.text} shrink-0 mt-0.5`} />}
                      {insight.type === 'warning' && <AlertTriangle className={`w-4 h-4 ${colors.text} shrink-0 mt-0.5`} />}
                      {insight.type === 'critical' && <Target className={`w-4 h-4 ${colors.text} shrink-0 mt-0.5`} />}
                      {insight.type === 'opportunity' && <Zap className={`w-4 h-4 ${colors.text} shrink-0 mt-0.5`} />}
                      
                      <div>
                        <p className={`text-sm font-medium ${colors.text}`}>{insight.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{insight.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {insight.value && (
                        <span className={`text-sm font-semibold ${colors.text}`}>{insight.value}</span>
                      )}
                      <ConfidenceBadge confidence={insight.confidence} size="sm" />
                    </div>
                  </div>
                  
                  {insight.action && (
                    <div className="mt-2 pl-6">
                      <AIActionButton
                        confidence={insight.confidence}
                        onAction={insight.action.onClick}
                        variant="secondary"
                        size="sm"
                      >
                        {insight.action.label}
                      </AIActionButton>
                    </div>
                  )}
                </div>
              );
            })}
            
            {hasMoreInsights && !showAllInsights && (
              <button
                onClick={handleShowMoreClick}
                className="w-full py-2 text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                Show {insights.length - 2} more insights
              </button>
            )}
          </div>
        )}
      </div>

      {/* Expand/collapse button */}
      <button
        onClick={handleExpandClick}
        className="
          w-full py-2 flex items-center justify-center gap-1
          text-xs text-slate-500 hover:text-slate-400
          border-t border-slate-800
          transition-colors
        "
      >
        {expanded ? <>
          <ChevronUp className="w-4 h-4" />
          Less details
        </> : <>
          <ChevronDown className="w-4 h-4" />
          AI insights
        </>}
      </button>
    </div>
  );
};

// Export memoized version to prevent unnecessary re-renders
export const SmartMetricCard = React.memo(SmartMetricCardComponent);

// Grid container for smart metrics
export function SmartMetricGrid({
  children,
  className = '',
  columns = 4
}: {
  children: React.ReactNode;
  className?: string;
  columns?: 2 | 3 | 4;
}) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-4 ${className}`}>
      {children}
    </div>
  );
}

export default SmartMetricCard;