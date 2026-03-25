import React, { useState, useEffect } from 'react';
import { X, Home, Users, Sparkles, ChevronRight, CheckCircle } from 'lucide-react';
import { Button } from './Button';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddUnit: () => void;
}

const steps = [
  {
    id: 'welcome',
    title: 'Welcome to LandlordBot!',
    description: 'Built by a 10-year NYC landlord to make property management effortless.',
    icon: Sparkles,
  },
  {
    id: 'add-unit',
    title: 'Add Your First Unit',
    description: 'Start by adding your first property. AI will track everything automatically.',
    icon: Home,
  },
  {
    id: 'explore',
    title: 'Explore AI Features',
    description: 'Try the AI assistant, maintenance triage, and rent reminders.',
    icon: Users,
  },
];

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  isOpen,
  onClose,
  onAddUnit,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onClose();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleAddUnit = () => {
    onAddUnit();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">{step.title}</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Progress dots */}
          <div className="flex gap-2 mt-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 mb-4">
              <Icon className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-slate-600">{step.description}</p>
          </div>

          {/* Step-specific actions */}
          {step.id === 'add-unit' && (
            <Button
              onClick={handleAddUnit}
              className="w-full gap-2"
              size="lg"
            >
              <Home className="w-5 h-5" />
              Add Your First Unit
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}

          {step.id === 'explore' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                AI Maintenance Triage
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                Smart Rent Reminders
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                Lead Scoring
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {currentStep > 0 && (
              <Button
                onClick={() => setCurrentStep(prev => prev - 1)}
                variant="outline"
                className="flex-1"
              >
                Back
              </Button>
            )}
            
            {step.id !== 'add-unit' && (
              <Button
                onClick={handleNext}
                className="flex-1"
                size="lg"
              >
                {isLastStep ? 'Get Started' : 'Next'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;