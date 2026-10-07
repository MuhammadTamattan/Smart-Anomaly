import express from 'express';
import {
  getIncidents,
  getIncidentStats,
  getIncidentById,
  createIncident,
  updateIncidentStatus,
  addIncidentNote,
  deleteIncident,
} from '../controllers/incidentController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

// All incident routes are strictly Admin-only
router.use(protect, adminOnly);

router.get('/stats', getIncidentStats);
router.get('/', getIncidents);
router.post('/', createIncident);
router.get('/:id', getIncidentById);
router.patch('/:id/status', updateIncidentStatus);
router.post('/:id/notes', addIncidentNote);
router.delete('/:id', deleteIncident);

export default router;
