import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { analytics } from '../utils/analytics';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

// Auth callback states
type CallbackState = 'processing' | 'success' | 'error' | 'redirecting';

export function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const [callbackState, setCallbackState] = useState<CallbackState>('processing');
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  // Use refs to prevent duplicate processing
  const processedRef = useRef(false);
  const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
    }
  }, []);

  // Handle successful auth
  const handleSuccess = useCallback((user: any, source: string) => {
    console.log(`[AuthCallback] Success from ${source}:`, user?.email);
    setCallbackState('success');
    
    // Track successful login - map provider to valid signup_method type
    const signupMethod: 'google' | 'microsoft' | 'magic_link' | 'email' = 
      user?.app_metadata?.provider === 'google' ? 'google' : 
      user?.app_metadata?.provider === 'azure' ? 'microsoft' : 
      'magic_link';
    
    analytics.trackEvent('login_success', { method: signupMethod });
    analytics.identifyUser(user.id, { 
      email: user.email || undefined,
      signup_method: signupMethod,
    });
    
    // Delay redirect to ensure auth state propagates
    redirectTimeoutRef.current = setTimeout(() => {
      setCallbackState('redirecting');
      // Use replace to prevent back button issues
      navigate('/dashboard', { replace: true });
    }, 500);
  }, [navigate]);

  // Handle auth error
  const handleError = useCallback((message: string, details?: any) => {
    console.error('[AuthCallback] Error:', message, details);
    setError(message);
    setCallbackState('error');
    analytics.trackEvent('login_failed', { 
      error: message,
      details: details?.toString(),
    });
  }, []);

  // Create user record in database if needed
  const createUserIfNeeded = useCallback(async (user: any) => {
    try {
      // Use upsert so the DB trigger's insert and this insert never conflict
      const { error: upsertError } = await (supabase as any).from('users').upsert({
        id: user.id,
        email: user.email,
        first_name:
          user.user_metadata?.first_name ||
          user.user_metadata?.full_name?.split(' ')[0] ||
          null,
        last_name:
          user.user_metadata?.last_name ||
          user.user_metadata?.full_name?.split(' ').slice(1).join(' ') ||
          null,
        phone_number: user.user_metadata?.phone_number || null,
        property_address: user.user_metadata?.property_address || null,
        subscription_tier: 'free',
        subscription_status: 'active',
        max_units: -1,
        storage_used: 0,
        storage_limit: 1073741824,
      }, {
        onConflict: 'id'
      });

      if (upsertError) {
        console.error('[AuthCallback] upsert error:', upsertError);
      } else {
        // Track new user signup
        const signupMethod: 'google' | 'microsoft' | 'magic_link' | 'email' = 
          user.app_metadata?.provider === 'google' ? 'google' : 
          user.app_metadata?.provider === 'azure' ? 'microsoft' : 
          'magic_link';
        
        // Check if this is a new user by looking at created_at
        const isNewUser = user.created_at && 
          (new Date().getTime() - new Date(user.created_at).getTime()) < 60000; // 1 minute
        
        if (isNewUser) {
          analytics.trackEvent('signup_complete', {
            method: signupMethod,
            email_domain: user.email?.split('@')[1] || 'unknown',
          });
          analytics.trackFunnelStep('signup', 3, 'user_created');
          
          // Create initial unit for new OAuth users
          try {
            const propertyAddress = user.user_metadata?.property_address;
            const { error: unitError } = await (supabase as any)
              .from('units')
              .insert({
                user_id: user.id,
                address: propertyAddress || 'Please update your property address',
                unit_number: '1',
                status: 'vacant',
                rent_amount: 0,
                bedrooms: 0,
                bathrooms: 0,
                square_feet: 0,
              });

            if (unitError) {
              console.error('[AuthCallback] Error creating initial unit:', unitError);
            } else {
              console.log('[AuthCallback] Initial unit created for OAuth user');
            }
          } catch (unitErr) {
            console.error('[AuthCallback] Exception creating initial unit:', unitErr);
          }
        }
      }
    } catch (e) {
      console.error('[AuthCallback] createUserIfNeeded error:', e);
    }
  }, []);

  // Main auth processing effect
  useEffect(() => {
    // Prevent duplicate processing
    if (processedRef.current) {
      console.log('[AuthCallback] Already processed, skipping');
      return;
    }
    processedRef.current = true;

    // Track callback page view
    analytics.trackPageView('/auth/callback', 'Authentication Callback');

    // Collect debug info from URL
    const hash = window.location.hash;
    const query = window.location.search;
    const fullUrl = window.location.href;

    console.log('=== AUTH CALLBACK ===');
    console.log('URL:', fullUrl);
    console.log('Hash:', hash);
    console.log('Query:', query);

    let debug = `URL: ${fullUrl}\n`;
    debug += `Hash: ${hash || '(none)'}\n`;
    debug += `Query: ${query || '(none)'}\n\n`;

    const queryParams = new URLSearchParams(query);
    const hashParams = new URLSearchParams(
      hash.startsWith('#') ? hash.slice(1) : hash
    );

    const urlError = queryParams.get('error');
    const errorDesc = queryParams.get('error_description');
    const code = queryParams.get('code') || hashParams.get('code');

    debug += `Found params:\n`;
    debug += `- error: ${urlError || 'NO'}\n`;
    debug += `- error_description: ${errorDesc || 'NO'}\n`;
    debug += `- code: ${code ? 'YES' : 'NO'}\n`;

    // PKCE debug info
    const codeVerifier = localStorage.getItem('sb-qmnngzevquidtvcopjcu-auth-code-verifier');
    debug += `- code_verifier: ${codeVerifier ? 'YES (in localStorage)' : 'NO (missing!'}\n`;
    debug += `- storage key: lb-auth-token exists: ${!!localStorage.getItem('lb-auth-token')}\n`;

    setDebugInfo(debug);

    // Handle URL errors first
    if (urlError) {
      handleError(`Auth Error: ${errorDesc || urlError}`, { urlError, errorDesc });
      return;
    }

    // Process the auth callback
    const processAuth = async () => {
      try {
        // Supabase with detectSessionInUrl: true should have already processed the OAuth callback
        // We just need to get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          handleError(`Session error: ${sessionError.message}`, sessionError);
          return;
        }

        if (session?.user) {
          console.log('[AuthCallback] Session found immediately:', session.user.email);
          await createUserIfNeeded(session.user);
          handleSuccess(session.user, 'immediate');
          return;
        }

        // If we have a code in URL but no session, manually exchange it
        if (code) {
          console.log('[AuthCallback] Code detected but no session, exchanging...');
          console.log('[AuthCallback] Code value:', code.substring(0, 10) + '...');
          
          // Check if method exists
          if (typeof supabase.auth.exchangeCodeForSession !== 'function') {
            console.error('[AuthCallback] exchangeCodeForSession method not available');
            handleError('Auth method not available. Please refresh and try again.');
            return;
          }
          
          try {
            const { data: { session: exchangedSession }, error: exchangeError } = 
              await supabase.auth.exchangeCodeForSession(code);
            
            if (exchangeError) {
              console.error('[AuthCallback] Exchange error:', exchangeError);
              handleError(`Code exchange failed: ${exchangeError.message}`, exchangeError);
              return;
            }
            
            if (exchangedSession?.user) {
              console.log('[AuthCallback] Session exchanged successfully:', exchangedSession.user.email);
              await createUserIfNeeded(exchangedSession.user);
              handleSuccess(exchangedSession.user, 'code_exchange');
              return;
            } else {
              console.error('[AuthCallback] Exchange succeeded but no session returned');
              handleError('Authentication completed but session not created. Please try again.');
              return;
            }
          } catch (exchangeErr: any) {
            console.error('[AuthCallback] Exchange exception:', exchangeErr);
            handleError(`Exchange error: ${exchangeErr.message || 'Unknown error'}`, exchangeErr);
            return;
          }
        }

        // If no session yet, wait for auth state change
        console.log('[AuthCallback] No session yet, waiting for auth state change...');
        
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log('[AuthCallback] Auth state change:', event, newSession?.user?.email);
            
            if (event === 'SIGNED_IN' && newSession?.user) {
              await createUserIfNeeded(newSession.user);
              handleSuccess(newSession.user, 'auth_state_change');
            }
          }
        );

        // Set a timeout in case auth never completes
        const timeoutId = setTimeout(() => {
          if (callbackState === 'processing') {
            handleError('Authentication timed out. Please try signing in again.');
          }
        }, 10000);

        // Cleanup subscription on unmount
        return () => {
          subscription.unsubscribe();
          clearTimeout(timeoutId);
        };
        
      } catch (err: any) {
        handleError(err.message || 'Unknown error during authentication', err);
      }
    };

    processAuth();

    // Cleanup on unmount
    return cleanup;
  }, [callbackState, createUserIfNeeded, handleError, handleSuccess, cleanup]);

  // Render based on state
  if (callbackState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Authentication Failed
          </h1>
          <p className="text-slate-600 mb-4">{error}</p>

          {debugInfo && (
            <div className="mb-4 p-4 bg-slate-100 rounded-lg text-left">
              <p className="text-xs font-mono text-slate-600 whitespace-pre-wrap break-all">
                {debugInfo}
              </p>
            </div>
          )}

          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 bg-[#1E3A5F] text-white font-semibold rounded-lg hover:bg-[#152942] transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (callbackState === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Authentication Successful!
          </h1>
          <p className="text-slate-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Processing state (default)
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#1E3A5F] mx-auto" />
        <p className="mt-4 text-slate-600 font-medium">Completing sign in...</p>
        <p className="mt-2 text-sm text-slate-500">
          Please wait while we authenticate you
        </p>
        <p className="mt-1 text-xs text-slate-400">
          This may take a few seconds
        </p>
        
        {/* Manual retry button - appears after delay */}
        <div className="mt-6">
          <button
            onClick={() => {
              // Clear processed flag and retry
              processedRef.current = false;
              window.location.reload();
            }}
            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm"
          >
            Retry Authentication
          </button>
          <button
            onClick={() => navigate('/login')}
            className="ml-2 px-4 py-2 text-slate-500 hover:text-slate-700 text-sm"
          >
            Back to Login
          </button>
        </div>
        
        {debugInfo && (
          <div className="mt-6 p-4 bg-slate-100 rounded-lg text-left max-w-md mx-auto">
            <p className="text-xs font-mono text-slate-600 whitespace-pre-wrap break-all">
              {debugInfo}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
