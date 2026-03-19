import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import { sendWelcomeEmail } from '../services/sendgrid';

// Auth state machine types
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
  signInWithMicrosoft: () => Promise<void>;
  refreshSession: () => Promise<void>;
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
  // Listing defaults
  listing_laundry?: string;
  listing_pets?: string;
  listing_heat_included?: boolean;
  listing_parking?: boolean;
}

// Storage keys for auth persistence
const AUTH_STORAGE_KEY = 'lb_auth_state';
const AUTH_TIMESTAMP_KEY = 'lb_auth_timestamp';

// Helper to safely access localStorage
const getStorageItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setStorageItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors
  }
};

const removeStorageItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage errors
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [authState, setAuthState] = useState<AuthState>('initializing');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Use refs to prevent race conditions
  const initializationRef = useRef(false);
  const authStateChangeRef = useRef(false);

  // Derived state
  const isLoading = authState === 'initializing';
  const isAuthenticated = authState === 'authenticated' && !!user;

  // Fetch user data from database
  const fetchUserData = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setUserData(data as UserData);
        return data as UserData;
      }
    } catch (error) {
      console.error('[AuthContext] fetchUserData error:', error);
    }
    return null;
  }, []);

  // Update auth state and persist to storage
  const updateAuthState = useCallback((newState: AuthState, newUser: User | null, newSession: Session | null) => {
    setAuthState(newState);
    setUser(newUser);
    setSession(newSession);
    
    // Persist to localStorage for faster initial loads
    if (newState === 'authenticated' && newUser) {
      setStorageItem(AUTH_STORAGE_KEY, JSON.stringify({
        user: { id: newUser.id, email: newUser.email },
        timestamp: Date.now(),
      }));
      setStorageItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
    } else if (newState === 'unauthenticated') {
      removeStorageItem(AUTH_STORAGE_KEY);
      removeStorageItem(AUTH_TIMESTAMP_KEY);
    }
  }, []);

  // Initialize auth state - runs once on mount
  useEffect(() => {
    // Prevent double initialization in React StrictMode
    if (initializationRef.current) return;
    initializationRef.current = true;

    const initAuth = async () => {
      // Guard: supabase client might not be initialized
      if (!supabase || typeof supabase.auth?.getSession !== 'function') {
        console.warn('[AuthContext] Supabase not initialized, skipping auth check');
        updateAuthState('unauthenticated', null, null);
        setIsInitialized(true);
        return;
      }

      try {
        // Check for existing session
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[AuthContext] getSession error:', sessionError);
          updateAuthState('unauthenticated', null, null);
          setIsInitialized(true);
          return;
        }

        if (currentSession?.user) {
          console.log('[AuthContext] Session found, user:', currentSession.user.email);
          await fetchUserData(currentSession.user.id);
          updateAuthState('authenticated', currentSession.user, currentSession);
        } else {
          console.log('[AuthContext] No session found');
          updateAuthState('unauthenticated', null, null);
        }
      } catch (error) {
        console.error('[AuthContext] initAuth error:', error);
        updateAuthState('unauthenticated', null, null);
      } finally {
        setIsInitialized(true);
      }
    };

    initAuth();
  }, [fetchUserData, updateAuthState]);

  // Auth state change listener
  useEffect(() => {
    // Guard: supabase client might not be initialized
    if (!supabase || typeof supabase.auth?.onAuthStateChange !== 'function') {
      console.warn('[AuthContext] Supabase auth listener not available');
      return;
    }

    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, newSession) => {
          console.log('[AuthContext] Auth state change:', event, newSession?.user?.email);
          
          // Prevent duplicate processing
          if (authStateChangeRef.current) return;
          authStateChangeRef.current = true;
          
          // Small delay to prevent race conditions with other tabs
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
              }
              break;
          }
        }
      );

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error('[AuthContext] Failed to setup auth listener:', error);
    }
  }, [fetchUserData, updateAuthState]);

  // Listen for storage events to sync auth state across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === AUTH_STORAGE_KEY) {
        // Another tab changed auth state, refresh our session
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
          if (currentSession?.user) {
            setUser(currentSession.user);
            setSession(currentSession);
            setAuthState('authenticated');
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
  }, []);

  // Refresh session manually
  const refreshSession = useCallback(async () => {
    try {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
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
      await (supabase as any).from('users').upsert({
        id: data.user.id,
        email: data.user.email,
        first_name: newUserData.first_name || null,
        last_name: newUserData.last_name || null,
        phone_number: newUserData.phone_number || null,
        property_address: newUserData.property_address || null,
      }, {
        onConflict: 'id'
      });

      await fetchUserData(data.user.id);

      if (data.user.email && newUserData.first_name) {
        try {
          await sendWelcomeEmail(data.user.email, newUserData.first_name);
          console.log('[AuthContext] Welcome email sent to:', data.user.email);
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
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const signInWithApple = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Apple sign-in error:', error);
      throw error;
    }
  };

  const signInWithMicrosoft = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'email profile openid',
      },
    });

    if (error) {
      console.error('Microsoft sign-in error:', error);
      throw error;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserData(null);
    updateAuthState('unauthenticated', null, null);
  };

  const updateUserData = async (data: Partial<UserData>) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await (supabase as any)
      .from('users')
      .update(data)
      .eq('id', user.id);

    if (!error) {
      await fetchUserData(user.id);
    }

    return { error };
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
        signInWithMicrosoft,
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
