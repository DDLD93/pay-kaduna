import { Router } from 'express';
import { registerTaxpayer, searchTaxpayer } from '../controllers/taxpayers.controller';

const router = Router();

/**
 * Taxpayers Routes
 * All routes are prefixed with /v1/taxpayers
 */

// Register a new taxpayer
router.post('/', registerTaxpayer);

// Search for taxpayers
router.get('/search', searchTaxpayer);

export default router;
