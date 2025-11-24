import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';

/**
 * Check if error is retryable
 * Do not retry on 400-level errors (Bad Request, Unauthorized)
 */
function isRetryableError(error: AxiosError): boolean {
  if (!error.response) {
    // Network error or timeout - retryable
    return true;
  }

  const status = error.response.status;
  
  // Don't retry on 4xx errors (client errors)
  if (status >= 400 && status < 500) {
    return false;
  }

  // Retry on 5xx errors (server errors) or network errors
  return status >= 500;
}

/**
 * Calculate delay for exponential backoff
 * @param attempt - Current attempt number (0-indexed)
 * @returns Delay in milliseconds
 */
function calculateDelay(attempt: number): number {
  // Exponential backoff: 1s, 2s, 4s
  return Math.min(1000 * Math.pow(2, attempt), 10000);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an Axios request with exponential backoff
 * @param requestFn - Function that returns an Axios promise
 * @param maxRetries - Maximum number of retries (default: 3)
 * @returns Axios response or throws error
 */
export async function retryWithBackoff<T = unknown>(
  requestFn: () => Promise<AxiosResponse<T>>,
  maxRetries = 3
): Promise<AxiosResponse<T>> {
  let lastError: AxiosError | unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await requestFn();
      return response;
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      if (error instanceof AxiosError && !isRetryableError(error)) {
        throw error;
      }

      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }

      // Calculate delay and wait before retrying
      const delay = calculateDelay(attempt);
      await sleep(delay);
    }
  }

  throw lastError;
}
