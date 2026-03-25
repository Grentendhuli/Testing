/**
 * AI Usage Tracking Service
 * 
 * Manages AI request quotas for users with tier-based limits:
 * - Free: 50 requests/day
 * - Pro: 500 requests/day
 * - Concierge: Unlimited
 */

import { supabase } from '../lib/supabase';
import { Result, AsyncResult, AppError, createError } from '../types/result';

// Tier-based AI limits
export const TIER_AI_LIMITS = {
  free: 50,        // 50 requests/day
  pro: 500,        // 500 requests/day
  concierge: Infinity // Unlimited
} as const;

// Tier-based AI models
export const TIER_AI_MODELS = {
  free: 'gemini-1.5-flash',
  pro: 'gemini-1.5-flash',
  concierge: 'gemini-1.5-pro' // Better model for premium
} as const;

// Warning threshold (80% of limit)
const WARNING_THRESHOLD = 0.8;

export type SubscriptionTier = 'free' | 'pro' | 'concierge';

export interface AIQuotaStatus {
  used: number;
  limit: number;
  remaining: number;
  tier: SubscriptionTier;
  isUnlimited: boolean;
  canProceed: boolean;
  percentUsed: number;
  warning?: string;
  showWarning: boolean; // At 80% threshold
  showExceeded: boolean; // At 100% limit
}

export interface AIUsageRecord {
  id: string;
  user_id: string;
  request_date: string;
  requests_used: number;
  requests_limit: number;
  last_request_at: string;
  created_at: string;
  updated_at: string;
}

export interface AIUsageFullStatus {
  currentWindow: {
    used: number;
    limit: number;
    remaining: number;
    tier: SubscriptionTier;
    percentUsed: number;
  };
  canProceed: boolean;
  nextResetAt: string;
  warning?: string;
  showWarning: boolean;
  showExceeded: boolean;
}

/**
 * Get the user's subscription tier
 */
export async function getUserSubscriptionTier(userId: string): AsyncResult<SubscriptionTier, AppError> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching user tier:', error);
      return Result.err(createError('TIER_FETCH_FAILED', 'Failed to fetch subscription tier', { originalError: error.message }));
    }
    
    const tier = (data?.subscription_tier as SubscriptionTier) || 'free';
    return Result.ok(tier);
  } catch (error) {
    console.error('Error in getUserSubscriptionTier:', error);
    return Result.ok('free'); // Default to free on error
  }
}

/**
 * Get AI limit for a tier
 */
export function getTierLimit(tier: SubscriptionTier): number {
  return TIER_AI_LIMITS[tier] ?? TIER_AI_LIMITS.free;
}

/**
 * Get AI model for a tier
 */
export function getTierModel(tier: SubscriptionTier): string {
  return TIER_AI_MODELS[tier] ?? TIER_AI_MODELS.free;
}

/**
 * Check if tier has unlimited AI
 */
export function isTierUnlimited(tier: SubscriptionTier): boolean {
  return getTierLimit(tier) === Infinity;
}

/**
 * Check AI quota for a user
 * Returns current usage status with rolling 24h window
 */
