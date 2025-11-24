import { Request, Response } from 'express';
import { payKadunaService } from '../services/paykaduna.service';
import {
  initPaymentRequestSchema,
  updateRedirectUrlQuerySchema,
  InitPaymentRequestInput,
  UpdateRedirectUrlQueryInput,
} from '../schemas/validation.schemas';
import logger from '../middleware/logger';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * Payments Controller
 * Handles all payment-related endpoints
 */

/**
 * Initialize payment transaction
 * POST /v1/payments/initialize
 */
export const initializePayment = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Validate request body
    const validatedData = initPaymentRequestSchema.parse(req.body) as InitPaymentRequestInput;

    // Initialize payment via PayKaduna service
    const result = await payKadunaService.createESTransaction(validatedData);

    logger.info('Payment initialized', {
      tpui: validatedData.tpui,
      billReference: validatedData.billReference,
    });

    res.status(200).json(result);
  }
);

/**
 * Update payment redirect URL
 * PUT /v1/configuration/redirect-url?redirectUrl=:url
 */
export const updateRedirectUrl = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Validate query parameter
    const { redirectUrl } = updateRedirectUrlQuerySchema.parse(req.query) as UpdateRedirectUrlQueryInput;

    // Update redirect URL via PayKaduna service
    const result = await payKadunaService.updatePaymentRedirectUrl(redirectUrl);

    logger.info('Redirect URL updated', { redirectUrl });

    res.status(200).json(result);
  }
);
