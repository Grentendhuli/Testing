/**
 * API Response Types
 * Standardized API response wrappers
 */

import type { Result } from './result';

// Request metadata
export interface RequestMeta {
  timestamp: string;
  requestId: string;
  duration?: number;
}

// Pagination info
export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// API Error structure
export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

// Standard API response
export type ApiResponse<T> =
  | { success: true; data: T; meta: RequestMeta; error?: never }
  | { success: false; data?: never; error: ApiError; meta: RequestMeta };

// Paginated API response
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
  meta: RequestMeta;
}

// API result type (combines Result with ApiResponse)
export type ApiResult<T> = Result<T, ApiError>;

// Helper to create success response
export const createSuccessResponse = <T>(
  data: T,
  requestId: string,
  duration?: number
): ApiResponse<T> => ({
  success: true,
  data,
  meta: {
    timestamp: new Date().toISOString(),
    requestId,
    duration,
  },
});

// Helper to create error response
export const createErrorResponse = (
  code: string,
  message: string,
  statusCode: number,
  requestId: string,
  details?: Record<string, unknown>
): ApiResponse<never> => ({
  success: false,
  error: {
    code,
    message,
    statusCode,
    details,
  },
  meta: {
    timestamp: new Date().toISOString(),
    requestId,
  },
});

// Common API error codes
export const ApiErrorCodes = {
  // 4xx Client Errors
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  
  // 5xx Server Errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  
  // Custom Errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ApiErrorCode = typeof ApiErrorCodes[keyof typeof ApiErrorCodes];

// HTTP status code mapping
export const getErrorCodeFromStatus = (status: number): ApiErrorCode => {
  switch (status) {
    case 400:
      return ApiErrorCodes.BAD_REQUEST;
    case 401:
      return ApiErrorCodes.UNAUTHORIZED;
    case 403:
      return ApiErrorCodes.FORBIDDEN;
    case 404:
      return ApiErrorCodes.NOT_FOUND;
    case 409:
      return ApiErrorCodes.CONFLICT;
    case 422:
      return ApiErrorCodes.VALIDATION_ERROR;
    case 429:
      return ApiErrorCodes.RATE_LIMITED;
    case 500:
      return ApiErrorCodes.INTERNAL_ERROR;
    case 503:
      return ApiErrorCodes.SERVICE_UNAVAILABLE;
    case 504:
      return ApiErrorCodes.TIMEOUT;
    default:
      return ApiErrorCodes.UNKNOWN_ERROR;
  }
};
