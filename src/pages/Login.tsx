import { useState, useEffect } from 'react';
import { useNavigate, Navigate, useSearchParams, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { analytics } from '../utils/analytics';
import { Building2, Mail, Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
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

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, signInWithGoogle, isAuthenticated, isInitialized, isLoading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailBlurred, setEmailBlurred] = useState(false);
  const [passwordBlurred, setPasswordBlurred] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'password' | 'magic'>('password');
  const [showPassword, setShowPassword] = useState(false);
  
  // Get return URL from query params or location state
  const returnUrl = searchParams.get('return') || 
                    (location.state as any)?.from || 
                    '/dashboard';

  // Track page view
  useEffect(() => {
    analytics.trackPageView('/login', 'Login Page');
    analytics.trackEvent('login_started', { return_url: returnUrl });
  }, [returnUrl]);

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

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    analytics.trackEvent('login_started', { 
      method: 'password', 
      email_domain: email.split('@')[1] 
    });
    
    const { error: loginError } = await login(email, password);
    
    if (loginError) {
      setError(loginError.message || 'Invalid email or password');
      analytics.trackEvent('login_failed', { 
        method: 'password', 
        error: loginError.message 
      });
      setIsSubmitting(false);
    } else {
      analytics.trackEvent('login_success', { 
        method: 'password', 
        email_domain: email.split('@')[1] 
      });
      // Navigation happens automatically via auth state change
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
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
      setError('Check your email — we sent you a magic link to sign in!');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      analytics.trackEvent('login_failed', { method: 'magic_link', error: err.message });
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
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
          {/* Error/Success Message */}
          {error && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              error.includes('magic link') 
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800' 
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
                error.includes('magic link')
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`} />
              <p className={`text-sm ${
                error.includes('magic link')
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-red-700 dark:text-red-400'
              }`}>{error}</p>
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
              <GoogleIcon />
              {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
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

          {/* Login Method Tabs */}
          <div className="flex mb-6 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setLoginMethod('password')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
                loginMethod === 'password'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('magic')}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-all ${
                loginMethod === 'magic'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Magic Link
            </button>
          </div>

          {/* Email Form */}
          <form onSubmit={loginMethod === 'password' ? handlePasswordLogin : handleMagicLink} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  name="email"
                  autoComplete="email username"
                  defaultValue={email}
                  onBlur={(e) => {
                    setEmail(e.target.value);
                    setEmailBlurred(true);
                  }}
                  onChange={(e) => {
                    // Only sync state if user has blurred field (autofill case)
                    if (emailBlurred) {
                      setEmail(e.target.value);
                    }
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            {/* Password Field (only for password login) */}
            {loginMethod === 'password' && (
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
                    defaultValue={password}
                    onBlur={(e) => {
                      setPassword(e.target.value);
                      setPasswordBlurred(true);
                    }}
                    onChange={(e) => {
                      if (passwordBlurred) {
                        setPassword(e.target.value);
                      }
                    }}
                    className="w-full pl-10 pr-12 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-colors"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="mt-2 text-right">
                  <Link to="/forgot-password" className="text-sm text-amber-600 dark:text-amber-400 hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-colors"
            >
              {isSubmitting 
                ? (loginMethod === 'password' ? 'Signing in...' : 'Sending magic link...') 
                : (loginMethod === 'password' ? 'Sign In' : 'Send Magic Link')
              }
            </button>
          </form>

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
