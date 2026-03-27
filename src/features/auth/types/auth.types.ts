import type { User, Session } from '@supabase/supabase-js';

// Auth state machine types
export type AuthState = 'initializing' | 'authenticated' | 'unauthenticated';

export interface UserData {
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
  // Payment handles
  venmo_handle?: string;
  zelle_contact?: string;
  cashapp_tag?: string;
  paypal_handle?: string;
  preferred_payment_method?: string;
}

export interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authState: AuthState;
  isInitialized: boolean;
  showSessionExpiredModal: boolean;
  setShowSessionExpiredModal: (show: boolean) => void;
  login: (email: string, password: string) => Promise<{ error: Error | null | undefined; remainingAttempts?: number; isLocked?: boolean }>;
  signup: (email: string, password: string, userData: Partial<UserData>) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
  updateUserData: (data: Partial<UserData>) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// Storage keys for auth persistence
export const AUTH_STORAGE_KEY = 'lb_auth_state';
export const AUTH_TIMESTAMP_KEY = 'lb_auth_timestamp';
