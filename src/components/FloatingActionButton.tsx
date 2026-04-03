import { useState, useEffect, useRef, useCallback } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, DollarSign, Wrench, MessageSquare, Home, X } from 'lucide-react';
import { useNavigate, type NavigateFunction } from 'react-router-dom';

export interface FABAction {
  id: string;
  label: string;
  icon: typeof Plus;
  onClick: () => void;
  color: string;
  bgColor: string;
}

interface FloatingActionButtonProps {
  className?: string;
  actions?: FABAction[];
}

export function createFabActions(navigate: NavigateFunction): FABAction[] {
  return [
    {
      id: 'payment',
      label: 'Add Payment',
      icon: DollarSign,
      onClick: () => navigate('/rent'),
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      id: 'maintenance',
      label: 'Log Maintenance',
      icon: Wrench,
      onClick: () => navigate('/maintenance'),
      color: 'text-rose-600',
      bgColor: 'bg-rose-100',
    },
    {
      id: 'message',
      label: 'Send Message',
      icon: MessageSquare,
      onClick: () => navigate('/messages'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      id: 'unit',
      label: 'Add Unit',
      icon: Home,
      onClick: () => navigate('/units'),
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
  ];
}

const defaultActionsList: FABAction[] = [
  {
    id: 'payment',
    label: 'Add Payment',
    icon: DollarSign,
    onClick: () => {},
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
  },
  {
    id: 'maintenance',
    label: 'Log Maintenance',
    icon: Wrench,
    onClick: () => {},
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
  },
  {
    id: 'message',
    label: 'Send Message',
    icon: MessageSquare,
    onClick: () => {},
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    id: 'unit',
    label: 'Add Unit',
    icon: Home,
    onClick: () => {},
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
];

export function FloatingActionButton({ className = '', actions: customActions }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const menuRef = useRef<HTMLDivElement>(null);

  const actions: FABAction[] = customActions || [
    {
      id: 'payment',
      label: 'Add Payment',
      icon: DollarSign,
      onClick: () => { navigate('/rent'); setIsOpen(false); },
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
    },
    {
      id: 'maintenance',
      label: 'Log Maintenance',
      icon: Wrench,
      onClick: () => { navigate('/maintenance?action=new'); setIsOpen(false); },
      color: 'text-rose-600',
      bgColor: 'bg-rose-100',
    },
    {
      id: 'message',
      label: 'Send Message',
      icon: MessageSquare,
      onClick: () => { navigate('/messages?action=new'); setIsOpen(false); },
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      id: 'unit',
      label: 'Add Unit',
      icon: Home,
      onClick: () => { navigate('/units?action=create'); setIsOpen(false); },
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const toggleMenu = useCallback(() => {
    setIsOpen((prev: boolean) => !prev);
  }, []);

  return (
    <div ref={menuRef} className={`fixed bottom-20 right-4 z-40 sm:bottom-6 ${className}`}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute bottom-16 right-0 flex flex-col gap-3 mb-2"
          >
            {actions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  type="button"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={action.onClick}
                  className="flex items-center gap-3 group"
                >
                  <span className="text-sm font-medium text-white bg-slate-800 px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                    {action.label}
                  </span>
                  <div
                    className={`w-14 h-14 rounded-full ${action.bgColor} ${action.color} flex items-center justify-center shadow-lg active:scale-95 transition-transform duration-150 hover:shadow-xl`}
                    aria-label={action.label}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={toggleMenu}
        className={`
          w-14 h-14 rounded-full 
          ${isOpen ? 'bg-slate-700 rotate-45' : 'bg-amber-500 hover:bg-amber-600'}
          text-white flex items-center justify-center shadow-lg
          active:scale-95 transition-all duration-200
          hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-amber-500/30
          min-h-[56px] min-w-[56px]
        `}
        aria-label={isOpen ? 'Close quick actions' : 'Open quick actions'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>
    </div>
  );
}

export default FloatingActionButton;
