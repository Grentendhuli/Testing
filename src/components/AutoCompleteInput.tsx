import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Check, X, Sparkles, UserCircle } from 'lucide-react';

export interface AutoCompleteOption {
  id: string;
  value: string;
  label: string;
  confidence: number;
  source: 'ai' | 'history' | 'template';
  metadata?: Record<string, any>;
}

export interface AutoCompleteInputProps {
  id?: string;
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'textarea' | 'number' | 'email' | 'select';
  context?: {
    page?: string;
    unitId?: string;
    tenantId?: string;
    formType?: string;
    previousValues?: Record<string, any>;
  };
  getSuggestions?: (fieldName: string, input: string, context?: any) => Promise<AutoCompleteOption[]>;
  aiEnabled?: boolean;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  rows?: number;
  maxLength?: number;
  helpText?: string;
}

// Mock AI suggestion engine
const mockGetSuggestions = async (
  fieldName: string, 
  input: string, 
  context?: any
): Promise<AutoCompleteOption[]> => {
  await new Promise(resolve => setTimeout(resolve, 150));
  
  const suggestions: Record<string, AutoCompleteOption[]> = {
    'description': [
      { 
        id: '1', 
        value: 'Water leak in bathroom ceiling', 
        label: 'Water leak in bathroom ceiling', 
        confidence: 92, 
        source: 'ai',
        metadata: { priority: 'high', category: 'plumbing' }
      },
      { 
        id: '2', 
        value: 'Heating not working - unit is cold', 
        label: 'Heating not working - unit is cold', 
        confidence: 88, 
        source: 'history' 
      },
      { 
        id: '3', 
        value: 'Kitchen faucet dripping', 
        label: 'Kitchen faucet dripping', 
        confidence: 85, 
        source: 'template' 
      }
    ],
    'message': [
      {
        id: '1',
        value: 'Hi, just a friendly reminder that rent is due on the 1st. Please let me know if you have any questions!',
        label: 'Gentle rent reminder',
        confidence: 94,
        source: 'ai',
        metadata: { tone: 'friendly' }
      },
      {
        id: '2',
        value: 'Your rent payment of $2,400 is now 3 days overdue. Please submit payment as soon as possible.',
        label: 'Formal late notice',
        confidence: 89,
        source: 'template',
        metadata: { tone: 'formal' }
      },
      {
        id: '3',
        value: 'Thanks for being such a great tenant! Quick reminder about the lease renewal coming up in 60 days.',
        label: 'Lease renewal prompt',
        confidence: 91,
        source: 'ai',
        metadata: { tone: 'friendly' }
      }
    ],
    'amount': [
      { id: '1', value: '2400', label: '$2,400 - Current rent', confidence: 95, source: 'ai' },
      { id: '2', value: '2520', label: '$2,520 - With 5% increase', confidence: 78, source: 'ai' },
      { id: '3', value: '2300', label: '$2,300 - Previous rent', confidence: 70, source: 'history' }
    ],
    'priority': [
      { id: '1', value: 'high', label: 'High Priority', confidence: 88, source: 'ai', metadata: { reason: 'Water damage detected' } },
      { id: '2', value: 'medium', label: 'Medium Priority', confidence: 65, source: 'ai' },
      { id: '3', value: 'low', label: 'Low Priority', confidence: 45, source: 'template' }
    ]
  };

  return suggestions[fieldName] || [];
};

