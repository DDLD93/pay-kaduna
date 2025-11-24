import { Router } from 'express';
import { initializePayment } from '../controllers/payments.controller';

const router = Router();

/**
 * Payments Routes
 * All routes are prefixed with /v1/payments
 */

// Initialize payment transaction
router.post('/initialize', initializePayment);

export default router;
