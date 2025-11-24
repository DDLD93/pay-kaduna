import { Router } from 'express';
import billsRoutes from './bills.routes';
import taxpayersRoutes from './taxpayers.routes';
import paymentsRoutes from './payments.routes';
import configurationRoutes from './configuration.routes';

const router = Router();

/**
 * API Routes Aggregator
 * All routes are prefixed with /v1
 */

router.use('/bills', billsRoutes);
router.use('/taxpayers', taxpayersRoutes);
router.use('/payments', paymentsRoutes);
router.use('/configuration', configurationRoutes);

export default router;
