import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  scanWebsite,
  getScanHistory,
  getScanById,
  deleteScan,
} from '../controllers/websiteScannerController.js';

const router = express.Router();

// All website scanner endpoints are protected with authentication
router.post('/scan', protect, scanWebsite);
router.get('/history', protect, getScanHistory);
router.get('/:id', protect, getScanById);
router.delete('/:id', protect, deleteScan);

export default router;
