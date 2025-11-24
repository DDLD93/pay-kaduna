# PayKaduna Integration Microservice

Production-grade Node.js/TypeScript microservice acting as a secure gateway to the PayKaduna Intelligent Billing System (IBS). This service abstracts the complexity of HMAC signing, request formatting, and error handling, exposing a clean REST API to internal systems.

## Features

- ✅ **HMAC Signature Middleware** - Automatic HMAC-SHA256 signing for all PayKaduna API requests
- ✅ **TypeScript** - Full type safety with strict mode enabled
- ✅ **Request Validation** - Zod schemas for runtime validation
- ✅ **Error Handling** - Standardized error responses
- ✅ **Logging** - Structured JSON logging with Winston
- ✅ **API Documentation** - OpenAPI 3.0 / Swagger UI
- ✅ **Retry Logic** - Exponential backoff for network errors
- ✅ **10 API Endpoints** - Complete coverage of PayKaduna API

## Tech Stack

- **Runtime**: Node.js (Latest LTS)
- **Language**: TypeScript (Strict Mode)
- **Framework**: Express.js
- **HTTP Client**: Axios (with interceptors)
- **Validation**: Zod
- **Logging**: Winston
- **Documentation**: Swagger UI / OpenAPI 3.0

## Prerequisites

- Node.js 18+ (Latest LTS recommended)
- npm or yarn
- PayKaduna API credentials (API Key and Engine Code)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pay-kaduna
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file with your credentials**
   ```env
   NODE_ENV=development
   PORT=3000
   PK_BASE_URL_TEST=https://testingapi.paykaduna.com/
   PK_BASE_URL_PROD=https://api.paykaduna.com/
   PK_API_KEY=your_api_key_here
   PK_ENGINE_CODE=your_engine_code_here
   ```

## Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment (development/production/test) | No | `development` |
| `PORT` | Server port | No | `3000` |
| `PK_BASE_URL_TEST` | PayKaduna test API URL | Yes | - |
| `PK_BASE_URL_PROD` | PayKaduna production API URL | Yes | - |
| `PK_API_KEY` | PayKaduna API key for HMAC signing | Yes | - |
| `PK_ENGINE_CODE` | PayKaduna engine code | Yes | - |

## Usage

### Development

```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Production

```bash
npm run build
npm start
```

### API Documentation

Once the server is running, visit:
- **Swagger UI**: `http://localhost:3000/docs`
- **OpenAPI JSON**: `http://localhost:3000/docs/json`

## API Endpoints

### Bill Management

#### 1. Create Single Bill
```http
POST /v1/bills
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

#### 2. Create Bulk Bills
```http
POST /v1/bills/bulk
Content-Type: application/json

{
  "esBillDtos": [
    {
      "identifier": "TAXPAYER123",
      "firstName": "John",
      "lastName": "Smith",
      "telephone": "+2348012345678",
      "address": "123 Main Street",
      "esBillDetailsDto": [...]
    }
  ]
}
```

#### 3. Get Bill
```http
GET /v1/bills/{reference}
```

#### 4. Get Invoice URL
```http
GET /v1/bills/{reference}/invoice-url
```

#### 5. Attach Metadata to Bill
```http
POST /v1/bills/{reference}/metadata
Content-Type: application/json

{
  "additionalData": {
    "customField": "value"
  }
}
```

#### 6. Bulk Attach Metadata
```http
POST /v1/bills/metadata/bulk
Content-Type: application/json

{
  "bills": [
    {
      "billReference": "BILL123",
      "additionalData": {...}
    }
  ]
}
```

### Taxpayer Management

#### 7. Register Taxpayer
```http
POST /v1/taxpayers
Content-Type: application/json

{
  "identifier": "TAXPAYER123",
  "firstName": "John",
  "lastName": "Smith",
  "tin": "TIN123456",
  "email": "john@example.com",
  "phoneNumber": "+2348012345678",
  "genderId": 2,
  "addressLine1": "123 Main Street",
  "userType": "Individual",
  "password": "password123",
  "confirmPassword": "password123"
}
```

#### 8. Search Taxpayer
```http
GET /v1/taxpayers/search?term=john
```

### Payment Management

#### 9. Initialize Payment
```http
POST /v1/payments/initialize
Content-Type: application/json

