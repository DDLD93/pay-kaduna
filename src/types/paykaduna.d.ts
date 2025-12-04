/**
 * PayKaduna API Type Definitions
 * TypeScript interfaces for request and response types
 */

// ============================================================================
// Bill Management Types
// ============================================================================

export interface EsBillDetailDto {
  amount: number;
  mdasId: number; // Revenue Head ID
  narration: string;
  recommendedRate?: number;
}

export interface CreateBillRequest {
  identifier: string; // Taxpayer ID or TPUI
  firstName: string;
  middleName?: string;
  lastName: string;
  telephone: string;
  address: string;
  engineCode?: string; // Optional, inject from env if missing
  esBillDetailsDto: EsBillDetailDto[];
}

export interface BulkBillRequest {
  engineCode?: string;
  esBillDtos: Array<Omit<CreateBillRequest, 'engineCode'>>;
}

export interface Bill {
  billReference: string;
  payStatus: string;
  narration: string;
  head?: string;
  subhead?: string;
  paidAt?: Date | string;
}

export interface BillItem {
  revenueHead: string;
  amount: number;
  revenueCode: string;
}

export interface CreateBillResponse {
  bill: Bill;
  billItems: BillItem[];
  failedBillItems: BillItem[];
}

export interface GetBillResponse {
  bill: Bill;
  billItems: BillItem[];
}

export interface AttachDataRequest {
  billReference: string;
  additionalData: Record<string, unknown>; // Flexible JSON object
}

export interface BulkAttachDataRequest {
  bills: Array<{
    billReference: string;
    additionalData: Record<string, unknown>;
  }>;
}

export interface InvoiceUrlResponse {
  invoiceUrl: string;
}

// ============================================================================
// Taxpayer Management Types
// ============================================================================

export type UserType = 'Individual' | 'Corporate';

export interface RegisterTaxpayerRequest {
  identifier: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  tin: string;
  email: string;
  phoneNumber: string;
  genderId: number; // 1=Female, 2=Male, 3=NotSpecified
  addressLine1: string;
  userType: UserType;
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

export interface Taxpayer {
  identifier?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  tin?: string;
  email?: string;
  phoneNumber?: string;
  tpui?: string;
  // Add other fields as needed
}

export type SearchTaxpayerResponse = Taxpayer[];

// ============================================================================
// Payment Types
// ============================================================================

export interface InitPaymentRequest {
  tpui: string;
  billReference: string;
}

export interface InitPaymentResponse {
  checkoutUrl: string;
  rawResponse: Record<string, unknown>;
}

export interface UpdateRedirectUrlRequest {
  redirectUrl: string;
}

// ============================================================================
// Error Types
// ============================================================================

export interface ApiError {
  code: string;
  message: string;
  details?: string;
  statusCode: number;
}

export interface ErrorResponse {
  error: ApiError;
}

// ============================================================================
// Generic Response Types
// ============================================================================

export interface PayKadunaApiResponse<T = unknown> {
  data?: T;
  error?: ApiError;
  statusCode: number;
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface WebhookEvent {
  event: string;
  data: Record<string, unknown>; // Should include invoiceNo: string
  message: string;
}