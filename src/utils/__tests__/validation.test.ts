import { 
  sanitizeInput, 
  isValidEmail, 
  isValidPhone, 
  isValidName, 
  validateLeadData,
  checkRateLimit,
  recordFailedAttempt,
  clearFailedAttempts,
  getRemainingAttempts
} from '../validation';

// Test XSS Protection
describe('XSS Protection', () => {
  test('sanitizeInput should strip script tags', () => {
    const input = `<script>alert('xss')</script>`;
    const sanitized = sanitizeInput(input);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).not.toContain('</script>');
  });

  test('sanitizeInput should strip event handlers', () => {
    const input = `<img src=x onerror="alert('xss')">`;
    const sanitized = sanitizeInput(input);
    expect(sanitized).not.toContain('onerror');
  });

  test('sanitizeInput should strip javascript: URLs', () => {
    const input = `<a href="javascript:alert('xss')">Link</a>`;
    const sanitized = sanitizeInput(input);
    expect(sanitized).not.toContain('javascript:');
  });

  test('sanitizeInput should handle null/undefined', () => {
    expect(sanitizeInput(null)).toBe('');
    expect(sanitizeInput(undefined)).toBe('');
  });
});

// Test Email Validation
describe('Email Validation', () => {
  test('should validate correct emails', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.org')).toBe(true);
    expect(isValidEmail('user+tag@example.com')).toBe(true);
  });

  test('should reject invalid emails', () => {
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('test@')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('test@@example.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});

// Test Phone Validation
describe('Phone Validation', () => {
  test('should validate correct phone numbers', () => {
    expect(isValidPhone('+1 (555) 123-4567')).toBe(true);
    expect(isValidPhone('555-123-4567')).toBe(true);
    expect(isValidPhone('555.123.4567')).toBe(true);
    expect(isValidPhone('+15551234567')).toBe(true);
    expect(isValidPhone('555 123 4567')).toBe(true);
  });

  test('should reject invalid phone numbers', () => {
    expect(isValidPhone('123')).toBe(false); // Too short
    expect(isValidPhone('123-456')).toBe(false); // Too short
    expect(isValidPhone('')).toBe(false);
    expect(isValidPhone('abc')).toBe(false);
    expect(isValidPhone('+0')).toBe(false);
  });
});

// Test Name Validation
describe('Name Validation', () => {
  test('should validate correct names', () => {
    expect(isValidName('John Doe')).toBe(true);
    expect(isValidName('Mary-Jane')).toBe(true);
    expect(isValidName("O'Brien")).toBe(true);
    expect(isValidName('Lee')).toBe(true);
  });

  test('should reject invalid names', () => {
    expect(isValidName('')).toBe(false);
    expect(isValidName('A')).toBe(false); // Too short
    expect(isValidName('John123')).toBe(false); // Contains numbers
    expect(isValidName('John@Doe')).toBe(false); // Contains special chars
    expect(isValidName('   ')).toBe(false);
  });
});

// Test Lead Data Validation
describe('Lead Data Validation', () => {
  test('should validate and sanitize valid lead data', () => {
    const result = validateLeadData({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-123-4567',
      notes: 'Interested in 2BR',
    });

    expect(result.isValid).toBe(true);
    expect(result.sanitized).toBeDefined();
  });

  test('should reject invalid email in lead data', () => {
    const result = validateLeadData({
      name: 'John Doe',
      email: 'invalid-email',
      phone: '555-123-4567',
    });

    expect(result.isValid).toBe(false);
    expect(result.error).toContain('email');
  });

  test('should reject XSS in lead data', () => {
    const result = validateLeadData({
      name: `<script>alert('xss')</script>John`,
      email: 'john@example.com',
      phone: '555-123-4567',
    });

    // Name should be sanitized to remove script tags
    expect(result.sanitized?.name).not.toContain('<script>');
  });
});

// Test Rate Limiting
describe('Rate Limiting', () => {
  const testEmail = 'test@example.com';

  beforeEach(() => {
    // Clear any existing rate limit data
    clearFailedAttempts(testEmail);
  });

  test('should allow initial attempts', () => {
    const result = checkRateLimit(testEmail);
    expect(result.allowed).toBe(true);
  });

  test('should track remaining attempts', () => {
    expect(getRemainingAttempts(testEmail)).toBe(5);
    
    recordFailedAttempt(testEmail);
    expect(getRemainingAttempts(testEmail)).toBe(4);
    
    recordFailedAttempt(testEmail);
    expect(getRemainingAttempts(testEmail)).toBe(3);
  });

  test('should lock after max attempts', () => {
    // Record 5 failed attempts
    for (let i = 0; i < 5; i++) {
      recordFailedAttempt(testEmail);
    }

    const result = checkRateLimit(testEmail);
    expect(result.allowed).toBe(false);
    expect(result.lockoutTimeLeft).toBeGreaterThan(0);
  });

  test('should clear attempts on success', () => {
    recordFailedAttempt(testEmail);
    recordFailedAttempt(testEmail);

    clearFailedAttempts(testEmail);

    expect(getRemainingAttempts(testEmail)).toBe(5);
    expect(checkRateLimit(testEmail).allowed).toBe(true);
  });
});
