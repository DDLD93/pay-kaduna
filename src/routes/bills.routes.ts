import { Router } from 'express';
import {
  createBill,
  createBulkBills,
  getBill,
  getInvoiceUrl,
  attachMetadata,
  bulkAttachMetadata,
} from '../controllers/bills.controller';

const router = Router();

/**
 * Bills Routes
 * All routes are prefixed with /v1/bills
 */

// Create a single bill
router.post('/', createBill);

// Create bulk bills
router.post('/bulk', createBulkBills);

// Get bill by reference
router.get('/:reference', getBill);

// Get invoice URL for a bill
router.get('/:reference/invoice-url', getInvoiceUrl);

// Attach metadata to a bill
router.post('/:reference/metadata', attachMetadata);

// Bulk attach metadata to bills
router.post('/metadata/bulk', bulkAttachMetadata);

export default router;
