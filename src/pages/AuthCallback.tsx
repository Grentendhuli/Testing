import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

// PKCE Code Verifier Storage Key (Supabase uses this pattern)
const getCodeVerifierKey = () => {
  const url = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const projectRef = url.match(/([a-z0-9]{20,})\.supabase\.co/)?.[1] || 'local';
  return `sb-${projectRef}-auth-token-code-verifier`;
};

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  const processedRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate processing
    if (processedRef.current) return;
    processedRef.current = true;

    const handleAuthCallback = async () => {
      try {
        // Log debug info
        const url = window.location.href;
        const code = searchParams.get('code');
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        // Check for PKCE code verifier
        const codeVerifierKey = getCodeVerifierKey();
        const codeVerifier = localStorage.getItem(codeVerifierKey);
        
        const initialDebug = {
          url,
          hasCode: !!code,
          codeLength: code?.length,
          hasError: !!errorParam,
          errorParam,
          errorDescription,
          hasCodeVerifier: !!codeVerifier,
          codeVerifierLength: codeVerifier?.length,
          codeVerifierKey,
          localStorageKeys: Object.keys(localStorage).filter(k => k.includes('auth') || k.includes('sb-')),
        };
        
        console.log('[AuthCallback] Debug info:', initialDebug);
        setDebugInfo(initialDebug);

        // Handle OAuth errors from provider
        if (errorParam) {
          throw new Error(errorDescription || errorParam || 'OAuth authentication failed');
        }

        // If no code, something went wrong
        if (!code) {
          throw new Error('No authorization code found in URL');
        }

        // CRITICAL FIX: Check PKCE code verifier before attempting exchange
        if (!codeVerifier) {
          console.warn('[AuthCallback] PKCE code verifier missing - trying recovery...');
          
          // Try to find any Supabase code verifier key
          const supabaseKeys = Object.keys(localStorage).filter(k => 
            k.includes('code-verifier') || k.includes('code_verifier')
          );
          
          if (supabaseKeys.length === 0) {
            setDebugInfo(prev => ({ 
              ...prev, 
              recoveryAttempted: true,
              recoveryFailed: true,
              error: 'PKCE code verifier not found in localStorage'
            }));
            
            // Don't throw immediately - give Supabase auto-detect a chance
            console.log('[AuthCallback] Waiting for Supabase auto-detect...');
          } else {
            setDebugInfo(prev => ({ 
              ...prev, 
              recoveryAttempted: true,
              foundKeys: supabaseKeys
            }));
          }
        }

        // Wait for Supabase to auto-detect and process the session
        // With detectSessionInUrl: true, Supabase automatically exchanges the code
        console.log('[AuthCallback] Waiting for session establishment...');
        
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds total
        
        const checkSession = async (): Promise<boolean> => {
          while (attempts < maxAttempts) {
            attempts++;
            
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
              console.error('[AuthCallback] getSession error:', sessionError);
              throw sessionError;
            }
            
            if (session?.user) {
              console.log('[AuthCallback] Session established:', session.user.email);
              setDebugInfo(prev => ({ 
                ...prev, 
                sessionFound: true,
                userEmail: session.user?.email,
                attempts 
              }));
              return true;
            }
            
            // Wait 100ms before next attempt
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
          return false;
        };

        const sessionEstablished = await checkSession();
        
        if (!sessionEstablished) {
          // Try manual code exchange as fallback
          console.log('[AuthCallback] Auto-detect failed, attempting manual exchange...');
          
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('[AuthCallback] Manual exchange failed:', exchangeError);
            throw new Error(`Code exchange failed: ${exchangeError.message}`);
          }
          
          // Check session again after manual exchange
          const { data: { session: newSession } } = await supabase.auth.getSession();
          
          if (!newSession?.user) {
            throw new Error('Session not established after code exchange');
          }
          
          console.log('[AuthCallback] Session established via manual exchange');
        }

        // Get final session
        const { data: { session: finalSession } } = await supabase.auth.getSession();
        
        if (!finalSession?.user) {
          throw new Error('Authentication completed but no session found');
        }

        console.log('[AuthCallback] Authentication successful, redirecting...');
        
        // Clear any OAuth processing flags
        sessionStorage.removeItem('auth_processed');
        
        // Redirect to dashboard
        navigate('/dashboard', { replace: true });

      } catch (err) {
        console.error('[AuthCallback] Error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
        setError(errorMessage);
        setDebugInfo(prev => ({ 
          ...prev, 
          error: errorMessage,
          errorStack: err instanceof Error ? err.stack : undefined 
        }));
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  const handleRetry = () => {
    // Clear all auth-related storage to start fresh
    const keysToRemove = Object.keys(localStorage).filter(k => 
      k.includes('auth') || k.includes('sb-') || k.includes('code-verifier')
    );
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    sessionStorage.clear();
    navigate('/login', { replace: true });
  };

  const handleBackToLogin = () => {
    navigate('/login', { replace: true });
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-6 p-8 bg-white rounded-lg shadow">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">Authentication Failed</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={handleRetry}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Retry Authentication
              </button>
              <button
                onClick={handleBackToLogin}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Back to Login
              </button>
            </div>
          </div>

          {/* Debug Panel */}
          <div className="mt-6 p-4 bg-gray-100 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Debug Information</h3>
            <pre className="text-xs text-gray-600 overflow-auto max-h-48">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 font-medium">Completing sign in...</p>
        <p className="mt-2 text-sm text-gray-400">Please wait while we verify your credentials</p>
        
        {/* Debug Panel - shows in loading state too */}
        {Object.keys(debugInfo).length > 0 && (
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-left">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Debug Information</h3>
            <pre className="text-xs text-gray-600 overflow-auto max-h-40">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
