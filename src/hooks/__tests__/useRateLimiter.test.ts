/**
 * Rate Limiting Tests
 *
 * Tests for the rate limiting hooks to ensure they work correctly.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRateLimiter, RATE_LIMITS } from '../src/hooks/useRateLimiter';

describe('useRateLimiter', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should allow requests under the limit', () => {
    const { result } = renderHook(() => useRateLimiter());

    // Check limit without recording
    const status = result.current.checkLimit('ai', 'user1');
    
    expect(status.allowed).toBe(true);
    expect(status.remaining).toBe(RATE_LIMITS.ai.requestsPerWindow - 1);
  });

  it('should block requests over the limit', () => {
    const { result } = renderHook(() => useRateLimiter());

    // Make exactly limit requests
    for (let i = 0; i < RATE_LIMITS.ai.requestsPerWindow; i++) {
      act(() => {
        result.current.recordRequest('ai', 'user1');
      });
    }

    // Next request should be blocked
    const status = result.current.checkLimit('ai', 'user1');
    expect(status.allowed).toBe(false);
    expect(status.remaining).toBe(0);
    expect(status.retryAfter).toBeGreaterThan(0);
  });

  it('should track different users separately', () => {
    const { result } = renderHook(() => useRateLimiter());

    // Max out user1
    for (let i = 0; i < RATE_LIMITS.ai.requestsPerWindow; i++) {
      act(() => {
        result.current.recordRequest('ai', 'user1');
      });
    }

    // User2 should still have full quota
    const status = result.current.checkLimit('ai', 'user2');
    expect(status.allowed).toBe(true);
    expect(status.remaining).toBe(RATE_LIMITS.ai.requestsPerWindow - 1);
  });

  it('should track different endpoint types separately', () => {
    const { result } = renderHook(() => useRateLimiter());

    // Max out AI endpoint
    for (let i = 0; i < RATE_LIMITS.ai.requestsPerWindow; i++) {
      act(() => {
        result.current.recordRequest('ai', 'user1');
      });
    }

    // Other endpoints should still work
    const status = result.current.checkLimit('email', 'user1');
    expect(status.allowed).toBe(true);
    expect(status.remaining).toBe(RATE_LIMITS.email.requestsPerWindow - 1);
  });

  it('should clear limits correctly', () => {
    const { result } = renderHook(() => useRateLimiter());

    // Use some quota
    act(() => {
      result.current.recordRequest('ai', 'user1');
    });

    // Clear the limit
    act(() => {
      result.current.clearLimit('ai', 'user1');
    });

    // Should have full quota again
    const status = result.current.checkLimit('ai', 'user1');
    expect(status.remaining).toBe(RATE_LIMITS.ai.requestsPerWindow - 1);
  });

  it('should format retry after correctly', () => {
    const { result } = renderHook(() => useRateLimiter());

    // Max out the limit
    for (let i = 0; i < RATE_LIMITS.ai.requestsPerWindow; i++) {
      act(() => {
        result.current.recordRequest('ai', 'user1');
      });
    }

    const status = result.current.checkLimit('ai', 'user1');
    const formatted = result.current.formatRetryAfter(status.retryAfter || 0);

    expect(formatted).toMatch(/\d+ seconds?/);
  });

  it('should return correct config for each endpoint type', () => {
    const { result } = renderHook(() => useRateLimiter());

    expect(result.current.getConfig('ai')).toEqual({
      requestsPerWindow: 10,
      windowSizeInSeconds: 60,
    });

    expect(result.current.getConfig('auth')).toEqual({
      requestsPerWindow: 5,
      windowSizeInSeconds: 300,
    });

    expect(result.current.getConfig('unknown')).toEqual({
      requestsPerWindow: 60,
      windowSizeInSeconds: 60,
    });
  });
});

describe('RATE_LIMITS configuration', () => {
  it('should have valid window sizes', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for (const [key, config] of Object.entries(RATE_LIMITS)) {
      expect(config.windowSizeInSeconds).toBeGreaterThan(0);
      expect(config.requestsPerWindow).toBeGreaterThan(0);
    }
  });

  it('should have stricter auth limits', () => {
    expect(RATE_LIMITS.auth.requestsPerWindow).toBeLessThan(RATE_LIMITS.default.requestsPerWindow);
    expect(RATE_LIMITS.auth.windowSizeInSeconds).toBeGreaterThan(RATE_LIMITS.default.windowSizeInSeconds);
  });

  it('should have stricter AI limits', () => {
    expect(RATE_LIMITS.ai.requestsPerWindow).toBeLessThan(RATE_LIMITS.default.requestsPerWindow);
  });
});
