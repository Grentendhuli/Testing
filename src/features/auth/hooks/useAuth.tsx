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
  getCurrentSession,
} from '../services/authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// SECURITY: Auth tokens are NOT stored in localStorage (XSS protection)
// Only non-sensitive user data is cached; tokens are memory-only
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
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [authState, setAuthState] = useState<AuthState>('initializing');
  const [isInitialized, setIsInitialized] = useState(false);
  
  const initializationRef = useRef(false);
  const authStateChangeRef = useRef(false);
  const visibilityRefreshRef = useRef(false);
  const previousUserDataRef = useRef<UserData | null>(null);

  const isLoading = authState === 'initializing';
  const isAuthenticated = authState === 'authenticated' && !!user;

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

  // Fetch user data with retry logic - creates record if it doesn't exist (for OAuth users)
  const fetchUserData = useCallback(async (userId: string, user?: User | null) => {
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
        const userData = data as UserData;
        setUserData(userData);
        saveUserDataToCache(userData);
        return userData;
      }

      // If no user data found, create it (for OAuth logins)
      if (error?.code === 'PGRST116' || !data) {
        console.log('[AuthContext] No user record found, creating one for OAuth user...');
        
        const userMetadata = user?.user_metadata || {};
        const fullName = userMetadata.full_name || userMetadata.name || '';
        const nameParts = fullName.split(' ');
        const firstName = userMetadata.first_name || nameParts[0] || '';
        const lastName = userMetadata.last_name || nameParts.slice(1).join(' ') || '';
        const avatarUrl = userMetadata.avatar_url || userMetadata.picture || '';
        
        const newUserData = {
          id: userId,
          email: user?.email || '',
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

  // Update auth state
  const updateAuthState = useCallback((newState: AuthState, newUser: User | null, newSession: Session | null) => {
    setAuthState(newState);
    setUser(newUser);
    setSession(newSession);
  }, []);

  // Initialize auth state - runs once on mount
  useEffect(() => {
    if (initializationRef.current) return;
    initializationRef.current = true;

    const initAuth = async () => {
      if (!supabase || typeof supabase.auth?.getSession !== 'function') {
        console.warn('[AuthContext] Supabase not initialized, skipping auth check');
        updateAuthState('unauthenticated', null, null);
        setIsInitialized(true);
        return;
      }

      const timeoutId = setTimeout(() => {
        console.warn('[AuthContext] Auth initialization timed out');
        // Try to load from cache
        const cached = loadUserDataFromCache();
        if (cached) {
          setUserData(cached);
        }
        updateAuthState('unauthenticated', null, null);
        setIsInitialized(true);
      }, 5000);

      try {
        const { session: currentSession, error: sessionError } = await getCurrentSession();
        
        clearTimeout(timeoutId);
        
        if (sessionError) {
          console.error('[AuthContext] getSession error:', sessionError);
          updateAuthState('unauthenticated', null, null);
          setIsInitialized(true);
          return;
        }

        if (currentSession?.user) {
          console.log('[AuthContext] Session found, user:', currentSession.user.email);
          await fetchUserData(currentSession.user.id, currentSession.user);
          updateAuthState('authenticated', currentSession.user, currentSession);
        } else {
          console.log('[AuthContext] No session found');
          updateAuthState('unauthenticated', null, null);
        }
      } catch (error) {
        console.error('[AuthContext] initAuth error:', error);
        // Try cache as fallback
        const cached = loadUserDataFromCache();
        if (cached) {
          setUserData(cached);
        }
        updateAuthState('unauthenticated', null, null);
      } finally {
        clearTimeout(timeoutId);
        setIsInitialized(true);
      }
    };

    initAuth();
  }, [fetchUserData, loadUserDataFromCache, updateAuthState]);

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
          const { session: currentSession } = await getCurrentSession();
          if (currentSession?.user) {
            await fetchUserData(currentSession.user.id);
          } else {
            await logout();
          }
        }
        
        setTimeout(() => { visibilityRefreshRef.current = false; }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [authState, user?.id, fetchUserData]);

  // Note: Cross-tab sync removed - tokens are memory-only for XSS protection
  // OAuth flows and session detection work via detectSessionInUrl in supabase.ts

  const refreshSession = useCallback(async () => {
    try {
      const { session: currentSession, error } = await getCurrentSession();
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

  const login = async (email: string, password: string) => {
    return loginWithPassword(email, password);
  };

  const signup = async (email: string, password: string, newUserData: Partial<UserData>) => {
    const { error } = await signupWithPassword(email, password, newUserData);
    return { error };
  };

  const logout = async () => {
    await signOut();
    setUser(null);
    setSession(null);
    setUserData(null);
    saveUserDataToCache(null);
    updateAuthState('unauthenticated', null, null);
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
