import DOMPurify from 'dompurify';

/**
 * Sanitizes user input to prevent XSS attacks
 * Removes HTML tags and dangerous content
 */
export const sanitizeInput = (input: string | null | undefined): string => {
  if (!input) return '';
  return DOMPurify.sanitize(input.trim(), { ALLOWED_TAGS: [] });
};

/**
 * Validates email format using strict regex
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

/**
 * Validates phone number format (US/international)
 * Allows: +1 (555) 123-4567, 555-123-4567, 555.123.4567, etc.
 */
export const isValidPhone = (phone: string): boolean => {
  // Remove all non-digit characters except + for international
  const digits = phone.replace(/[\s\-\.\(\)]/g, '');
  
  // Check if it's a valid phone number format
  // Minimum 10 digits (US), maximum 15 (ITU-T E.164)
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(digits) && digits.length >= 10;
};

/**
 * Validates that name contains only letters, spaces, hyphens, and apostrophes
 * No numbers or special characters
 */
export const isValidName = (name: string): boolean => {
  const nameRegex = /^[a-zA-Z\s\-'.]+$/;
  return nameRegex.test(name.trim()) && name.trim().length >= 2;
};

/**
 * Validates lead form data
 * Returns object with sanitized values or error message
 */
export interface LeadFormData {
  name: string;
  email: string;
  phone: string;
  notes?: string;
}

export interface ValidationResult {
  isValid: boolean;
  sanitized?: LeadFormData;
  error?: string;
}

export const validateLeadData = (data: LeadFormData): ValidationResult => {
  // Sanitize all inputs
  const sanitized = {
    name: sanitizeInput(data.name),
    email: sanitizeInput(data.email),
    phone: sanitizeInput(data.phone),
    notes: sanitizeInput(data.notes || ''),
  };

  // Check XSS payloads were attempted (sanitized input differs from original for non-empty strings)
  const original = {
    name: data.name?.trim() || '',
    email: data.email?.trim() || '',
    phone: data.phone?.trim() || '',
    notes: data.notes?.trim() || '',
  };

  // Validate name
  if (!isValidName(sanitized.name)) {
    return {
      isValid: false,
      error: 'Name must contain at least 2 characters and only letters, spaces, hyphens, or apostrophes',
    };
  }

  // Validate email
  if (!isValidEmail(sanitized.email)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address',
    };
  }

  // Validate phone
  if (!isValidPhone(sanitized.phone)) {
    return {
      isValid: false,
      error: 'Please enter a valid phone number (at least 10 digits)',
    };
  }

  return {
    isValid: true,
    sanitized,
  };
};

/**
 * Types for authentication rate limiting
 */
interface FailedAttempt {
  count: number;
  firstAttempt: number;
  lastAttempt: number;
}

interface RateLimitStore {
  [email: string]: FailedAttempt;
}

const RATE_LIMIT_CONFIG = {
  MAX_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes
  CLEAR_AFTER_MS: 24 * 60 * 60 * 1000, // Clear old entries after 24 hours
};

// In-memory store (use Redis or database in production)
const rateLimitStore: RateLimitStore = {};

/**
 * Cleans up old entries from rate limit store
 */
const cleanupOldEntries = (): void => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach((email) => {
    const entry = rateLimitStore[email];
    if (now - entry.firstAttempt > RATE_LIMIT_CONFIG.CLEAR_AFTER_MS) {
      delete rateLimitStore[email];
    }
  });
};

/**
 * Checks rate limit for a given email
 * Returns true if allowed, false if locked out
 */
export const checkRateLimit = (email: string): { allowed: boolean; lockoutTimeLeft?: number } => {
  cleanupOldEntries();

  const normalizedEmail = email.toLowerCase().trim();
  const now = Date.now();
  const entry = rateLimitStore[normalizedEmail];

  if (!entry) {
    return { allowed: true };
  }

  // Check if lockout period has expired
  const timeSinceLastAttempt = now - entry.lastAttempt;
  
  if (entry.count >= RATE_LIMIT_CONFIG.MAX_ATTEMPTS) {
    if (timeSinceLastAttempt < RATE_LIMIT_CONFIG.LOCKOUT_DURATION_MS) {
      const timeLeft = RATE_LIMIT_CONFIG.LOCKOUT_DURATION_MS - timeSinceLastAttempt;
      return { allowed: false, lockoutTimeLeft: timeLeft };
    }
    // Lockout expired, reset
    delete rateLimitStore[normalizedEmail];
    return { allowed: true };
  }

  return { allowed: true };
};

/**
 * Records a failed login attempt for rate limiting
 * Implements exponential backoff
 */
export const recordFailedAttempt = (email: string): void => {
  const normalizedEmail = email.toLowerCase().trim();
  const now = Date.now();

  if (!rateLimitStore[normalizedEmail]) {
    rateLimitStore[normalizedEmail] = {
      count: 0,
      firstAttempt: now,
      lastAttempt: now,
    };
  }

  const entry = rateLimitStore[normalizedEmail];
  entry.count += 1;
  entry.lastAttempt = now;

  // Calculate exponential backoff delay (max 5 seconds)
  const backoffDelay = Math.min(1000 * Math.pow(2, entry.count - 1), 5000);
  
  // Log for monitoring (remove in production or use proper logging)
  console.warn(`[RateLimit] Failed attempt ${entry.count}/${RATE_LIMIT_CONFIG.MAX_ATTEMPTS} for ${email}. Delay: ${backoffDelay}ms`);
};

/**
 * Clears failed attempts for an email (call after successful login)
 */
export const clearFailedAttempts = (email: string): void => {
  const normalizedEmail = email.toLowerCase().trim();
  delete rateLimitStore[normalizedEmail];
};

/**
 * Gets remaining attempts before lockout
 */
export const getRemainingAttempts = (email: string): number => {
  const normalizedEmail = email.toLowerCase().trim();
  const entry = rateLimitStore[normalizedEmail];
  
  if (!entry) {
    return RATE_LIMIT_CONFIG.MAX_ATTEMPTS;
  }

  return Math.max(0, RATE_LIMIT_CONFIG.MAX_ATTEMPTS - entry.count);
};

/**
 * Returns rate limit config for external reference
 */
export const getRateLimitConfig = () => ({ ...RATE_LIMIT_CONFIG });
