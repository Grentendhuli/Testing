/**
 * useRateLimiter Hook
 *
 * Client-side rate limiting for API calls to prevent abuse and provide immediate feedback.
 * Works alongside server-side rate limiting as a secondary defense layer.
 *
 * Usage:
 *   const rateLimiter = useRateLimiter();
 *   const canProceed = await rateLimiter.checkLimit('ai', userId);
 */

import { useCallback, useRef, useState } from 'react';
import { useLocalStorage } from './index';

export interface RateLimitConfig {
  requestsPerWindow: number;
  windowSizeInSeconds: number;
}

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

// Rate limit configurations by endpoint type
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // AI endpoints - stricter limits for cost control
  ai: {
    requestsPerWindow: 10,
    windowSizeInSeconds: 60, // 10 requests per minute
  },
  // Auth endpoints - strict for brute force protection (per email)
  auth: {
    requestsPerWindow: 5,
    windowSizeInSeconds: 300, // 5 attempts per 5 minutes
  },
  login: {
    requestsPerWindow: 5,
    windowSizeInSeconds: 300, // 5 attempts per 5 minutes
  },
  signup: {
    requestsPerWindow: 3,
    windowSizeInSeconds: 3600, // 3 signups per hour
  },
  forgotPassword: {
    requestsPerWindow: 3,
    windowSizeInSeconds: 3600, // 3 requests per hour
  },
  // Communication endpoints
  email: {
    requestsPerWindow: 20,
    windowSizeInSeconds: 60, // 20 emails per minute
  },
  vapi: {
    requestsPerWindow: 10,
    windowSizeInSeconds: 60, // 10 calls per minute
  },
  // Export functionality
  export: {
    requestsPerWindow: 5,
    windowSizeInSeconds: 60, // 5 exports per minute
  },
  download: {
    requestsPerWindow: 10,
    windowSizeInSeconds: 60, // 10 downloads per minute
  },
  // Default
  default: {
    requestsPerWindow: 60,
    windowSizeInSeconds: 60, // 60 requests per minute
  },
};

// Storage key for rate limit tracking
const RATE_LIMIT_STORAGE_KEY = 'lb_rate_limits_v1';

interface RateLimitEntry {
  timestamps: number[];
  lastReset: number;
}

type RateLimitStorage = Record<string, RateLimitEntry>;

export function useRateLimiter() {
  // Use localStorage for persistence across page reloads
  const [rateLimitData, setRateLimitData] = useLocalStorage<RateLimitStorage>(
    RATE_LIMIT_STORAGE_KEY,
    {}
  );

  // In-memory cache for current session (faster access)
  const memoryCache = useRef<RateLimitStorage>(rateLimitData);

  // Get config for an endpoint
  const getConfig = useCallback((endpointType: string): RateLimitConfig => {
    return RATE_LIMITS[endpointType] || RATE_LIMITS.default;
  }, []);

  // Generate rate limit key
  const generateKey = useCallback(
    (endpointType: string, identifier: string): string => {
      return `${endpointType}:${identifier}`;
    },
    []
  );

  // Clean expired entries from storage
  const cleanupExpired = useCallback(() => {
    const now = Date.now();
    const cleaned: RateLimitStorage = {};

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [key, entry] of Object.entries(memoryCache.current) as [string, RateLimitEntry][]) {
      const config = getConfig(key.split(':')[0]);
      const windowStart = now - config.windowSizeInSeconds * 1000;

      if (entry.timestamps.some((ts) => ts > windowStart)) {
        cleaned[key] = {
          timestamps: entry.timestamps.filter((ts) => ts > windowStart),
          lastReset: entry.lastReset,
        };
      }
    }

    memoryCache.current = cleaned;
    setRateLimitData(cleaned);
  }, [getConfig, setRateLimitData]);

  // Check rate limit for an endpoint
  const checkLimit = useCallback(
    (endpointType: string, identifier: string): RateLimitStatus => {
      const config = getConfig(endpointType);
      const key = generateKey(endpointType, identifier);
      const now = Date.now();
      const windowStart = now - config.windowSizeInSeconds * 1000;

      // Get existing entry
      const entry = memoryCache.current[key] || { timestamps: [], lastReset: 0 };

      // Filter to current window
      const currentWindowTimestamps = entry.timestamps.filter(
        (ts) => ts > windowStart
      );

      const currentCount = currentWindowTimestamps.length;
      const limit = config.requestsPerWindow;
      const remaining = Math.max(0, limit - currentCount);

      // Calculate reset time
      const resetTime =
        currentWindowTimestamps.length > 0
          ? Math.min(...currentWindowTimestamps) + config.windowSizeInSeconds * 1000
          : now + config.windowSizeInSeconds * 1000;

      if (currentCount >= limit) {
        return {
          allowed: false,
          remaining: 0,
          resetTime,
          retryAfter: Math.ceil((resetTime - now) / 1000),
        };
      }

      return {
        allowed: true,
        remaining: remaining - 1,
        resetTime,
      };
    },
    [generateKey, getConfig]
  );

  // Record a request attempt
  const recordRequest = useCallback(
    (endpointType: string, identifier: string): void => {
      const key = generateKey(endpointType, identifier);
      const now = Date.now();

      const entry = memoryCache.current[key] || { timestamps: [], lastReset: now };
      entry.timestamps.push(now);

      memoryCache.current = {
        ...memoryCache.current,
        [key]: entry,
      };

      setRateLimitData(memoryCache.current);
    },
    [generateKey, setRateLimitData]
  );

  // Check and record in one operation
  const checkAndRecord = useCallback(
    (endpointType: string, identifier: string): RateLimitStatus => {
      const status = checkLimit(endpointType, identifier);

      if (status.allowed) {
        recordRequest(endpointType, identifier);
      }

      return status;
    },
    [checkLimit, recordRequest]
  );

  // Clear rate limit for a specific endpoint
  const clearLimit = useCallback(
    (endpointType: string, identifier: string): void => {
      const key = generateKey(endpointType, identifier);
      const { [key]: _, ...rest } = memoryCache.current;

      memoryCache.current = rest;
      setRateLimitData(rest);
    },
    [generateKey, setRateLimitData]
  );

  // Get time until next available request
  const getTimeUntilNextRequest = useCallback(
    (endpointType: string, identifier: string): number => {
      const status = checkLimit(endpointType, identifier);

      if (status.allowed) {
        return 0;
      }

      return status.retryAfter || 0;
    },
    [checkLimit]
  );

  // Format retry after time as human readable string
  const formatRetryAfter = useCallback((seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }, []);

  return {
    // Rate limit configs
    configs: RATE_LIMITS,
    getConfig,

    // Core functions
    checkLimit,
    recordRequest,
    checkAndRecord,
    clearLimit,
    cleanupExpired,

    // Utilities
    getTimeUntilNextRequest,
    formatRetryAfter,

    // Raw data (for debugging)
    rateLimitData: memoryCache.current,
  };
}

export default useRateLimiter;
