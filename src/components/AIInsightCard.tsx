import React, { useState } from 'react';
import { Sparkles, ChevronDown, ChevronUp, ExternalLink, X } from 'lucide-react';
import { motion } from 'framer-motion';

export interface InsightAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'primary' | 'ghost';
}

export interface AIInsight {
  id: string;
  title: string;
  body: string;
  property?: string;
  severity: 'info' | 'warning' | 'urgent' | 'positive';
  actions?: InsightAction[];
  generatedAt: string;
}

const SEVERITY_STYLES = {
  info:     { border: 'border-lb-blue/30',   badge: 'bg-lb-blue/10 text-lb-blue',    icon: 'text-lb-blue',   dot: 'bg-lb-blue'   },
  warning:  { border: 'border-lb-orange/30', badge: 'bg-lb-orange/10 text-lb-orange', icon: 'text-lb-orange', dot: 'bg-lb-orange' },
  urgent:   { border: 'border-lb-red/30',    badge: 'bg-lb-red/10 text-lb-red',       icon: 'text-lb-red',    dot: 'bg-lb-red'    },
  positive: { border: 'border-lb-green/30',  badge: 'bg-lb-green/10 text-lb-green',   icon: 'text-lb-green',  dot: 'bg-lb-green'  },
};

interface AIInsightCardProps {
  insight: AIInsight;
  onDismiss?: (id: string) => void;
}

export const AIInsightCard = React.memo(function AIInsightCard({ insight, onDismiss }: AIInsightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const styles = SEVERITY_STYLES[insight.severity];
  const preview = insight.body.length > 100 ? insight.body.slice(0, 100) + '...' : insight.body;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className={`relative bg-lb-surface border rounded-2xl p-4 transition-all duration-300 hover:border-opacity-60 ${styles.border}`}
    >
      {onDismiss && (
        <button 
          onClick={() => onDismiss(insight.id)} 
          className="absolute top-3 right-3 p-1 rounded-full text-lb-text-muted hover:text-lb-text-secondary hover:bg-lb-muted transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
      
      <div className="flex items-start gap-3 pr-6">
        <div className={`mt-0.5 p-1.5 rounded-lg bg-lb-muted ${styles.icon}`}>
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles.badge}`}>
              {insight.severity.toUpperCase()}
            </span>
            {insight.property && (
              <span className="text-xs text-lb-text-muted">{insight.property}</span>
            )}
          </div>
          <h3 className="text-sm font-semibold text-lb-text-primary leading-snug">
            {insight.title}
          </h3>
        </div>
      </div>
      
      <div className="mt-3 ml-10">
        <p className="text-sm text-lb-text-secondary leading-relaxed">
          {expanded ? insight.body : preview}
        </p>
        {insight.body.length > 100 && (
          <button 
            onClick={() => setExpanded(!expanded)} 
            className="flex items-center gap-1 text-xs text-lb-text-muted hover:text-lb-text-secondary mt-1 transition-colors"
          >
            {expanded ? <ChevronUp className="w-3 h-3"/> : <ChevronDown className="w-3 h-3"/>}
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
      
      {insight.actions && insight.actions.length > 0 && (
        <div className="flex items-center gap-2 mt-4 ml-10 flex-wrap">
          {insight.actions.map((action, i) => (
            <button 
              key={i} 
              onClick={action.onClick}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-1.5
                ${action.variant === 'ghost' 
                  ? 'bg-lb-muted text-lb-text-secondary hover:bg-lb-border hover:text-lb-text-primary' 
                  : 'bg-lb-orange/20 text-lb-orange hover:bg-lb-orange/30 border border-lb-orange/30'
                }`}
            >
              {action.label}
              {action.href && <ExternalLink className="w-3 h-3"/>}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
});

AIInsightCard.displayName = 'AIInsightCard';
