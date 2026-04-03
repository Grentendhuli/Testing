import { MessageSquare, X, Send, Bug, Lightbulb, MessageCircle, Check } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import React from 'react';

type FeedbackType = 'bug' | 'feature' | 'general';

interface FeedbackItem {
  id: string;
  type: FeedbackType;
  message: string;
  timestamp: number;
  userAgent: string;
  url: string;
}

const feedbackTypes: { type: FeedbackType; label: string; icon: typeof Bug; description: string }[] = [
  { type: 'bug', label: 'Bug Report', icon: Bug, description: 'Something is not working correctly' },
  { type: 'feature', label: 'Feature Request', icon: Lightbulb, description: 'Suggest a new feature or improvement' },
  { type: 'general', label: 'General Feedback', icon: MessageCircle, description: 'Share your thoughts or ask a question' },
];

export function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Listen for custom open event from BetaBanner
  useEffect(() => {
    const handleOpenFeedback = () => setIsOpen(true);
    window.addEventListener('openFeedback', handleOpenFeedback);
    return () => window.removeEventListener('openFeedback', handleOpenFeedback);
  }, []);

  // Handle ESC key to close modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const feedback: FeedbackItem = {
      id: crypto.randomUUID(),
      type: selectedType,
      message: message.trim(),
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Store in localStorage with safe parsing
    let existingFeedback: FeedbackItem[] = [];
    try {
      const saved = localStorage.getItem('feedback_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          existingFeedback = parsed;
        }
      }
    } catch (e) {
      console.error('Error parsing feedback history:', e);
      existingFeedback = [];
    }
    localStorage.setItem('feedback_history', JSON.stringify([feedback, ...existingFeedback]));

    setIsSubmitting(false);
    setShowSuccess(true);
    setMessage('');

    // Reset success message after 3 seconds and close modal
    setTimeout(() => {
      setShowSuccess(false);
      setIsOpen(false);
    }, 2500);
  };

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium rounded-full shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-200 hover:scale-105 active:scale-95"
        aria-label="Open feedback form"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="hidden sm:inline">Feedback</span>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="feedback-title"
        >
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h2 id="feedback-title" className="text-lg font-semibold text-slate-100">Send Feedback</h2>
                  <p className="text-sm text-slate-500">Help us improve your experience</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                aria-label="Close feedback form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success State */}
            {showSuccess ? (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Check className="w-8 h-8 text-emerald-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-100 mb-2">Thanks for your feedback!</h3>
                <p className="text-slate-400">We appreciate your input and will review it shortly.</p>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
                {/* Feedback Type Selection */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-300">Feedback Type</label>
                  <div className="grid grid-cols-1 gap-2">
                    {feedbackTypes.map((type) => {
                      const Icon = type.icon;
                      const isSelected = selectedType === type.type;
                      return (
                        <button
                          key={type.type}
                          type="button"
                          onClick={() => setSelectedType(type.type)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-all duration-200 ${
                            isSelected
                              ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
                              : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600 hover:bg-slate-800'
                          }`}
                        >
                          <Icon className={`w-5 h-5 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} />
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${isSelected ? 'text-slate-200' : 'text-slate-300'}`}>
                              {type.label}
                            </p>
                            <p className="text-xs text-slate-500">{type.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Message Textarea */}
                <div className="space-y-2">
                  <label htmlFor="feedback-message" className="block text-sm font-medium text-slate-300">
                    Your Feedback
                  </label>
                  <textarea
                    id="feedback-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what's on your mind..."
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all resize-none"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!message.trim() || isSubmitting}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-slate-950 font-medium rounded-lg transition-all duration-200"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Feedback
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
