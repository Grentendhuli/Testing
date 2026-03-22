import { useAuth } from '@/features/auth';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Building2, ChevronRight, X } from 'lucide-react';

interface DashboardSetupPromptProps {
  missingFields: string[];
  onDismiss?: () => void;
}

export function DashboardSetupPrompt({ missingFields, onDismiss }: DashboardSetupPromptProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const { userData } = useAuth();
  
  if (isDismissed || missingFields.length === 0) return null;
  
  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
    // Store dismissal in session storage (not critical, can be cleared)
    try {
      sessionStorage.setItem('setup_prompt_dismissed', Date.now().toString());
    } catch {}
  };
  
  // Map field names to user-friendly labels
  const fieldLabels: Record<string, string> = {
    first_name: 'First Name',
    last_name: 'Last Name',
    property_address: 'Property Address',
  };
  
  const completedSteps = 3 - missingFields.length;
  const progressPercent = (completedSteps / 3) * 100;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 mb-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Complete Your Profile</h3>
            <p className="text-sm text-slate-600 mt-0.5">
              You're {completedSteps}/3 steps done. Finish setup to unlock all features.
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleDismiss}
          className="text-slate-400 hover:text-slate-600 p-1"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Progress bar */}
      <div className="mt-4 h-2 bg-amber-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-amber-500 transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      
      {/* Missing fields */}
      <div className="mt-4 flex flex-wrap gap-2">
        {missingFields.map(field => (
          <Link
            key={field}
            to="/config"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-amber-50 hover:border-amber-300 transition-colors"
          >
            <span>+ Add {fieldLabels[field] || field}</span>
            <ChevronRight className="w-4 h-4 text-amber-500" />
          </Link>
        ))}
      </div>
      
      {/* Quick tip */}
      <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
        <Building2 className="w-4 h-4 text-amber-500" />
        <span>Tip: Add your property address to start tracking units</span>
      </div>
    </div>
  );
}
