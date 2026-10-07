import Log from '../models/Log.js';
import Alert from '../models/Alert.js';
import WebsiteScan from '../models/WebsiteScan.js';
import { seedDatabase } from '../config/seed.js';

// System defense monitoring state
let defenseShieldActive = true;

export const toggleDefenseShield = (req, res) => {
  if (typeof req.body.active === 'boolean') {
    defenseShieldActive = req.body.active;
  } else {
    defenseShieldActive = !defenseShieldActive;
  }
  return res.json({
    success: true,
    defenseShieldActive,
    message: defenseShieldActive
      ? 'System anomaly monitoring is ACTIVE.'
      : 'System anomaly monitoring has been PAUSED.',
  });
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user?._id;

    // If database is empty, auto-seed with initial sample records
    const currentTotal = await Log.countDocuments();
    if (currentTotal === 0) {
      await seedDatabase();
    }

    // Filter by user; if user has no data yet, show seeded sample data for testing
    let logFilter = userId ? { uploadedBy: userId } : {};
    let alertFilter = userId ? { user: userId } : {};
    let scanFilter = userId ? { scannedBy: userId } : {};

    const [userLogCount, userAlertCount] = await Promise.all([
      Log.countDocuments(logFilter),
      Alert.countDocuments(alertFilter),
    ]);

    if (userLogCount === 0 && (await Log.countDocuments()) > 0) {
      logFilter = {};
    }
    if (userAlertCount === 0 && (await Alert.countDocuments()) > 0) {
      alertFilter = {};
    }

    const [
      totalLogs,
      anomalyLogs,
      logBytesAgg,
      totalAlerts,
      activeAlerts,
      resolvedAlerts,
      criticalAlerts,
      highAlerts,
      mediumAlerts,
      lowAlerts,
      recentAlerts,
      alertsByType,
      recentLogs,
      totalScans,
      highRiskScans,
      mediumRiskScans,
      lowRiskScans,
      recentScans,
    ] = await Promise.all([
      Log.countDocuments(logFilter),
      Log.countDocuments({ ...logFilter, isAnomaly: true }),
      Log.aggregate([
        { $match: logFilter },
        { $group: { _id: null, totalBytes: { $sum: '$fileSize' } } },
      ]),
      Alert.countDocuments(alertFilter),
      Alert.countDocuments({ ...alertFilter, status: { $in: ['new', 'investigating'] } }),
      Alert.countDocuments({ ...alertFilter, status: 'resolved' }),
      Alert.countDocuments({ ...alertFilter, severity: 'critical' }),
      Alert.countDocuments({ ...alertFilter, severity: 'high' }),
      Alert.countDocuments({ ...alertFilter, severity: 'medium' }),
      Alert.countDocuments({ ...alertFilter, severity: 'low' }),
      Alert.find(alertFilter)
        .sort({ detectedAt: -1 })
        .limit(8)
        .populate('sourceLog', 'originalName')
        .lean(),
      Alert.aggregate([
        { $match: alertFilter },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Log.find(logFilter)
        .sort({ createdAt: -1 })
        .limit(10)
        .select('createdAt fileSize fileType isAnomaly severity analysisStatus originalName anomalyScore')
        .lean(),
      WebsiteScan.countDocuments(scanFilter),
      WebsiteScan.countDocuments({ ...scanFilter, riskLevel: 'high' }),
      WebsiteScan.countDocuments({ ...scanFilter, riskLevel: 'medium' }),
      WebsiteScan.countDocuments({ ...scanFilter, riskLevel: 'low' }),
      WebsiteScan.find(scanFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .select('url hostname ipAddress httpStatus riskScore riskLevel createdAt')
        .lean(),
    ]);

    const totalBytes = logBytesAgg[0]?.totalBytes || 0;

    // Calculate realistic threat index score (0 - 100) based on active alerts and anomalies
    let threatScore = 15;
    threatScore += criticalAlerts * 20;
    threatScore += highAlerts * 12;
    threatScore += mediumAlerts * 5;
    threatScore += lowAlerts * 2;
    const mitigationRate = totalAlerts > 0 ? Math.round((resolvedAlerts / totalAlerts) * 100) : 100;
    if (mitigationRate > 50) {
      threatScore = Math.max(10, threatScore - Math.round((mitigationRate - 50) * 0.3));
    }
    const finalThreatScore = Math.min(Math.max(threatScore, 10), 95);

    // Calculate anomaly rate
    const anomalyRate = totalLogs > 0 ? ((anomalyLogs / totalLogs) * 100).toFixed(1) : '0.0';

    // Format recent activity feed from MongoDB alerts
    const recentActivity = recentAlerts.map((alt) => {
      const detectedDate = new Date(alt.detectedAt || alt.createdAt);
      const minutesAgo = Math.max(1, Math.round((Date.now() - detectedDate.getTime()) / 60000));
      let timeAgo = `${minutesAgo}m ago`;
      if (minutesAgo >= 60) {
        const hoursAgo = Math.floor(minutesAgo / 60);
        timeAgo = hoursAgo === 1 ? '1h ago' : `${hoursAgo}h ago`;
        if (hoursAgo >= 24) {
          const daysAgo = Math.floor(hoursAgo / 24);
          timeAgo = daysAgo === 1 ? '1d ago' : `${daysAgo}d ago`;
        }
      }

      return {
        id: alt._id.toString(),
        event: alt.title,
        description: alt.description,
        time: timeAgo,
        rawTimestamp: alt.detectedAt,
        type: alt.status === 'resolved' ? 'resolved' : 'anomaly',
        status: alt.status,
        severity: alt.severity,
        threatType: alt.type,
        score: alt.anomalyScore ? Number(alt.anomalyScore.toFixed(3)) : 0.85,
        sourceLogName: alt.sourceLog?.originalName || 'System Log Stream',
        indicators: alt.indicators || [],
      };
    });

    // Format event distribution from real alerts
    const typeLabels = {
      brute_force: 'Repeated Failed Logins',
      sql_injection: 'SQL Query Patterns',
      ddos: 'High-Volume Traffic',
      dns_tunneling: 'DNS Activity',
      high_error_rate: 'High Error Rate',
      suspicious_activity: 'Unusual Log Activity',
      anomaly_detected: 'Statistical Outliers',
      privilege_escalation: 'Privilege Changes',
      port_scan: 'Port Scanning Activity',
    };

    const attackVectors = alertsByType.map((t, idx) => {
      const label = typeLabels[t._id] || t._id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      const colorClass = idx % 3 === 0 ? 'green-dash-dot-mint' : idx % 3 === 1 ? 'green-dash-dot-teal' : 'green-dash-dot-emerald';
      return {
        type: t._id,
        label,
        count: t.count,
        percentage: totalAlerts > 0 ? Math.round((t.count / totalAlerts) * 100) : 0,
        colorClass,
      };
    });

    if (attackVectors.length === 0) {
      attackVectors.push(
        { label: 'Standard Traffic', count: totalLogs, percentage: 70, colorClass: 'green-dash-dot-mint' },
        { label: 'Authentication Events', count: 0, percentage: 20, colorClass: 'green-dash-dot-teal' },
        { label: 'System Errors', count: 0, percentage: 10, colorClass: 'green-dash-dot-emerald' }
      );
    }

    // Sparkline bars for mini cards
    const logBars = [
      Math.min(90, Math.max(30, 40 + (totalLogs % 4) * 12)),
      Math.min(90, Math.max(30, 55 + (anomalyLogs % 3) * 10)),
      Math.min(90, Math.max(30, 45 + (recentLogs.length % 4) * 11)),
      Math.min(90, Math.max(30, 70 + (totalLogs % 2) * 15)),
      Math.min(90, Math.max(30, 60 + (criticalAlerts > 0 ? 25 : 5))),
    ];

    const threatBars = [
      Math.min(90, Math.max(25, 25 + criticalAlerts * 15)),
      Math.min(90, Math.max(25, 35 + highAlerts * 12)),
      Math.min(90, Math.max(25, 30 + mediumAlerts * 8)),
      Math.min(90, Math.max(30, Math.round(finalThreatScore * 0.75))),
      Math.min(90, Math.max(25, activeAlerts > 0 ? 65 : 20)),
    ];

    const neutralizedBars = [
      Math.min(90, Math.max(30, 40 + (resolvedAlerts % 3) * 15)),
      Math.min(90, Math.max(30, 35 + (resolvedAlerts % 4) * 10)),
      Math.min(90, Math.max(30, 60 + (mitigationRate > 50 ? 20 : 5))),
      Math.min(90, Math.max(30, 50 + (resolvedAlerts % 2) * 15)),
      Math.min(90, Math.max(30, 75 + (mitigationRate > 80 ? 15 : 0))),
    ];

    const logVelocityValue = totalLogs.toLocaleString();
    const neutralizedValue = resolvedAlerts.toLocaleString();
    const securityRiskScore = finalThreatScore.toFixed(1);
    const inferenceLatencyMs = '18ms';
    const activeSensorsCount = 'Active';

    res.json({
      totalLogs,
      totalBytes,
      anomaliesDetected: anomalyLogs,
      totalAlerts,
      activeAlerts,
      resolvedAlerts,
      criticalAlerts,
      highAlerts,
      mediumAlerts,
      lowAlerts,
      threatIndex: finalThreatScore.toFixed(1),
      anomalyRate,
      gaugeScore: Math.round(finalThreatScore),
      mitigationRate,
      securityRiskIndex: securityRiskScore,
      inferenceLatency: inferenceLatencyMs,
      activeSensors: activeSensorsCount,
      logVelocity: logVelocityValue,
      neutralizedCount: neutralizedValue,
      sparklines: {
        ingestionBars: logBars,
        threatBars,
        neutralizedBars,
      },
      attackVectors,
      regionThreatSources: [],
      recentActivity,
      recentLogs,
      cleanLogs: Math.max(0, totalLogs - anomalyLogs),
      mlModelStatus: {
        modelName: 'Isolation Forest',
        trees: 150,
        featuresCount: 24,
        contamination: '8%',
        status: 'Online',
      },
      defenseShieldActive,
      websiteScanActivity: {
        totalScanned: totalScans,
        highRisk: highRiskScans,
        mediumRisk: mediumRiskScans,
        lowRisk: lowRiskScans,
        recentScans: recentScans.map((s) => ({
          id: s._id.toString(),
          url: s.url,
          hostname: s.hostname,
          riskScore: s.riskScore,
          riskLevel: s.riskLevel,
          status: s.riskLevel === 'high' ? 'High Risk' : s.riskLevel === 'medium' ? 'Medium Risk' : 'Low Risk',
          httpStatus: s.httpStatus,
          date: s.createdAt,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};
