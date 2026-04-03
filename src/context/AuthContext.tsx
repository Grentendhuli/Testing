import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { sendWelcomeEmail } from '../services/sendgrid';

// Auth state machine types - force rebuild
type AuthState = 'initializing' | 'authenticated' | 'unauthenticated';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authState: AuthState;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  signup: (email: string, password: string, userData: Partial<UserData>) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  updateUserData: (data: Partial<UserData>) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  refreshSession: () => Promise<void>;
  refetchUserData: () => Promise<void>; // NEW: Manual refetch
}

interface UserData {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  property_address: string | null;
  bot_phone_number: string | null;
  subscription_tier: string;
  subscription_status: string;
  max_units: number;
  storage_used: number;
  storage_limit: number;
  created_at: string;
  updated_at?: string;
  // Listing defaults
  listing_laundry?: string;
  listing_pets?: string;
  listing_heat_included?: boolean;
  listing_parking?: boolean;
}

// Storage keys
const AUTH_STATE_KEY = 'lb_auth_state_v2';
const USER_DATA_CACHE_KEY = 'lb_user_data_cache_v2';
const AUTH_TIMESTAMP_KEY = 'lb_auth_timestamp_v2';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days cache

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
      // Ignore storage errors (private mode)
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [authState, setAuthState] = useState<AuthState>('initializing');
  const [isInitialized, setIsInitialized] = useState(false);
  
  const initRef = useRef(false);
  const authChangeRef = useRef(false);
  const visibilityRefreshRef = useRef(false);

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

  // Fetch user data with retry logic
  const fetchUserData = useCallback(async (userId: string): Promise<UserData | null> => {
    try {
      const { data, error } = await withRetry(async () => {
        const result = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (result.error) throw result.error;
        return result;
      });

      if (data && !error) {
        const userData = data as UserData;
        setUserData(userData);
        saveUserDataToCache(userData);
        return userData;
      }
    } catch (error) {
      console.error('[AuthContext] fetchUserData failed after retries:', error);
      // Try to load from cache as fallback
      const cached = loadUserDataFromCache();
      if (cached && cached.id === userId) {
        setUserData(cached);
        return cached;
      }
    }
    return null;
  }, [loadUserDataFromCache, saveUserDataToCache]);

  // Manual refetch (for use after deployment)
  const refetchUserData = useCallback(async () => {
    if (user?.id) {
      await fetchUserData(user.id);
    }
  }, [fetchUserData, user?.id]);

  // Update auth state and persist
  const updateAuthState = useCallback((
    newState: AuthState, 
    newUser: User | null, 
    newSession: Session | null,
    newUserData?: UserData | null
  ) => {
    setAuthState(newState);
    setUser(newUser);
    setSession(newSession);
    if (newUserData !== undefined) {
      setUserData(newUserData);
    }
    
    // Persist auth state
    if (newState === 'authenticated' && newUser) {
      safeStorage.set(AUTH_STATE_KEY, JSON.stringify({
        user: { id: newUser.id, email: newUser.email },
        timestamp: Date.now(),
      }));
      safeStorage.set(AUTH_TIMESTAMP_KEY, Date.now().toString());
    } else if (newState === 'unauthenticated') {
      safeStorage.remove(AUTH_STATE_KEY);
      safeStorage.remove(AUTH_TIMESTAMP_KEY);
      safeStorage.remove(USER_DATA_CACHE_KEY);
    }
  }, []);

  // Initialize auth
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initAuth = async () => {
      if (!supabase?.auth?.getSession) {
        updateAuthState('unauthenticated', null, null);
        setIsInitialized(true);
        return;
      }

      try {
        // Load from cache first for immediate UI
        const cachedUserData = loadUserDataFromCache();
        
        // Get current session with 5s timeout (prevents infinite hang)
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<{data: {session: null}, error: Error}>((_, reject) => 
          setTimeout(() => reject(new Error('Session check timeout')), 5000)
        );
        const { data: { session: currentSession }, error: sessionError } = 
          await Promise.race([sessionPromise, timeoutPromise]).catch(() => ({ 
            data: { session: null }, 
            error: new Error('Session check timeout') 
          }));
        
        if (sessionError) {
          console.error('[AuthContext] getSession error:', sessionError);
          // Try to recover from cache
          if (cachedUserData) {
            setUserData(cachedUserData);
          }
          updateAuthState('unauthenticated', null, null);
          setIsInitialized(true);
          return;
        }

        if (currentSession?.user) {
          // Show cached data immediately while fetching fresh
          if (cachedUserData && cachedUserData.id === currentSession.user.id) {
            setUserData(cachedUserData);
          }
          
          // Fetch fresh data
          await fetchUserData(currentSession.user.id);
          updateAuthState('authenticated', currentSession.user, currentSession);
        } else {
          // Check for expired session in cache
          const authed = safeStorage.get(AUTH_STATE_KEY);
          if (authed) {
            const parsed = JSON.parse(authed);
            const age = Date.now() - parsed.timestamp;
            // If less than 7 days, try to refresh
            if (age < CACHE_TTL_MS) {
              await refreshSession();
            } else {
              updateAuthState('unauthenticated', null, null);
            }
          } else {
            updateAuthState('unauthenticated', null, null);
          }
        }
      } catch (error) {
        console.error('[AuthContext] initAuth error:', error);
        // Try cache as last resort
        const cached = loadUserDataFromCache();
        if (cached) {
          setUserData(cached);
        }
        updateAuthState('unauthenticated', null, null);
      } finally {
        setIsInitialized(true);
      }
    };

    initAuth();
  }, [fetchUserData, loadUserDataFromCache, updateAuthState]);

  // Auth state change listener
  useEffect(() => {
    if (!supabase?.auth?.onAuthStateChange) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (authChangeRef.current) return;
        authChangeRef.current = true;
        
        setTimeout(() => { authChangeRef.current = false; }, 100);

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
              // Re-fetch userData after update
              await fetchUserData(newSession.user.id);
            }
            break;
          case 'INITIAL_SESSION':
            // Handle initial session
            if (newSession?.user) {
              await fetchUserData(newSession.user.id);
              updateAuthState('authenticated', newSession.user, newSession);
            }
            break;
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [fetchUserData, updateAuthState, saveUserDataToCache]);

  // Refresh on window focus (handles deployment updates)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && !visibilityRefreshRef.current) {
        visibilityRefreshRef.current = true;
        
        // Verify session is still valid
        if (authState === 'authenticated' && user?.id) {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession?.user) {
            // Re-fetch userData to get any deployment updates
            await fetchUserData(currentSession.user.id);
          } else {
            // Session expired, logout
            await logout();
          }
        }
        
        setTimeout(() => { visibilityRefreshRef.current = false; }, 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [authState, user?.id, fetchUserData]);

  // Cross-tab sync
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === AUTH_STATE_KEY) {
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
          if (currentSession?.user) {
            setUser(currentSession.user);
            setSession(currentSession);
            setAuthState('authenticated');
            // Also refresh userData
            fetchUserData(currentSession.user.id);
          } else {
            setUser(null);
            setSession(null);
            setUserData(null);
            setAuthState('unauthenticated');
          }
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [fetchUserData]);

  const refreshSession = useCallback(async () => {
    try {
      const { data: { session: currentSession }, error } = 
        await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (currentSession?.user) {
        await fetchUserData(currentSession.user.id);
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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signup = async (email: string, password: string, newUserData: Partial<UserData>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: newUserData.first_name || null,
          last_name: newUserData.last_name || null,
          phone_number: newUserData.phone_number || null,
          property_address: newUserData.property_address || null,
        },
      },
    });

    if (data.user && !error) {
      // Retry upsert with backoff
      await withRetry(async () => {
        const { error: upsertError } = await (supabase as any)
          .from('users')
          .upsert({
            id: data.user!.id,
            email: data.user!.email,
            first_name: newUserData.first_name || null,
            last_name: newUserData.last_name || null,
            phone_number: newUserData.phone_number || null,
            property_address: newUserData.property_address || null,
          }, { onConflict: 'id' });
        
        if (upsertError) throw upsertError;
      });

      await fetchUserData(data.user.id);

      if (data.user.email && newUserData.first_name) {
        try {
          await sendWelcomeEmail(data.user.email, newUserData.first_name);
        } catch (emailError) {
          console.error('[AuthContext] Failed to send welcome email:', emailError);
        }
      }
    }

    return { error };
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    if (error) throw error;
  };

  const signInWithApple = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserData(null);
    safeStorage.remove(USER_DATA_CACHE_KEY);
    updateAuthState('unauthenticated', null, null);
  };

  const updateUserData = async (data: Partial<UserData>) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Optimistic update
    const previousData = userData;
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
        setUserData(previousData);
        saveUserDataToCache(previousData);
      }

      return { error };
    } catch (err) {
      // Rollback
      setUserData(previousData);
      saveUserDataToCache(previousData);
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
        refetchUserData,
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
