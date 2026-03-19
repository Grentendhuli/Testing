import { useState, useEffect } from 'react';
import { X, MessageSquare, Star } from 'lucide-react';

export function BetaFeedbackBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the banner
    const dismissed = localStorage.getItem('beta_feedback_dismissed');
    
    // Check account age
    const signupTimestamp = localStorage.getItem('landlord_signup_timestamp');
    const isNewUser = signupTimestamp && (Date.now() - parseInt(signupTimestamp)) < (7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Show if not dismissed and user is new (< 7 days)
    if (!dismissed && isNewUser) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('beta_feedback_dismissed', 'true');
    setIsDismissed(true);
    setTimeout(() => setIsVisible(false), 300);
  };

  const handleFeedbackClick = () => {
    const formUrl = (import.meta as any).env?.VITE_FEEDBACK_FORM_URL || 'https://forms.gle/your-feedback-form';
    window.open(formUrl, '_blank');
    handleDismiss();
  };

  if (!isVisible) return null;

  return (
    <div 
      className={`fixed bottom-4 right-4 z-50 max-w-md bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl shadow-2xl p-4 border border-amber-400 transition-all duration-300 ${
        isDismissed ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
          <MessageSquare className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Star className="w-4 h-4 fill-current" />
            <span className="font-semibold text-sm">Beta Feedback</span>
          </div>
          
          <p className="text-sm text-white/90 mb-3">
            You've been using LandlordBot for a few days. Help us improve with 2 minutes of feedback.
          </p>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleFeedbackClick}
              className="px-4 py-2 bg-white text-amber-600 font-semibold text-sm rounded-lg hover:bg-amber-50 transition-colors"
            >
              Share Feedback
            </button>
            
            <button
              onClick={handleDismiss}
              className="px-4 py-2 text-white/80 hover:text-white text-sm font-medium transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
