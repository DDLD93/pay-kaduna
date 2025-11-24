Product Requirements Document (PRD): PayKaduna Integration Microservice1. Context & ObjectiveGoal: Develop a production-grade Node.js/TypeScript microservice acting as the secure gateway to the PayKaduna Intelligent Billing System (IBS).Source of Truth: PayKaduna API Documentation (Version 9, Nov 2025).Role: This service abstracts the complexity of HMAC signing, request formatting, and error handling, exposing a clean, documented REST API to internal systems.2. Technical Stack & StandardsRuntime: Node.js (Latest LTS)Language: TypeScript (Strict Mode required)Framework: Express.js or FastifyDocumentation: OpenAPI 3.0 (Swagger UI) - MandatoryHTTP Client: Axios (with interceptors for automatic signing)Validation: Zod (preferred) or Joi for runtime payload validationLogging: Winston or Pino (structured JSON logs)3. Security & Middleware Architecture3.1 HMAC Signature Middleware (signRequest)The PayKaduna API requires a custom HMAC SHA256 signature on every request. This logic must be implemented as an Axios request interceptor or a dedicated service utility, not manually in every controller.Algorithm:Secret: Retrieve PK_API_KEY from environment variables.Payload Construction:GET Requests: path + query_string (e.g., /api/ESBills/GetBill?billreference=12345).POST Requests: The exact JSON string body. Crucial: The JSON must be minified (no whitespace) before hashing.Hashing: HMAC-SHA256(payload, secret).Encoding: Base64.Header: Inject X-Api-Signature: <generated_hash> into the request headers.3.2 Rate Limiting & RetriesImplement exponential backoff for network timeouts (3 retries max).Do not retry on 400-level errors (Bad Request, Unauthorized).4. API Specification & InterfacesA. Bill Management1. Create Single BillInternal Endpoint: POST /v1/billsUpstream: POST /api/ESBills/CreateESBillRequest Body (TypeScript Interface):interface CreateBillRequest {
  identifier: string; // Taxpayer ID or TPUI
  firstName: string;
  middleName?: string;
  lastName: string;
  telephone: string;
  address: string;
  engineCode?: string; // Optional, inject from env if missing
  esBillDetailsDto: Array<{
    amount: number;
    mdasId: number; // Revenue Head ID
    narration: string;
    recommendedRate?: number;
  }>;
}
Success Response (200 OK):{
  "bill": { "billReference": "string", "payStatus": "string", "narration": "string" },
  "billItems": [{ "revenueHead": "string", "amount": 100.00, "revenueCode": "string" }],
  "failedBillItems": []
}
2. Create Bulk BillsInternal Endpoint: POST /v1/bills/bulkUpstream: POST /api/ESBills/CreateBulkESBillRequest Body:interface BulkBillRequest {
  engineCode?: string;
  esBillDtos: Array<Omit<CreateBillRequest, 'engineCode'>>;
}
Logic: Iterate through the response. If failedBillItems is not empty, log a warning but return 207 (Multi-Status) or 200 with the partial error details.3. Get BillInternal Endpoint: GET /v1/bills/:referenceUpstream: GET /api/ESBills/GetBill?billreference=:referenceResponse: Returns the Bill object and its items.4. Get Invoice URLInternal Endpoint: GET /v1/bills/:reference/invoice-urlUpstream: GET /api/ESBills/GetInvoiceUrl?billreference=:referenceResponse: { "invoiceUrl": "https://..." }5. Attach Data to BillInternal Endpoint: POST /v1/bills/:reference/metadataUpstream: POST /api/ESBills/AttachAdditionalDataToBillRequest Body:interface AttachDataRequest {
  billReference: string;
  additionalData: Record<string, any>; // Flexible JSON object
}
6. Bulk Attach DataInternal Endpoint: POST /v1/bills/metadata/bulkUpstream: POST /api/ESBills/BulkAttachAdditionalDataToBillRequest Body:interface BulkAttachDataRequest {
  bills: Array<{
    billReference: string;
    additionalData: Record<string, any>;
  }>;
}
B. Taxpayer Management7. Register TaxpayerInternal Endpoint: POST /v1/taxpayersUpstream: POST /api/ESBills/RegisterTaxPayerRequest Body:interface RegisterTaxpayerRequest {
  identifier: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  tin: string;
  email: string;
  phoneNumber: string;
  genderId: number; // 1=Female, 2=Male
  addressLine1: string;
  userType: 'Individual' | 'Corporate';
  password: string;
  confirmPassword: string;
  // Corporate specific (Optional unless userType is Corporate)
  rcNumber?: string;
  industryId?: number;
  officeName?: string;
  officeEmail?: string;
  officePhoneNumber?: string;
  officeAddressLine1?: string;
  officeStateId?: number;
  officeLgaId?: number;
  taxStationId?: number;
}
Validation: If userType is 'Corporate', validate that rcNumber and industryId are present.8. Search TaxpayerInternal Endpoint: GET /v1/taxpayers/searchUpstream: GET /api/ESBills/SearchTaxPayer?criteria=:termQuery Param: term (Min 4 chars).Response: Array of taxpayers matching Name, TPUI, TIN, NIN, Phone, or Email.C. Payments9. Initialize PaymentInternal Endpoint: POST /v1/payments/initializeUpstream: POST /api/ESBills/CreateESTransactionRequest Body:interface InitPaymentRequest {
  tpui: string;
  billReference: string;
}
Response: { "checkoutUrl": "string", "rawResponse": object }10. Update Redirect URLInternal Endpoint: PUT /v1/configuration/redirect-urlUpstream: GET /api/ESBills/UpdatePaymentRedirectUrlQuery Param: redirectUrl (URL encoded).5. Error Handling StrategyThe service must intercept all errors and normalize them into a standard format before responding to the client.Standard Error Response:{
  "error": {
    "code": "UPSTREAM_ERROR",
    "message": "PayKaduna API rejected the request",
    "details": "Invalid HMAC signature",
    "statusCode": 401
  }
}
Error Mapping:401 Unauthorized: Invalid API Key or HMAC Signature.400 Bad Request: Validation failure (Zod/Joi) or PayKaduna rejection (e.g., invalid Bill Reference).404 Not Found: Bill or Taxpayer not found.500 Internal Server Error: Axios network error or parsing failure.6. OpenAPI / Swagger DocumentationThe agent must generate a swagger.yaml or configure swagger-jsdoc to expose the API documentation at /docs.Requirements:Define all Schemas (Bill, Taxpayer, Payment).Define all Security Schemes (if internal API uses Bearer tokens).Provide example payloads for every endpoint.7. Environment VariablesNODE_ENV=development
PORT=3000
# PayKaduna Config
PK_BASE_URL_TEST=[https://testingapi.paykaduna.com/](https://testingapi.paykaduna.com/)
PK_BASE_URL_PROD=[https://api.paykaduna.com/](https://api.paykaduna.com/)
PK_API_KEY=<provided_secret_key>
PK_ENGINE_CODE=<provided_engine_code>
8. Data Dictionaries (Constants)Store these in src/constants/paykaduna.tsGenders: { Female: 1, Male: 2, NotSpecified: 3 }Industries: Map the full list from Section 3.5 (1=Agriculture, 2=Oil/Gas, etc.).States: { Kaduna: 19 }.LGAs: Map the full list from Section 3.2.Tax Stations: Map the full list from Section 3.4.9. Deliverables Checklistmiddleware/signRequest.ts: The HMAC logic.services/paykaduna.service.ts: The Axios instance and method implementations.controllers/: Route handlers validating input with Zod.types/paykaduna.d.ts: Complete type definitions.swagger.json: Auto-generated or manually defined API docs.test/integration: A script proving the HMAC signature works against the Test URL.