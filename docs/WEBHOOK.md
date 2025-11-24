# Webhook Integration Guide

This guide explains how to send events to the PayKaduna webhook endpoint.

## Endpoint URL

```
POST /api/v1/paykaduna/webhook
```

## Authentication

All webhook requests must include an **HMAC-SHA512 signature** in the request header to verify authenticity.

### Signature Header

Include the signature in the `x-paykaduna-signature` header.

### How to Generate the Signature

1. Convert your request body to a JSON string (compact format, no extra whitespace)
2. Compute HMAC-SHA512 hash using your webhook secret key
3. Convert the hash to a hexadecimal string
4. Include the hexadecimal string in the `x-paykaduna-signature` header

**Formula:**
```
signature = HMAC-SHA512(JSON.stringify(requestBody), secretKey).hex()
```

**Important:** The signature must be computed from the exact JSON string that will be sent in the request body. Any difference in formatting will cause validation to fail.

## Request Format

### Headers

- `Content-Type: application/json` (required)
- `x-paykaduna-signature: <your_signature>` (required)

### Request Body

The request body must be a valid JSON object with the following structure:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `event` | string | Yes | Event type identifier |
| `data` | object | Yes | Event data payload (must include `invoiceNo` as string) |
| `message` | string | Yes | Descriptive message for the event |

### Example Request

**Payment Success Event:**
```json
{
  "event": "charge.success",
  "data": {
    "invoiceNo": "INV123456",
    "billReference": "BILL123456",
    "amount": 10000.00,
    "status": "paid",
    "transactionId": "TXN789",
    "timestamp": "2025-01-15T10:30:00Z"
  },
  "message": "Payment completed successfully"
}
```

**Payment Error Event:**
```json
{
  "event": "payment.error",
  "data": {
    "invoiceNo": "INV123456",
    "billReference": "BILL123456",
    "transactionId": "TXN789"
  },
  "message": "Payment processing failed"
}
```

## Event Types

Common event types include:

- `charge.success` - Payment completed successfully
- `payment.success` - Payment completed successfully (alternative)
- `payment.error` - Payment failed
- Custom event types - Any string value is accepted

## Response Format

All responses follow the same standardized structure:

| Field | Type | Description |
|-------|------|-------------|
| `event` | string | Event type identifier |
| `data` | object | Response data payload |
| `message` | string | Descriptive message |

### Success Response (200)

```json
{
  "event": "charge.success",
  "data": {
    "invoiceNo": "INV123456",
    "billReference": "BILL123456",
    "amount": 10000.00,
    "status": "paid"
  },
  "message": "Webhook event processed successfully"
}
```

### Error Responses

**Missing Signature (401):**
```json
{
  "event": "webhook.error",
  "data": {},
  "message": "Webhook signature is required"
}
```

**Invalid Signature (401):**
```json
{
  "event": "webhook.error",
  "data": {},
  "message": "Webhook signature validation failed"
}
```

**Validation Error (400):**
```json
{
  "event": "webhook.error",
  "data": {},
  "message": "Invalid request: event is required and must be a string"
}
```

**Server Error (500):**
```json
{
  "event": "webhook.error",
  "data": {},
  "message": "Internal server error"
}
```

## Common Issues

### Signature Validation Failed

- Verify you're using the correct secret key
- Ensure the JSON body matches exactly (no extra spaces, consistent formatting)
- Confirm you're using HMAC-SHA512 algorithm
- Verify the signature is in hexadecimal format
- Ensure the `x-paykaduna-signature` header is included

### Missing Signature Error

- Ensure the `x-paykaduna-signature` header is included
- Verify the header value is not empty

### Validation Error

- Ensure all required fields are present: `event`, `data`, `message`
- Verify `event` is a string
- Verify `data` is an object (not an array) and includes `invoiceNo` as a string
- Verify `message` is a string

### Invalid JSON

- Ensure the request body is valid JSON
- Check that `Content-Type: application/json` header is set

## Testing

You can test the webhook endpoint using any HTTP client. Ensure you:

1. Generate a valid HMAC-SHA512 signature
2. Include the signature in the `x-paykaduna-signature` header
3. Send a valid JSON payload matching the required structure
4. Set the `Content-Type: application/json` header
