import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export type { Database };
export type Tables = Database['public']['Tables'];
export type TableRow<T extends keyof Tables> = Tables[T]['Row'];
export type TableInsert<T extends keyof Tables> = Tables[T]['Insert'];
export type TableUpdate<T extends keyof Tables> = Tables[T]['Update'];

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

if (import.meta.env.DEV) {
  console.log('[Supabase Debug] URL exists:', !!supabaseUrl);
  console.log('[Supabase Debug] Key exists:', !!supabaseKey);
}

const isValidUrl = typeof supabaseUrl === 'string' && supabaseUrl.startsWith('https://');
const isValidKey = typeof supabaseKey === 'string' && supabaseKey.length > 0;

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
  supabase = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,              // FIXED: Enable session persistence
      detectSessionInUrl: true,
      storageKey: 'lb-auth-token',        // Custom storage key
      flowType: 'pkce',                   // Enhanced OAuth security
    },
    db: { schema: 'public' },
    global: {
      headers: { 'X-Client-Info': 'landlordbot-web' },
    },
  });
  console.log('[Supabase] Client initialized with secure session persistence');
}

export { supabase };
export default supabase;
