import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export type { Database };
export type Tables = Database['public']['Tables'];
export type TableRow<T extends keyof Tables> = Tables[T]['Row'];
export type TableInsert<T extends keyof Tables> = Tables[T]['Insert'];
export type TableUpdate<T extends keyof Tables> = Tables[T]['Update'];

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

if ((import.meta as any).env?.DEV) {
  console.log('[Supabase Debug] URL exists:', !!supabaseUrl);
  console.log('[Supabase Debug] Key exists:', !!supabaseKey);
}

const isValidUrl = typeof supabaseUrl === 'string' && supabaseUrl.startsWith('https://');
const isValidKey = typeof supabaseKey === 'string' && supabaseKey.length > 0;

// Project reference for storage key
const projectRef = isValidUrl 
  ? supabaseUrl.match(/([a-z0-9]{20,})\.supabase\.co/)?.[1] 
  : null;

export const STORAGE_KEY = projectRef 
  ? `sb-${projectRef}-auth-token` 
  : 'lb-auth-token';

export const CODE_VERIFIER_KEY = projectRef 
  ? `sb-${projectRef}-auth-token-code-verifier` 
  : 'lb-auth-code-verifier';

let supabase: SupabaseClient<Database>;

if (!isValidUrl || !isValidKey) {
  console.error('━━━ SUPABASE CONFIG ERROR ━━━');
  console.error('Missing or invalid Supabase credentials');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  console.error('Current URL:', supabaseUrl ? 'SET' : 'NOT SET');
  console.error('Current Key:', supabaseKey ? 'SET' : 'NOT SET');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const dummyClient = createClient<Database>('https://placeholder.supabase.co', 'placeholder-key', {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  
  const safeFrom = () => ({
    select: () => ({ data: null, error: { message: 'Supabase not configured', code: 'CONFIG_ERROR' } }),
    insert: () => ({ data: null, error: { message: 'Supabase not configured', code: 'CONFIG_ERROR' } }),
    update: () => ({ data: null, error: { message: 'Supabase not configured', code: 'CONFIG_ERROR' } }),
    delete: () => ({ data: null, error: { message: 'Supabase not configured', code: 'CONFIG_ERROR' } }),
    eq: () => ({ data: null, error: { message: 'Supabase not configured', code: 'CONFIG_ERROR' } }),
    single: () => ({ data: null, error: { message: 'Supabase not configured', code: 'CONFIG_ERROR' } }),
  });
  
  supabase = new Proxy(dummyClient, {
    get(target, prop) {
      if (prop === 'from') {
        return safeFrom;
      }
      if (prop === 'auth') {
        return {
          getSession: async () => ({ data: { session: null }, error: null }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
          signUp: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
          signOut: async () => ({ error: null }),
        };
      }
      return target[prop as keyof typeof target];
    }
  }) as SupabaseClient<Database>;
} else {
  // PRODUCTION: Secure session persistence enabled
  // Security model:
  // 1. JWT tokens stored in localStorage (Supabase default)
  // 2. Short token lifetime (1 hour) with automatic refresh
  // 3. RLS policies prevent unauthorized data access
  // 4. XSS protection via CSP headers + input sanitization
  
  // CRITICAL FIX: Custom storage implementation to preserve PKCE code verifier
  const customStorage = {
    getItem: (key: string): string | null => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key: string, value: string): void => {
      try {
        localStorage.setItem(key, value);
        
        // Debug logging for PKCE verifier
        if (key.includes('code-verifier') && (import.meta as any).env?.DEV) {
          console.log('[Supabase] Code verifier stored:', key);
        }
      } catch (e) {
        console.warn('[Supabase] Failed to set item:', key, e);
      }
    },
    removeItem: (key: string): void => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore
      }
    },
  };
  
  supabase = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,      // Auto-detect OAuth callback
      storage: customStorage,         // Custom storage with error handling
      storageKey: STORAGE_KEY,        // Consistent storage key
      flowType: 'pkce',               // PKCE flow for OAuth
      // CRITICAL FIX: Ensure cookies are used properly for cross-origin
      // Note: This is the default behavior, but being explicit
    },
    db: { schema: 'public' },
    global: {
      headers: { 'X-Client-Info': 'landlordbot-web' },
    },
  });
  
  console.log('[Supabase] Client initialized with PKCE OAuth support');
  console.log('[Supabase] Storage key:', STORAGE_KEY);
}

export { supabase };
export default supabase;

// Helper: Get code verifier for debugging
export const getPKCEVerifier = (): string | null => {
  return localStorage.getItem(CODE_VERIFIER_KEY);
};

// Helper: Clear all Supabase auth data (for logout/errors)
export const clearSupabaseAuth = (): void => {
  const keysToRemove = Object.keys(localStorage).filter(k => 
    k.includes('sb-') || k.includes('supabase') || k.includes(STORAGE_KEY)
  );
  keysToRemove.forEach(key => localStorage.removeItem(key));
};
