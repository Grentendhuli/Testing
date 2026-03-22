import { Result, AsyncResult, AppError, createError } from '../types/result';
import { sanitizeAIInput, detectPromptInjection, sanitizeText } from '@/lib/sanitize';
import { 
  checkAIQuota, 
  incrementAIUsage, 
  validateAIQuota, 
  AIQuotaStatus 
} from './aiUsage';

const CLOUDFLARE_WORKER_URL = (import.meta as any).env?.VITE_CLOUDFLARE_WORKER_URL;

export interface PortfolioContext {
  totalUnits: number;
  occupiedUnits: number;
  monthlyRent: number;
  openMaintenance: number;
  expiringSoon: number;
  overduePayments: number;
}

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export interface MaintenanceTriage {
  priority: 'Emergency' | 'Urgent' | 'Standard';
  trade: string;
  estimatedCostRange: string;
  hpdRisk: boolean;
  hpdNote?: string;
  tenantMessage: string;
}

export interface AIResponse<T = string> {
  success: boolean;
  data?: T;
  error?: string;
  quotaStatus?: AIQuotaStatus;
  warning?: string;
}

export class AIQuotaError extends Error {
  code: string;
  quotaStatus: AIQuotaStatus;
  
  constructor(message: string, quotaStatus: AIQuotaStatus) {
    super(message);
    this.name = 'AIQuotaError';
    this.code = 'QUOTA_EXCEEDED';
    this.quotaStatus = quotaStatus;
  }
}

export function isGeminiConfigured(): boolean {
  return !!CLOUDFLARE_WORKER_URL;
}

/**
 * Check AI quota before making a request
 * Returns quota status or error Result if exceeded
 */
export async function checkQuota(userId: string): AsyncResult<AIQuotaStatus, AppError> {
  return await validateAIQuota(userId);
}

