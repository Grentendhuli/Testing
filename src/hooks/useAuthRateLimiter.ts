/**
 * useAuthRateLimiter Hook
 *
 * Specialized rate limiting for authentication endpoints with user-friendly UI feedback.
 * Prevents brute force attacks on login, signup, and forgot password.
 *
 * Usage:
 *   const authRateLimiter = useAuthRateLimiter();
 *   const canLogin = authRateLimiter.canAttempt('login', email);
 *   const error = authRateLimiter.getErrorMessage('login', email);
 */

import { useCallback, useState, useEffect } from 'react';
import { useRateLimiter, RateLimitStatus } from './useRateLimiter';

export type AuthEndpointType = 'login' | 'signup' | 'forgotPassword';

export interface AuthRateLimitState {
  isBlocked: boolean;
  remainingAttempts: number;
  retryAfter: number;
  formattedRetryAfter: string;
}

export function useAuthRateLimiter() {
  const rateLimiter = useRateLimiter();
  const [blockedStates, setBlockedStates] = useState<Record<string, AuthRateLimitState>>({});

  // Update blocked states periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setBlockedStates((prev) => {
        const updated = { ...prev };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const key of Object.keys(updated)) {
          const [endpointType, identifier] = key.split(':');
          const status = rateLimiter.checkLimit(endpointType, identifier);
          
          if (status.allowed) {
            delete updated[key];
          } else {
            updated[key] = {
              isBlocked: true,
              remainingAttempts: 0,
              retryAfter: status.retryAfter || 60,
              formattedRetryAfter: rateLimiter.formatRetryAfter(status.retryAfter || 60),
            };
          }
        }
        return updated;
      });
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [rateLimiter]);

  // Generate cache key
  const getCacheKey = useCallback(
    (endpointType: AuthEndpointType, identifier: string): string => {
      return `${endpointType}:${identifier}`;
    },
    []
  );

  // Check if the user can attempt an auth action
  const canAttempt = useCallback(
    (endpointType: AuthEndpointType, identifier: string): boolean => {
      const status = rateLimiter.checkLimit(endpointType, identifier);
      return status.allowed;
    },
    [rateLimiter]
  );

  // Get remaining attempts
  const getRemainingAttempts = useCallback(
    (endpointType: AuthEndpointType, identifier: string): number => {
      const status = rateLimiter.checkLimit(endpointType, identifier);
      return status.remaining;
    },
    [rateLimiter]
  );

  // Record an attempt (call this after a failed attempt)
  const recordAttempt = useCallback(
    (endpointType: AuthEndpointType, identifier: string): RateLimitStatus => {
      const status = rateLimiter.checkAndRecord(endpointType, identifier);

      if (!status.allowed) {
        setBlockedStates((prev) => ({
          ...prev,
          [getCacheKey(endpointType, identifier)]: {
            isBlocked: true,
            remainingAttempts: 0,
            retryAfter: status.retryAfter || 60,
            formattedRetryAfter: rateLimiter.formatRetryAfter(status.retryAfter || 60),
          },
        }));
      }

      return status;
    },
    [rateLimiter, getCacheKey]
  );

  // Clear rate limit (e.g., after successful login)
  const clearLimit = useCallback(
    (endpointType: AuthEndpointType, identifier: string): void => {
      rateLimiter.clearLimit(endpointType, identifier);
      setBlockedStates((prev) => {
        const updated = { ...prev };
        delete updated[getCacheKey(endpointType, identifier)];
        return updated;
      });
    },
    [rateLimiter, getCacheKey]
  );

  // Get error message for display
  const getErrorMessage = useCallback(
    (endpointType: AuthEndpointType, identifier: string): string | null => {
      const key = getCacheKey(endpointType, identifier);
      const state = blockedStates[key];

      if (!state?.isBlocked) {
        return null;
      }

      const actionName =
        endpointType === 'login'
          ? 'login'
          : endpointType === 'signup'
            ? 'signup'
            : 'password reset';

      return `Too many ${actionName} attempts. Please try again in ${state.formattedRetryAfter}.`;
    },
    [blockedStates, getCacheKey]
  );

  // Get warning message (shown before limit is reached)
  const getWarningMessage = useCallback(
    (endpointType: AuthEndpointType, identifier: string): string | null => {
      const remaining = getRemainingAttempts(endpointType, identifier);

      if (remaining <= 2 && remaining > 0) {
        return `Warning: ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining before rate limit.`;
      }

      return null;
    },
    [getRemainingAttempts]
  );

  // Check if blocked (for UI state)
  const isBlocked = useCallback(
    (endpointType: AuthEndpointType, identifier: string): boolean => {
      const key = getCacheKey(endpointType, identifier);
      const state = blockedStates[key];
      return state?.isBlocked || false;
    },
    [blockedStates, getCacheKey]
  );

  // Get formatted retry after
  const getRetryAfterText = useCallback(
    (endpointType: AuthEndpointType, identifier: string): string | null => {
      const key = getCacheKey(endpointType, identifier);
      const state = blockedStates[key];
      return state?.formattedRetryAfter || null;
    },
    [blockedStates, getCacheKey]
  );

  return {
    // Main functions
    canAttempt,
    recordAttempt,
    clearLimit,
    getRemainingAttempts,

    // UI helpers
    isBlocked,
    getErrorMessage,
    getWarningMessage,
    getRetryAfterText,

    // Raw states
    blockedStates,
  };
}

export default useAuthRateLimiter;
