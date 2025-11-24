import { Request, Response } from 'express';
import { payKadunaService } from '../services/paykaduna.service';
import {
  registerTaxpayerRequestSchema,
  searchTaxpayerQuerySchema,
  RegisterTaxpayerRequestInput,
  SearchTaxpayerQueryInput,
} from '../schemas/validation.schemas';
import logger from '../middleware/logger';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * Taxpayers Controller
 * Handles all taxpayer management endpoints
 */

/**
 * Register a new taxpayer
 * POST /v1/taxpayers
 */
export const registerTaxpayer = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Validate request body (includes userType validation)
    const validatedData = registerTaxpayerRequestSchema.parse(
      req.body
    ) as RegisterTaxpayerRequestInput;

    // Register taxpayer via PayKaduna service
    const result = await payKadunaService.registerTaxPayer(validatedData);

    logger.info('Taxpayer registered successfully', {
      identifier: validatedData.identifier,
      userType: validatedData.userType,
    });

    res.status(201).json(result);
  }
);

/**
 * Search for taxpayers
 * GET /v1/taxpayers/search?term=:term
 */
export const searchTaxpayer = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    // Validate query parameters
    const { term } = searchTaxpayerQuerySchema.parse(req.query) as SearchTaxpayerQueryInput;

    // Search taxpayers via PayKaduna service
    const taxpayers = await payKadunaService.searchTaxPayer(term);

    logger.info('Taxpayer search completed', {
      searchTerm: term,
      resultCount: taxpayers?.length || 0,
    });

    res.status(200).json(taxpayers || []);
  }
);
