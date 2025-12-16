import { Router } from 'express';
import {
  getAnalyticsByStatus,
  getAnalyticsByHead,
  getAnalyticsBySubhead,
  getAnalyticsByPaidAt,
  getAnalyticsByStatusAndHead,
  getAnalyticsByStatusHeadSubhead,
  getAnalyticsByZoneAreaBillTypePropertyType,
  getAnalyticsByTime,
} from '../controllers/analytics.controller';

const router = Router();

/**
 * Analytics Routes
 * All routes are prefixed with /v1/analytics
 */

// Get analytics by status
router.get('/status', getAnalyticsByStatus);

// Get analytics by head
router.get('/head', getAnalyticsByHead);

// Get analytics by subhead
router.get('/subhead', getAnalyticsBySubhead);

// Get analytics by paidAt
router.get('/paid-at', getAnalyticsByPaidAt);

// Get analytics by status and head
router.get('/status-head', getAnalyticsByStatusAndHead);

// Get analytics by status, head, and subhead
router.get('/status-head-subhead', getAnalyticsByStatusHeadSubhead);

// Get analytics by zone, area, billType, and propertyType
router.get('/zone-area-type', getAnalyticsByZoneAreaBillTypePropertyType);

// Get analytics by time
router.get('/time', getAnalyticsByTime);

export default router;

