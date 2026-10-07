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
import websiteScannerRoutes from './routes/websiteScannerRoutes.js';
import aiAssistantRoutes from './routes/aiAssistantRoutes.js';
import incidentRoutes from './routes/incidentRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/anomalies', anomalyRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/logs', analysisRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/website-scanner', websiteScannerRoutes);
app.use('/api/ai-assistant', aiAssistantRoutes);
app.use('/api/incidents', incidentRoutes);
app.get('/api', (req, res) => res.json({ message: 'API is running' }));

app.use(errorHandler);

export default app;
