import { Request, Response } from 'express';
import crypto from 'crypto';
import config from '../config/env';
import logger from '../middleware/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { WebhookEvent } from '../types/paykaduna.d';

/**
 * Webhook Controller
 * Handles incoming webhook events from PayKaduna
 */

/**
 * Handle webhook events
 * POST /api/v1/paykaduna/webhook
 */
export const handleWebhook = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Get the signature from header - only x-paykaduna-signature is accepted
      const signature = req.headers['x-paykaduna-signature'];

      if (!signature || typeof signature !== 'string') {
        logger.warn('Webhook received without signature', {
          headers: Object.keys(req.headers),
        });
        res.status(401).json({
          event: 'webhook.error',
          data: {},
          message: 'Webhook signature is required',
        });
        return;
      }

      // Generate HMAC SHA512 signature from request body
      const webhookSecretKey = config.payKaduna.webhookSecretKey;
      const hash = crypto
        .createHmac('sha512', webhookSecretKey)
        .update(JSON.stringify(req.body))
        .digest('hex');

      // Verify signature
      if (hash !== signature) {
        logger.warn('Webhook signature validation failed', {
          received: signature.substring(0, 10) + '...',
          expected: hash.substring(0, 10) + '...',
        });
        res.status(401).json({
          event: 'webhook.error',
          data: {},
          message: 'Webhook signature validation failed',
        });
        return;
      }

      // Validate request body structure
      const body = req.body as Partial<WebhookEvent>;

      if (!body.event || typeof body.event !== 'string') {
        res.status(400).json({
          event: 'webhook.error',
          data: {},
          message: 'Invalid request: event is required and must be a string',
        });
        return;
      }

      if (!body.data || typeof body.data !== 'object' || Array.isArray(body.data)) {
        res.status(400).json({
          event: 'webhook.error',
          data: {},
          message: 'Invalid request: data is required and must be an object',
        });
        return;
      }

      if (!body.message || typeof body.message !== 'string') {
        res.status(400).json({
          event: 'webhook.error',
          data: {},
          message: 'Invalid request: message is required and must be a string',
        });
        return;
      }

      // Request is valid, process the event
      const event = body as WebhookEvent;

      logger.info('Webhook event received', {
        event: event.event,
        hasInvoiceNo: !!(event.data && 'invoiceNo' in event.data),
      });

      // Process the event directly (no queue)
      // Add your business logic here

      // Return success response in standardized format
      res.status(200).json({
        event: event.event,
        data: event.data,
        message: 'Webhook event processed successfully',
      });
    } catch (error) {
      logger.error('Webhook error', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      res.status(500).json({
        event: 'webhook.error',
        data: {},
        message: 'Internal server error',
      });
    }
  }
);
