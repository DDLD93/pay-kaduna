import { Request, Response } from 'express';
import { analyticsService } from '../services/analytics.service';
import { analyticsQuerySchema, AnalyticsQueryInput } from '../schemas/validation.schemas';
import logger from '../middleware/logger';
import { asyncHandler } from '../middleware/errorHandler';

/**
 * Analytics Controller
 * Handles analytics aggregation endpoints
 */

/**
 * Get analytics aggregated by status
 * GET /v1/analytics/status
 */
export const getAnalyticsByStatus = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const validatedQuery = analyticsQuerySchema.parse(req.query) as AnalyticsQueryInput;

    const filter = {
      startDate: validatedQuery.startDate ? new Date(validatedQuery.startDate) : undefined,
      endDate: validatedQuery.endDate ? new Date(validatedQuery.endDate) : undefined,
      status: validatedQuery.status,
      head: validatedQuery.head,
      subhead: validatedQuery.subhead,
    };

    const result = await analyticsService.aggregateByStatus(filter);

    logger.info('Analytics by status retrieved', {
      filter,
      itemCount: result.items.length,
    });

    res.status(200).json(result);
  }
);

/**
 * Get analytics aggregated by head
 * GET /v1/analytics/head
 */
export const getAnalyticsByHead = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const validatedQuery = analyticsQuerySchema.parse(req.query) as AnalyticsQueryInput;

    const filter = {
      startDate: validatedQuery.startDate ? new Date(validatedQuery.startDate) : undefined,
      endDate: validatedQuery.endDate ? new Date(validatedQuery.endDate) : undefined,
      status: validatedQuery.status,
      head: validatedQuery.head,
      subhead: validatedQuery.subhead,
    };

    const result = await analyticsService.aggregateByHead(filter);

    logger.info('Analytics by head retrieved', {
      filter,
      itemCount: result.items.length,
    });

    res.status(200).json(result);
  }
);

/**
 * Get analytics aggregated by subhead
 * GET /v1/analytics/subhead
 */
export const getAnalyticsBySubhead = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const validatedQuery = analyticsQuerySchema.parse(req.query) as AnalyticsQueryInput;

    const filter = {
      startDate: validatedQuery.startDate ? new Date(validatedQuery.startDate) : undefined,
      endDate: validatedQuery.endDate ? new Date(validatedQuery.endDate) : undefined,
      status: validatedQuery.status,
      head: validatedQuery.head,
      subhead: validatedQuery.subhead,
    };

    const result = await analyticsService.aggregateBySubhead(filter);

    logger.info('Analytics by subhead retrieved', {
      filter,
      itemCount: result.items.length,
    });

    res.status(200).json(result);
  }
);

/**
 * Get analytics aggregated by paidAt
 * GET /v1/analytics/paid-at
 */
export const getAnalyticsByPaidAt = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const validatedQuery = analyticsQuerySchema.parse(req.query) as AnalyticsQueryInput;

    const filter = {
      startDate: validatedQuery.startDate ? new Date(validatedQuery.startDate) : undefined,
      endDate: validatedQuery.endDate ? new Date(validatedQuery.endDate) : undefined,
      status: validatedQuery.status,
      head: validatedQuery.head,
      subhead: validatedQuery.subhead,
    };

    const result = await analyticsService.aggregateByPaidAt(filter);

    logger.info('Analytics by paidAt retrieved', {
      filter,
      itemCount: result.items.length,
    });

    res.status(200).json(result);
  }
);

/**
 * Get analytics aggregated by status and head
 * GET /v1/analytics/status-head
 */
export const getAnalyticsByStatusAndHead = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const validatedQuery = analyticsQuerySchema.parse(req.query) as AnalyticsQueryInput;

    const filter = {
      startDate: validatedQuery.startDate ? new Date(validatedQuery.startDate) : undefined,
      endDate: validatedQuery.endDate ? new Date(validatedQuery.endDate) : undefined,
      status: validatedQuery.status,
      head: validatedQuery.head,
      subhead: validatedQuery.subhead,
    };

    const result = await analyticsService.aggregateByStatusAndHead(filter);

    logger.info('Analytics by status and head retrieved', {
      filter,
      itemCount: result.items.length,
    });

    res.status(200).json(result);
  }
);

/**
 * Get analytics aggregated by status, head, and subhead
 * GET /v1/analytics/status-head-subhead
 */
export const getAnalyticsByStatusHeadSubhead = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const validatedQuery = analyticsQuerySchema.parse(req.query) as AnalyticsQueryInput;

    const filter = {
      startDate: validatedQuery.startDate ? new Date(validatedQuery.startDate) : undefined,
      endDate: validatedQuery.endDate ? new Date(validatedQuery.endDate) : undefined,
      status: validatedQuery.status,
      head: validatedQuery.head,
      subhead: validatedQuery.subhead,
    };

    const result = await analyticsService.aggregateByStatusHeadSubhead(filter);

    logger.info('Analytics by status, head, and subhead retrieved', {
      filter,
      itemCount: result.items.length,
    });

    res.status(200).json(result);
  }
);

