import express from 'express';
import { getDashboardStats, toggleDefenseShield } from '../controllers/dashboardController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', protect, getDashboardStats);
router.patch('/toggle-defense', protect, toggleDefenseShield);

export default router;
