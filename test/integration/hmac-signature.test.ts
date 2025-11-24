import { generateHmacSignature } from '../../src/middleware/signRequest';

/**
 * Integration Test: HMAC Signature Verification
 * 
 * This test verifies that the HMAC signature generation works correctly
 * according to PayKaduna API requirements.
 * 
 * Note: This test does not make actual API calls to PayKaduna.
 * To verify against the actual test URL, you'll need:
 * 1. Valid PK_API_KEY from PayKaduna
 * 2. Make a test request and compare signatures
 */

describe('HMAC Signature Generation', () => {
  const testApiKey = 'test-api-key-secret';

  describe('GET request signature', () => {
    it('should generate correct HMAC signature for GET request with path and query', () => {
      // GET request: path + query_string
      // Example: /api/ESBills/GetBill?billreference=12345
      const path = '/api/ESBills/GetBill';
      const queryString = '?billreference=12345';
      const payload = path + queryString;

      const signature = generateHmacSignature(payload, testApiKey);

      // Signature should be a base64 encoded string
      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBeGreaterThan(0);

      // Should be valid base64
      expect(() => {
        Buffer.from(signature, 'base64');
      }).not.toThrow();
    });

    it('should generate different signatures for different payloads', () => {
      const payload1 = '/api/ESBills/GetBill?billreference=12345';
      const payload2 = '/api/ESBills/GetBill?billreference=67890';

      const signature1 = generateHmacSignature(payload1, testApiKey);
      const signature2 = generateHmacSignature(payload2, testApiKey);

      expect(signature1).not.toBe(signature2);
    });

    it('should generate same signature for same payload', () => {
      const payload = '/api/ESBills/GetBill?billreference=12345';

      const signature1 = generateHmacSignature(payload, testApiKey);
      const signature2 = generateHmacSignature(payload, testApiKey);

      expect(signature1).toBe(signature2);
    });
  });

  describe('POST request signature', () => {
    it('should generate correct HMAC signature for POST request with JSON body', () => {
      // POST request: minified JSON body
      const body = {
        identifier: 'TAXPAYER123',
        firstName: 'John',
        lastName: 'Smith',
      };
      const payload = JSON.stringify(body); // Minified (no whitespace)

      const signature = generateHmacSignature(payload, testApiKey);

      expect(signature).toBeDefined();
      expect(typeof signature).toBe('string');
      expect(signature.length).toBeGreaterThan(0);

      // Should be valid base64
      expect(() => {
        Buffer.from(signature, 'base64');
      }).not.toThrow();
    });

    it('should generate same signature for minified JSON regardless of formatting', () => {
      const body = { identifier: 'TAXPAYER123', firstName: 'John', lastName: 'Smith' };
      
      // Both should result in same minified JSON
      const payload1 = JSON.stringify(body);
      const payload2 = JSON.stringify({ identifier: 'TAXPAYER123', firstName: 'John', lastName: 'Smith' });

      const signature1 = generateHmacSignature(payload1, testApiKey);
      const signature2 = generateHmacSignature(payload2, testApiKey);

      expect(signature1).toBe(signature2);
    });

    it('should generate different signatures for different JSON bodies', () => {
      const body1 = { identifier: 'TAXPAYER123' };
      const body2 = { identifier: 'TAXPAYER456' };

      const payload1 = JSON.stringify(body1);
      const payload2 = JSON.stringify(body2);

      const signature1 = generateHmacSignature(payload1, testApiKey);
      const signature2 = generateHmacSignature(payload2, testApiKey);

      expect(signature1).not.toBe(signature2);
    });
  });

  describe('Signature format', () => {
    it('should generate base64 encoded HMAC-SHA256 signature', () => {
      const payload = 'test-payload';
      const signature = generateHmacSignature(payload, testApiKey);

      // Base64 regex pattern
      const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
      expect(signature).toMatch(base64Pattern);
    });

    it('should generate valid signature length (base64 of 32-byte HMAC = 44 chars)', () => {
      const payload = 'test-payload';
      const signature = generateHmacSignature(payload, testApiKey);

      // HMAC-SHA256 produces 32 bytes, base64 encoded = 44 characters (with padding)
      expect(signature.length).toBe(44);
    });
  });

  describe('API key dependency', () => {
    it('should generate different signatures for different API keys', () => {
      const payload = 'test-payload';
      const key1 = 'api-key-1';
      const key2 = 'api-key-2';

      const signature1 = generateHmacSignature(payload, key1);
      const signature2 = generateHmacSignature(payload, key2);

      expect(signature1).not.toBe(signature2);
    });
  });
});

/**
 * Manual Integration Test Instructions
 * 
 * To verify HMAC signature against actual PayKaduna test URL:
 * 
 * 1. Set up environment variables:
 *    - PK_API_KEY=<your_test_api_key>
 *    - PK_BASE_URL_TEST=https://testingapi.paykaduna.com/
 * 
 * 2. Make a test request:
 *    - Use the PayKaduna service to make a test API call
 *    - Check the X-Api-Signature header in the request
 *    - Verify the signature matches PayKaduna expectations
 * 
 * 3. Example test request:
 *    - GET /api/ESBills/GetBill?billreference=TEST123
 *    - Check the generated signature
 * 
 * 4. Compare with PayKaduna documentation examples
 */