{
  "tpui": "TAXPAYER123",
  "billReference": "BILL123"
}
```

#### 10. Update Redirect URL
```http
PUT /v1/configuration/redirect-url?redirectUrl=https://example.com/callback
```

## Error Responses

All errors are returned in a standardized format:

```json
{
  "error": {
    "code": "UPSTREAM_ERROR",
    "message": "PayKaduna API rejected the request",
    "details": "Invalid HMAC signature",
    "statusCode": 401
  }
}
```

### Error Codes

- `VALIDATION_ERROR` (400) - Request validation failure
- `UPSTREAM_UNAUTHORIZED` (401) - Invalid API Key or HMAC Signature
- `UPSTREAM_BAD_REQUEST` (400) - PayKaduna API rejected the request
- `UPSTREAM_NOT_FOUND` (404) - Bill or Taxpayer not found
- `UPSTREAM_SERVER_ERROR` (500) - PayKaduna API server error
- `NETWORK_ERROR` (500) - Network request failed
- `INTERNAL_ERROR` (500) - Internal server error

## Testing

### Run all tests
```bash
npm test
```

### Run integration tests
```bash
npm run test:integration
```

### Watch mode
```bash
npm run test:watch
```

## Project Structure

```
pay-kaduna/
├── src/
│   ├── config/
│   │   └── env.ts                    # Environment configuration
│   ├── constants/
│   │   └── paykaduna.ts              # Data dictionaries
│   ├── middleware/
│   │   ├── signRequest.ts            # HMAC signature middleware
│   │   ├── errorHandler.ts           # Global error handler
│   │   └── logger.ts                 # Logger setup
│   ├── services/
│   │   └── paykaduna.service.ts      # PayKaduna API service
│   ├── controllers/
│   │   ├── bills.controller.ts       # Bill management endpoints
│   │   ├── taxpayers.controller.ts   # Taxpayer management endpoints
│   │   └── payments.controller.ts    # Payment endpoints
│   ├── routes/
│   │   ├── bills.routes.ts
│   │   ├── taxpayers.routes.ts
│   │   ├── payments.routes.ts
│   │   ├── configuration.routes.ts
│   │   └── index.ts                  # Route aggregator
│   ├── types/
│   │   └── paykaduna.d.ts            # TypeScript interfaces
│   ├── schemas/
│   │   └── validation.schemas.ts     # Zod validation schemas
│   ├── utils/
│   │   └── retry.ts                  # Retry logic with exponential backoff
│   ├── app.ts                        # Express app setup
│   └── index.ts                      # Application entry point
├── docs/
│   └── swagger.yaml                  # OpenAPI 3.0 specification
├── test/
│   └── integration/
│       └── hmac-signature.test.ts    # HMAC signature tests
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## HMAC Signature

The service automatically signs all requests to PayKaduna using HMAC-SHA256:

- **GET requests**: Signature is generated from `path + query_string`
- **POST requests**: Signature is generated from minified JSON body (no whitespace)
- **Header**: `X-Api-Signature: <base64_encoded_signature>`

Example:
```
GET /api/ESBills/GetBill?billreference=12345
→ Sign: "/api/ESBills/GetBill?billreference=12345"
→ Header: X-Api-Signature: <generated_signature>
```

## Retry Logic

The service implements exponential backoff for network errors:

- **Max retries**: 3
- **Backoff**: 1s, 2s, 4s
- **Retry conditions**: Network errors and 5xx server errors
- **No retry**: 4xx client errors (Bad Request, Unauthorized)

## Data Dictionaries

The service includes data dictionaries in `src/constants/paykaduna.ts`:

- **Genders**: Female (1), Male (2), NotSpecified (3)
- **States**: Kaduna (19)
- **Industries**: (See constants file - to be populated from PDF)
- **LGAs**: (See constants file - to be populated from PDF)
- **Tax Stations**: (See constants file - to be populated from PDF)

## Health Check

```http
GET /health
```

Returns:
```json
{
  "status": "ok",
  "service": "paykaduna-integration",
  "timestamp": "2025-01-20T10:00:00.000Z"
}
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Ensure all tests pass
5. Submit a pull request

## License

ISC

## Support

For issues related to:
- **This microservice**: Open an issue in this repository
- **PayKaduna API**: Contact PayKaduna support

## Changelog

### Version 1.0.0
- Initial release
- Complete PayKaduna API integration
- HMAC signature middleware
- 10 API endpoints implemented
- OpenAPI documentation
- Comprehensive error handling
