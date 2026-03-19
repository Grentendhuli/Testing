/**
 * AI Usage Tracking Service
 * 
 * Manages AI request quotas for users.
 * Free tier: Unlimited AI requests (generous free tier).
 */

import { supabase } from '../lib/supabase';
import { Result, AsyncResult, AppError, createError } from '../types/result';

// Constants - Unlimited on free tier
const HARD_LIMIT = Infinity;
const SOFT_LIMIT = Infinity;

export interface AIQuotaStatus {
  used: number;
  limit: number;
  remaining: number;
  isSoftLimit: boolean;
  canProceed: boolean;
  warning?: string;
}

export interface AIUsageRecord {
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
    isSoftLimit: boolean;
  };
  canProceed: boolean;
  nextResetAt: string;
  warning?: string;
}

/**
 * Check AI quota for a user
 * Returns current usage status with rolling 24h window
 */
export async function checkAIQuota(userId: string): AsyncResult<AIQuotaStatus, AppError> {
  try {
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
    
    // Unlimited on free tier - always allow
    const isSoftLimit = false;
    const limit = Infinity;
    const remaining = Infinity;
    const canProceed = true;
    
    // No warnings needed for unlimited tier
    let warning: string | undefined;
    
    return Result.ok({
      used,
      limit,
      remaining,
      isSoftLimit,
      canProceed,
      warning
    });
  } catch (error) {
    console.error('Error in checkAIQuota:', error);
    // Return unlimited defaults - free tier is generous
    return Result.ok({
      used: 0,
      limit: Infinity,
      remaining: Infinity,
      isSoftLimit: false,
      canProceed: true
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
          requests_limit: HARD_LIMIT,
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
        limit: Infinity,
        remaining: Infinity,
        isSoftLimit: false
      },
      canProceed: true,
      nextResetAt,
      warning: undefined
    });
  } catch (error) {
    console.error('Error in getAIUsageStatus:', error);
    // Return unlimited defaults
    return Result.ok({
      currentWindow: {
        used: 0,
        limit: Infinity,
        remaining: Infinity,
        isSoftLimit: false
      },
      canProceed: true,
      nextResetAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
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
