# PayKaduna Integration API Documentation

## Overview

This document provides comprehensive API documentation for the PayKaduna Integration service endpoints. This documentation is designed for AI agents and automated systems to programmatically interact with the API.

**Base URL**: The API is typically available at `/v1` prefix. The full base URL depends on deployment (e.g., `http://localhost:3000/v1` or `https://api.example.com/v1`).

**Content-Type**: All requests and responses use `application/json`.

**Authentication**: The API handles HMAC signature generation internally. No authentication headers are required from clients.

---

## Standard Error Response Format

All endpoints return errors in the following standardized format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error details or validation messages",
    "statusCode": 400
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` (400): Request validation failed (missing/invalid fields)
- `UPSTREAM_UNAUTHORIZED` (401): Invalid API Key or HMAC Signature
- `UPSTREAM_BAD_REQUEST` (400): PayKaduna API rejected the request
- `UPSTREAM_NOT_FOUND` (404): Resource not found (bill, taxpayer, etc.)
- `UPSTREAM_SERVER_ERROR` (500): PayKaduna API server error
- `NETWORK_ERROR` (500): Network request failed
- `INTERNAL_ERROR` (500): Internal server error

---

## Endpoints

### 1. Create Bill

**Endpoint**: `POST /v1/bills`

**Description**: Creates a single electronic bill for a taxpayer.

**Request Body**:

```json
{
  "identifier": "string (required)",
  "firstName": "string (required)",
  "middleName": "string (optional)",
  "lastName": "string (required)",
  "telephone": "string (required)",
  "address": "string (required)",
  "engineCode": "string (optional)",
  "esBillDetailsDto": [
    {
      "amount": "number (required, positive)",
      "mdasId": "number (required, positive integer)",
      "narration": "string (required, min length 1)",
      "recommendedRate": "number (optional, positive)"
    }
  ]
}
```

**Field Constraints**:
- `identifier`: Taxpayer ID or TPUI (Taxpayer Unique Identifier), minimum 1 character
- `firstName`: Minimum 1 character
- `lastName`: Minimum 1 character
- `telephone`: Minimum 1 character
- `address`: Minimum 1 character
- `engineCode`: Optional, can be injected from environment if missing
- `esBillDetailsDto`: Array with at least 1 item required
  - `amount`: Must be a positive number
  - `mdasId`: Revenue Head ID, must be a positive integer
  - `narration`: Minimum 1 character
  - `recommendedRate`: Optional, must be positive if provided

**Example Request**:

```json
{
  "identifier": "TAXPAYER123",
  "firstName": "John",
  "middleName": "Doe",
  "lastName": "Smith",
  "telephone": "+2348012345678",
  "address": "123 Main Street, Kaduna",
  "engineCode": "185477",
  "esBillDetailsDto": [
    {
      "amount": 10000.00,
      "mdasId": 1,
      "narration": "Property Tax for Q1 2024",
      "recommendedRate": 0.05
    }
  ]
}
```

**Success Response** (200 OK):

```json
{
  "bill": {
    "billReference": "string",
    "payStatus": "string",
    "narration": "string",
    "head": "string (optional)",
    "subhead": "string (optional)",
    "paidAt": "string (optional, ISO 8601 date)"
  },
  "billItems": [
    {
      "revenueHead": "string",
      "amount": "number",
      "revenueCode": "string"
    }
  ],
  "failedBillItems": [
    {
      "revenueHead": "string",
      "amount": "number",
      "revenueCode": "string"
    }
  ]
}
```

**Error Responses**:
- `400 Bad Request`: Validation error or PayKaduna API rejection
- `401 Unauthorized`: Invalid API Key or HMAC Signature
- `500 Internal Server Error`: Server error or network failure

**Example Error Response**:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": "esBillDetailsDto: At least one bill detail is required",
    "statusCode": 400
  }
}
```

---

### 2. Get Bill by Reference

**Endpoint**: `GET /v1/bills/{reference}`

**Description**: Retrieves bill information by bill reference number.

**Path Parameters**:
- `reference` (string, required): Bill reference number (minimum 1 character)

**Example URL**: `GET /v1/bills/BILL-2024-001234`

**Success Response** (200 OK):

```json
{
  "bill": {
    "billReference": "string",
    "payStatus": "string",
    "narration": "string",
    "head": "string (optional)",
    "subhead": "string (optional)",
    "paidAt": "string (optional, ISO 8601 date)"
  },
  "billItems": [
    {
      "revenueHead": "string",
      "amount": "number",
      "revenueCode": "string"
    }
  ]
}
```

**Error Responses**:
- `400 Bad Request`: Invalid bill reference format
- `401 Unauthorized`: Invalid API Key or HMAC Signature
- `404 Not Found`: Bill not found
- `500 Internal Server Error`: Server error or network failure

**Example Error Response** (404):

```json
{
  "error": {
    "code": "UPSTREAM_NOT_FOUND",
    "message": "Resource not found",
    "details": "Bill or Taxpayer not found",
    "statusCode": 404
  }
}
```