export async function checkAIQuota(userId: string): AsyncResult<AIQuotaStatus, AppError> {
  try {
    // Get user's subscription tier
    const tierResult = await getUserSubscriptionTier(userId);
    const tier = tierResult.success ? tierResult.data : 'free';
    const limit = getTierLimit(tier);
    const isUnlimited = limit === Infinity;
    
    // Calculate the 24h window
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    // Get sum of requests in the last 24 hours
    const { data, error } = await supabase
      .from('ai_usage')
      .select('requests_used, last_request_at')
      .eq('user_id', userId)
      .gte('last_request_at', twentyFourHoursAgo)
      .returns<{ requests_used: number; last_request_at: string }[]>();
    
    if (error) {
      console.error('Error checking AI quota:', error);
      return Result.err(createError('AI_QUOTA_CHECK_FAILED', 'Failed to check AI quota', { originalError: error.message }));
    }
    
    const used = data?.reduce((sum, record) => sum + (record.requests_used || 0), 0) || 0;
    const remaining = isUnlimited ? Infinity : Math.max(0, limit - used);
    const canProceed = isUnlimited || used < limit;
    const percentUsed = isUnlimited ? 0 : Math.min(100, (used / limit) * 100);
    
    // Determine warning states
    const showWarning = !isUnlimited && percentUsed >= WARNING_THRESHOLD * 100 && percentUsed < 100;
    const showExceeded = !isUnlimited && used >= limit;
    
    // Generate appropriate warning message
    let warning: string | undefined;
    if (showExceeded) {
      warning = `Daily limit reached (${used}/${limit}). Upgrade to Pro for 10x more requests.`;
    } else if (showWarning) {
      const remainingCount = limit - used;
      warning = `You're approaching your daily limit (${remainingCount} remaining). Upgrade to Pro for 10x more requests.`;
    }
    
    return Result.ok({
      used,
      limit,
      remaining,
      tier,
      isUnlimited,
      canProceed,
      percentUsed,
      warning,
      showWarning,
      showExceeded
    });
  } catch (error) {
    console.error('Error in checkAIQuota:', error);
    // Return free tier defaults on error
    return Result.ok({
      used: 0,
      limit: TIER_AI_LIMITS.free,
      remaining: TIER_AI_LIMITS.free,
      tier: 'free',
      isUnlimited: false,
      canProceed: true,
      percentUsed: 0,
      showWarning: false,
      showExceeded: false
    });
  }
}

/**
 * Increment AI usage for a user
 * Records usage with rolling 24h window logic
 */
export async function incrementAIUsage(userId: string): AsyncResult<void, AppError> {
  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const timestamp = now.toISOString();
    
    // Get user's tier for the limit
    const tierResult = await getUserSubscriptionTier(userId);
    const tier = tierResult.success ? tierResult.data : 'free';
    const limit = getTierLimit(tier);
    
    // Try to update existing record for today
    const { data: existingData, error: fetchError } = await supabase
      .from('ai_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('request_date', today)
      .single()
      .returns<AIUsageRecord | null>();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 = no rows found, other errors are real errors
      console.error('Error fetching AI usage:', fetchError);
      return Result.err(createError('AI_USAGE_FETCH_FAILED', 'Failed to fetch AI usage', { originalError: fetchError.message }));
    }
    
    if (existingData) {
      // Update existing record
      const { error: updateError } = await (supabase
        .from('ai_usage') as any)
        .update({
          requests_used: ((existingData as AIUsageRecord).requests_used || 0) + 1,
          requests_limit: limit,
          last_request_at: timestamp,
          updated_at: timestamp
        })
        .eq('user_id', userId)
        .eq('request_date', today);
      
      if (updateError) {
        console.error('Error updating AI usage:', updateError);
        return Result.err(createError('AI_USAGE_UPDATE_FAILED', 'Failed to update AI usage', { originalError: updateError.message }));
      }
    } else {
      // Insert new record for today
      const { error: insertError } = await (supabase
        .from('ai_usage') as any)
        .insert({
          user_id: userId,
          request_date: today,
          requests_used: 1,
          requests_limit: limit,
          last_request_at: timestamp,
          created_at: timestamp,
          updated_at: timestamp
        });
      
      if (insertError) {
        console.error('Error inserting AI usage:', insertError);
        return Result.err(createError('AI_USAGE_INSERT_FAILED', 'Failed to insert AI usage', { originalError: insertError.message }));
      }
    }
    
    // Clean up old records (older than 30 days) - optional housekeeping
    await cleanupOldAIUsage(userId);
    
    return Result.ok(undefined);
  } catch (error) {
    console.error('Error in incrementAIUsage:', error);
    // Don't throw - we don't want to block the AI request due to tracking errors
    return Result.ok(undefined);
  }
}

/**
 * Get full AI usage status for UI display
 * Includes detailed information about the current window and next reset
 */
