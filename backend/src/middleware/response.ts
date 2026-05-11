// Unified API Response Format
import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Success response
export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    error: null,
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(response);
}

// Error response
export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode: number = 500,
  details?: any
): void {
  const response: ApiResponse = {
    success: false,
    data: null,
    error: { code, message, details },
    timestamp: new Date().toISOString(),
  };
  res.status(statusCode).json(response);
}

// Common error codes
export const ErrorCodes = {
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',
  SCAN_IN_PROGRESS: 'SCAN_IN_PROGRESS',
  DUPLICATE_OPPORTUNITY: 'DUPLICATE_OPPORTUNITY',
} as const;