**Notes**:
- The endpoint automatically updates the local database with the latest bill data
- If available, the invoice URL is also fetched and stored (this is optional and failures are logged but don't affect the response)

---

### 3. Initialize Payment

**Endpoint**: `POST /v1/payments/initialize`

**Description**: Initializes a payment transaction for a bill. Returns a checkout URL that can be used to complete the payment.

**Request Body**:

```json
{
  "tpui": "string (required)",
  "billReference": "string (required)"
}
```

**Field Constraints**:
- `tpui`: Taxpayer Unique Identifier, minimum 1 character
- `billReference`: Bill reference number, minimum 1 character

**Example Request**:

```json
{
  "tpui": "TAXPAYER123",
  "billReference": "BILL-2024-001234"
}
```

**Success Response** (200 OK):

```json
{
  "checkoutUrl": "string",
  "rawResponse": {
    "additional": "response fields from PayKaduna API"
  }
}
```

**Response Fields**:
- `checkoutUrl`: URL where the user can complete the payment (redirect user to this URL)
- `rawResponse`: Complete response from PayKaduna API (may contain additional fields)

**Example Response**:

```json
{
  "checkoutUrl": "https://paykaduna.com/checkout?transaction=abc123",
  "rawResponse": {
    "transactionId": "abc123",
    "expiresAt": "2024-12-31T23:59:59Z"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Validation error or PayKaduna API rejection
- `401 Unauthorized`: Invalid API Key or HMAC Signature
- `404 Not Found`: Bill or taxpayer not found
- `500 Internal Server Error`: Server error or network failure

**Example Error Response** (400):

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": "tpui: Taxpayer identifier is required",
    "statusCode": 400
  }
}
```

**Usage Flow**:
1. Create a bill using `POST /v1/bills`
2. Retrieve the `billReference` from the response
3. Initialize payment using `POST /v1/payments/initialize` with the `billReference` and `tpui`
4. Redirect the user to the `checkoutUrl` from the response
5. User completes payment on PayKaduna platform
6. Payment status updates are received via webhooks (if configured)

---

## Request/Response Examples

### Complete Workflow Example

**Step 1: Create a Bill**

```http
POST /v1/bills HTTP/1.1
Content-Type: application/json

{
  "identifier": "TAXPAYER123",
  "firstName": "John",
  "lastName": "Smith",
  "telephone": "+2348012345678",
  "address": "123 Main Street, Kaduna",
  "esBillDetailsDto": [
    {
      "amount": 10000.00,
      "mdasId": 1,
      "narration": "Property Tax"
    }
  ]
}
```

**Response**:

```json
{
  "bill": {
    "billReference": "BILL-2024-001234",
    "payStatus": "Pending",
    "narration": "Property Tax"
  },
  "billItems": [
    {
      "revenueHead": "Property Tax",
      "amount": 10000.00,
      "revenueCode": "PT001"
    }
  ],
  "failedBillItems": []
}
```

**Step 2: Get Bill Details**

```http
GET /v1/bills/BILL-2024-001234 HTTP/1.1
```

**Response**:

```json
{
  "bill": {
    "billReference": "BILL-2024-001234",
    "payStatus": "Pending",
    "narration": "Property Tax"
  },
  "billItems": [
    {
      "revenueHead": "Property Tax",
      "amount": 10000.00,
      "revenueCode": "PT001"
    }
  ]
}
```

**Step 3: Initialize Payment**

```http
POST /v1/payments/initialize HTTP/1.1
Content-Type: application/json

{
  "tpui": "TAXPAYER123",
  "billReference": "BILL-2024-001234"
}
```

**Response**:

```json
{
  "checkoutUrl": "https://paykaduna.com/checkout?transaction=abc123",
  "rawResponse": {
    "transactionId": "abc123",
    "expiresAt": "2024-12-31T23:59:59Z"
  }
}
```

---

## Validation Rules Summary

### Bill Creation (`POST /v1/bills`)
- All required string fields must have minimum length of 1
- `amount` must be positive
- `mdasId` must be a positive integer
- `esBillDetailsDto` array must contain at least 1 item
- `recommendedRate` (if provided) must be positive

### Get Bill (`GET /v1/bills/{reference}`)
- `reference` path parameter must be a non-empty string

### Initialize Payment (`POST /v1/payments/initialize`)
- Both `tpui` and `billReference` are required and must be non-empty strings

---

## HTTP Status Codes

- `200 OK`: Request successful
- `207 Multi-Status`: Partial success (used for bulk operations)
- `400 Bad Request`: Validation error or invalid request
- `401 Unauthorized`: Authentication failed
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Rate Limiting & Retries

- The service implements exponential backoff for network timeouts (maximum 3 retries)
- 400-level errors (Bad Request, Unauthorized) are not retried
- Network errors and 500-level errors are retried with exponential backoff

---

## Notes for AI Agents

1. **Always validate request payloads** before sending requests. Use the field constraints provided above.

2. **Handle errors gracefully**: Check the `error.code` field to determine error type and handle accordingly.

3. **Store bill references**: After creating a bill, store the `billReference` for later use in payment initialization and bill retrieval.

4. **Checkout URL handling**: The `checkoutUrl` from payment initialization should be presented to the user or opened in a browser. The payment completion happens on the PayKaduna platform.

5. **Idempotency**: Bill creation and payment initialization are not idempotent. Each request creates a new bill or payment transaction.

6. **Response structure**: Always check for the presence of `error` object in responses to determine if the request was successful.

7. **Optional fields**: Fields marked as optional may be omitted from requests. However, some optional fields may be required by business logic (e.g., `engineCode` may be injected from environment if missing).

8. **Date formats**: Date fields in responses use ISO 8601 format (e.g., `2024-12-31T23:59:59Z`).

---

## Testing Endpoints

### Health Check

Before making API calls, you can verify the service is running:

```http
GET /health HTTP/1.1
```

**Response**:

```json
{
  "status": "ok",
  "service": "paykaduna-integration",
  "timestamp": "2024-12-31T12:00:00.000Z"
}
```

---

## Additional Resources

- Swagger UI documentation is available at `/docs` endpoint (if deployed)
- Swagger JSON specification is available at `/docs/json` endpoint
- All endpoints are prefixed with `/v1`

---

## Version Information

- **API Version**: 1.0.0
- **Documentation Version**: 1.0.0
- **Last Updated**: 2024-12-31

