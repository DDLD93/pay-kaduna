import { Request, Response } from 'express';
import { payKadunaService } from '../services/paykaduna.service';
import { billDbService } from '../services/bill-db.service';
import {
  createBillRequestSchema,
  bulkBillRequestSchema,
  billReferenceParamSchema,
  attachDataRequestSchema,
  bulkAttachDataRequestSchema,
  CreateBillRequestInput,
  BulkBillRequestInput,
  AttachDataRequestInput,
  BulkAttachDataRequestInput,
} from '../schemas/validation.schemas';
import logger from '../middleware/logger';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * Bills Controller
 * Handles all bill management endpoints
 */

/**
 * Create a single bill
 * POST /v1/bills
 */
export const createBill = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Validate request body
    const validatedData = createBillRequestSchema.parse(req.body) as CreateBillRequestInput;

    // Create bill via PayKaduna service
    const result = await payKadunaService.createESBill(validatedData);

    // Save to database if bill was created successfully
    if (result.bill && result.billItems) {
      try {
        await billDbService.saveBillFromResponse(result);
      } catch (error) {
        // Log error but don't fail the request
        logger.error('Failed to save bill to database', {
          billReference: result.bill?.billReference,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info('Bill created successfully', {
      billReference: result.bill?.billReference,
    });

    res.status(200).json(result);
  }
);

/**
 * Create bulk bills
 * POST /v1/bills/bulk
 */
export const createBulkBills = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Validate request body
    const validatedData = bulkBillRequestSchema.parse(req.body) as BulkBillRequestInput;

    // Create bulk bills via PayKaduna service
    const result = await payKadunaService.createBulkESBill(validatedData);

    // Save to database if bill was created successfully
    if (result.bill && result.billItems) {
      try {
        await billDbService.saveBillFromResponse(result);
      } catch (error) {
        // Log error but don't fail the request
        logger.error('Failed to save bill to database', {
          billReference: result.bill?.billReference,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Check for failed bill items
    const hasFailures = result.failedBillItems && result.failedBillItems.length > 0;

    if (hasFailures) {
      logger.warn('Bulk bill creation completed with partial failures', {
        totalBills: validatedData.esBillDtos.length,
        failedItems: result.failedBillItems.length,
      });
      // Return 207 Multi-Status if there are failures, or 200 with details
      res.status(207).json(result);
    } else {
      logger.info('Bulk bills created successfully', {
        totalBills: validatedData.esBillDtos.length,
      });
      res.status(200).json(result);
    }
  }
);

/**
 * Get bill by reference
 * GET /v1/bills/:reference
 */
export const getBill = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Validate route parameter
    const { reference } = billReferenceParamSchema.parse(req.params);

    // Get bill via PayKaduna service
    const bill = await payKadunaService.getBill(reference);

    // Update database with latest bill data
    if (bill.bill && bill.billItems) {
      try {
        // Try to get invoice URL if available
        let invoiceUrl: string | undefined;
        try {
          const invoiceUrlResponse = await payKadunaService.getInvoiceUrl(reference);
          invoiceUrl = invoiceUrlResponse.invoiceUrl;
        } catch (error) {
          // Invoice URL fetch is optional, continue without it
          logger.debug('Invoice URL not available', { billReference: reference });
        }

        await billDbService.saveBillFromGetResponse(bill, invoiceUrl);
      } catch (error) {
        // Log error but don't fail the request
        logger.error('Failed to update bill in database', {
          billReference: reference,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    logger.info('Bill retrieved', { billReference: reference });

    res.status(200).json(bill);
  }
);

/**
 * Get invoice URL for a bill
 * GET /v1/bills/:reference/invoice-url
 */
export const getInvoiceUrl = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Validate route parameter
    const { reference } = billReferenceParamSchema.parse(req.params);

    // Get invoice URL via PayKaduna service
    const result = await payKadunaService.getInvoiceUrl(reference);

    logger.info('Invoice URL retrieved', { billReference: reference });

    res.status(200).json(result);
  }
);

/**
 * Attach additional data to a bill
 * POST /v1/bills/:reference/metadata
 */
export const attachMetadata = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Validate route parameter
    const { reference } = billReferenceParamSchema.parse(req.params);

    // Validate request body
    const validatedData = attachDataRequestSchema.parse({
      billReference: reference,
      additionalData: req.body.additionalData || req.body,
    }) as AttachDataRequestInput;

    // Attach metadata via PayKaduna service
    const result = await payKadunaService.attachAdditionalDataToBill(validatedData);

    logger.info('Metadata attached to bill', {
      billReference: reference,
    });

    res.status(200).json(result);
  }
);

/**
 * Bulk attach additional data to bills
 * POST /v1/bills/metadata/bulk
 */
export const bulkAttachMetadata = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Validate request body
    const validatedData = bulkAttachDataRequestSchema.parse(req.body) as BulkAttachDataRequestInput;

    // Bulk attach metadata via PayKaduna service
    const result = await payKadunaService.bulkAttachAdditionalDataToBill(validatedData);

    logger.info('Bulk metadata attached', {
      billCount: validatedData.bills.length,
    });

    res.status(200).json(result);
  }
);
