import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import anomalyRoutes from './routes/anomalyRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import logRoutes from './routes/logRoutes.js';
import analysisRoutes from './routes/analysisRoutes.js';
import alertRoutes from './routes/alertRoutes.js';
import reportsRoutes from './routes/reportsRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/anomalies', anomalyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/logs', analysisRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportsRoutes);
app.get('/api', (req, res) => res.json({ message: 'API is running' }));

app.use(errorHandler);

export default app;
