import { supabase } from '@/lib/supabase';
import { sendWelcomeEmail } from '@/services/sendgrid';
import { sanitizeEmail } from '@/lib/sanitize';
import type { UserData } from '../types/auth.types';

export const AUTH_STORAGE_KEY = 'landlordbot_auth';
export const AUTH_TIMESTAMP_KEY = 'landlordbot_auth_timestamp';

export async function loginWithPassword(email: string, password: string) {
  try {
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      return { error: new Error('Invalid email address') };
    }
    
    const { error } = await supabase.auth.signInWithPassword({
      email: sanitizedEmail,
      password,
    });
    return { error };
  } catch (error) {
    console.error('[loginWithPassword] Error:', error);
    return { error: error as Error };
  }
}

export async function signupWithPassword(
  email: string,
  password: string,
  userData: Partial<UserData>
) {
  try {
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      return { data: null, error: new Error('Invalid email address') };
    }
    
    const { data, error } = await supabase.auth.signUp({
      email: sanitizedEmail,
      password,
      options: {
        data: {
          first_name: userData.first_name || null,
          last_name: userData.last_name || null,
          phone_number: userData.phone_number || null,
          property_address: userData.property_address || null,
        },
      },
    });

    if (data.user && !error) {
      // Create user profile in users table
      await (supabase as any).from('users').upsert({
        id: data.user.id,
        email: data.user.email,
        first_name: userData.first_name || null,
        last_name: userData.last_name || null,
        phone_number: userData.phone_number || null,
        property_address: userData.property_address || null,
      }, {
        onConflict: 'id'
      });

      // Send welcome email
      if (data.user.email && userData.first_name) {
        try {
          await sendWelcomeEmail(data.user.email, userData.first_name);
        } catch (emailError) {
          console.error('[AuthService] Failed to send welcome email:', emailError);
        }
      }
    }

    return { data, error };
  } catch (error) {
    console.error('[signupWithPassword] Error:', error);
    return { data: null, error: error as Error };
  }
}

export async function signInWithGoogle() {
  try {
    // CRITICAL FIX: Store a flag to indicate OAuth is in progress
    // This helps detect if the code verifier might have been lost
    sessionStorage.setItem('oauth_in_progress', 'true');
    sessionStorage.setItem('oauth_start_time', Date.now().toString());
    
    // Log current storage state before OAuth
    if ((import.meta as any).env?.DEV) {
      const supabaseKeys = Object.keys(localStorage).filter(k => 
        k.includes('sb-') || k.includes('code-verifier')
      );
      console.log('[AuthService] Pre-OAuth storage keys:', supabaseKeys);
    }
    
    const redirectTo = `${window.location.origin}/auth/callback`;
    console.log('[AuthService] Starting Google OAuth, redirect to:', redirectTo);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        // CRITICAL FIX: Ensure PKCE is used
        // Supabase handles this automatically with flowType: 'pkce' in client config
      },
    });

    if (error) {
      console.error('[AuthService] Google sign-in error:', error);
      sessionStorage.removeItem('oauth_in_progress');
      throw error;
    }
    
    // The browser will redirect to Google now
    // On return, the AuthCallback component will handle the response
    console.log('[AuthService] OAuth initiated, browser redirecting...');
    
    return { data, error: null };
  } catch (error) {
    console.error('[signInWithGoogle] Error:', error);
    sessionStorage.removeItem('oauth_in_progress');
    throw error;
  }
}

export async function signInWithApple() {
  try {
    sessionStorage.setItem('oauth_in_progress', 'true');
    
    const redirectTo = `${window.location.origin}/auth/callback`;
    console.log('[AuthService] Starting Apple OAuth, redirect to:', redirectTo);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo,
      },
    });

    if (error) {
      console.error('[AuthService] Apple sign-in error:', error);
      sessionStorage.removeItem('oauth_in_progress');
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('[signInWithApple] Error:', error);
    sessionStorage.removeItem('oauth_in_progress');
    throw error;
  }
}

export async function signInWithMicrosoft() {
  try {
    sessionStorage.setItem('oauth_in_progress', 'true');
    
    const redirectTo = `${window.location.origin}/auth/callback`;
    console.log('[AuthService] Starting Microsoft OAuth, redirect to:', redirectTo);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo,
        scopes: 'email profile openid',
      },
    });

    if (error) {
      console.error('[AuthService] Microsoft sign-in error:', error);
      sessionStorage.removeItem('oauth_in_progress');
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('[signInWithMicrosoft] Error:', error);
    sessionStorage.removeItem('oauth_in_progress');
    throw error;
  }
}

export async function signOut() {
  try {
    // Clear OAuth in progress flag
    sessionStorage.removeItem('oauth_in_progress');
    sessionStorage.removeItem('oauth_start_time');
    
    // Clear any auth processing flags from sessionStorage
    sessionStorage.removeItem('auth_processed');
    
    await supabase.auth.signOut();
    console.log('[AuthService] Sign out successful');
  } catch (error) {
    console.error('[signOut] Error:', error);
    // Even if Supabase signOut fails, we should still clear local state
    // The clearAuthState function in useAuth will handle this
  }
}

export async function getCurrentSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  } catch (error) {
    console.error('[getCurrentSession] Error:', error);
    return { session: null, error: error as Error };
  }
}

export async function sendMagicLink(email: string) {
  try {
    const sanitizedEmail = sanitizeEmail(email);
    if (!sanitizedEmail) {
      return { error: new Error('Invalid email address') };
    }
    
    const { error } = await supabase.auth.signInWithOtp({
      email: sanitizedEmail,
      options: {
        emailRedirectTo: window.location.origin + '/auth/callback',
      },
    });
    return { error };
  } catch (error) {
    console.error('[sendMagicLink] Error:', error);
    return { error: error as Error };
  }
}

// Helper to safely access localStorage
export const getStorageItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const setStorageItem = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignore storage errors
  }
};

export const removeStorageItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
};

// Helper to get OAuth state for debugging
export const getOAuthState = () => {
  return {
    inProgress: sessionStorage.getItem('oauth_in_progress'),
    startTime: sessionStorage.getItem('oauth_start_time'),
    elapsed: sessionStorage.getItem('oauth_start_time') 
      ? Date.now() - parseInt(sessionStorage.getItem('oauth_start_time')!, 10)
      : null,
  };
};

// Helper to clear OAuth state
export const clearOAuthState = () => {
  sessionStorage.removeItem('oauth_in_progress');
  sessionStorage.removeItem('oauth_start_time');
  sessionStorage.removeItem('auth_processed');
};
