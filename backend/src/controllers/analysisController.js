import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import Log from '../models/Log.js';
import Alert from '../models/Alert.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

const titleMap = {
  anomaly_detected: 'Anomaly Detected in Log File',
  brute_force: 'Brute Force Attack Detected',
  sql_injection: 'SQL Injection Attempt Detected',
  port_scan: 'Port Scanning Activity Detected',
  high_error_rate: 'High Error Rate Detected',
  suspicious_activity: 'Suspicious Activity Detected',
};

const severityMap = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
  low: 'low',
  none: 'low',
};

export const analyzeLog = async (req, res, next) => {
  try {
    const log = await Log.findById(req.params.id);

    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }

    if (log.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to analyze this log' });
    }

    if (log.analysisStatus === 'analyzed') {
      const existingAlert = await Alert.findOne({ sourceLog: log._id, user: log.uploadedBy });

      if (!existingAlert) {
        const cachedImp = log.analysisResult?.feature_importance || {};
        const cachedIndicators = [];

        if (cachedImp.failed_auth > 3) cachedIndicators.push(`${Math.round(cachedImp.failed_auth)} authentication failure(s) detected`);
        if (cachedImp.sql_keywords > 5) cachedIndicators.push(`${Math.round(cachedImp.sql_keywords)} SQL keywords found (possible injection attempt)`);
        if (cachedImp.shell_keywords > 2) cachedIndicators.push(`${Math.round(cachedImp.shell_keywords)} shell command(s) detected`);
        if (cachedImp.port_scan > 0) cachedIndicators.push('Port scanning activity detected');
        if (cachedImp.error_count > 10) cachedIndicators.push(`${Math.round(cachedImp.error_count)} errors found in log`);
        if (cachedImp.unique_ips > 20) cachedIndicators.push(`${Math.round(cachedImp.unique_ips)} unique source IPs (possible distributed activity)`);
        if (cachedImp.rate_limit_hits > 3) cachedIndicators.push(`${Math.round(cachedImp.rate_limit_hits)} rate limit event(s) detected`);
        if (cachedImp.connection_resets > 3) cachedIndicators.push(`${Math.round(cachedImp.connection_resets)} connection reset(s) detected`);

        let cachedType = 'anomaly_detected';
        if (cachedImp.failed_auth > 3) cachedType = 'brute_force';
        else if (cachedImp.sql_keywords > 5) cachedType = 'sql_injection';
        else if (cachedImp.port_scan > 0) cachedType = 'port_scan';
        else if (cachedImp.error_count > 20) cachedType = 'high_error_rate';
        else if (cachedImp.shell_keywords > 2 || cachedImp.unique_ips > 20) cachedType = 'suspicious_activity';

        const shouldCreateCached = log.isAnomaly || cachedIndicators.length > 0;

        if (shouldCreateCached) {
          try {
            const alertDoc = await Alert.create({
              title: titleMap[cachedType] || 'Security Anomaly Detected',
              description: log.analysisResult?.summary || 'ML analysis detected anomalous activity in the uploaded log file.',
              severity: severityMap[log.severity] || 'medium',
              type: cachedType,
              status: 'new',
              sourceLog: log._id,
              user: log.uploadedBy,
              anomalyScore: log.anomalyScore,
              indicators: cachedIndicators,
              detectedAt: log.analyzedAt || new Date(),
            });
            console.log('[Analysis] Retroactive alert created for already-analyzed log:', alertDoc._id);
          } catch (alertError) {
            console.error('[Analysis] Retroactive alert creation FAILED:', alertError.message);
          }
        }
      }

      return res.status(200).json({
        message: 'Log already analyzed',
        result: {
          is_anomaly: log.isAnomaly,
          anomaly_score: log.anomalyScore,
          severity: log.severity,
          summary: log.analysisResult?.summary || '',
          total_lines_analyzed: log.analysisResult?.total_lines_analyzed || 0,
          analyzedAt: log.analyzedAt,
        },
      });
    }

    await Log.findByIdAndUpdate(log._id, {
      status: 'processing',
      analysisStatus: 'processing',
    });

    if (!log.filePath || !fs.existsSync(log.filePath)) {
      await Log.findByIdAndUpdate(log._id, {
        status: 'failed',
        analysisStatus: 'failed',
      });
      return res.status(404).json({ message: 'Log file not found on disk' });
    }

    const fileContent = fs.readFileSync(log.filePath, 'utf-8');

    if (!fileContent || fileContent.trim().length === 0) {
      await Log.findByIdAndUpdate(log._id, {
        status: 'failed',
        analysisStatus: 'failed',
      });
      return res.status(400).json({ message: 'Log file is empty' });
    }

    const logLines = fileContent.split('\n').filter(line => line.trim().length > 0);

    if (logLines.length === 0) {
      await Log.findByIdAndUpdate(log._id, {
        status: 'failed',
        analysisStatus: 'failed',
      });
      return res.status(400).json({ message: 'Log file contains no parseable lines' });
    }

    console.log(`[Analysis] Sending ${logLines.length} lines to ML service at ${ML_SERVICE_URL}/predict`);

    let mlResult;
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/predict`, {
        log_lines: logLines,
      }, {
        timeout: 30000,
      });
      mlResult = response.data;
    } catch (mlError) {
      await Log.findByIdAndUpdate(log._id, {
        status: 'failed',
        analysisStatus: 'failed',
      });

      if (mlError.code === 'ECONNREFUSED') {
        return res.status(503).json({ message: 'ML service is unavailable. Please ensure the Flask ML service is running.' });
      }
      return res.status(500).json({ message: `ML service error: ${mlError.message}` });
    }

    if (mlResult.error) {
      await Log.findByIdAndUpdate(log._id, {
        status: 'failed',
        analysisStatus: 'failed',
      });
      return res.status(500).json({ message: mlResult.error });
    }

    console.log('[Analysis] ML service response:', JSON.stringify({
      is_anomaly: mlResult.is_anomaly,
      anomaly_score: mlResult.anomaly_score,
      severity: mlResult.severity,
      feature_importance_keys: mlResult.feature_importance ? Object.keys(mlResult.feature_importance) : null,
    }, null, 2));

    const updateData = {
      status: 'completed',
      analysisStatus: 'analyzed',
      isAnomaly: mlResult.is_anomaly,
      anomalyScore: mlResult.anomaly_score,
      severity: mlResult.severity,
      analyzedAt: new Date(),
      analysisResult: {
        summary: mlResult.summary,
        total_lines_analyzed: mlResult.total_lines_analyzed,
        feature_importance: mlResult.feature_importance,
      },
    };

    await Log.findByIdAndUpdate(log._id, updateData);

    console.log('[Analysis] is_anomaly value:', mlResult.is_anomaly, '| type:', typeof mlResult.is_anomaly);

    const featureImp = mlResult.feature_importance || {};
    const indicators = [];

    if (featureImp.failed_auth > 3) {
      indicators.push(`${Math.round(featureImp.failed_auth)} authentication failure(s) detected`);
    }
    if (featureImp.sql_keywords > 5) {
      indicators.push(`${Math.round(featureImp.sql_keywords)} SQL keywords found (possible injection attempt)`);
    }
    if (featureImp.shell_keywords > 2) {
      indicators.push(`${Math.round(featureImp.shell_keywords)} shell command(s) detected`);
    }
    if (featureImp.port_scan > 0) {
      indicators.push('Port scanning activity detected');
    }
    if (featureImp.error_count > 10) {
      indicators.push(`${Math.round(featureImp.error_count)} errors found in log`);
    }
    if (featureImp.unique_ips > 20) {
      indicators.push(`${Math.round(featureImp.unique_ips)} unique source IPs (possible distributed activity)`);
    }
    if (featureImp.rate_limit_hits > 3) {
      indicators.push(`${Math.round(featureImp.rate_limit_hits)} rate limit event(s) detected`);
    }
    if (featureImp.connection_resets > 3) {
      indicators.push(`${Math.round(featureImp.connection_resets)} connection reset(s) detected`);
    }

    let alertType = 'anomaly_detected';
    if (featureImp.failed_auth > 3) alertType = 'brute_force';
    else if (featureImp.sql_keywords > 5) alertType = 'sql_injection';
    else if (featureImp.port_scan > 0) alertType = 'port_scan';
    else if (featureImp.error_count > 20) alertType = 'high_error_rate';
    else if (featureImp.shell_keywords > 2 || featureImp.unique_ips > 20) alertType = 'suspicious_activity';

    const hasSecurityIndicators = indicators.length > 0;
    const shouldCreateAlert = mlResult.is_anomaly || hasSecurityIndicators;

    console.log('[Analysis] Feature importance:', JSON.stringify(featureImp, null, 2));
    console.log('[Analysis] Security indicators found:', indicators.length, indicators);
    console.log('[Analysis] Alert type:', alertType);
    console.log('[Analysis] is_anomaly:', mlResult.is_anomaly, '| hasSecurityIndicators:', hasSecurityIndicators, '| shouldCreateAlert:', shouldCreateAlert);

    if (shouldCreateAlert) {
      console.log('[Analysis] Creating alert - type:', alertType, '| severity:', severityMap[mlResult.severity] || 'medium');

      try {
        const alertDoc = await Alert.create({
          title: titleMap[alertType] || 'Security Anomaly Detected',
          description: mlResult.summary || 'ML analysis detected anomalous activity in the uploaded log file.',
          severity: severityMap[mlResult.severity] || 'medium',
          type: alertType,
          status: 'new',
          sourceLog: log._id,
          user: log.uploadedBy,
          anomalyScore: mlResult.anomaly_score,
          indicators,
          detectedAt: new Date(),
        });
        console.log('[Analysis] Alert created successfully:', alertDoc._id);
      } catch (alertError) {
        console.error('[Analysis] Alert creation FAILED:', alertError.message);
        console.error('[Analysis] Alert validation details:', alertError.errors || alertError);
      }
    } else {
      console.log('[Analysis] No anomaly and no security indicators — skipping alert creation');
    }

    res.json({
      message: 'Analysis complete',
      result: {
        is_anomaly: mlResult.is_anomaly,
        anomaly_score: mlResult.anomaly_score,
        severity: mlResult.severity,
        summary: mlResult.summary,
        total_lines_analyzed: mlResult.total_lines_analyzed,
        analyzedAt: updateData.analyzedAt,
      },
    });
  } catch (error) {
    console.error('[Analysis] Unexpected error:', error.message);
    next(error);
  }
};

export const getAnalysisResult = async (req, res, next) => {
  try {
    const log = await Log.findById(req.params.id)
      .select('originalName fileType fileSize status analysisStatus isAnomaly anomalyScore severity analyzedAt analysisResult createdAt');

    if (!log) {
      return res.status(404).json({ message: 'Log not found' });
    }

    if (log.uploadedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(log);
  } catch (error) {
    next(error);
  }
};
