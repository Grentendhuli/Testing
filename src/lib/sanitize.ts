import DOMPurify from 'dompurify';

/**
 * Sanitizes user input to prevent XSS attacks
 * Removes HTML tags and dangerous content while preserving safe text
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return '';
  
  // Configure DOMPurify to be strict - only allow text content
  const config = {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [], // No attributes allowed
    KEEP_CONTENT: true, // Keep the text content
  };
  
  return DOMPurify.sanitize(input, config);
}

/**
 * Sanitizes input but allows basic formatting tags
 * Use for fields that need rich text like notes, descriptions
 */
export function sanitizeRichText(input: string | null | undefined): string {
  if (!input) return '';
  
  // Allow basic formatting tags
  const config = {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [], // No attributes allowed (prevents onclick, onerror, etc.)
  };
  
  return DOMPurify.sanitize(input, config);
}

/**
 * Validates and sanitizes email addresses
 * Prevents: header injection, XSS, malformed addresses
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return '';
  
  // Remove any HTML/script tags first
  let clean = sanitizeInput(email);
  
  // Prevent header injection - reject if contains newlines or carriage returns
  if (/[\r\n]/.test(clean)) {
    console.warn('[sanitizeEmail] Rejected email with CRLF injection attempt');
    return '';
  }
  
  // Trim whitespace
  clean = clean.trim();
  
  // Check length (RFC 5321: max 254 chars, local part max 64)
  if (clean.length > 254) {
    console.warn('[sanitizeEmail] Rejected email exceeding max length');
    return '';
  }
  
  // Reject multiple @ symbols (common injection technique)
  const atCount = (clean.match(/@/g) || []).length;
  if (atCount !== 1) {
    return '';
  }
  
  // Reject suspicious characters that shouldn't be in emails
  if (/[\s<>()[\]\\,;:]/g.test(clean)) {
    return '';
  }
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(clean)) {
    return '';
  }
  
  // Additional check: domain must have at least one dot and valid chars
  const [, domain] = clean.split('@');
  if (!domain || domain.length > 253 || !/^[a-zA-Z0-9.-]+$/.test(domain)) {
    return '';
  }
  
  return clean.toLowerCase();
}

/**
 * Sanitizes phone numbers - removes non-numeric characters except +, -, (, ), spaces
 */
export function sanitizePhone(phone: string | null | undefined): string {
  if (!phone) return '';
  
  // Remove any HTML/script tags first
  const clean = sanitizeInput(phone);
  
  // Allow only valid phone characters
  return clean.replace(/[^\d+\-()\s]/g, '').trim();
}

/**
 * Sanitizes a generic text field - strips HTML, trims whitespace
 */
export function sanitizeText(input: string | null | undefined): string {
  if (!input) return '';
  return sanitizeInput(input).trim();
}

/**
 * Checks for potential prompt injection patterns in AI inputs
 */
export function detectPromptInjection(input: string): boolean {
  const suspiciousPatterns = [
    /ignore previous instructions/i,
    /ignore all prior instructions/i,
    /system prompt/i,
    /you are now/i,
    /disregard/i,
    /forget everything/i,
    /new instructions/i,
    /override/i,
    /bypass/i,
    /hack/i,
    /exploit/i,
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick, onerror, etc.
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(input));
}

/**
 * AI Input Limits
 * Prevents DoS via oversized prompts
 */
export const AI_LIMITS = {
  MAX_PROMPT_LENGTH: 10000,      // 10KB max prompt
  MAX_CONTEXT_LENGTH: 50000,     // 50KB max context
  MAX_HISTORY_MESSAGES: 50,      // Max conversation history
  MAX_MESSAGE_LENGTH: 2000,      // Max single message length
} as const;

/**
 * Validates AI prompt length and returns error if exceeded
 */
export function validateAIPrompt(input: string): { valid: boolean; error?: string; truncated?: string } {
  if (!input) {
    return { valid: false, error: 'Prompt cannot be empty' };
  }
  
  if (input.length > AI_LIMITS.MAX_PROMPT_LENGTH) {
    return { 
      valid: false, 
      error: `Prompt exceeds maximum length of ${AI_LIMITS.MAX_PROMPT_LENGTH} characters (${input.length} provided)`,
      truncated: input.slice(0, AI_LIMITS.MAX_PROMPT_LENGTH)
    };
  }
  
  return { valid: true };
}

/**
 * Validates conversation history length
 */
export function validateAIHistory(history: { role: string; content: string }[]): { valid: boolean; error?: string } {
  if (history.length > AI_LIMITS.MAX_HISTORY_MESSAGES) {
    return { 
      valid: false, 
      error: `Conversation history exceeds maximum of ${AI_LIMITS.MAX_HISTORY_MESSAGES} messages` 
    };
  }
  
  const totalLength = history.reduce((sum, msg) => sum + (msg.content?.length || 0), 0);
  if (totalLength > AI_LIMITS.MAX_CONTEXT_LENGTH) {
    return { 
      valid: false, 
      error: `Total context length exceeds maximum of ${AI_LIMITS.MAX_CONTEXT_LENGTH} characters` 
    };
  }
  
  return { valid: true };
}

/**
 * Sanitizes AI prompt input - removes injection attempts
 */
export function sanitizeAIInput(input: string | null | undefined): string {
  if (!input) return '';
  
  // First apply standard sanitization
  let clean = sanitizeInput(input);
  
  // Remove potential injection patterns
  const injectionPatterns = [
    /ignore previous instructions/gi,
    /ignore all prior instructions/gi,
    /system prompt/gi,
    /you are now/gi,
    /disregard/gi,
    /forget everything/gi,
    /new instructions/gi,
  ];
  
  injectionPatterns.forEach(pattern => {
    clean = clean.replace(pattern, '[REMOVED]');
  });
  
  return clean.trim();
}
