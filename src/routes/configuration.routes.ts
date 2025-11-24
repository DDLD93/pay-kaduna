import { Router } from 'express';
import { updateRedirectUrl } from '../controllers/payments.controller';

const router = Router();

/**
 * Configuration Routes
 * All routes are prefixed with /v1/configuration
 */

// Update payment redirect URL
router.put('/redirect-url', updateRedirectUrl);

export default router;
