import { useState, useCallback } from 'react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  /**
   * Enable browser autofill for phone numbers
   * @default true
   */
  autoComplete?: boolean;
}

/**
 * PhoneInput - A reusable phone input component that auto-formats US phone numbers
 * Format: (XXX) XXX-XXXX
 * 
 * Supports browser autofill via autoComplete attribute
 */
export function PhoneInput({
  value,
  onChange,
  placeholder = '(555) 555-5555',
  className = '',
  id,
  name,
  disabled = false,
  autoComplete = true,
}: PhoneInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  // Format phone number as (XXX) XXX-XXXX
  const formatPhoneNumber = useCallback((input: string): string => {
    // Remove all non-numeric characters
    const digitsOnly = input.replace(/\D/g, '');
    
    // Limit to 10 digits
    const digits = digitsOnly.slice(0, 10);
    
    // Format based on length
    if (digits.length === 0) {
      return '';
    } else if (digits.length <= 3) {
      return `(${digits}`;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
  }, []);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    
    // If user is deleting, allow the raw value temporarily
    if (rawValue.length < value.length) {
      // Remove formatting when deleting
      const digitsOnly = rawValue.replace(/\D/g, '');
      onChange(digitsOnly);
      return;
    }
    
    // Format the new value
    const formatted = formatPhoneNumber(rawValue);
    const digitsOnly = formatted.replace(/\D/g, '');
    onChange(digitsOnly);
  };

  // Handle autofill - browsers often fill with just digits
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    // Allow paste to proceed, then clean it up
    setTimeout(() => {
      const pasted = value;
      const digitsOnly = pasted.replace(/\D/g, '').slice(0, 10);
      if (digitsOnly.length > 0) {
        onChange(digitsOnly);
      }
    }, 0);
  };

  // Handle blur - ensure proper formatting
  const handleBlur = () => {
    setIsFocused(false);
    // On blur, store just the digits
    const digitsOnly = value.replace(/\D/g, '');
    onChange(digitsOnly);
  };

  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
  };

  // Display value with formatting
  const displayValue = isFocused ? formatPhoneNumber(value) : formatPhoneNumber(value);

  return (
    <input
      type="tel"
      id={id}
      name={name || 'phone'}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      onPaste={handlePaste}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={14} // (XXX) XXX-XXXX = 14 characters
      autoComplete={autoComplete ? 'tel' : 'off'}
      inputMode="tel"
      className={`
        w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 
        border border-slate-300 dark:border-slate-600 
        rounded-lg text-slate-800 dark:text-slate-100 
        placeholder-slate-400
        focus:outline-none focus:ring-2 focus:ring-amber-500/50 
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    />
  );
}

/**
 * Utility function to format a phone number string
 * Useful for displaying phone numbers in read-only contexts
 */
export function formatPhoneNumber(value: string): string {
  if (!value) return '';
  
  const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
  
  if (digitsOnly.length === 0) {
    return '';
  } else if (digitsOnly.length <= 3) {
    return `(${digitsOnly}`;
  } else if (digitsOnly.length <= 6) {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
  } else {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6)}`;
  }
}

/**
 * Utility function to validate a US phone number
 */
export function isValidPhoneNumber(value: string): boolean {
  const digitsOnly = value.replace(/\D/g, '');
  return digitsOnly.length === 10;
}
