import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { analytics } from '../utils/analytics';
import { Mail, AlertCircle, Loader2, CheckCircle, ArrowLeft, Lock } from 'lucide-react';
import { LogoMark } from '@/components/LogoMark';

export function ForgotPassword() {
  const navigate = useNavigate();
  
  // Form state
  const [email, setEmail] = useState('');
  
  // UI state
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  
  // Resend timer state
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Track page view
  useEffect(() => {
    analytics.trackPageView('/forgot-password', 'Forgot Password Page');
    analytics.trackEvent('password_reset_started');
  }, []);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => {
        setResendTimer(resendTimer - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  // Real-time email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    
    analytics.trackEvent('password_reset_requested', { 
      email_domain: email.split('@')[1] 
    });
    
    try {
      const { supabase } = await import('../lib/supabase');
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth/callback?type=recovery',
      });
      
      if (error) throw error;
      
      setIsSubmitting(false);
      setEmailSent(true);
      setSuccessMessage(`Password reset link sent to ${email}`);
      analytics.trackEvent('password_reset_email_sent', { 
        email_domain: email.split('@')[1] 
      });
      
      // Start 60-second resend timer
      setResendTimer(60);
      setCanResend(false);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
      analytics.trackEvent('password_reset_failed', { error: err.message });
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resendTimer > 0) return;
    
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);
    
    try {
      const { supabase } = await import('../lib/supabase');
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/auth/callback?type=recovery',
      });
      
      if (error) throw error;
      
      setSuccessMessage(`New reset link sent to ${email}`);
      setResendTimer(60);
      setCanResend(false);
      analytics.trackEvent('password_reset_email_resent', { 
        email_domain: email.split('@')[1] 
      });
    } catch (err: any) {
      setError(err.message || 'Failed to resend reset email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatResendTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <LogoMark size={44} showWordmark={true} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Reset your password
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {!emailSent 
              ? "Enter your email and we'll send you a reset link"
              : 'Check your email for the reset link'
            }
          </p>
        </div>

        {/* Reset Password Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <p className="text-sm text-emerald-700 dark:text-emerald-400">{successMessage}</p>
            </div>
          )}

          {!emailSent ? (
            /* Email Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex items-center justify-center mb-6">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                  <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-colors ${
                      error && !validateEmail(email) && email.length > 0
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                {email.length > 0 && !validateEmail(email) && (
                  <p className="text-xs text-red-500 mt-1">Please enter a valid email address</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !validateEmail(email)}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending reset link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          ) : (
            /* Success State with Resend Option */
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-slate-600 dark:text-slate-400">
                  We've sent a password reset link to:
                </p>
                <p className="font-medium text-slate-900 dark:text-slate-100">
                  {email}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Didn't receive the email? Check your spam folder or:
                </p>
                
                {!canResend ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                    Resend available in {formatResendTime(resendTimer)}
                  </p>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={isSubmitting}
                    className="mt-2 text-sm text-amber-600 dark:text-amber-400 font-medium hover:underline disabled:opacity-50"
                  >
                    {isSubmitting ? 'Resending...' : 'Resend reset link'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Back to Login Link */}
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center justify-center gap-2 w-full text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to login
            </button>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center mt-6 text-sm text-slate-500 dark:text-slate-400">
          Need help?{' '}
          <button
            onClick={() => navigate('/contact')}
            className="text-amber-600 dark:text-amber-400 hover:underline font-medium"
          >
            Contact support
          </button>
        </p>
      </div>
    </div>
  );
}