export function AutoCompleteInput({
  id,
  label,
  placeholder,
  value,
  onChange,
  type = 'text',
  context,
  getSuggestions = mockGetSuggestions,
  aiEnabled = true,
  className = '',
  disabled = false,
  required = false,
  rows = 4,
  maxLength,
  helpText
}: AutoCompleteInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<AutoCompleteOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch suggestions when input changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!aiEnabled || value.length < 2 || !context?.formType) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await getSuggestions(context.formType, value, context);
        setSuggestions(results.filter(s => s.confidence > 50));
        setSelectedIndex(0);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Set new timer
    debounceTimerRef.current = setTimeout(fetchSuggestions, 200);
    
    // Cleanup on unmount or when dependencies change
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, [value, context, getSuggestions, aiEnabled]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setShowSuggestions(true);
  };

  const handleSelectSuggestion = (suggestion: AutoCompleteOption) => {
    onChange(suggestion.value);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (showSuggestions) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
      case 'Tab':
        if (suggestions.length > 0 && suggestions[0].confidence >= 85) {
          e.preventDefault();
          handleSelectSuggestion(suggestions[0]);
        }
        break;
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'ai': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'history': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'template': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-slate-700 text-slate-400';
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'ai': return 'AI Suggested';
      case 'history': return 'From History';
      case 'template': return 'Template';
      default: return source;
    }
  };

  const InputComponent = type === 'textarea' ? 'textarea' : 'input';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
          {aiEnabled && (
            <span className="inline-flex items-center gap-1 ml-2 text-xs text-amber-400">
              <Sparkles className="w-3 h-3" />
              AI-assisted
            </span>
          )}
        </label>
      )}
      
      <div className="relative">
        <InputComponent
          ref={inputRef as any}
          id={id}
          type={type === 'textarea' ? undefined : type}
          rows={type === 'textarea' ? rows : undefined}
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            setIsFocused(true);
            setShowSuggestions(suggestions.length > 0);
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          maxLength={maxLength}
          placeholder={placeholder}
          className={`
            w-full px-4 py-3 
            bg-slate-900/50 border-2 
            ${isFocused ? 'border-amber-500/50' : 'border-slate-700'}
            rounded-lg 
            ${type === 'textarea' ? 'resize-y' : ''}
            text-slate-200 placeholder-slate-500
            focus:outline-none focus:ring-2 focus:ring-amber-500/20
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        />
        
        {/* AI indicator */}
        {aiEnabled && isFocused && isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          </div>
        )}
      </div>
      
      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="
          absolute z-50 w-full mt-2 
          bg-slate-900 border border-slate-700 rounded-lg shadow-xl
          animate-in fade-in slide-in-from-top-2 duration-200
        ">
          <div className="py-2 max-h-60 overflow-y-auto">
            <div className="px-3 py-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center justify-between">
              <span>AI Suggestions</span>
              <span className="text-[10px] normal-case">Press Tab to accept top suggestion</span>
            </div>
            
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.id}
                onClick={() => handleSelectSuggestion(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`
                  w-full px-3 py-2.5 text-left 
                  ${selectedIndex === index ? 'bg-slate-800' : ''}
                  hover:bg-slate-800 transition-colors
                `}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`
                        text-sm truncate
                        ${selectedIndex === index ? 'text-amber-400' : 'text-slate-300'}
                      `}>
                        {suggestion.label}
                      </span>
                      
                      <span className={`
                        shrink-0 text-[10px] px-1.5 py-0.5 rounded-full border
                        ${getSourceColor(suggestion.source)}
                      `}>
                        {suggestion.confidence}%
                      </span>
                    </div>
                    
                    {suggestion.metadata && (
                      <div className="flex items-center gap-2 mt-1">
                        {suggestion.metadata.priority && (
                          <span className={`
                            text-[10px] px-1.5 py-0.5 rounded
                            ${suggestion.metadata.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                              suggestion.metadata.priority === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-slate-700 text-slate-400'}
                          `}>
                            {suggestion.metadata.priority} priority
                          </span>
                        )}
                        {suggestion.metadata.tone && (
                          <span className="text-[10px] text-slate-500">
                            {suggestion.metadata.tone} tone
                          </span>
                        )}
                        {suggestion.metadata.reason && (
                          <span className="text-[10px] text-slate-500">
                            {suggestion.metadata.reason}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Help text */}
      {helpText && (
        <p className="mt-1.5 text-xs text-slate-500">{helpText}</p>
      )}
      
      {/* Character count */}
      {maxLength && value.length > maxLength * 0.8 && (
        <p className={`mt-1.5 text-xs ${value.length > maxLength ? 'text-red-400' : 'text-amber-400'}`}>
          {value.length}/{maxLength} characters
        </p>
      )}
    </div>
  );
}

// Version for multi-select with AI suggestions
export function AutoCompleteSelect({
  label,
  value,
  onChange,
  options,
  aiSuggestion,
  className = ''
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  aiSuggestion?: { value: string; reason: string; confidence: number };
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">
          {label}
        </label>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          w-full px-4 py-3 
          bg-slate-900/50 border-2 border-slate-700 rounded-lg
          text-left text-slate-200
          hover:border-slate-600 focus:border-amber-500/50
          focus:outline-none focus:ring-2 focus:ring-amber-500/20
          transition-all duration-200
        "
      >
        <div className="flex items-center justify-between">
          <span>{options.find(o => o.value === value)?.label || 'Select...'}</span>
          <svg 
            className={`w-5 h-5 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        
        {aiSuggestion && value !== aiSuggestion.value && (
          <div className="mt-2 pt-2 border-t border-slate-800">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange(aiSuggestion.value);
              }}
              className="w-full flex items-start gap-2 p-2 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors text-left"
            >
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-xs font-medium text-amber-400"></span>
                  <span className="text-sm text-slate-300">{aiSuggestion.value}</span>
                  <p className="text-xs text-slate-500 mt-0.5">{aiSuggestion.reason} • {aiSuggestion.confidence}% confident</p>
                </div>
            </button>
          </div>
        )}
      </button>
      
      {isOpen && (
        <div className="
          absolute z-50 w-full mt-2 
          bg-slate-900 border border-slate-700 rounded-lg shadow-xl
        ">
          {options.map(option => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`
                w-full px-4 py-2.5 text-left
                ${value === option.value ? 'bg-amber-500/10 text-amber-400' : 'text-slate-300 hover:bg-slate-800'}
                transition-colors
              `}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default AutoCompleteInput;
