import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { AuthState, UserData, AuthContextType } from '../types/auth.types';
import {
  loginWithPassword,
  signupWithPassword,
  signInWithGoogle,
  signInWithApple,
  signOut,
} from '../services/authService';
import { 
  checkRateLimit, 
  recordFailedAttempt, 
  clearFailedAttempts,
  getRemainingAttempts 
} from '@/utils/validation';
import { identifyUser, resetUser } from '@/services/analytics';
import { useMultiTabAuth } from '@/hooks/useMultiTabAuth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session persistence configuration
const USER_DATA_CACHE_KEY = 'lb_user_data_cache_v3';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Retry config
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

// Safe localStorage helpers
const safeStorage = {
  get: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore storage errors
    }
  },
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  },
};

// Retry wrapper with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = MAX_RETRIES,
  delay = RETRY_DELAY_MS
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // ============================================================================
  // SECTION 1: ALL STATE HOOKS (must be first, unconditionally called)
  // ============================================================================
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [authState, setAuthState] = useState<AuthState>('initializing');
  const [isInitialized, setIsInitialized] = useState(false);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
  
  // ============================================================================
  // SECTION 2: ALL REFS (must be at top level, unconditionally called)
  // ============================================================================
  const initializationRef = useRef(false);
  const authStateChangeRef = useRef(false);
  const previousUserDataRef = useRef<UserData | null>(null);
  const visibilityRefreshRef = useRef(false);
  const isRefreshingRef = useRef(false);
  const isCallbackPageRef = useRef(false);

  // ============================================================================
  // SECTION 3: DERIVED STATE (computed values, not hooks)
  // ============================================================================
  const isLoading = authState === 'initializing';
  const isAuthenticated = authState === 'authenticated' && !!user && !!session;

  // ============================================================================
  // SECTION 4: ALL HELPER CALLBACKS (useCallback - defined BEFORE effects that use them)
  // ============================================================================
  
  // Check if we're on the OAuth callback page
  const checkIsCallbackPage = useCallback(() => {
    const pathname = window.location.pathname;
    const hasCode = window.location.search.includes('code=');
    const hasAuthTokens = window.location.hash.includes('access_token=');
    
    const isCallback = pathname.includes('/auth/callback') || hasCode || hasAuthTokens;
    return isCallback;
  }, []);

  // Update auth state - stable callback
  const updateAuthState = useCallback((newState: AuthState, newUser: User | null, newSession: Session | null) => {
    setAuthState(newState);
    setUser(newUser);
    setSession(newSession);
  }, []);

  // Load userData from cache
  const loadUserDataFromCache = useCallback((): UserData | null => {
    try {
      const cached = safeStorage.get(USER_DATA_CACHE_KEY);
      if (cached) {
        const data = JSON.parse(cached) as UserData & { _cachedAt?: number };
        const age = Date.now() - (data._cachedAt || 0);
        if (age < CACHE_TTL_MS) {
          return data;
        }
      }
    } catch {
      // Ignore parse errors
    }
    return null;
  }, []);

  // Save userData to cache
  const saveUserDataToCache = useCallback((data: UserData | null) => {
    if (data) {
      safeStorage.set(USER_DATA_CACHE_KEY, JSON.stringify({ ...data, _cachedAt: Date.now() }));
    } else {
      safeStorage.remove(USER_DATA_CACHE_KEY);
    }
  }, []);

  // Clear all auth state - defined early for use in multiple effects
  const clearAuthState = useCallback(async () => {
    await signOut();
    setUser(null);
    setSession(null);
    setUserData(null);
    saveUserDataToCache(null);
    updateAuthState('unauthenticated', null, null);
  }, [saveUserDataToCache, updateAuthState]);

  // Fetch user data with retry logic
  const fetchUserData = useCallback(async (userId: string, userObj?: User | null) => {
    // Show cached data immediately if available
    const cached = loadUserDataFromCache();
    if (cached && cached.id === userId) {
      setUserData(cached);
    }

    try {
      // First try to fetch existing user data with retry
      const { data, error } = await withRetry(async () => {
        const result = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (result.error && result.error.code !== 'PGRST116') {
          throw result.error;
        }
        return result;
      });

      if (!error && data) {
        const userDataResult = data as UserData;
        setUserData(userDataResult);
        saveUserDataToCache(userDataResult);
        
        // Track user in analytics
        identifyUser(userDataResult.id, {
          email: userDataResult.email,
          firstName: userDataResult.first_name || undefined,
          lastName: userDataResult.last_name || undefined,
          subscriptionTier: userDataResult.subscription_tier,
          createdAt: userDataResult.created_at,
        });
        
        return userDataResult;
      }

      // If no user data found, create it (for OAuth logins)
      if (error?.code === 'PGRST116' || !data) {
        console.log('[AuthContext] No user record found, creating one for OAuth user...');
        
        const userMetadata = userObj?.user_metadata || {};
        const fullName = userMetadata.full_name || userMetadata.name || '';
        const nameParts = fullName.split(' ');
        const firstName = userMetadata.first_name || nameParts[0] || '';
        const lastName = userMetadata.last_name || nameParts.slice(1).join(' ') || '';
        const avatarUrl = userMetadata.avatar_url || userMetadata.picture || '';
        
        const newUserData = {
          id: userId,
          email: userObj?.email || '',
          first_name: firstName,
          last_name: lastName,
          phone_number: userMetadata.phone || '',
          property_address: '',
          avatar_url: avatarUrl,
          subscription_tier: 'free',
          subscription_status: 'active',
          max_units: -1,
          storage_used: 0,
          storage_limit: 1073741824,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: createdUser, error: createError } = await withRetry(async () => {
          const result = await supabase
            .from('users')
            .upsert(newUserData as any, { onConflict: 'id' })
            .select()
            .single();
          
          if (result.error) throw result.error;
          return result;
        });

        if (createError) {
          console.error('[AuthContext] Error creating user record:', createError);
          // Return cached data if available
          return cached;
        }

        if (createdUser) {
          console.log('[AuthContext] User record created successfully');
          setUserData(createdUser as UserData);
          saveUserDataToCache(createdUser as UserData);
          
          // Track new user in analytics
          identifyUser((createdUser as UserData).id, {
            email: (createdUser as UserData).email,
            firstName: (createdUser as UserData).first_name || undefined,
            lastName: (createdUser as UserData).last_name || undefined,
            subscriptionTier: (createdUser as UserData).subscription_tier,
            createdAt: (createdUser as UserData).created_at,
          });
          
          return createdUser as UserData;
        }
      }
    } catch (error) {
      console.error('[AuthContext] fetchUserData failed after retries:', error);
      // Return cached data as fallback
      if (cached && cached.id === userId) {
        return cached;
      }
    }
    return null;
  }, [loadUserDataFromCache, saveUserDataToCache]);

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (currentSession?.user) {
        await fetchUserData(currentSession.user.id, currentSession.user);
        updateAuthState('authenticated', currentSession.user, currentSession);
      } else {
        updateAuthState('unauthenticated', null, null);
      }
    } catch (error) {
      console.error('[AuthContext] refreshSession error:', error);
      updateAuthState('unauthenticated', null, null);
    }
  }, [fetchUserData, updateAuthState]);

  // ============================================================================
  // SECTION 5: ALL USEEFFECT HOOKS
  // ============================================================================

  // Multi-tab auth synchronization
  const { broadcastLogout } = useMultiTabAuth({
    onLogout: () => {
      // Other tab logged out - clear auth state without broadcasting
      clearAuthState();
    },
    onSessionExpired: () => {
      // Other tab's session expired - show modal
      setShowSessionExpiredModal(true);
    },
    onLogin: () => {
      // Other tab logged in - refresh session
      refreshSession();
    },
  });

  // Initialize auth state - runs once on mount
  useEffect(() => {
    if (initializationRef.current) {
      console.log('[AuthContext] Initialization already in progress, skipping');
      return;
    }
    initializationRef.current = true;

    const initAuth = async () => {
      let completed = false;
      
      const completeInitialization = () => {
        if (!completed) {
          completed = true;
          setIsInitialized(true);
          console.log('[AuthContext] Initialization complete');
        }
      };

      // Safety timeout - ensure initialization always completes
      const safetyTimeout = setTimeout(() => {
        console.warn('[AuthContext] Initialization safety timeout triggered');
        completeInitialization();
      }, 10000);

      try {
        console.log('[AuthContext] Starting initAuth...');
        if (!supabase || typeof supabase.auth?.getSession !== 'function') {
          console.warn('[AuthContext] Supabase not initialized');
          updateAuthState('unauthenticated', null, null);
          completeInitialization();
          return;
        }
        console.log('[AuthContext] Supabase OK, checking callback...');

        // CRITICAL FIX: Check if we're on OAuth callback page
        isCallbackPageRef.current = checkIsCallbackPage();
        
        if (isCallbackPageRef.current) {
          console.log('[AuthContext] OAuth callback detected - deferring to AuthCallback page');
          // Defer to AuthCallback component to handle the flow
          // Just complete initialization without interfering
          completeInitialization();
          clearTimeout(safetyTimeout);
          return;
        }

        // Normal initialization (not OAuth callback)
        // CRITICAL: Wrap getSession in timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('getSession timeout')), 5000)
        );
        const { data: { session: currentSession }, error: sessionError } = await Promise.race([sessionPromise, timeoutPromise]).catch(err => {
          console.warn('[AuthContext] getSession timed out or failed:', err);
          return { data: { session: null }, error: err };
        }) as { data: { session: Session | null }; error: Error | null };
        
        if (sessionError) {
          console.error('[AuthContext] getSession error:', sessionError);
          updateAuthState('unauthenticated', null, null);
          completeInitialization();
          return;
        }

        if (currentSession?.user) {
          console.log('[AuthContext] Session recovered for:', currentSession.user.email);
          
          // Verify session is still valid
          const { error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.warn('[AuthContext] Session validation failed:', refreshError);
            await supabase.auth.signOut();
            updateAuthState('unauthenticated', null, null);
          } else {
            await fetchUserData(currentSession.user.id, currentSession.user);
            updateAuthState('authenticated', currentSession.user, currentSession);
          }
        } else {
          console.log('[AuthContext] No existing session - user needs to login');
          updateAuthState('unauthenticated', null, null);
        }
      } catch (error) {
        console.error('[AuthContext] initAuth error:', error);
        updateAuthState('unauthenticated', null, null);
      } finally {
        console.log('[AuthContext] initAuth finally block reached, completed:', completed);
        clearTimeout(safetyTimeout);
        completeInitialization();
      }
    };

    initAuth();
  }, [checkIsCallbackPage, fetchUserData, updateAuthState]);

  // Auth state change listener
  useEffect(() => {
    if (!supabase || typeof supabase.auth?.onAuthStateChange !== 'function') {
      console.warn('[AuthContext] Supabase auth listener not available');
      return;
    }

    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          console.log('[AuthContext] Auth state change:', event, newSession?.user?.email);
          
          // NOTE: Removed debounce - it was blocking SIGNED_IN after INITIAL_SESSION
          // The auth state changes are already serialized by Supabase

          switch (event) {
            case 'SIGNED_IN':
              // Always handle SIGNED_IN - OAuth flow depends on this
              if (newSession?.user) {
                console.log('[AuthContext] User signed in, fetching data...');
                await fetchUserData(newSession.user.id, newSession.user);
                updateAuthState('authenticated', newSession.user, newSession);
              }
              break;
            case 'INITIAL_SESSION':
              // Only update if user exists and we're not already authenticated
              // This prevents overwriting an active session during init
              if (newSession?.user && authState !== 'authenticated') {
                console.log('[AuthContext] Initial session found, fetching data...');
                await fetchUserData(newSession.user.id, newSession.user);
                updateAuthState('authenticated', newSession.user, newSession);
              }
              break;
            case 'SIGNED_OUT':
              setUserData(null);
              saveUserDataToCache(null);
              updateAuthState('unauthenticated', null, null);
              resetUser(); // Clear analytics session
              break;
            case 'TOKEN_REFRESHED':
              if (newSession) {
                setSession(newSession);
              }
              break;
            case 'USER_UPDATED':
              if (newSession?.user) {
                setUser(newSession.user);
                await fetchUserData(newSession.user.id);
              }
              break;
            default:
              // Handle TOKEN_REFRESHED_FAILURE, SESSION_EXPIRED
              if ((event as any) === 'TOKEN_REFRESHED_FAILURE' || (event as any) === 'SESSION_EXPIRED') {
                console.log('[AuthContext] Session expired, showing modal');
                setShowSessionExpiredModal(true);
              }
              break;
          }
          
          // Ensure initialization is complete
          if (!isInitialized) {
            setIsInitialized(true);
          }
        }
      );

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('[AuthContext] Failed to setup auth listener:', error);
    }
  }, [fetchUserData, updateAuthState, saveUserDataToCache, isInitialized]);

  // Refresh on window focus (handles deployment updates)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && !visibilityRefreshRef.current) {
        visibilityRefreshRef.current = true;
        
        if (authState === 'authenticated' && user?.id) {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession?.user) {
            await fetchUserData(currentSession.user.id);
          } else {
            // Session expired - sign out
            await clearAuthState();
          }
        }
        
        setTimeout(() => { visibilityRefreshRef.current = false; }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [authState, user?.id, fetchUserData, clearAuthState]);

  // Session health monitoring
  useEffect(() => {
    if (authState !== 'authenticated') return;

    const healthCheck = setInterval(async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error || !currentSession) {
          console.warn('[AuthContext] Session health check failed');
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error('[AuthContext] Session recovery failed, logging out');
            await clearAuthState();
          }
        }
      } catch (err) {
        console.error('[AuthContext] Health check error:', err);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(healthCheck);
  }, [authState, clearAuthState]);

  // ============================================================================
  // SECTION 6: PUBLIC API FUNCTIONS
  // ============================================================================

  const login = async (email: string, password: string): Promise<{ error: Error | null; remainingAttempts?: number; isLocked?: boolean }> => {
    const rateLimit = checkRateLimit(email);
    
    if (!rateLimit.allowed) {
      const minutesLeft = Math.ceil(rateLimit.lockoutTimeLeft! / 60000);
      return {
        error: new Error(`Too many failed attempts. Please try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`),
        remainingAttempts: 0,
        isLocked: true,
      };
    }

    // Add exponential backoff delay
    const remainingAttempts = getRemainingAttempts(email);
    if (remainingAttempts < 5) {
      const delay = Math.min(1000 * Math.pow(2, 5 - remainingAttempts), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const result = await loginWithPassword(email, password);

    if (result.error) {
      recordFailedAttempt(email);
      const remaining = getRemainingAttempts(email);
      
      return {
        error: result.error,
        remainingAttempts: remaining,
        isLocked: false,
      };
    }

    clearFailedAttempts(email);
    return { error: null, remainingAttempts: 5 };
  };

  const signup = async (email: string, password: string, newUserData: Partial<UserData>) => {
    const { error } = await signupWithPassword(email, password, newUserData);
    return { error };
  };

  const logout = async () => {
    broadcastLogout();
    await clearAuthState();
  };

  const updateUserData = async (data: Partial<UserData>) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Optimistic update
    const previousData = userData;
    previousUserDataRef.current = previousData;
    
    if (previousData) {
      const optimisticData = { ...previousData, ...data };
      setUserData(optimisticData);
      saveUserDataToCache(optimisticData);
    }

    try {
      const { error } = await withRetry(async () => {
        const result = await (supabase as any)
          .from('users')
          .update(data)
          .eq('id', user.id);
        
        if (result.error) throw result.error;
        return result;
      });

      if (!error) {
        await fetchUserData(user.id);
      } else {
        // Rollback on error
        if (previousUserDataRef.current) {
          setUserData(previousUserDataRef.current);
          saveUserDataToCache(previousUserDataRef.current);
        }
      }

      return { error };
    } catch (err) {
      // Rollback
      if (previousUserDataRef.current) {
        setUserData(previousUserDataRef.current);
        saveUserDataToCache(previousUserDataRef.current);
      }
      return { error: err as Error };
    }
  };

  // ============================================================================
  // SECTION 7: RENDER - Context Provider
  // ============================================================================

  // Debug - expose to window for debugging
  useEffect(() => {
    (window as any).__AUTH_CONTEXT = {
      isInitialized,
      isLoading,
      authState,
      isAuthenticated,
      user: user?.email,
      session: session?.user?.email,
      refreshSession,
    };
  }, [isInitialized, isLoading, authState, isAuthenticated, user, session, refreshSession]);

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        session,
        isLoading,
        isAuthenticated,
        authState,
        isInitialized,
        showSessionExpiredModal,
        setShowSessionExpiredModal,
        login,
        signup,
        logout,
        updateUserData,
        signInWithGoogle,
        signInWithApple,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
