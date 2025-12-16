import { z } from 'zod';

// Gender IDs: 1=Female, 2=Male, 3=NotSpecified
const VALID_GENDER_IDS = [1, 2, 3] as const;

/**
 * Zod Validation Schemas for PayKaduna API Requests
 */

// ============================================================================
// Common Schemas
// ============================================================================

export const billReferenceSchema = z.string().min(1, 'Bill reference is required');

export const taxpayerIdentifierSchema = z.string().min(1, 'Taxpayer identifier is required');

export const genderIdSchema = z
  .number()
  .int()
  .refine((val) => (VALID_GENDER_IDS as readonly number[]).includes(val), {
    message: 'Invalid gender ID',
  });

// ============================================================================
// Bill Management Schemas
// ============================================================================

export const esBillDetailDtoSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  mdasId: z.number().int().positive('Revenue Head ID must be a positive integer'),
  narration: z.string().min(1, 'Narration is required'),
  recommendedRate: z.number().positive().optional(),
});

export const createBillRequestSchema = z.object({
  identifier: taxpayerIdentifierSchema,
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  telephone: z.string().min(1, 'Telephone is required'),
  address: z.string().min(1, 'Address is required'),
  billType: z.string().min(1, 'Bill Type is required'),
  zone: z.string().optional(),
  area: z.string().optional(),
  fileNumber: z.string().optional(),
  propertyType: z.string().min(1, 'Property Type is required'),
  engineCode: z.string().optional(),
  esBillDetailsDto: z
    .array(esBillDetailDtoSchema)
    .min(1, 'At least one bill detail is required'),
});

export const bulkBillRequestSchema = z.object({
  engineCode: z.string().optional(),
  esBillDtos: z
    .array(
      createBillRequestSchema.omit({ engineCode: true })
    )
    .min(1, 'At least one bill is required'),
});

export const attachDataRequestSchema = z.object({
  billReference: billReferenceSchema,
  additionalData: z.record(z.string(), z.unknown()).refine(
    (val) => Object.keys(val).length >= 1,
    { message: 'Additional data must not be empty' }
  ),
});

export const bulkAttachDataRequestSchema = z.object({
  bills: z
    .array(
      z.object({
        billReference: billReferenceSchema,
        additionalData: z.record(z.string(), z.unknown()).refine(
          (val) => Object.keys(val).length >= 1,
          { message: 'Additional data must not be empty' }
        ),
      })
    )
    .min(1, 'At least one bill is required'),
});

// ============================================================================
// Taxpayer Management Schemas
// ============================================================================