export async function askLandlordAssistant(
  question: string,
  context: PortfolioContext,
  history: GeminiMessage[] = [],
  userId?: string
): AsyncResult<AIResponse<string>, AppError> {
  // Sanitize and validate input
  const sanitizedQuestion = sanitizeAIInput(question);
  
  if (detectPromptInjection(sanitizedQuestion)) {
    return Result.ok({
      success: false,
      error: 'Invalid input detected. Please try again with a different question.'
    });
  }

  // Check quota if userId provided
  if (userId) {
    const quotaResult = await validateAIQuota(userId);
    
    if (!quotaResult.success) {
      return Result.ok({
        success: false,
        error: quotaResult.error.message || 'AI request limit reached. Please try again in 24 hours or upgrade your plan.'
      });
    }
    
    if (!quotaResult.data.canProceed) {
      return Result.ok({
        success: false,
        error: quotaResult.data.warning || 'AI request limit reached. Please try again in 24 hours or upgrade your plan.',
        quotaStatus: quotaResult.data
      });
    }
  }

  if (!CLOUDFLARE_WORKER_URL) {
    const fallbackSummary = `Quick snapshot: ${context.totalUnits} units (${context.occupiedUnits} occupied), ${context.openMaintenance} open maintenance requests, ${context.expiringSoon} leases expiring soon, ${context.overduePayments} overdue payments.`;
    return Result.ok({
      success: true,
      data: `AI is running in demo mode right now. ${fallbackSummary}`,
      warning: 'AI demo mode'
    });
  }

  try {
    const response = await fetch(CLOUDFLARE_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: sanitizedQuestion,
        type: 'tenant-chat',
        context: {
          totalUnits: context.totalUnits,
          occupiedUnits: context.occupiedUnits,
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Cloudflare Worker error: ${response.status}`);
    }

    const data = await response.json();
    
    // Track usage on successful call
    if (userId) {
      await incrementAIUsage(userId);
    }
    
    // Get updated quota status for warning
    let warning: string | undefined;
    if (userId) {
      const quotaResult = await checkAIQuota(userId);
      if (quotaResult.success) {
        warning = quotaResult.data.warning;
      }
    }
    
    return Result.ok({
      success: true,
      data: data.response || 'No response from AI',
      warning
    });
  } catch (error) {
    console.error('AI call failed:', error);
    return Result.ok({
      success: false,
      error: 'AI service temporarily unavailable. Please try again later.'
    });
  }
}

export async function triageMaintenanceRequest(
  description: string,
  userId?: string
): AsyncResult<AIResponse<MaintenanceTriage>, AppError> {
  // Sanitize and validate input
  const sanitizedDescription = sanitizeAIInput(description);
  
  if (detectPromptInjection(sanitizedDescription)) {
    return Result.ok({
      success: false,
      error: 'Invalid input detected.',
      data: {
        priority: 'Standard',
        trade: 'General',
        estimatedCostRange: '$100 - $500',
        hpdRisk: false,
        tenantMessage: 'Thank you for reporting this issue. We will address it promptly.',
      }
    });
  }

  // Check quota if userId provided
  if (userId) {
    const quotaResult = await validateAIQuota(userId);
    
    if (!quotaResult.success) {
      return Result.ok({
        success: false,
        error: quotaResult.error.message || 'AI request limit reached. Please try again in 24 hours or upgrade your plan.'
      });
    }
    
    if (!quotaResult.data.canProceed) {
      return Result.ok({
        success: false,
        error: quotaResult.data.warning || 'AI request limit reached. Please try again in 24 hours or upgrade your plan.',
        quotaStatus: quotaResult.data
      });
    }
  }

  if (!CLOUDFLARE_WORKER_URL) {
    return Result.ok({
      success: true,
      data: {
        priority: 'Standard',
        trade: 'General',
        estimatedCostRange: '$100 - $500',
        hpdRisk: false,
        tenantMessage: 'Thank you for reporting this issue. We will address it promptly.',
      }
    });
  }

  try {
    const response = await fetch(CLOUDFLARE_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: sanitizedDescription,
        type: 'maintenance-triage',
        context: {}
      }),
    });

    if (!response.ok) {
      throw new Error(`Cloudflare Worker error: ${response.status}`);
    }

    const data = await response.json();
    
    // Track usage on successful call
    if (userId) {
      await incrementAIUsage(userId);
    }
    
    // Try to parse JSON response from AI
    try {
      const parsed = JSON.parse(data.response);
      const result: MaintenanceTriage = {
        priority: parsed.priority || 'Standard',
        trade: parsed.trade || 'General',
        estimatedCostRange: parsed.estimatedCostRange || '$100 - $500',
        hpdRisk: parsed.hpdRisk || false,
        hpdNote: parsed.hpdNote,
        tenantMessage: parsed.tenantMessage || 'Thank you for reporting this issue. We will address it promptly.',
      };
      
      // Get updated quota status for warning
      let warning: string | undefined;
      if (userId) {
        const quotaResult = await checkAIQuota(userId);
        if (quotaResult.success) {
          warning = quotaResult.data.warning;
        }
      }
      
      return Result.ok({
        success: true,
        data: result,
        warning
      });
    } catch {
      // Fallback if AI didn't return valid JSON
      const result: MaintenanceTriage = {
        priority: 'Standard',
        trade: 'General',
        estimatedCostRange: '$100 - $500',
        hpdRisk: false,
        tenantMessage: data.response || 'Thank you for reporting this issue. We will address it promptly.',
      };
      
      // Still track usage even on parse failure
      if (userId) {
        await incrementAIUsage(userId);
      }
      
      return Result.ok({
        success: true,
        data: result
      });
    }
  } catch (error) {
    console.error('Maintenance triage failed:', error);
    return Result.ok({
      success: false,
      error: 'AI service temporarily unavailable. Please try again later.',
      data: {
        priority: 'Standard',
        trade: 'General',
        estimatedCostRange: '$100 - $500',
        hpdRisk: false,
        tenantMessage: 'Thank you for reporting this issue. We will address it promptly.',
      }
    });
  }
}

export async function draftLandlordLetter(
  purpose: string,
  tenantName: string,
  unitNumber: string,
  details: string,
  userId?: string
): AsyncResult<AIResponse<string>, AppError> {
  // Sanitize all inputs
  const sanitizedPurpose = sanitizeAIInput(purpose);
  const sanitizedTenantName = sanitizeText(tenantName);
  const sanitizedUnitNumber = sanitizeText(unitNumber);
  const sanitizedDetails = sanitizeAIInput(details);
  
  // Check for prompt injection
  if (detectPromptInjection(sanitizedPurpose) || detectPromptInjection(sanitizedDetails)) {
    return Result.ok({
      success: false,
      error: 'Invalid input detected. Please try again.'
    });
  }

  // Check quota if userId provided
  if (userId) {
    const quotaResult = await validateAIQuota(userId);
    
    if (!quotaResult.success) {
      return Result.ok({
        success: false,
        error: quotaResult.error.message || 'AI request limit reached. Please try again in 24 hours or upgrade your plan.'
      });
    }
    
    if (!quotaResult.data.canProceed) {
      return Result.ok({
        success: false,
        error: quotaResult.data.warning || 'AI request limit reached. Please try again in 24 hours or upgrade your plan.',
        quotaStatus: quotaResult.data
      });
    }
  }

  if (!CLOUDFLARE_WORKER_URL) {
    const fallbackLetter = `Dear ${sanitizedTenantName || 'Tenant'},\n\nThis is a notice regarding ${sanitizedPurpose || 'your tenancy'} for unit ${sanitizedUnitNumber || ''}.\n\n${sanitizedDetails || 'Please contact us to discuss next steps and any questions you may have.'}\n\nPlease reach out at your earliest convenience so we can resolve this promptly.\n\nSincerely,\nLandlord`;
    return Result.ok({
      success: true,
      data: fallbackLetter,
      warning: 'AI demo mode'
    });
  }

  try {
    const prompt = `Draft a professional landlord letter for:
Purpose: ${sanitizedPurpose}
Tenant: ${sanitizedTenantName}
Unit: ${sanitizedUnitNumber}
Details: ${sanitizedDetails}

Requirements:
- Professional but firm tone
- Reference relevant NYC housing laws where applicable
- Include clear action items and deadlines
- Provide contact information for questions`;

    const response = await fetch(CLOUDFLARE_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: prompt,
        type: 'tenant-chat',
        context: {}
      }),
    });

    if (!response.ok) {
      throw new Error(`Cloudflare Worker error: ${response.status}`);
    }

    const data = await response.json();
    
    // Track usage on successful call
    if (userId) {
      await incrementAIUsage(userId);
    }
    
    // Get updated quota status for warning
    let warning: string | undefined;
    if (userId) {
      const quotaResult = await checkAIQuota(userId);
      if (quotaResult.success) {
        warning = quotaResult.data.warning;
      }
    }
    
    return Result.ok({
      success: true,
      data: data.response || 'Failed to draft letter',
      warning
    });
  } catch (error) {
    console.error('Letter drafting failed:', error);
    return Result.ok({
      success: false,
      error: 'AI service temporarily unavailable. Please try again later.'
    });
  }
}

// Re-export AI usage functions for convenience
export { checkAIQuota, incrementAIUsage, getAIUsageStatus } from './aiUsage';
export type { AIQuotaStatus, AIUsageFullStatus } from './aiUsage';

/**
 * Generate text from a prompt (general purpose)
 * Used for reminders, messages, and other AI-generated content
 */
export async function generateText(
  prompt: string,
  options?: { temperature?: number; maxOutputTokens?: number },
  userId?: string
): AsyncResult<AIResponse<string>, AppError> {
  // Sanitize input
  const sanitizedPrompt = sanitizeAIInput(prompt);
  
  // Check for prompt injection
  if (detectPromptInjection(sanitizedPrompt)) {
    return Result.ok({
      success: false,
      error: 'Invalid input detected. Please try again with different text.'
    });
  }

  // Check quota if userId provided
  if (userId) {
    const quotaResult = await validateAIQuota(userId);
    
    if (!quotaResult.success) {
      return Result.ok({
        success: false,
        error: quotaResult.error.message || 'AI request limit reached. Please try again in 24 hours or upgrade your plan.'
      });
    }
    
    if (!quotaResult.data.canProceed) {
      return Result.ok({
        success: false,
        error: quotaResult.data.warning || 'AI request limit reached. Please try again in 24 hours or upgrade your plan.',
        quotaStatus: quotaResult.data
      });
    }
  }

  if (!CLOUDFLARE_WORKER_URL) {
    return Result.ok({
      success: false,
      error: 'AI is currently unavailable. Using a fallback template.'
    });
  }

  try {
    const response = await fetch(CLOUDFLARE_WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: sanitizedPrompt,
        type: 'tenant-chat',
        context: {},
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxOutputTokens ?? 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`Cloudflare Worker error: ${response.status}`);
    }

    const data = await response.json();
    
    // Track usage on successful call
    if (userId) {
      await incrementAIUsage(userId);
    }
    
    // Get updated quota status for warning
    let warning: string | undefined;
    if (userId) {
      const quotaResult = await checkAIQuota(userId);
      if (quotaResult.success) {
        warning = quotaResult.data.warning;
      }
    }
    
    return Result.ok({
      success: true,
      data: data.response || '',
      warning
    });
  } catch (error) {
    console.error('Text generation failed:', error);
    return Result.ok({
      success: false,
      error: 'AI service temporarily unavailable. Please try again later.'
    });
  }
}
