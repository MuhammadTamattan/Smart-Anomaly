import express from 'express';
import { analyzeLog, getAnalysisResult } from '../controllers/analysisController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/:id/analyze', protect, analyzeLog);
router.get('/:id/result', protect, getAnalysisResult);

export default router;
