/**
 * useAIRateLimiter Hook
 *
 * Specialized rate limiting for AI generation endpoints with cost control.
 * Prevents abuse and provides cost-control warnings.
 *
 * Usage:
 *   const aiRateLimiter = useAIRateLimiter();
 *   const canGenerate = aiRateLimiter.canGenerate(userId);
 *   const status = aiRateLimiter.getStatus(userId);
 */

import { useCallback, useState, useEffect } from 'react';
import { useRateLimiter, RateLimitStatus } from './useRateLimiter';

export interface AIRateLimitState {
  isBlocked: boolean;
  remaining: number;
  totalAllowed: number;
  usedInWindow: number;
  retryAfter: number;
  formattedRetryAfter: string;
  percentUsed: number;
}

export function useAIRateLimiter() {
  const rateLimiter = useRateLimiter();
  const [aiStates, setAiStates] = useState<Record<string, AIRateLimitState>>({});

  // Update AI states periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setAiStates((prev) => {
        const updated: Record<string, AIRateLimitState> = {};

        // Update all tracked users
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const userId of Object.keys(prev)) {
          updated[userId] = calculateState(userId);
        }

        return updated;
      });
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Calculate state for a user
  const calculateState = useCallback(
    (userId: string): AIRateLimitState => {
      const status = rateLimiter.checkLimit('ai', userId);
      const config = rateLimiter.getConfig('ai');

      const totalAllowed = config.requestsPerWindow;
      const usedInWindow = totalAllowed - status.remaining - (status.allowed ? 1 : 0);
      const percentUsed = Math.round((usedInWindow / totalAllowed) * 100);

      return {
        isBlocked: !status.allowed,
        remaining: status.remaining,
        totalAllowed,
        usedInWindow,
        retryAfter: status.retryAfter || 0,
        formattedRetryAfter: rateLimiter.formatRetryAfter(status.retryAfter || 0),
        percentUsed,
      };
    },
    [rateLimiter]
  );

  // Check if user can generate AI content
  const canGenerate = useCallback(
    (userId: string): boolean => {
      return rateLimiter.checkLimit('ai', userId).allowed;
    },
    [rateLimiter]
  );

  // Record a generation attempt
  const recordGeneration = useCallback(
    (userId: string): RateLimitStatus => {
      const status = rateLimiter.checkAndRecord('ai', userId);
      
      // Update state
      setAiStates((prev) => ({
        ...prev,
        [userId]: calculateState(userId),
      }));

      return status;
    },
    [rateLimiter, calculateState]
  );

  // Get current status
  const getStatus = useCallback(
    (userId: string): AIRateLimitState => {
      // Calculate fresh status
      const status = calculateState(userId);
      
      // Update cache
      setAiStates((prev) => ({
        ...prev,
        [userId]: status,
      }));

      return status;
    },
    [calculateState]
  );

  // Check if warning should be shown (at 80% usage)
  const shouldShowWarning = useCallback(
    (userId: string, threshold = 80): boolean => {
      const status = getStatus(userId);
      return status.percentUsed >= threshold && !status.isBlocked;
    },
    [getStatus]
  );

  // Get warning message
  const getWarningMessage = useCallback(
    (userId: string): string | null => {
      const status = getStatus(userId);
      
      if (status.isBlocked) {
        return `AI generation limit reached. Please try again in ${status.formattedRetryAfter}.`;
      }
      
      if (status.percentUsed >= 80) {
        return `Approaching rate limit: ${status.remaining} request${status.remaining !== 1 ? 's' : ''} remaining.`;
      }

      return null;
    },
    [getStatus]
  );

  // Format usage for display
  const formatUsage = useCallback(
    (userId: string): string => {
      const status = getStatus(userId);
      return `${status.remaining}/${status.totalAllowed} remaining`;
    },
    [getStatus]
  );

  // Reset tracking for a user (e.g., on logout)
  const resetTracking = useCallback(
    (userId: string): void => {
      rateLimiter.clearLimit('ai', userId);
      setAiStates((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    },
    [rateLimiter]
  );

  // Get color based on usage (for UI indicators)
  const getUsageColor = useCallback(
    (userId: string): 'success' | 'warning' | 'danger' => {
      const status = getStatus(userId);
      
      if (status.isBlocked || status.percentUsed >= 90) {
        return 'danger';
      }
      if (status.percentUsed >= 70) {
        return 'warning';
      }
      return 'success';
    },
    [getStatus]
  );

  return {
    // Main functions
    canGenerate,
    recordGeneration,
    getStatus,
    formatUsage,
    resetTracking,

    // UI helpers
    shouldShowWarning,
    getWarningMessage,
    getUsageColor,

    // Raw states
    aiStates,
  };
}

export default useAIRateLimiter;
