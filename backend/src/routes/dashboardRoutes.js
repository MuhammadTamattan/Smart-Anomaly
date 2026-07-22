import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', protect, (req, res) => {
  res.json({
    totalLogs: 12847,
    anomaliesDetected: 234,
    activeAlerts: 18,
    resolvedAlerts: 156,
    recentActivity: [
      { id: 1, event: 'CPU spike detected on Server A1', time: '2 min ago', type: 'anomaly' },
      { id: 2, event: 'Memory threshold exceeded', time: '15 min ago', type: 'alert' },
      { id: 3, event: 'Network latency anomaly resolved', time: '1 hr ago', type: 'resolved' },
      { id: 4, event: 'Disk usage warning cleared', time: '3 hr ago', type: 'resolved' },
      { id: 5, event: 'Unusual login pattern detected', time: '5 hr ago', type: 'anomaly' },
    ],
  });
});

export default router;
