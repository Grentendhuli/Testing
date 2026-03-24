import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Command, Search, Sparkles, Clock, ArrowRight, X, 
  MessageSquare, Wrench, DollarSign, FileText, Calendar,
  User, Building2, Bell, TrendingUp, ChevronRight,
  Loader2, Check, Zap
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  action: () => void;
  shortcut?: string;
  aiGenerated?: boolean;
}

interface AICommand {
  id: string;
  input: string;
  interpreted: string;
  confidence: number;
  action: () => void;
  timestamp: Date;
}

interface AICommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onCommand?: (command: string) => void;
}

// Command categories
const categories = [
  { id: 'actions', label: 'Quick Actions', icon: Zap },
  { id: 'unit', label: 'Unit Management', icon: Building2 },
  { id: 'tenant', label: 'Tenant', icon: User },
  { id: 'financial', label: 'Financial', icon: DollarSign },
  { id: 'maintenance', label: 'Maintenance', icon: Wrench },
  { id: 'recent', label: 'Recent', icon: Clock },
];

export function AICommandPalette({ isOpen, onClose, onCommand }: AICommandPaletteProps) {
  const [input, setInput] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState<{
    raw: string;
    interpreted: string;
    confidence: number;
  } | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);

  // Track mounted state for async cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Mock recent commands (would come from localStorage/context)
  const [recentCommands, setRecentCommands] = useState<AICommand[]>([
    {
      id: '1',
      input: 'Send late rent reminder to tenant 3A',
      interpreted: 'Send rent reminder to Unit 3A tenant',
      confidence: 92,
      action: () => console.log('Sending reminder'),
      timestamp: new Date(Date.now() - 1000 * 60 * 30) // 30 min ago
    },
    {
      id: '2',
      input: 'Mark maintenance request #45 as completed',
      interpreted: 'Update maintenance status',
      confidence: 88,
      action: () => console.log('Marking complete'),
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2) // 2 hours ago
    }
  ]);

  // Mock all available commands
  const allCommands: CommandItem[] = [
    {
      id: 'text-tenant',
      label: 'Text Tenant',
      description: 'Send message to a specific tenant',
      icon: <MessageSquare className="w-4 h-4" />,
      category: 'tenant',
      action: () => onCommand?.('open_tenant_message'),
      shortcut: '⌘T'
    },
    {
      id: 'view-rent',
      label: 'View Rent Status',
      description: 'Check payment status for all units',
      icon: <DollarSign className="w-4 h-4" />,
      category: 'financial',
      action: () => onCommand?.('navigate_rent'),
      shortcut: '⌘R'
    },
    {
      id: 'new-maintenance',
      label: 'New Maintenance Request',
      description: 'Create a new maintenance ticket',
      icon: <Wrench className="w-4 h-4" />,
      category: 'maintenance',
      action: () => onCommand?.('open_maintenance_form'),
      shortcut: '⌘M'
    },
    {
      id: 'view-units',
      label: 'View All Units',
      description: 'See occupancy and details',
      icon: <Building2 className="w-4 h-4" />,
      category: 'unit',
      action: () => onCommand?.('navigate_units'),
    },
    {
      id: 'view-leases',
      label: 'Lease Renewals',
      description: 'See upcoming lease expirations',
      icon: <FileText className="w-4 h-4" />,
      category: 'unit',
      action: () => onCommand?.('navigate_leases'),
    },
    {
      id: 'send-reminder',
      label: 'Send Rent Reminders',
      description: 'AI: Send reminders to late tenants',
      icon: <Bell className="w-4 h-4" />,
      category: 'actions',
      action: () => onCommand?.('send_reminders'),
      aiGenerated: true
    },
    {
      id: 'optimize-rent',
      label: 'Analyze Rent Pricing',
      description: 'AI: Check if units are at market rate',
      icon: <TrendingUp className="w-4 h-4" />,
      category: 'actions',
      action: () => onCommand?.('analyze_rent'),
      aiGenerated: true
    },
  ];

  // Filter commands based on input
  const filteredCommands = input.length > 0
    ? allCommands.filter(cmd => 
        cmd.label.toLowerCase().includes(input.toLowerCase()) ||
        cmd.description.toLowerCase().includes(input.toLowerCase())
      )
    : allCommands.filter(cmd => cmd.category !== 'recent');

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  // Simulate AI interpretation
  const simulateAIInterpretation = useCallback(async (text: string) => {
    if (text.length < 3) {
      setAiInterpretation(null);
      return;
    }

    setIsProcessing(true);
    
    // Simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 600));

    // Check if component is still mounted before updating state
    if (!isMountedRef.current) return;

    // Mock AI interpretation
    const interpretations: Record<string, { interpreted: string; confidence: number; action: () => void }> = {
      'text': {
        interpreted: 'Send message to tenant',
        confidence: 94,
        action: () => onCommand?.('open_tenant_message')
      },
      'remind': {
        interpreted: 'Send rent payment reminder',
        confidence: 91,
        action: () => onCommand?.('send_reminders')
      },
      'late': {
        interpreted: 'View late payments / send reminders',
        confidence: 89,
        action: () => onCommand?.('navigate_rent')
      },
      'fix': {
        interpreted: 'Create maintenance request',
        confidence: 87,
        action: () => onCommand?.('open_maintenance_form')
      },
      'broken': {
        interpreted: 'Create maintenance request',
        confidence: 85,
        action: () => onCommand?.('open_maintenance_form')
      },
      'lease': {
        interpreted: 'View or manage lease agreements',
        confidence: 92,
        action: () => onCommand?.('navigate_leases')
      },
      'renew': {
        interpreted: 'Process lease renewal',
        confidence: 88,
        action: () => onCommand?.('navigate_leases')
      }
    };

    // Find matching interpretation
    const match = Object.entries(interpretations).find(([key]) => 
      text.toLowerCase().includes(key)
    );

    if (match) {
      setAiInterpretation({
        raw: text,
        interpreted: match[1].interpreted,
        confidence: match[1].confidence
      });
    } else {
      setAiInterpretation({
        raw: text,
        interpreted: 'Searching commands...',
        confidence: 0
      });
    }

    if (isMountedRef.current) {
      setIsProcessing(false);
    }
  }, [onCommand]);

  // Handle input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      simulateAIInterpretation(input);
    }, 300);
    return () => clearTimeout(timer);
  }, [input, simulateAIInterpretation]);

  // Focus input on open
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    if (isOpen) {
      timeoutId = setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setInput('');
      setAiInterpretation(null);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          const command = filteredCommands[selectedIndex];
          if (command) {
            executeCommand(command);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  const executeCommand = (command: CommandItem) => {
    command.action();
    
    // Add to recent
    const newCommand: AICommand = {
      id: Date.now().toString(),
      input: command.label,
      interpreted: command.description,
      confidence: command.aiGenerated ? 90 : 100,
      action: command.action,
      timestamp: new Date()
    };
    
    setRecentCommands(prev => [newCommand, ...prev].slice(0, 5));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Command palette */}
      <div 
        ref={containerRef}
        className="relative w-full max-w-2xl mx-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header with input */}
        <div className="border-b border-slate-800">
          <div className="flex items-center gap-3 px-4 py-4">
            {isProcessing ? (
              <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
            ) : aiInterpretation ? (
              <Sparkles className="w-5 h-5 text-amber-400" />
            ) : (
              <Search className="w-5 h-5 text-slate-500" />
            )}
            
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="What would you like to do? (e.g., 'Text tenant 3A about late rent')"
              className="flex-1 bg-transparent text-slate-100 placeholder-slate-500 text-base outline-none"
            />
            
            {input && (
              <button
                onClick={() => {
                  setInput('');
                  inputRef.current?.focus();
                }}
                className="p-1 text-slate-500 hover:text-slate-300 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <span className="px-1.5 py-0.5 bg-slate-800 rounded">ESC</span>
              <span>to close</span>
            </div>
          </div>

          {/* AI interpretation */}
          {aiInterpretation && aiInterpretation.confidence > 0 && (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-300">
                    AI understood: <span className="text-amber-400 font-medium">{aiInterpretation.interpreted}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <div className={`w-2 h-2 rounded-full ${
                    aiInterpretation.confidence >= 90 ? 'bg-emerald-500' :
                    aiInterpretation.confidence >= 70 ? 'bg-blue-500' : 'bg-amber-500'
                  }`} />
                  <span className="text-slate-500">{aiInterpretation.confidence}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Commands list */}
        <div className="max-h-[50vh] overflow-y-auto">
          {/* Recent commands */}
          {recentCommands.length > 0 && !input && (
            <div className="py-2">
              <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Recent Commands
              </div>
              {recentCommands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={() => executeCommand({
                    id: cmd.id,
                    label: cmd.input,
                    description: cmd.interpreted,
                    icon: <Clock className="w-4 h-4" />,
                    category: 'recent',
                    action: cmd.action
                  })}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2.5 text-left
                    hover:bg-slate-800 transition-colors
                    ${selectedIndex === index ? 'bg-slate-800' : ''}
                  `}
                >
                  <div className="w-4 h-4 text-slate-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-200 truncate">{cmd.input}</p>
                    <p className="text-xs text-slate-500">
                      {cmd.interpreted} • {cmd.confidence}% confident
                    </p>
                  </div>
                  <div className="text-xs text-slate-600">
                    {Math.floor((Date.now() - cmd.timestamp.getTime()) / 60000)} min ago
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* AI suggestions based on input */}
          {filteredCommands.length > 0 && (
            <div className="py-2">
              {!input && (
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Available Commands
                </div>
              )}
              
              {Object.entries(groupedCommands).map(([category, commands]) => (
                <div key={category}>
                  {input && (
                    <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      {categories.find(c => c.id === category)?.label || category}
                    </div>
                  )}
                  
                  {commands.map((command) => {
                    const globalIndex = filteredCommands.indexOf(command);
                    const isSelected = selectedIndex === globalIndex;
                    
                    return (
                      <button
                        key={command.id}
                        onClick={() => executeCommand(command)}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                        className={`
                          w-full flex items-center gap-3 px-4 py-2.5 text-left
                          transition-colors group
                          ${isSelected ? 'bg-amber-500/10 border-r-2 border-amber-500' : 'hover:bg-slate-800'}
                        `}
                      >
                        <div className={`
                          w-8 h-8 rounded-lg flex items-center justify-center
                          ${command.aiGenerated ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'}
                          group-hover:bg-slate-700
                        `}>
                          {command.aiGenerated ? <Sparkles className="w-4 h-4" /> : command.icon}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium truncate ${isSelected ? 'text-amber-400' : 'text-slate-200'}`}>
                              {command.label}
                            </p>
                            {command.aiGenerated && (
                              <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-400 rounded">
                                AI
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 truncate">{command.description}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {command.shortcut && (
                            <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-500 rounded">
                              {command.shortcut}
                            </kbd>
                          )}
                          <ArrowRight className={`w-4 h-4 ${isSelected ? 'text-amber-400 opacity-100' : 'text-slate-600 opacity-0'} transition-all`} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
          {input && filteredCommands.length === 0 && (
            <div className="py-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 bg-slate-800 rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-slate-400">No commands found for "{input}"</p>
              <p className="text-sm text-slate-500 mt-1">
                Try saying "Text tenant about rent" or "Create maintenance request"
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              <span>to select</span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1 bg-slate-800 rounded">↑</kbd>
              <kbd className="px-1 bg-slate-800 rounded">↓</kbd>
              <span>to navigate</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>AI-powered suggestions</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Floating button to open command palette
export function AICommandPaletteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="
        fixed bottom-6 right-6 z-40
        flex items-center gap-2 px-4 py-3
        bg-gradient-to-r from-amber-500 to-amber-400
        hover:from-amber-400 hover:to-amber-300
        text-slate-900 font-semibold
        rounded-full shadow-lg shadow-amber-500/30
        transition-all duration-300 hover:scale-105
        hover:shadow-xl hover:shadow-amber-500/40
      "
    >
      <Sparkles className="w-5 h-5" />
      <span>Ask AI</span>
      <kbd className="hidden sm:block px-1.5 py-0.5 text-xs bg-amber-600/30 rounded">
        ⌘K
      </kbd>
    </button>
  );
}

export default AICommandPalette;
