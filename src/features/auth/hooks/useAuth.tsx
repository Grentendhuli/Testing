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
import { clearAllAutosaves } from '@/hooks/useAutosave';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session persistence configuration
const USER_DATA_CACHE_KEY = 'lb_user_data_cache_v3';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const SESSION_VERSION_KEY = 'lb_session_version';
const CURRENT_SESSION_VERSION = '1';

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

// Deployment detection helper
const detectNewDeployment = (): boolean => {
  try {
    const storedVersion = localStorage.getItem(SESSION_VERSION_KEY);
    if (storedVersion !== CURRENT_SESSION_VERSION) {
      localStorage.setItem(SESSION_VERSION_KEY, CURRENT_SESSION_VERSION);
      if (storedVersion) {
        console.log('[AuthContext] Deployment version changed:', storedVersion, '→', CURRENT_SESSION_VERSION);
        return true;
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return false;
};

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
  const visibilityRefreshRef = useRef(false);  // MOVED TO TOP - was inside useEffect!
  const isRefreshingRef = useRef(false);       // MOVED TO TOP - was scattered

  // ============================================================================
  // SECTION 3: DERIVED STATE (computed values, not hooks)
  // ============================================================================
  const isLoading = authState === 'initializing';
  const isAuthenticated = authState === 'authenticated' && !!user;

  // ============================================================================
  // SECTION 4: ALL HELPER CALLBACKS (useCallback - defined BEFORE effects that use them)
  // ============================================================================
  
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
    // Clear any form drafts on logout
    clearAllAutosaves();
  }, [saveUserDataToCache, updateAuthState]);

  // Fetch user data with retry logic - creates record if it doesn't exist (for OAuth users)
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
          firstName: userDataResult.first_name,
          lastName: userDataResult.last_name,
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
            firstName: (createdUser as UserData).first_name,
            lastName: (createdUser as UserData).last_name,
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

  // Refresh session - defined BEFORE cross-tab sync that uses it
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
  // SECTION 5: ALL USEEFFECT HOOKS (defined AFTER all callbacks they reference)
  // ============================================================================

  // Multi-tab auth synchronization
  const { broadcastLogout } = useMultiTabAuth({
    onLogout: () => {
      // Other tab logged out - clear auth state without broadcasting (to avoid infinite loop)
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
    if (initializationRef.current) return;
    initializationRef.current = true;

    const initAuth = async () => {
      if (!supabase || typeof supabase.auth?.getSession !== 'function') {
        console.warn('[AuthContext] Supabase not initialized');
        updateAuthState('unauthenticated', null, null);
        setIsInitialized(true);
        return;
      }

      // Track deployment changes for debugging
      const isNewDeployment = detectNewDeployment();
      if (isNewDeployment) {
        console.log('[AuthContext] New deployment detected, recovering session...');
      }

      const timeoutId = setTimeout(() => {
        console.warn('[AuthContext] Auth initialization timed out');
        updateAuthState('unauthenticated', null, null);
        setIsInitialized(true);
      }, 8000); // Increased timeout for session recovery

      try {
        // With persistSession: true, this recovers session from localStorage
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        clearTimeout(timeoutId);
        
        if (sessionError) {
          console.error('[AuthContext] getSession error:', sessionError);
          updateAuthState('unauthenticated', null, null);
          setIsInitialized(true);
          return;
        }

        if (currentSession?.user) {
          console.log('[AuthContext] Session recovered for:', currentSession.user.email);
          
          // Verify session is still valid by attempting refresh
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
        clearTimeout(timeoutId);
        setIsInitialized(true);
      }
    };

    initAuth();
  }, [fetchUserData, updateAuthState]);

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
          
          if (authStateChangeRef.current) return;
          authStateChangeRef.current = true;
          
          setTimeout(() => {
            authStateChangeRef.current = false;
          }, 100);

          switch (event) {
            case 'SIGNED_IN':
              if (newSession?.user) {
                await fetchUserData(newSession.user.id);
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
            case 'TOKEN_REFRESHED_FAILURE':
            case 'SESSION_EXPIRED':
              // Show session expired modal instead of immediate redirect
              console.log('[AuthContext] Session expired, showing modal');
              setShowSessionExpiredModal(true);
              break;
          }
        }
      );

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('[AuthContext] Failed to setup auth listener:', error);
    }
  }, [fetchUserData, updateAuthState, saveUserDataToCache]);

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

  // Cross-tab synchronization for auth state - using supabase's actual key
  useEffect(() => {
    const handleStorageChange = async (event: StorageEvent) => {
      // Supabase uses 'sb-<project-ref>-auth-token' pattern - check for supabase auth token
      if (event.key?.includes('auth-token') || event.key?.includes('supabase.auth.token')) {
        // Prevent race conditions - ignore if already refreshing
        if (isRefreshingRef.current) return;
        
        isRefreshingRef.current = true;
        
        try {
          if (event.newValue === null) {
            // User logged out in another tab
            console.log('[AuthContext] Logout detected in another tab');
            setUserData(null);
            saveUserDataToCache(null);
            updateAuthState('unauthenticated', null, null);
          } else {
            // User logged in in another tab - refresh session
            console.log('[AuthContext] Login detected in another tab');
            await refreshSession();  // NOW SAFE - defined above!
          }
        } finally {
          // Release lock after a short delay to prevent immediate re-trigger
          setTimeout(() => { isRefreshingRef.current = false; }, 100);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshSession, saveUserDataToCache, updateAuthState]);

  // Session health monitoring - recovers from edge cases
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
  // SECTION 6: PUBLIC API FUNCTIONS (returned in context, not hooks)
  // ============================================================================

  const login = async (email: string, password: string): Promise<{ error: Error | null; remainingAttempts?: number; isLocked?: boolean }> => {
    // Check rate limit before attempting login
    const rateLimit = checkRateLimit(email);
    
    if (!rateLimit.allowed) {
      const minutesLeft = Math.ceil(rateLimit.lockoutTimeLeft! / 60000);
      return {
        error: new Error(`Too many failed attempts. Please try again in ${minutesLeft} minute${minutesLeft !== 1 ? 's' : ''}.`),
        remainingAttempts: 0,
        isLocked: true,
      };
    }

    // Add exponential backoff delay based on remaining attempts
    const remainingAttempts = getRemainingAttempts(email);
    if (remainingAttempts < 5) {
      const delay = Math.min(1000 * Math.pow(2, 5 - remainingAttempts), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const result = await loginWithPassword(email, password);

    if (result.error) {
      // Record failed attempt
      recordFailedAttempt(email);
      const remaining = getRemainingAttempts(email);
      
      return {
        error: result.error,
        remainingAttempts: remaining,
        isLocked: false,
      };
    }

    // Clear failed attempts on successful login
    clearFailedAttempts(email);
    return { error: null, remainingAttempts: 5 };
  };

  const signup = async (email: string, password: string, newUserData: Partial<UserData>) => {
    const { error } = await signupWithPassword(email, password, newUserData);
    return { error };
  };

  const logout = async () => {
    // Broadcast logout to other tabs BEFORE clearing local state
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