export const registerTaxpayerIndividualSchema = z
  .object({
    identifier: taxpayerIdentifierSchema,
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    middleName: z.string().optional(),
    tin: z.string().min(1, 'TIN is required'),
    email: z.string().email('Invalid email address'),
    phoneNumber: z.string().min(1, 'Phone number is required'),
    genderId: genderIdSchema,
    addressLine1: z.string().min(1, 'Address is required'),
    userType: z.literal('Individual'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
    // Corporate-specific fields are optional for Individual
    rcNumber: z.string().optional(),
    industryId: z.number().int().optional(),
    officeName: z.string().optional(),
    officeEmail: z.string().email().optional().or(z.literal('')),
    officePhoneNumber: z.string().optional(),
    officeAddressLine1: z.string().optional(),
    officeStateId: z.number().int().optional(),
    officeLgaId: z.number().int().optional(),
    taxStationId: z.number().int().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const registerTaxpayerCorporateSchema = z
  .object({
    identifier: taxpayerIdentifierSchema,
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    middleName: z.string().optional(),
    tin: z.string().min(1, 'TIN is required'),
    email: z.string().email('Invalid email address'),
    phoneNumber: z.string().min(1, 'Phone number is required'),
    genderId: genderIdSchema,
    addressLine1: z.string().min(1, 'Address is required'),
    userType: z.literal('Corporate'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
    // Corporate-specific fields are required
    rcNumber: z.string().min(1, 'RC Number is required for Corporate users'),
    industryId: z.number().int().positive('Industry ID is required for Corporate users'),
    officeName: z.string().optional(),
    officeEmail: z.string().email().optional().or(z.literal('')),
    officePhoneNumber: z.string().optional(),
    officeAddressLine1: z.string().optional(),
    officeStateId: z.number().int().optional(),
    officeLgaId: z.number().int().optional(),
    taxStationId: z.number().int().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const registerTaxpayerRequestSchema = z.discriminatedUnion('userType', [
  registerTaxpayerIndividualSchema,
  registerTaxpayerCorporateSchema,
]);

export const searchTaxpayerQuerySchema = z.object({
  term: z.string().min(4, 'Search term must be at least 4 characters'),
});

// ============================================================================
// Payment Schemas
// ============================================================================

export const initPaymentRequestSchema = z.object({
  tpui: taxpayerIdentifierSchema,
  billReference: billReferenceSchema,
});

export const updateRedirectUrlQuerySchema = z.object({
  redirectUrl: z.string().url('Invalid redirect URL'),
});

// ============================================================================
// Route Parameter Schemas
// ============================================================================

export const billReferenceParamSchema = z.object({
  reference: billReferenceSchema,
});

// ============================================================================
// Analytics Schemas
// ============================================================================

export const analyticsDateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const analyticsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  status: z.string().optional(),
  head: z.string().optional(),
  subhead: z.string().optional(),
  billType: z.string().optional(),
  zone: z.string().optional(),
  area: z.string().optional(),
  fileNumber: z.string().optional(),
  propertyType: z.string().optional(),
});

// ============================================================================
// Get All Bills Query Schema
// ============================================================================

export const getAllBillsQuerySchema = z.object({
  // Text search filters
  billReference: z.string().optional(),
  invoiceNo: z.string().optional(),
  
  // Exact match filters
  status: z.string().optional(),
  head: z.string().optional(),
  subhead: z.string().optional(),
  billType: z.string().optional(),
  zone: z.string().optional(),
  area: z.string().optional(),
  fileNumber: z.string().optional(),
  propertyType: z.string().optional(),
  
  // Date range filters
  createdAtStart: z.string().datetime().optional(),
  createdAtEnd: z.string().datetime().optional(),
  updatedAtStart: z.string().datetime().optional(),
  updatedAtEnd: z.string().datetime().optional(),
  paidAtStart: z.string().datetime().optional(),
  paidAtEnd: z.string().datetime().optional(),
  
  // Amount range filters (coerce from string to number)
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  
  // Pagination (coerce from string to number)
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  
  // Sorting
  sortBy: z.enum(['createdAt', 'updatedAt', 'paidAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// Type Exports (inferred from schemas)
// ============================================================================

export type CreateBillRequestInput = z.infer<typeof createBillRequestSchema>;
export type BulkBillRequestInput = z.infer<typeof bulkBillRequestSchema>;
export type AttachDataRequestInput = z.infer<typeof attachDataRequestSchema>;
export type BulkAttachDataRequestInput = z.infer<typeof bulkAttachDataRequestSchema>;
export type RegisterTaxpayerRequestInput = z.infer<typeof registerTaxpayerRequestSchema>;
export type SearchTaxpayerQueryInput = z.infer<typeof searchTaxpayerQuerySchema>;
export type InitPaymentRequestInput = z.infer<typeof initPaymentRequestSchema>;
export type UpdateRedirectUrlQueryInput = z.infer<typeof updateRedirectUrlQuerySchema>;
export type BillReferenceParamInput = z.infer<typeof billReferenceParamSchema>;
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
export type AnalyticsDateRangeInput = z.infer<typeof analyticsDateRangeSchema>;
export type GetAllBillsQueryInput = z.infer<typeof getAllBillsQuerySchema>;