export async function getAIUsageStatus(userId: string): AsyncResult<AIUsageFullStatus, AppError> {
  try {
    const quotaResult = await checkAIQuota(userId);
    
    if (!quotaResult.success) {
      return Result.err(quotaResult.error);
    }
    
    const quota = quotaResult.data;
    
    // Calculate next reset time (24 hours from the oldest request in window)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: oldestRequest, error } = await supabase
      .from('ai_usage')
      .select('last_request_at')
      .eq('user_id', userId)
      .gte('last_request_at', twentyFourHoursAgo)
      .order('last_request_at', { ascending: true })
      .limit(1)
      .single()
      .returns<{ last_request_at: string } | null>();
    
    let nextResetAt: string;
    
    if (error || !oldestRequest) {
      // No requests in window, reset is 24h from now
      nextResetAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    } else {
      // Reset is 24h after the oldest request
      const oldestDate = new Date((oldestRequest as { last_request_at: string }).last_request_at);
      nextResetAt = new Date(oldestDate.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }
    
    return Result.ok({
      currentWindow: {
        used: quota.used,
        limit: quota.limit,
        remaining: quota.remaining,
        tier: quota.tier,
        percentUsed: quota.percentUsed
      },
      canProceed: quota.canProceed,
      nextResetAt,
      warning: quota.warning,
      showWarning: quota.showWarning,
      showExceeded: quota.showExceeded
    });
  } catch (error) {
    console.error('Error in getAIUsageStatus:', error);
    // Return free tier defaults
    return Result.ok({
      currentWindow: {
        used: 0,
        limit: TIER_AI_LIMITS.free,
        remaining: TIER_AI_LIMITS.free,
        tier: 'free',
        percentUsed: 0
      },
      canProceed: true,
      nextResetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      showWarning: false,
      showExceeded: false
    });
  }
}

/**
 * Clean up old AI usage records (older than 30 days)
 * Keeps the database clean while maintaining 24h window accuracy
 */
async function cleanupOldAIUsage(userId: string): Promise<void> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { error } = await supabase
      .from('ai_usage')
      .delete()
      .eq('user_id', userId)
      .lt('request_date', thirtyDaysAgo.split('T')[0]);
    
    if (error) {
      console.warn('Error cleaning up old AI usage:', error);
    }
  } catch (error) {
    // Silent fail - cleanup is not critical
    console.warn('Cleanup error (non-critical):', error);
  }
}

/**
 * Check if user can make an AI request
 * Returns error Result if quota exceeded, otherwise returns quota status
 */
export async function validateAIQuota(userId: string): AsyncResult<AIQuotaStatus, AppError> {
  const quotaResult = await checkAIQuota(userId);
  
  if (!quotaResult.success) {
    return Result.err(quotaResult.error);
  }
  
  const quota = quotaResult.data;
  
  if (!quota.canProceed) {
    return Result.err(createError(
      'QUOTA_EXCEEDED',
      quota.warning || 'AI request limit reached',
      { quotaStatus: quota }
    ));
  }
  
  return Result.ok(quota);
}

/**
 * Get usage history for a user (last 30 days)
 * Useful for analytics and user dashboards
 */
export async function getAIUsageHistory(userId: string, days: number = 30): AsyncResult<AIUsageRecord[], AppError> {
  try {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('ai_usage')
      .select('*')
      .eq('user_id', userId)
      .gte('request_date', cutoffDate)
      .order('request_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching AI usage history:', error);
      return Result.err(createError('AI_USAGE_HISTORY_FAILED', 'Failed to fetch AI usage history', { originalError: error.message }));
    }
    
    return Result.ok(data || []);
  } catch (error) {
    console.error('Error in getAIUsageHistory:', error);
    return Result.ok([]);
  }
}

/**
 * Format remaining requests for display
 */
export function formatRemainingRequests(remaining: number): string {
  if (remaining === Infinity) {
    return 'Unlimited';
  }
  return `${remaining} remaining`;
}

/**
 * Format tier name for display
 */
export function formatTierName(tier: SubscriptionTier): string {
  const names: Record<SubscriptionTier, string> = {
    free: 'Free',
    pro: 'Pro',
    concierge: 'Concierge'
  };
  return names[tier] || 'Free';
}
