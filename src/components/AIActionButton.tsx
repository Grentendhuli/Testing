import React, { useState } from 'react';
import { Sparkles, Loader2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { ConfidenceBadge, ConfidenceIndicator } from './ConfidenceBadge';

export interface AIActionButtonProps {
  children: React.ReactNode;
  onAction: () => void | Promise<void>;
  confidence: number;
  reasoning?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showConfidence?: boolean;
  requireConfirmation?: boolean;
  disabled?: boolean;
  className?: string;
  successMessage?: string;
  confirmLabel?: string;
  rejectLabel?: string;
  icon?: React.ReactNode;
}

export function AIActionButton({
  children,
  onAction,
  confidence,
  reasoning,
  variant = 'primary',
  size = 'md',
  showConfidence = true,
  requireConfirmation = false,
  disabled = false,
  className = '',
  successMessage = 'Done!',
  confirmLabel = 'Yes, do it',
  rejectLabel = 'No, skip',
  icon
}: AIActionButtonProps) {
  const [state, setState] = useState<'idle' | 'confirming' | 'executing' | 'success'>('idle');
  const [showReasoning, setShowReasoning] = useState(false);

  const isHighConfidence = confidence >= 80;
  const needsConfirmation = requireConfirmation || !isHighConfidence;

  const handleClick = () => {
    if (needsConfirmation && state === 'idle') {
      setState('confirming');
      return;
    }
    executeAction();
  };

  const executeAction = async () => {
    setState('executing');
    try {
      await onAction();
      setState('success');
      setTimeout(() => setState('idle'), 2000);
    } catch (error) {
      setState('idle');
    }
  };

  const handleCancel = () => {
    setState('idle');
    setShowReasoning(false);
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  // Variant classes
  const variantClasses = {
    primary: 'bg-amber-500 hover:bg-amber-400 text-slate-900 font-medium',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-400 hover:text-slate-200'
  };

  // Rendering different states
  if (state === 'confirming') {
    return (
      <div className={`
        animate-in fade-in slide-in-from-bottom-2 duration-200
        bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3
        ${className}
      `}>
        {/* Confirmation prompt */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg shrink-0">
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-200 font-medium">AI Suggestion</p>
            <p className="text-slate-400 text-sm mt-1">{children}</p>
            
            {/* Reasoning toggle */}
            {reasoning && (
              <button
                onClick={() => setShowReasoning(!showReasoning)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 mt-2"
              >
                {showReasoning ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                {showReasoning ? 'Hide reasoning' : 'Why this suggestion?'}
              </button>
            )}
          </div>
        </div>

        {/* Reasoning expand */}
        {showReasoning && reasoning && (
          <div className="text-sm text-slate-400 bg-slate-900/50 rounded-lg p-3 border border-slate-700">
            {reasoning}
          </div>
        )}

        {/* Confidence indicator */}
        <div className="flex items-center justify-between">
          <ConfidenceIndicator confidence={confidence} />
          
          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              {rejectLabel}
            </button>
            <button
              onClick={executeAction}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (state === 'executing') {
    return (
      <button
        disabled
        className={`
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          rounded-lg flex items-center justify-center gap-2
          opacity-75 cursor-not-allowed
          ${className}
        `}
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Thinking...</span>
      </button>
    );
  }

  if (state === 'success') {
    return (
      <button
        disabled
        className={`
          ${sizeClasses[size]}
          bg-emerald-500/20 text-emerald-400 border border-emerald-500/30
          rounded-lg flex items-center justify-center gap-2
          animate-in fade-in zoom-in-95 duration-200
          ${className}
        `}
      >
        <Check className="w-4 h-4" />
        <span>{successMessage}</span>
      </button>
    );
  }

  // Idle state - main button
  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        group relative
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-lg flex items-center gap-2
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {/* AI Glow effect for high confidence */}
      {isHighConfidence && variant === 'primary' && (
        <div className="absolute inset-0 rounded-lg bg-amber-400/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
      
      <span className="relative flex items-center gap-2">
        {icon || <Sparkles className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} ${isHighConfidence ? 'text-amber-200' : ''}`} />}
        {children}
      </span>
      
      {/* Confidence badge inline */}
      {showConfidence && !isHighConfidence && (
        <span className={`
          ml-1 px-1.5 py-0.5 rounded text-[10px] font-medium
          ${confidence >= 70 ? 'bg-blue-500/20 text-blue-400' :
            confidence >= 50 ? 'bg-amber-500/20 text-amber-400' :
            'bg-slate-500/20 text-slate-400'}
        `}>
          {confidence}%
        </span>
      )}
    </button>
  );
}

// Simplified version for inline use
export function AIActionButtonCompact({
  onClick,
  confidence,
  label,
  disabled
}: {
  onClick: () => void;
  confidence: number;
  label: string;
  disabled?: boolean;
}) {
  const color = confidence >= 80 ? 'text-amber-400' : 
                confidence >= 60 ? 'text-blue-400' : 'text-slate-400';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center gap-1.5 px-2 py-1 
        text-xs font-medium text-slate-300 
        bg-slate-800 hover:bg-slate-700 rounded 
        transition-colors disabled:opacity-50
      `}
    >
      <Sparkles className={`w-3 h-3 ${color}`} />
      <span>{label}</span>
      <span className={`text-[10px] ${color}`}>{confidence}%</span>
    </button>
  );
}

export default AIActionButton;
