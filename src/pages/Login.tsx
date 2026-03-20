import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Navigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { analytics } from '../utils/analytics';
import { Building2, Mail, AlertCircle, Loader2, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { LogoMark } from '@/components/LogoMark';

// Google Icon Component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

// Microsoft Icon Component
const MicrosoftIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 23 23">
    <path fill="#f25022" d="M1 1h10v10H1z" />
    <path fill="#00a4ef" d="M12 1h10v10H12z" />
    <path fill="#7fba00" d="M1 12h10v10H1z" />
    <path fill="#ffb900" d="M12 12h10v10H12z" />
  </svg>
);

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { signInWithGoogle, signInWithMicrosoft, login, isAuthenticated, isInitialized, isLoading } = useAuth();
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);
  
  // UI state
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isMicrosoftLoading, setIsMicrosoftLoading] = useState(false);
  
  // Resend timer state
  const [resendTimer, setResendTimer] = useState(0);
  const [canResend, setCanResend] = useState(true);
  
  // Get return URL from query params or location state
  const returnUrl = searchParams.get('return') || 
                    (location.state as any)?.from || 
                    '/dashboard';

  // Track page view
  useEffect(() => {
    analytics.trackPageView('/login', 'Login Page');
    analytics.trackEvent('login_started', { return_url: returnUrl });
  }, [returnUrl]);

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

  // Show loading while auth initializes
  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-amber-500 mx-auto" />
          <p className="mt-4 text-slate-600 dark:text-slate-400 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if already authenticated
  if (isAuthenticated) {
    console.log('[Login] User already authenticated, redirecting to:', returnUrl);
    return <Navigate to={returnUrl} replace />;
  }

  // Real-time email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Real-time password validation
  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    
    analytics.trackEvent('login_started', { 
      method: 'magic_link', 
      email_domain: email.split('@')[1] 
    });
    
    try {
      const { supabase } = await import('../lib/supabase');
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin + '/auth/callback',
        },
      });
      
      if (error) throw error;
      
      setIsSubmitting(false);
      analytics.trackEvent('magic_link_sent', { email_domain: email.split('@')[1] });
      setSuccessMessage('Check your email — we sent you a magic link to sign in!');
      
      // Start 60-second resend timer
      setResendTimer(60);
      setCanResend(false);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      analytics.trackEvent('login_failed', { method: 'magic_link', error: err.message });
      setIsSubmitting(false);
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    // Validation
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters');
      return;
    }
    
    setIsSubmitting(true);
    
    analytics.trackEvent('login_started', { 
      method: 'password', 
      email_domain: email.split('@')[1] 
    });
    
    try {
      const { error } = await login(email, password);
      
      if (error) throw error;
      
      analytics.trackEvent('login_success', { method: 'password' });
      // Auth state change will handle redirect
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
      analytics.trackEvent('login_failed', { method: 'password', error: err.message });
      setIsSubmitting(false);
    }
  };

  const handleResendMagicLink = async () => {
    if (!canResend || resendTimer > 0) return;
    
    setError('');
    setIsSubmitting(true);
    
    try {
      const { supabase } = await import('../lib/supabase');
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin + '/auth/callback',
        },
      });
      
      if (error) throw error;
      
      setSuccessMessage('New magic link sent! Check your email.');
      setResendTimer(60);
      setCanResend(false);
      setIsSubmitting(false);
    } catch (err: any) {
      setError(err.message || 'Failed to resend magic link. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setSuccessMessage('');
    setIsGoogleLoading(true);
    
    analytics.trackEvent('login_started', { method: 'google' });

    try {
      await signInWithGoogle();
      // OAuth will redirect to callback page - no need to handle success here
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
      analytics.trackEvent('login_failed', { method: 'google', error: err.message });
      setIsGoogleLoading(false);
    }
  };

  const handleMicrosoftSignIn = async () => {
    setError('');
    setSuccessMessage('');
    setIsMicrosoftLoading(true);
    
    analytics.trackEvent('login_started', { method: 'microsoft' });

    try {
      await signInWithMicrosoft();
      // OAuth will redirect to callback page - no need to handle success here
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Microsoft');
      analytics.trackEvent('login_failed', { method: 'microsoft', error: err.message });
      setIsMicrosoftLoading(false);
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
          <p className="text-slate-500 dark:text-slate-400">Welcome back</p>
        </div>

        {/* Auth Card */}
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

          {/* OAuth Buttons */}
          <div className="space-y-3">
            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full py-3 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
            >
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
            </button>

            {/* Microsoft Sign In */}
            <button
              onClick={handleMicrosoftSignIn}
              disabled={isMicrosoftLoading}
              className="w-full py-3 px-4 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-3"
            >
              {isMicrosoftLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <MicrosoftIcon />
              )}
              {isMicrosoftLoading ? 'Connecting...' : 'Continue with Microsoft'}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300 dark:border-slate-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={useMagicLink ? handleMagicLink : handlePasswordLogin} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email
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

            {/* Password Field - Only show when not using magic link */}
            {!useMagicLink && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    className={`w-full pl-10 pr-12 py-3 bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-colors ${
                      error && password.length > 0 && !validatePassword(password)
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                        : 'border-slate-300 dark:border-slate-700'
                    }`}
                    placeholder="Enter your password"
                    required={!useMagicLink}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {password.length > 0 && !validatePassword(password) && (
                  <p className="text-xs text-red-500 mt-1">Password must be at least 8 characters</p>
                )}
              </div>
            )}

            {/* Remember Me & Forgot Password - Only for password login */}
            {!useMagicLink && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm text-amber-600 dark:text-amber-400 hover:underline font-medium"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || (!useMagicLink && (!validateEmail(email) || !validatePassword(password)))}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {useMagicLink ? 'Sending magic link...' : 'Signing in...'}
                </>
              ) : (
                useMagicLink ? 'Send Magic Link' : 'Sign In'
              )}
            </button>

            {/* Resend Timer for Magic Link */}
            {useMagicLink && successMessage && (
              <div className="text-center">
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendMagicLink}
                    disabled={isSubmitting}
                    className="text-sm text-amber-600 dark:text-amber-400 hover:underline font-medium"
                  >
                    Didn't receive it? Resend magic link
                  </button>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Resend available in {formatResendTime(resendTimer)}
                  </p>
                )}
              </div>
            )}
          </form>

          {/* Toggle between Magic Link and Password */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setUseMagicLink(!useMagicLink);
                setError('');
                setSuccessMessage('');
              }}
              className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              {useMagicLink ? (
                <span>
                  Prefer to use a password?{' '}
                  <span className="text-amber-600 dark:text-amber-400 font-medium hover:underline">
                    Sign in with password
                  </span>
                </span>
              ) : (
                <span>
                  Prefer a passwordless login?{' '}
                  <span className="text-amber-600 dark:text-amber-400 font-medium hover:underline">
                    Use magic link
                  </span>
                </span>
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <button
                onClick={() => navigate('/signup')}
                className="text-amber-600 dark:text-amber-400 hover:underline font-medium"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center mt-6 text-sm text-slate-500 dark:text-slate-400">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
