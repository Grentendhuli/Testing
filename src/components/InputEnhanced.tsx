import React, { useState, useCallback, useRef, useEffect, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { 
  Eye, 
  EyeOff, 
  Check, 
  AlertCircle, 
  X,
  Loader2,
  Info
} from 'lucide-react';

// Validation rule type
export interface ValidationRule {
  validate: (value: string) => boolean;
  message: string;
}

// Common validation rules
export const validationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    validate: (value) => value.trim().length > 0,
    message,
  }),
  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
  }),
  minLength: (length: number, message?: string): ValidationRule => ({
    validate: (value) => value.length >= length,
    message: message || `Must be at least ${length} characters`,
  }),
  maxLength: (length: number, message?: string): ValidationRule => ({
    validate: (value) => value.length <= length,
    message: message || `Must be no more than ${length} characters`,
  }),
  pattern: (regex: RegExp, message: string): ValidationRule => ({
    validate: (value) => regex.test(value),
    message,
  }),
  phone: (message = 'Please enter a valid phone number'): ValidationRule => ({
    validate: (value) => value.replace(/\D/g, '').length >= 10,
    message,
  }),
  url: (message = 'Please enter a valid URL'): ValidationRule => ({
    validate: (value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message,
  }),
  numeric: (message = 'Please enter a valid number'): ValidationRule => ({
    validate: (value) => !isNaN(Number(value)) && value.trim() !== '',
    message,
  }),
  match: (compareValue: string, message = 'Values do not match'): ValidationRule => ({
    validate: (value) => value === compareValue,
    message,
  }),
};

// Input state type
type InputState = 'idle' | 'validating' | 'valid' | 'invalid';

// Base input props
export interface InputEnhancedProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  successMessage?: string;
  /** Real-time validation rules */
  validationRules?: ValidationRule[];
  /** Validate on blur */
  validateOnBlur?: boolean;
  /** Validate on change (with debounce) */
  validateOnChange?: boolean;
  /** Debounce delay for validation (ms) */
  validationDelay?: number;
  /** Async validation function */
  asyncValidate?: (value: string) => Promise<boolean>;
  /** Custom validation function */
  customValidate?: (value: string) => string | null | undefined;
  /** Show character count */
  showCharacterCount?: boolean;
  /** Max length for character count */
  maxLength?: number;
  /** Show success indicator */
  showSuccessIndicator?: boolean;
  /** Show clear button */
  clearable?: boolean;
  /** Input size */
  size?: 'sm' | 'md' | 'lg';
  /** Visual variant */
  variant?: 'default' | 'filled' | 'outlined';
  /** Left icon */
  leftIcon?: React.ReactNode;
  /** Right icon */
  rightIcon?: React.ReactNode;
  /** Loading state */
  isLoading?: boolean;
  /** Controlled value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Blur handler */
  onBlur?: () => void;
  /** Focus handler */
  onFocus?: () => void;
}

