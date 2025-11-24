import { Router } from 'express';
import { handleWebhook } from '../controllers/webhook.controller';

const router = Router();

/**
 * Webhook Routes
 * Route: POST /api/v1/paykaduna/webhook
 */

// Handle webhook events
router.post('/webhook', handleWebhook);

export default router;

