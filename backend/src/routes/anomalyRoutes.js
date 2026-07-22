import express from 'express';
import {
  getAnomalies,
  getAnomalyById,
  createAnomaly,
  updateAnomaly,
  deleteAnomaly,
} from '../controllers/anomalyController.js';

const router = express.Router();

router.route('/')
  .get(getAnomalies)
  .post(createAnomaly);

router.route('/:id')
  .get(getAnomalyById)
  .put(updateAnomaly)
  .delete(deleteAnomaly);

export default router;