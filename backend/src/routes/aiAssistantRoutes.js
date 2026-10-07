import express from 'express';
import { chatWithAssistant, getAssistantStatus } from '../controllers/aiAssistantController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// Both routes strictly require valid JWT and ADMIN role
router.post('/chat', protect, adminOnly, chatWithAssistant);
router.get('/status', protect, adminOnly, getAssistantStatus);

export default router;
