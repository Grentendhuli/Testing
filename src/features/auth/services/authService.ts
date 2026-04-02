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
  } catch (error) {
    console.error('[signInWithGoogle] Error:', error);
    throw error;
  }
}

export async function signInWithApple() {
  try {
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
  } catch (error) {
    console.error('[signInWithApple] Error:', error);
    throw error;
  }
}

export async function signInWithMicrosoft() {
  try {
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
  } catch (error) {
    console.error('[signInWithMicrosoft] Error:', error);
    throw error;
  }
}

export async function signOut() {
  try {
    await supabase.auth.signOut();
  } catch (error) {
    console.error('[signOut] Error:', error);
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
    // Ignore storage errors
  }
};
