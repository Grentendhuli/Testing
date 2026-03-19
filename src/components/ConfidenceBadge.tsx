import { Brain, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';

export interface ConfidenceBadgeProps {
  confidence: number; // 0-100
  showExplanation?: boolean;
  explanation?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ConfidenceBadge({
  confidence,
  showExplanation = false,
  explanation,
  size = 'md',
  className = ''
}: ConfidenceBadgeProps) {
  // Determine color and icon based on confidence level
  const getConfig = (score: number) => {
    if (score >= 90) {
      return {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
        icon: CheckCircle,
        label: 'High Confidence',
        description: 'AI is very confident about this'
      };
    }
    if (score >= 70) {
      return {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30', 
        text: 'text-blue-400',
        icon: Brain,
        label: 'Good Confidence',
        description: 'AI recommends this with minor review'
      };
    }
    if (score >= 50) {
      return {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        text: 'text-amber-400',
        icon: AlertCircle,
        label: 'Needs Review',
        description: 'AI suggests reviewing before confirming'
      };
    }
    return {
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/30',
      text: 'text-slate-400',
      icon: HelpCircle,
      label: 'Low Confidence',
      description: 'AI needs more information or human decision'
    };
  };

  const config = getConfig(confidence);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2'
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <div 
        className={`
          inline-flex items-center rounded-full font-medium
          border ${config.border} ${config.bg} ${config.text}
          ${sizeClasses[size]}
          transition-all duration-200 hover:opacity-80
        `}
        title={config.description}
      >
        <Icon className={iconSizes[size]} />
        <span>{confidence}% confident</span>
      </div>
      
      {showExplanation && explanation && (
        <div className={`text-xs text-slate-500 pl-1 ${size === 'sm' ? 'max-w-[200px]' : 'max-w-[300px]'}`}>
          {explanation}
        </div>
      )}
    </div>
  );
}

// Compact version for inline use
export function ConfidenceBadgeCompact({
  confidence,
  className = ''
}: {
  confidence: number;
  className?: string;
}) {
  const color = confidence >= 90 ? 'text-emerald-400' : 
                confidence >= 70 ? 'text-blue-400' : 
                confidence >= 50 ? 'text-amber-400' : 'text-slate-400';
  
  return (
    <span className={`text-xs font-medium ${color} ${className}`}>
      {confidence}%
    </span>
  );
}

// Visual indicator only (sparkline style)
export function ConfidenceIndicator({
  confidence,
  className = ''
}: {
  confidence: number;
  className?: string;
}) {
  const getColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-500';
    if (score >= 70) return 'bg-blue-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-slate-500';
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor(confidence)} transition-all duration-500`}
          style={{ width: `${confidence}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${getColor(confidence).replace('bg-', 'text-')}`}>
        {confidence}%
      </span>
    </div>
  );
}

export default ConfidenceBadge;
