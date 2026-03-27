import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { analytics } from '@/utils/analytics';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

// Auth callback states
type CallbackState = 'processing' | 'success' | 'error' | 'redirecting';

export function AuthCallback() {
  const navigate = useNavigate();
  const [callbackState, setCallbackState] = useState<CallbackState>('processing');
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('');
  
  // Use refs to prevent duplicate processing and store mutable values
  const processedRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const subscriptionRef = useRef<{ unsubscribe: () => void } | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  // Main auth processing effect - runs once on mount
  useEffect(() => {
    // Prevent duplicate processing - but ONLY if we've already completed processing
    // Don't block if we're just retrying after a failure
    if (processedRef.current && callbackState !== 'error') {
      console.log('[AuthCallback] Already processed successfully, skipping');
      return;
    }
    
    // Track callback page view
    analytics.trackPageView('/auth/callback', 'Authentication Callback');

    // Helper: handle error
    const handleError = (message: string, details?: any) => {
      console.error('[AuthCallback] Error:', message, details);
      setError(message);
      setCallbackState('error');
      // Mark as processed on error to prevent infinite retries
      processedRef.current = true;
      analytics.trackEvent('login_failed', { 
        error: message,
        details: details?.toString(),
      });
    };

    // Helper: handle success
    const handleSuccess = async (user: any, source: string) => {
      console.log(`[AuthCallback] Success from ${source}:`, user?.email);
      
      // Clear all polling and timeouts immediately
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      // Mark as processed BEFORE state changes to prevent race conditions
      processedRef.current = true;
      
      setCallbackState('success');
      
      const signupMethod: 'google' | 'microsoft' | 'magic_link' | 'email' = 
        user?.app_metadata?.provider === 'google' ? 'google' : 
        user?.app_metadata?.provider === 'azure' ? 'microsoft' : 
        'magic_link';
      
      analytics.trackEvent('login_success', { method: signupMethod });
      analytics.identifyUser(user.id, { 
        email: user.email || undefined,
        signup_method: signupMethod,
      });
      
      // Wait for auth state to propagate before navigating
      // This ensures useAuth has updated its state
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Trigger navigation
      setCallbackState('redirecting');
      navigate('/dashboard', { replace: true });
    };

    // Helper: create user record
    const createUserIfNeeded = async (user: any) => {
      try {
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
          const signupMethod: 'google' | 'microsoft' | 'magic_link' | 'email' = 
            user.app_metadata?.provider === 'google' ? 'google' : 
            user.app_metadata?.provider === 'azure' ? 'microsoft' : 
            'magic_link';
          
          // Check if this is a new user by looking at created_at
          const isNewUser = user.created_at && 
            (new Date().getTime() - new Date(user.created_at).getTime()) < 60000;
          
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
    };

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
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');

    debug += `Found params:\n`;
    debug += `- error: ${urlError || 'NO'}\n`;
    debug += `- error_description: ${errorDesc || 'NO'}\n`;
    debug += `- code: ${code ? 'YES' : 'NO'}\n`;
    debug += `- access_token: ${accessToken ? 'YES' : 'NO'}\n`;
    debug += `- refresh_token: ${refreshToken ? 'YES' : 'NO'}\n`;

    setDebugInfo(debug);

    // Handle URL errors first
    if (urlError) {
      handleError(`Auth Error: ${errorDesc || urlError}`, { urlError, errorDesc });
      return;
    }

    // Process the auth callback
    const processAuth = async () => {
      try {
        let attempts = 0;
        const maxAttempts = 20; // Try for up to 10 seconds
        
        // Poll for session
        const pollForSession = async (): Promise<boolean> => {
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              console.log('[AuthCallback] Session found on attempt', attempts);
              await createUserIfNeeded(session.user);
              await handleSuccess(session.user, 'poll');
              return true;
            }
          } catch (err) {
            console.error('[AuthCallback] Error polling for session:', err);
          }
          return false;
        };

        // Try immediate check first
        if (await pollForSession()) return;

        // If no session yet, check if we have tokens in URL that need processing
        // This happens with OAuth implicit flow
        if (accessToken) {
          console.log('[AuthCallback] Found access_token in URL, setting session...');
          try {
            const { data, error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            
            if (setSessionError) {
              console.error('[AuthCallback] setSession error:', setSessionError);
            } else if (data.session?.user) {
              console.log('[AuthCallback] Session set from URL tokens');
              await createUserIfNeeded(data.session.user);
              await handleSuccess(data.session.user, 'url_token');
              return;
            }
          } catch (err) {
            console.error('[AuthCallback] Error setting session from tokens:', err);
          }
        }

        // Set up auth state listener
        console.log('[AuthCallback] No session yet, starting listener + poll...');
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log('[AuthCallback] Auth state change:', event, newSession?.user?.email);
            
            // Clear interval immediately when we get a state change
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            
            if (event === 'SIGNED_IN' && newSession?.user) {
              await createUserIfNeeded(newSession.user);
              await handleSuccess(newSession.user, 'auth_state_change');
            }
          }
        );

        subscriptionRef.current = subscription;

        // Poll interval while waiting for state change (backup mechanism)
        pollIntervalRef.current = setInterval(async () => {
          attempts++;
          console.log(`[AuthCallback] Poll attempt ${attempts}/${maxAttempts}`);
          
          if (await pollForSession()) {
            // Session found - interval will be cleared by pollForSession
            return;
          }
          
          if (attempts >= maxAttempts) {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
            handleError('Authentication timed out. Please try signing in again.');
          }
        }, 500);

        // Hard timeout - ensures we never get stuck
        timeoutRef.current = setTimeout(() => {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          // Only show error if still processing
          if (callbackState === 'processing') {
            handleError('Authentication took too long. Please try signing in again.');
          }
        }, 15000);
        
      } catch (err: any) {
        handleError(err.message || 'Unknown error during authentication', err);
      }
    };

    processAuth();
    
    // NOTE: We intentionally don't set processedRef here - it's set 
    // in handleSuccess or handleError to prevent race conditions
  }, [navigate]); // Only depend on navigate - callbackState check happens inside

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

  if (callbackState === 'success' || callbackState === 'redirecting') {
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
