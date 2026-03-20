import { useState, useRef, useEffect } from 'react';
import { Plus, X, Home, Wrench, Users, FileText, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FabAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  actions: FabAction[];
  position?: 'bottom-right' | 'bottom-left';
}

export function FloatingActionButton({ actions, position = 'bottom-right' }: FloatingActionButtonProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const positionClasses = position === 'bottom-right' ? 'right-6' : 'left-6';

  return (
    <div ref={containerRef} className={`fixed bottom-6 ${positionClasses} z-50 flex flex-col items-end gap-3`}>
      <AnimatePresence>
        {open && actions.map((action, i) => (
          <motion.button 
            key={i} 
            onClick={() => { action.onClick(); setOpen(false); }}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.2, delay: i * 0.05 }}
            className="flex items-center gap-3 group"
          >
            <span className="bg-lb-surface border border-lb-border text-lb-text-secondary px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
              {action.label}
            </span>
            <div 
              className="w-12 h-12 rounded-full bg-lb-surface border border-lb-border flex items-center justify-center shadow-lg hover:bg-lb-muted transition-colors" 
              style={{ color: action.color || '#F1F5F9' }}
            >
              {action.icon}
            </div>
          </motion.button>
        ))}
      </AnimatePresence>
      
      <motion.button 
        onClick={() => setOpen(!open)}
        whileTap={{ scale: 0.95 }}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 ${open ? 'bg-lb-red' : 'bg-lb-orange hover:bg-lb-orange/90'}`}
      >
        <motion.div
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {open ? <X className="w-6 h-6 text-white" /> : <Plus className="w-6 h-6 text-white" />}
        </motion.div>
      </motion.button>
    </div>
  );
}

// Pre-configured FAB actions for common use cases
export const createFabActions = (navigate: (path: string) => void): FabAction[] => [
  {
    label: 'Add Unit',
    icon: <Home className="w-5 h-5" />,
    onClick: () => navigate('/units?action=add'),
    color: '#3B82F6',
  },
  {
    label: 'Add Maintenance',
    icon: <Wrench className="w-5 h-5" />,
    onClick: () => navigate('/maintenance?action=add'),
    color: '#F59E0B',
  },
  {
    label: 'Create Lease',
    icon: <FileText className="w-5 h-5" />,
    onClick: () => navigate('/leases?action=add'),
    color: '#10B981',
  },
  {
    label: 'Record Payment',
    icon: <DollarSign className="w-5 h-5" />,
    onClick: () => navigate('/rent?action=add'),
    color: '#8B5CF6',
  },
];
