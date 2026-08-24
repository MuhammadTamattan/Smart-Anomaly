import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import Log from '../models/Log.js';
import Alert from '../models/Alert.js';

const currentFilename = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFilename);

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

const evaluateSecurityConditions = (featureImp, mlResult) => {
  const indicators = [];

  if (featureImp.failed_auth > 3) {
    indicators.push(`${Math.round(featureImp.failed_auth)} authentication failure(s) detected`);
  }
  if (featureImp.sql_keywords > 3) {
    indicators.push(`${Math.round(featureImp.sql_keywords)} SQL keywords found (possible injection attempt)`);
  }
  if (featureImp.shell_keywords > 1) {
    indicators.push(`${Math.round(featureImp.shell_keywords)} shell command(s) detected`);
  }
  if (featureImp.port_scan > 0) {
    indicators.push('Port scanning activity detected');
  }
  if (featureImp.error_count > 3) {
    indicators.push(`${Math.round(featureImp.error_count)} errors found in log`);
  }
  if (featureImp.unique_ips > 20) {
    indicators.push(`${Math.round(featureImp.unique_ips)} unique source IPs (possible distributed activity)`);
  }
  if (featureImp.rate_limit_hits > 3) {
    indicators.push(`${Math.round(featureImp.rate_limit_hits)} rate limit event(s) detected`);
  }
  if (featureImp.connection_resets > 2) {
    indicators.push(`${Math.round(featureImp.connection_resets)} connection reset(s) detected`);
  }
  if (featureImp.timeout_count > 5) {
    indicators.push(`${Math.round(featureImp.timeout_count)} timeout event(s) detected`);
  }

  let alertType = 'anomaly_detected';
  if (featureImp.failed_auth > 3) alertType = 'brute_force';
  else if (featureImp.sql_keywords > 3) alertType = 'sql_injection';
  else if (featureImp.port_scan > 0) alertType = 'port_scan';
  else if (featureImp.error_count > 3) alertType = 'high_error_rate';
  else if (featureImp.shell_keywords > 1 || featureImp.unique_ips > 20) alertType = 'suspicious_activity';

  const hasSecurityIndicators = indicators.length > 0;
  const hasHighAnomalyScore = mlResult.anomaly_score < -0.3;
  const hasCriticalSeverity = mlResult.severity === 'critical';
  const shouldCreateAlert = mlResult.is_anomaly || hasSecurityIndicators || hasHighAnomalyScore || hasCriticalSeverity;

  return {
    indicators,
    alertType,
    hasSecurityIndicators,
    hasHighAnomalyScore,
    hasCriticalSeverity,
    shouldCreateAlert,
  };
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
        const cachedMlResult = {
          is_anomaly: log.isAnomaly,
          anomaly_score: log.anomalyScore,
          severity: log.severity,
        };
        const cachedEval = evaluateSecurityConditions(cachedImp, cachedMlResult);

        console.log('[ML ANALYSIS] Retroactive evaluation for already-analyzed log:', log._id);
        console.log('[ML ANALYSIS] is_anomaly:', cachedMlResult.is_anomaly, '| score:', cachedMlResult.anomaly_score, '| severity:', cachedMlResult.severity);
        console.log('[ML ANALYSIS] Indicators:', cachedEval.indicators.length, cachedEval.indicators);
        console.log('[ML ANALYSIS] shouldCreateAlert:', cachedEval.shouldCreateAlert);

        if (cachedEval.shouldCreateAlert) {
          try {
            const alertDoc = await Alert.create({
              title: titleMap[cachedEval.alertType] || 'Security Anomaly Detected',
              description: log.analysisResult?.summary || 'ML analysis detected anomalous activity in the uploaded log file.',
              severity: severityMap[log.severity] || 'medium',
              type: cachedEval.alertType,
              status: 'new',
              sourceLog: log._id,
              user: log.uploadedBy,
              anomalyScore: log.anomalyScore,
              indicators: cachedEval.indicators,
              detectedAt: log.analyzedAt || new Date(),
            });
            console.log('[ALERT] Retroactive alert created successfully:', alertDoc._id);
          } catch (alertError) {
            console.error('[ALERT] Retroactive alert creation FAILED:', alertError.message);
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

    console.log('[ML ANALYSIS] Result received from ML service');
    console.log('[ML ANALYSIS] is_anomaly:', mlResult.is_anomaly, '| type:', typeof mlResult.is_anomaly);
    console.log('[ML ANALYSIS] anomaly_score:', mlResult.anomaly_score);
    console.log('[ML ANALYSIS] severity:', mlResult.severity);
    console.log('[ML ANALYSIS] feature_importance:', JSON.stringify(mlResult.feature_importance, null, 2));

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

    const featureImp = mlResult.feature_importance || {};
    const evalResult = evaluateSecurityConditions(featureImp, mlResult);

    console.log('[ML ANALYSIS] Indicators found:', evalResult.indicators.length, evalResult.indicators);
    console.log('[ML ANALYSIS] Alert type:', evalResult.alertType);
    console.log('[ML ANALYSIS] is_anomaly:', mlResult.is_anomaly);
    console.log('[ML ANALYSIS] hasHighAnomalyScore:', evalResult.hasHighAnomalyScore, '| score:', mlResult.anomaly_score);
    console.log('[ML ANALYSIS] hasCriticalSeverity:', evalResult.hasCriticalSeverity);
    console.log('[ML ANALYSIS] hasSecurityIndicators:', evalResult.hasSecurityIndicators);
    console.log('[ML ANALYSIS] shouldCreateAlert:', evalResult.shouldCreateAlert);

    if (evalResult.shouldCreateAlert) {
      console.log('[ALERT] Security condition detected - creating alert');
      console.log('[ALERT] Creating alert - type:', evalResult.alertType, '| severity:', severityMap[mlResult.severity] || 'medium');

      try {
        const alertDoc = await Alert.create({
          title: titleMap[evalResult.alertType] || 'Security Anomaly Detected',
          description: mlResult.summary || 'ML analysis detected anomalous activity in the uploaded log file.',
          severity: severityMap[mlResult.severity] || 'medium',
          type: evalResult.alertType,
          status: 'new',
          sourceLog: log._id,
          user: log.uploadedBy,
          anomalyScore: mlResult.anomaly_score,
          indicators: evalResult.indicators,
          detectedAt: new Date(),
        });
        console.log('[ALERT] Alert created successfully:', alertDoc._id);
      } catch (alertError) {
        console.error('[ALERT] Alert creation FAILED:', alertError.message);
        console.error('[ALERT] Alert validation details:', alertError.errors || alertError);
      }
    } else {
      console.log('[ML ANALYSIS] No anomaly and no security indicators — skipping alert creation');
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
      .select('originalName fileType fileSize status analysisStatus isAnomaly anomalyScore severity analyzedAt analysisResult uploadedBy createdAt');

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