export const InputEnhanced = forwardRef<HTMLInputElement, InputEnhancedProps>(
  (
    {
      label,
      helperText,
      errorMessage: externalError,
      successMessage = 'Looks good!',
      validationRules = [] as ValidationRule[],
      validateOnBlur = true,
      validateOnChange = false,
      validationDelay = 500,
      asyncValidate,
      customValidate,
      showCharacterCount = false,
      maxLength,
      showSuccessIndicator = true,
      clearable = false,
      size = 'md',
      variant = 'default',
      leftIcon,
      rightIcon,
      isLoading = false,
      value,
      onChange,
      onBlur,
      onFocus,
      className,
      disabled,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const [state, setState] = useState<InputState>('idle');
    const [internalError, setInternalError] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const validationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    // Validate the input value
    const validate = useCallback(
      async (val: string, showErrors = true): Promise<boolean> => {
        // Check required
        if (props.required && !val.trim()) {
          if (showErrors) {
            setInternalError('This field is required');
            setState('invalid');
          }
          return false;
        }

        // Skip validation if empty and not required
        if (!val.trim() && !props.required) {
          setInternalError(null);
          setState('idle');
          return true;
        }

        // Run validation rules
        for (const rule of validationRules) {
          if (!rule.validate(val)) {
            if (showErrors) {
              setInternalError(rule.message);
              setState('invalid');
            }
            return false;
          }
        }

        // Run custom validation
        if (customValidate) {
          const customError = customValidate(val);
          if (customError) {
            if (showErrors) {
              setInternalError(customError);
              setState('invalid');
            }
            return false;
          }
        }

        // Run async validation
        if (asyncValidate) {
          setState('validating');
          try {
            const isValid = await asyncValidate(val);
            if (!isValid) {
              if (showErrors) {
                setInternalError('Validation failed');
                setState('invalid');
              }
              return false;
            }
          } catch (err) {
            if (showErrors) {
              setInternalError('Validation error');
              setState('invalid');
            }
            return false;
          }
        }

        if (showErrors) {
          setInternalError(null);
          setState('valid');
        }
        return true;
      },
      [validationRules, customValidate, asyncValidate, props.required]
    );

    // Debounced validation
    const debouncedValidate = useCallback(
      (val: string) => {
        if (validationTimer.current) {
          clearTimeout(validationTimer.current);
        }
        validationTimer.current = setTimeout(() => {
          validate(val, true);
        }, validationDelay);
      },
      [validate, validationDelay]
    );

    // Handle input change
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);

      if (validateOnChange) {
        debouncedValidate(newValue);
      } else {
        // Clear error when user starts typing
        if (state === 'invalid') {
          setState('idle');
          setInternalError(null);
        }
      }
    };

    // Handle blur
    const handleBlur = () => {
      setIsFocused(false);
      if (validateOnBlur) {
        validate(value, true);
      }
      onBlur?.();
    };

    // Handle focus
    const handleFocus = () => {
      setIsFocused(true);
      onFocus?.();
    };

    // Handle clear
    const handleClear = () => {
      onChange('');
      setState('idle');
      setInternalError(null);
    };

    // Cleanup timer on unmount
    useEffect(() => {
      return () => {
        if (validationTimer.current) {
          clearTimeout(validationTimer.current);
        }
      };
    }, []);

    const error = externalError || internalError;
    const isInvalid = !!error || state === 'invalid';
    const isValid = state === 'valid' && showSuccessIndicator && value.length > 0;

    // Size classes
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-4 py-3 text-lg',
    };

    // Variant classes
    const variantClasses = {
      default: `
        bg-slate-50 dark:bg-slate-700 
        border border-slate-300 dark:border-slate-600
        focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20
      `,
      filled: `
        bg-slate-100 dark:bg-slate-800 
        border-2 border-transparent
        focus:bg-white dark:focus:bg-slate-700
        focus:border-amber-500
      `,
      outlined: `
        bg-transparent
        border-2 border-slate-300 dark:border-slate-600
        focus:border-amber-500
      `,
    };

    // State classes
    const stateClasses = isInvalid
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
      : isValid
      ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20'
      : '';

    return (
      <div className={cn('w-full', className)}>
        {/* Label */}
        {label && (
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {/* Input wrapper */}
        <div className="relative">
          {/* Left icon */}
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {leftIcon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            type={inputType}
            value={value}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            disabled={disabled || isLoading}
            maxLength={maxLength}
            className={cn(
              'w-full rounded-lg transition-all duration-200',
              'text-slate-900 dark:text-slate-100 placeholder-slate-400',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              sizeClasses[size],
              variantClasses[variant],
              stateClasses,
              leftIcon && 'pl-10',
              (rightIcon || clearable || isPassword || isLoading || isValid) && 'pr-10'
            )}
            {...props}
          />

          {/* Right side icons */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {/* Loading spinner */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success indicator */}
            <AnimatePresence>
              {isValid && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-emerald-500"
                >
                  <Check className="w-4 h-4" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Clear button */}
            <AnimatePresence>
              {clearable && value && !isLoading && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  type="button"
                  onClick={handleClear}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>

            {/* Password toggle */}
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            )}

            {/* Custom right icon */}
            {rightIcon && !isLoading && !isValid && (
              <div className="text-slate-400">{rightIcon}</div>
            )}
          </div>
        </div>

        {/* Helper text / Error / Success / Character count */}
        <div className="flex items-start justify-between mt-1.5 min-h-[20px]">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {isInvalid ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400"
                >
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              ) : isValid && showSuccessIndicator ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400"
                >
                  <Check className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{successMessage}</span>
                </motion.div>
              ) : helperText ? (
                <motion.div
                  key="helper"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400"
                >
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{helperText}</span>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Character count */}
          {showCharacterCount && maxLength && (
            <span
              className={cn(
                'text-xs ml-2',
                value.length > maxLength * 0.9
                  ? value.length >= maxLength
                    ? 'text-red-500'
                    : 'text-amber-500'
                  : 'text-slate-400'
              )}
            >
              {value.length}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

InputEnhanced.displayName = 'InputEnhanced';

// Textarea variant
export interface TextareaEnhancedProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'size'> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  successMessage?: string;
  validationRules?: ValidationRule[];
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  validationDelay?: number;
  showCharacterCount?: boolean;
  maxLength?: number;
  showSuccessIndicator?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
}

export const TextareaEnhanced = forwardRef<HTMLTextAreaElement, TextareaEnhancedProps>(
  (
    {
      label,
      helperText,
      errorMessage: externalError,
      successMessage = 'Looks good!',
      validationRules = [] as ValidationRule[],
      validateOnBlur = true,
      validateOnChange = false,
      validationDelay = 500,
      showCharacterCount = false,
      maxLength,
      showSuccessIndicator = true,
      size = 'md',
      variant = 'default',
      value,
      onChange,
      onBlur,
      onFocus,
      className,
      disabled,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const [state, setState] = useState<InputState>('idle');
    const [internalError, setInternalError] = useState<string | null>(null);
    const [isFocused, setIsFocused] = useState(false);
    const validationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const validate = useCallback(
      (val: string, showErrors = true): boolean => {
        if (props.required && !val.trim()) {
          if (showErrors) {
            setInternalError('This field is required');
            setState('invalid');
          }
          return false;
        }

        if (!val.trim() && !props.required) {
          setInternalError(null);
          setState('idle');
          return true;
        }

        for (const rule of validationRules) {
          if (!rule.validate(val)) {
            if (showErrors) {
              setInternalError(rule.message);
              setState('invalid');
            }
            return false;
          }
        }

        if (showErrors) {
          setInternalError(null);
          setState('valid');
        }
        return true;
      },
      [validationRules, props.required]
    );

    const debouncedValidate = useCallback(
      (val: string) => {
        if (validationTimer.current) {
          clearTimeout(validationTimer.current);
        }
        validationTimer.current = setTimeout(() => {
          validate(val, true);
        }, validationDelay);
      },
      [validate, validationDelay]
    );

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      onChange(newValue);

      if (validateOnChange) {
        debouncedValidate(newValue);
      } else {
        if (state === 'invalid') {
          setState('idle');
          setInternalError(null);
        }
      }
    };

    const handleBlur = () => {
      setIsFocused(false);
      if (validateOnBlur) {
        validate(value, true);
      }
      onBlur?.();
    };

    const handleFocus = () => {
      setIsFocused(true);
      onFocus?.();
    };

    useEffect(() => {
      return () => {
        if (validationTimer.current) {
          clearTimeout(validationTimer.current);
        }
      };
    }, []);

    const error = externalError || internalError;
    const isInvalid = !!error || state === 'invalid';
    const isValid = state === 'valid' && showSuccessIndicator && value.length > 0;

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-base',
      lg: 'px-4 py-4 text-lg',
    };

    const variantClasses = {
      default: `
        bg-slate-50 dark:bg-slate-700 
        border border-slate-300 dark:border-slate-600
        focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20
      `,
      filled: `
        bg-slate-100 dark:bg-slate-800 
        border-2 border-transparent
        focus:bg-white dark:focus:bg-slate-700
        focus:border-amber-500
      `,
      outlined: `
        bg-transparent
        border-2 border-slate-300 dark:border-slate-600
        focus:border-amber-500
      `,
    };

    const stateClasses = isInvalid
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
      : isValid
      ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20'
      : '';

    return (
      <div className={cn('w-full', className)}>
        {label && (
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          disabled={disabled}
          maxLength={maxLength}
          rows={rows}
          className={cn(
            'w-full rounded-lg transition-all duration-200 resize-y',
            'text-slate-900 dark:text-slate-100 placeholder-slate-400',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            sizeClasses[size],
            variantClasses[variant],
            stateClasses
          )}
          {...props}
        />

        <div className="flex items-start justify-between mt-1.5 min-h-[20px]">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {isInvalid ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400"
                >
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              ) : isValid && showSuccessIndicator ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400"
                >
                  <Check className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{successMessage}</span>
                </motion.div>
              ) : helperText ? (
                <motion.div
                  key="helper"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400"
                >
                  <Info className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{helperText}</span>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {showCharacterCount && maxLength && (
            <span
              className={cn(
                'text-xs ml-2',
                value.length > maxLength * 0.9
                  ? value.length >= maxLength
                    ? 'text-red-500'
                    : 'text-amber-500'
                  : 'text-slate-400'
              )}
            >
              {value.length}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

TextareaEnhanced.displayName = 'TextareaEnhanced';

export default InputEnhanced;
