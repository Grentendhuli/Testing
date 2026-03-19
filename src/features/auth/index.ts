// Types
export type { AuthState, UserData, AuthContextType } from './types/auth.types';

// Hooks
export { AuthProvider, useAuth } from './hooks/useAuth.tsx';

// Components
export { LoginForm } from './components/LoginForm';
export { SignupForm } from './components/SignupForm';
export { AuthCallback } from './components/AuthCallback';

// Services
export {
  loginWithPassword,
  signupWithPassword,
  signInWithGoogle,
  signInWithApple,
  signInWithMicrosoft,
  signOut,
  getCurrentSession,
  sendMagicLink,
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  AUTH_STORAGE_KEY,
  AUTH_TIMESTAMP_KEY,
} from './services/authService';
