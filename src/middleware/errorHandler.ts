import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AxiosError } from 'axios';
import { ErrorResponse, ApiError } from '../types/paykaduna.d';

/**
 * Global error handler middleware
 * Normalizes all errors into a standard format before responding to the client
 */
export function errorHandler(
  err: Error | ZodError | AxiosError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  let error: ApiError;

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    error = {
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed',
      details: err.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
      statusCode: 400,
    };
  }
  // Handle Axios errors (upstream API errors)
  else if (err instanceof AxiosError) {
    const statusCode = err.response?.status || 500;
    
    // Map status codes
    if (statusCode === 401) {
      error = {
        code: 'UPSTREAM_UNAUTHORIZED',
        message: 'Invalid API Key or HMAC Signature',
        details: err.response?.data?.message || err.message || 'Authentication failed',
        statusCode: 401,
      };
    } else if (statusCode === 400) {
      error = {
        code: 'UPSTREAM_BAD_REQUEST',
        message: 'PayKaduna API rejected the request',
        details: err.response?.data?.message || err.message || 'Invalid request',
        statusCode: 400,
      };
    } else if (statusCode === 404) {
      error = {
        code: 'UPSTREAM_NOT_FOUND',
        message: 'Resource not found',
        details: err.response?.data?.message || err.message || 'Bill or Taxpayer not found',
        statusCode: 404,
      };
    } else if (statusCode >= 500) {
      error = {
        code: 'UPSTREAM_SERVER_ERROR',
        message: 'PayKaduna API server error',
        details: err.response?.data?.message || err.message || 'Internal server error',
        statusCode: 500,
      };
    } else {
      // Network errors or other Axios errors
      error = {
        code: 'NETWORK_ERROR',
        message: 'Network request failed',
        details: err.message || 'Unable to connect to PayKaduna API',
        statusCode: 500,
      };
    }
  }
  // Handle generic errors
  else {
    error = {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
      details: err.message || 'An unexpected error occurred',
      statusCode: 500,
    };
  }

  // Log error (winston logger will be added later)
  console.error('Error:', {
    code: error.code,
    message: error.message,
    details: error.details,
    statusCode: error.statusCode,
    stack: err.stack,
  });

  // Send error response
  const response: ErrorResponse = { error };
  res.status(error.statusCode).json(response);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
