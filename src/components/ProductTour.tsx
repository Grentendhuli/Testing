import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from './Button';

interface TourStep {
  target: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface ProductTourProps {
  steps?: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
  tourId?: string;
}

const defaultSteps: TourStep[] = [
  {
    target: '[data-tour="units"]',
    title: 'Manage Your Units',
    description: 'View and manage all your rental units in one place. Track occupancy, rent, and tenant information.',
    position: 'bottom',
  },
  {
    target: '[data-tour="add-unit"]',
    title: 'Add New Units',
    description: 'Quickly add new units to your portfolio. Just enter the address and unit details.',
    position: 'bottom',
  },
  {
    target: '[data-tour="dashboard"]',
    title: 'Dashboard Overview',
    description: 'Get a quick overview of your portfolio health, upcoming tasks, and important metrics.',
    position: 'right',
  },
];

// Export default steps for use
export const defaultTourSteps = defaultSteps;

export function ProductTour({ 
  steps = defaultSteps, 
  isOpen, 
  onClose, 
  onComplete,
  tourId = 'default-tour'
}: ProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const calculatePosition = useCallback(() => {
    if (!targetElement) return;

    const rect = targetElement.getBoundingClientRect();
    const step = steps[currentStep];
    const position = step.position || 'bottom';
    
    const tooltipWidth = 320;
    const tooltipHeight = 150;
    const offset = 16;

    let top = 0;
    let left = 0;

    switch (position) {
      case 'bottom':
        top = rect.bottom + offset;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'top':
        top = rect.top - tooltipHeight - offset;
        left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.left - tooltipWidth - offset;
        break;
      case 'right':
        top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
        left = rect.right + offset;
        break;
    }

    // Keep tooltip within viewport
    const padding = 16;
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding));
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding));

    setTooltipPosition({ top, left });
  }, [targetElement, currentStep, steps]);

  useEffect(() => {
    if (isOpen && steps[currentStep]) {
      const element = document.querySelector(steps[currentStep].target);
      setTargetElement(element);
    }
  }, [isOpen, currentStep, steps]);

  useEffect(() => {
    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    return () => window.removeEventListener('resize', calculatePosition);
  }, [calculatePosition]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(`tour-completed-${tourId}`, 'true');
    onComplete?.();
    onClose();
  };

  const handleSkip = () => {
    localStorage.setItem(`tour-completed-${tourId}`, 'skipped');
    onClose();
  };

  if (!isOpen || !steps.length) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with spotlight effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/50"
            onClick={handleSkip}
          >
            {/* Spotlight around target */}
            {targetElement && (
              <div
                className="absolute bg-transparent border-4 border-amber-500 rounded-lg transition-all duration-300"
                style={{
                  top: targetElement.getBoundingClientRect().top - 4,
                  left: targetElement.getBoundingClientRect().left - 4,
                  width: targetElement.getBoundingClientRect().width + 8,
                  height: targetElement.getBoundingClientRect().height + 8,
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                }}
              />
            )}
          </motion.div>

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[160] w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6"
            style={{
              top: tooltipPosition.top,
              left: tooltipPosition.left,
            }}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              <button
                onClick={handleSkip}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              {steps[currentStep]?.title}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              {steps[currentStep]?.description}
            </p>

            {/* Progress dots */}
            <div className="flex items-center gap-1.5 mb-4">
              {steps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`h-1.5 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-6 bg-amber-500'
                      : 'w-1.5 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'
                  }`}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <div className="flex gap-2">
                <Button
                  variant={currentStep === steps.length - 1 ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={handleNext}
                  icon={currentStep === steps.length - 1 ? undefined : <ChevronRight className="w-4 h-4" />}
                >
                  {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Hook to manage tour state
export function useProductTour(tourId: string = 'default-tour') {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already seen or skipped this tour
    const tourStatus = localStorage.getItem(`tour-completed-${tourId}`);
    if (!tourStatus) {
      // Small delay to allow page to fully render
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [tourId]);

  const startTour = () => setIsOpen(true);
  const closeTour = () => setIsOpen(false);
  const resetTour = () => {
    localStorage.removeItem(`tour-completed-${tourId}`);
    setIsOpen(true);
  };

  return {
    isOpen,
    startTour,
    closeTour,
    resetTour,
  };
}

export default ProductTour;
