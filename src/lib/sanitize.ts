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
 */
export function sanitizeEmail(email: string | null | undefined): string {
  if (!email) return '';
  
  // Remove any HTML/script tags first
  const clean = sanitizeInput(email);
  
  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(clean)) {
    return '';
  }
  
  return clean.toLowerCase().trim();
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
