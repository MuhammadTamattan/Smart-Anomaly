import express from 'express';
import {
  getAlerts,
  getAlertById,
  updateAlertStatus,
  deleteAlert,
  getAlertStats,
} from '../controllers/alertController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', protect, getAlertStats);
router.get('/', protect, getAlerts);
router.get('/:id', protect, getAlertById);
router.patch('/:id/status', protect, updateAlertStatus);
router.delete('/:id', protect, deleteAlert);

export default router;
