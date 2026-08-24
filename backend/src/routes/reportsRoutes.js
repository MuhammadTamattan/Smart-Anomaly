import express from 'express';
import { getReportsSummary, exportReport } from '../controllers/reportsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/summary', protect, getReportsSummary);
router.get('/export', protect, exportReport);

export default router;
