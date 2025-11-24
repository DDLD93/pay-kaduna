import crypto from 'crypto';
import { InternalAxiosRequestConfig } from 'axios';

/**
 * Generate HMAC SHA256 signature for PayKaduna API requests
 * 
 * For GET requests: sign path + query_string
 * For POST requests: sign minified JSON body
 * 
 * @param payload - The string to sign (path+query for GET, JSON body for POST)
 * @param secret - The API key secret
 * @returns Base64 encoded HMAC signature
 */
export function generateHmacSignature(payload: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  return hmac.digest('base64');
}

/**
 * Sign an Axios request with HMAC signature
 * This function is designed to be used as an Axios request interceptor
 * 
 * @param config - Axios request configuration
 * @param apiKey - The API key secret for HMAC signing
 * @returns Modified Axios request configuration with X-Api-Signature header
 */
export function signRequest(
  config: InternalAxiosRequestConfig,
  apiKey: string
): InternalAxiosRequestConfig {
  if (!apiKey) {
    throw new Error('API key is required for HMAC signature generation');
  }

  let payload = '';

  const method = config.method?.toLowerCase() || 'get';
  const url = config.url || '';

  if (method === 'get') {
    // For GET requests: path + query_string
    // Example: /api/ESBills/GetBill?billreference=12345
    const queryString = config.params
      ? '?' + new URLSearchParams(config.params).toString()
      : '';
    payload = url + queryString;
  } else if (method === 'post' || method === 'put' || method === 'patch') {
    // For POST/PUT/PATCH requests: minified JSON body (no whitespace)
    if (config.data) {
      if (typeof config.data === 'string') {
        // Already a string - try to parse and re-stringify to ensure minification
        try {
          const parsed = JSON.parse(config.data);
          payload = JSON.stringify(parsed);
        } catch {
          // If parsing fails, use as-is
          payload = config.data;
        }
      } else if (typeof config.data === 'object') {
        // Object - stringify without whitespace (minified)
        payload = JSON.stringify(config.data);
      } else {
        payload = String(config.data);
      }
    }
  }

  // Generate signature
  const signature = generateHmacSignature(payload, apiKey);

  // Inject X-Api-Signature header
  config.headers = config.headers || {};
  config.headers['X-Api-Signature'] = signature;

  return config;
}
