import Log from '../models/Log.js';
import Alert from '../models/Alert.js';

export const getReportsSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [
      totalLogs,
      analyzedLogs,
      anomalyLogs,
      logsBySeverity,
      logsByStatus,
      totalAlerts,
      alertsBySeverity,
      alertsByStatus,
      alertsByType,
      recentAlerts,
      recentLogs,
      alertsOverTime,
      logsOverTime,
    ] = await Promise.all([
      Log.countDocuments({ uploadedBy: userId }),
      Log.countDocuments({ uploadedBy: userId, analysisStatus: 'analyzed' }),
      Log.countDocuments({ uploadedBy: userId, isAnomaly: true }),
      Log.aggregate([
        { $match: { uploadedBy: userId, severity: { $ne: null } } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
      Log.aggregate([
        { $match: { uploadedBy: userId } },
        { $group: { _id: '$analysisStatus', count: { $sum: 1 } } },
      ]),
      Alert.countDocuments({ user: userId }),
      Alert.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$severity', count: { $sum: 1 } } },
      ]),
      Alert.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Alert.aggregate([
        { $match: { user: userId } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Alert.find({ user: userId })
        .populate('sourceLog', 'originalName fileType')
        .sort({ detectedAt: -1 })
        .limit(10)
        .lean(),
      Log.find({ uploadedBy: userId })
        .select('originalName fileType fileSize status analysisStatus isAnomaly severity createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Alert.aggregate([
        { $match: { user: userId } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$detectedAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
      Log.aggregate([
        { $match: { uploadedBy: userId } },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]),
    ]);

    const severityMap = {};
    logsBySeverity.forEach((s) => { severityMap[s._id] = s.count; });

    const statusMap = {};
    logsByStatus.forEach((s) => { statusMap[s._id] = s.count; });

    const alertSevMap = {};
    alertsBySeverity.forEach((s) => { alertSevMap[s._id] = s.count; });

    const alertStatusMap = {};
    alertsByStatus.forEach((s) => { alertStatusMap[s._id] = s.count; });

    const threatTypes = alertsByType.map((t) => ({
      type: t._id,
      count: t.count,
    }));

    const trend = alertsOverTime.map((a) => ({
      date: a._id,
      alerts: a.count,
    }));

    const logTrend = logsOverTime.map((l) => ({
      date: l._id,
      logs: l.count,
    }));

    res.json({
      summary: {
        totalLogs,
        analyzedLogs,
        anomalyLogs,
        totalAlerts,
        criticalAlerts: alertSevMap.critical || 0,
        highAlerts: alertSevMap.high || 0,
        mediumAlerts: alertSevMap.medium || 0,
        lowAlerts: alertSevMap.low || 0,
        activeAlerts: (alertStatusMap.new || 0) + (alertStatusMap.investigating || 0),
        resolvedAlerts: alertStatusMap.resolved || 0,
        investigatingAlerts: alertStatusMap.investigating || 0,
        newAlerts: alertStatusMap.new || 0,
      },
      logSeverity: {
        critical: severityMap.critical || 0,
        high: severityMap.high || 0,
        medium: severityMap.medium || 0,
        low: severityMap.low || 0,
        none: severityMap.none || 0,
      },
      logStatus: {
        pending: statusMap.pending || 0,
        processing: statusMap.processing || 0,
        analyzed: statusMap.analyzed || 0,
        failed: statusMap.failed || 0,
        uploaded: statusMap.uploaded || 0,
      },
      threatTypes,
      recentAlerts,
      recentLogs,
      trend,
      logTrend,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

export const exportReport = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { format = 'json' } = req.query;

    const [logs, alerts] = await Promise.all([
      Log.find({ uploadedBy: userId })
        .select('originalName fileType fileSize status analysisStatus isAnomaly anomalyScore severity analyzedAt createdAt')
        .sort({ createdAt: -1 })
        .lean(),
      Alert.find({ user: userId })
        .populate('sourceLog', 'originalName fileType')
        .sort({ detectedAt: -1 })
        .lean(),
    ]);

    const reportData = {
      reportTitle: 'Security Analysis Report',
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.name || req.user.email,
      summary: {
        totalLogs: logs.length,
        totalAlerts: alerts.length,
        criticalAlerts: alerts.filter((a) => a.severity === 'critical').length,
        highAlerts: alerts.filter((a) => a.severity === 'high').length,
        mediumAlerts: alerts.filter((a) => a.severity === 'medium').length,
        lowAlerts: alerts.filter((a) => a.severity === 'low').length,
        resolvedAlerts: alerts.filter((a) => a.status === 'resolved').length,
        activeAlerts: alerts.filter((a) => a.status !== 'resolved').length,
      },
      logs,
      alerts,
    };

    if (format === 'csv') {
      const csvRows = [];
      csvRows.push('Report generated at,' + reportData.generatedAt);
      csvRows.push('Generated by,' + reportData.generatedBy);
      csvRows.push('');
      csvRows.push('ALERTS');
      csvRows.push('Title,Severity,Type,Status,Anomaly Score,Detected At,Source Log');
      alerts.forEach((a) => {
        const sourceName = a.sourceLog?.originalName || 'N/A';
        csvRows.push(
          `"${a.title}",${a.severity},${a.type},${a.status},${a.anomalyScore ?? 'N/A'},${a.detectedAt},"${sourceName}"`
        );
      });
      csvRows.push('');
      csvRows.push('LOGS');
      csvRows.push('Name,Type,Size,Status,Analysis Status,Is Anomaly,Severity,Created At');
      logs.forEach((l) => {
        csvRows.push(
          `"${l.originalName}",${l.fileType},${l.fileSize},${l.status},${l.analysisStatus},${l.isAnomaly ?? 'N/A'},${l.severity ?? 'N/A'},${l.createdAt}`
        );
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=security-report.csv');
      return res.send(csvRows.join('\n'));
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=security-report.json');
    res.json(reportData);
  } catch (error) {
    next(error);
  }
};
