/**
 * Result/Option Pattern Types
 * Type-safe error handling without throwing exceptions
 */

// Result type for operations that can fail
export type Result<T, E = AppError> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: E };

// Async result helper type
export type AsyncResult<T, E = AppError> = Promise<Result<T, E>>;

// Option type for nullable values
export type Option<T> =
  | { type: 'some'; value: T }
  | { type: 'none' };

// Helper functions for Result
export const Result = {
  ok: <T>(data: T): Result<T, never> => ({ success: true, data }),
  err: <E>(error: E): Result<never, E> => ({ success: false, error }),
  
  // Map success value
  map: <T, U, E>(result: Result<T, E>, fn: (data: T) => U): Result<U, E> => {
    if (result.success) {
      return { success: true, data: fn(result.data) };
    }
    return result;
  },
  
  // Map error value
  mapErr: <T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> => {
    if (!result.success) {
      return { success: false, error: fn(result.error) };
    }
    return result;
  },
  
  // Unwrap with default
  unwrapOr: <T, E>(result: Result<T, E>, defaultValue: T): T => {
    return result.success ? result.data : defaultValue;
  },
  
  // Unwrap or throw
  unwrap: <T, E>(result: Result<T, E>): T => {
    if (!result.success) {
      throw result.error instanceof Error ? result.error : new Error(String(result.error));
    }
    return result.data;
  },
};

// Helper functions for Option
export const Option = {
  some: <T>(value: T): Option<T> => ({ type: 'some', value }),
  none: <T>(): Option<T> => ({ type: 'none' }),
  
  // Check if option has value
  isSome: <T>(option: Option<T>): option is { type: 'some'; value: T } => {
    return option.type === 'some';
  },
  
  // Check if option is empty
  isNone: <T>(option: Option<T>): option is { type: 'none' } => {
    return option.type === 'none';
  },
  
  // Unwrap with default
  unwrapOr: <T>(option: Option<T>, defaultValue: T): T => {
    return option.type === 'some' ? option.value : defaultValue;
  },
  
  // Map option value
  map: <T, U>(option: Option<T>, fn: (value: T) => U): Option<U> => {
    return option.type === 'some' 
      ? { type: 'some', value: fn(option.value) }
      : { type: 'none' };
  },
};

// Common error types
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export const createError = (code: string, message: string, details?: Record<string, unknown>): AppError => ({
  code,
  message,
  details,
});

// Type guards
export const isResult = <T, E>(value: unknown): value is Result<T, E> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as { success: boolean }).success === 'boolean'
  );
};

export const isOption = <T>(value: unknown): value is Option<T> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    ((value as { type: string }).type === 'some' || (value as { type: string }).type === 'none')
  );
};
