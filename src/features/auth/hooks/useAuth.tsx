import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { AuthState, UserData, AuthContextType } from '../types/auth.types';
import {
  loginWithPassword,
  signupWithPassword,
  signInWithGoogle,
  signInWithApple,
  signInWithMicrosoft,
  signOut,
  getCurrentSession,
} from '../services/authService';

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

  // Fetch user data from database - creates record if it doesn't exist (for OAuth users)
  const fetchUserData = useCallback(async (userId: string, user?: User | null) => {
    try {
      // First try to fetch existing user data
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setUserData(data as UserData);
        return data as UserData;
      }

      // If no user data found, create it (for OAuth logins)
      if (error?.code === 'PGRST116' || !data) {
        console.log('[AuthContext] No user record found, creating one for OAuth user...');
        
        // Extract user metadata from Supabase user
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
          property_address: '', // Will be set during onboarding
          avatar_url: avatarUrl,
          subscription_tier: 'free',
          subscription_status: 'active',
          max_units: -1, // Unlimited for free tier
          storage_used: 0,
          storage_limit: 1073741824, // 1GB
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: createdUser, error: createError } = await supabase
          .from('users')
          .upsert(newUserData, { onConflict: 'id' })
          .select()
          .single();

        if (createError) {
          console.error('[AuthContext] Error creating user record:', createError);
          return null;
        }

        if (createdUser) {
          console.log('[AuthContext] User record created successfully');
          setUserData(createdUser as UserData);
          return createdUser as UserData;
        }
      }
    } catch (error) {
      console.error('[AuthContext] fetchUserData error:', error);
    }
    return null;
  }, []);

  // Update auth state - removed localStorage persistence for security
  const updateAuthState = useCallback((newState: AuthState, newUser: User | null, newSession: Session | null) => {
    setAuthState(newState);
    setUser(newUser);
    setSession(newSession);
    
    // Note: Auth tokens are no longer persisted to localStorage for security
    // They remain in memory only and are managed by Supabase's secure cookie-based session
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

      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('[AuthContext] Auth initialization timed out');
        updateAuthState('unauthenticated', null, null);
        setIsInitialized(true);
      }, 5000); // 5 second timeout

      try {
        // Check for existing session
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
  // Note: This now relies on Supabase's cookie-based session instead of localStorage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === AUTH_STORAGE_KEY) {
        // Another tab changed auth state, refresh our session from Supabase
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
