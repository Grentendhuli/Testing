import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Re-export types for convenience
export type { Database };
export type Tables = Database['public']['Tables'];
export type TableRow<T extends keyof Tables> = Tables[T]['Row'];
export type TableInsert<T extends keyof Tables> = Tables[T]['Insert'];
export type TableUpdate<T extends keyof Tables> = Tables[T]['Update'];

// Environment variables for Supabase
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

// Debug logging - only in development
if (import.meta.env.DEV) {
  console.log('[Supabase Debug] URL exists:', !!supabaseUrl);
  console.log('[Supabase Debug] Key exists:', !!supabaseKey);
}

// Validate credentials exist
const isValidUrl = typeof supabaseUrl === 'string' && supabaseUrl.startsWith('https://');
const isValidKey = typeof supabaseKey === 'string' && supabaseKey.length > 0;

// Create client with proper typing
let supabase: SupabaseClient<Database>;

if (!isValidUrl || !isValidKey) {
  console.error('━━━ SUPABASE CONFIG ERROR ━━━');
  console.error('Missing or invalid Supabase credentials');
  console.error('Required: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY');
  console.error('Current URL:', supabaseUrl ? 'SET' : 'NOT SET');
  console.error('Current Key:', supabaseKey ? 'SET' : 'NOT SET');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  // Create a dummy client with methods that return empty results instead of throwing
  // This prevents the app from crashing on load
  const dummyClient = createClient<Database>('https://placeholder.supabase.co', 'placeholder-key', {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  
  // Create a safe wrapper that returns empty data instead of throwing
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
  // SECURE: Memory-only token storage to prevent XSS attacks
  // Tokens are NOT stored in localStorage, preventing malicious scripts from stealing them
  // Trade-offs:
  //   - User must re-login after closing tab/refreshing page (session is memory-only)
  //   - autoRefreshToken keeps session alive while tab is open
  //   - OAuth flows still work via URL hash detection (detectSessionInUrl)
  //   - 1-hour default session TTL from Supabase (configured in Supabase Dashboard > Auth > Sessions)
  supabase = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,      // Auto-refresh token while tab is open
      persistSession: false,       // SECURITY: Don't store tokens in localStorage (XSS protection)
      detectSessionInUrl: true,    // Handle OAuth redirects (Google/Apple sign-in)
    },
  });
  console.log('[Supabase] Client initialized securely (memory-only tokens)');
}

export { supabase };
export default supabase;
