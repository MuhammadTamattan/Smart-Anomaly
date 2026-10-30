import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserDashboard from './UserDashboard';
import api from '../services/api';
import { formatDate, formatTimeAgo } from '../utils/helpers';
import './Dashboard.css';

/**
 * Clean & Responsive SVG Activity Chart for Log Analysis & Anomaly Activity
 * Displays real MongoDB aggregated data when available, or a clearly labeled
 * baseline curve when the database has no historical records yet.
 */
function ActivityChart({ logTrend = [], alertTrend = [], isDemo = false }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // Prepare 7-day data points
  const chartData = useMemo(() => {
    // If we have actual logTrend from backend reports
    if (Array.isArray(logTrend) && logTrend.length >= 2) {
      const alertMap = new Map();
      if (Array.isArray(alertTrend)) {
        alertTrend.forEach((a) => {
          if (a?.date) alertMap.set(a.date, a.alerts || 0);
        });
      }

      return logTrend.slice(-7).map((item) => {
        const d = new Date(item.date);
        const dayLabel = !isNaN(d.getTime())
          ? d.toLocaleDateString('en-US', { weekday: 'short' })
          : item.date;

        return {
          label: dayLabel,
          fullDate: item.date,
          logs: Number(item.logs) || 0,
          anomalies: Number(alertMap.get(item.date)) || 0,
        };
      });
    }

    // Default 7-day demonstration baseline (labeled clearly as baseline)
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const demoLogs = [24, 38, 45, 52, 60, 78, 85];
    const demoAnomalies = [2, 4, 3, 6, 5, 8, 7];

    return days.map((day, idx) => ({
      label: day,
      fullDate: `Day ${idx + 1}`,
      logs: demoLogs[idx],
      anomalies: demoAnomalies[idx],
    }));
  }, [logTrend, alertTrend]);

  const width = 720;
  const height = 210;
  const padLeft = 36;
  const padRight = 24;
  const padTop = 20;
  const padBottom = 32;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  // Compute max value for dynamic Y-scaling
  const maxVal = useMemo(() => {
    const highest = Math.max(...chartData.map((d) => Math.max(d.logs, d.anomalies, 10)));
    return Math.ceil(highest / 10) * 10 || 50;
  }, [chartData]);

  const getCoordinates = (seriesKey) => {
    if (chartData.length <= 1) {
      return [{ x: padLeft + chartW / 2, y: padTop + chartH / 2, val: chartData[0]?.[seriesKey] || 0 }];
    }
    return chartData.map((d, i) => {
      const x = padLeft + (i / (chartData.length - 1)) * chartW;
      const y = padTop + chartH - (d[seriesKey] / maxVal) * chartH;
      return { x, y, val: d[seriesKey], label: d.label, fullDate: d.fullDate };
    });
  };

  const logsPoints = getCoordinates('logs');
  const anomaliesPoints = getCoordinates('anomalies');

  const createSmoothPath = (pts) => {
    if (!pts.length) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const curr = pts[i];
      const next = pts[i + 1];
      const cp1x = curr.x + (next.x - curr.x) / 2;
      const cp1y = curr.y;
      const cp2x = curr.x + (next.x - curr.x) / 2;
      const cp2y = next.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    return d;
  };

  const logsPath = createSmoothPath(logsPoints);
  const anomaliesPath = createSmoothPath(anomaliesPoints);

  const logsArea = logsPoints.length > 1
    ? `${logsPath} L ${logsPoints[logsPoints.length - 1].x} ${height - padBottom} L ${logsPoints[0].x} ${height - padBottom} Z`
    : '';

  const yTicks = [0, Math.round(maxVal / 2), maxVal];

  return (
    <div className="dash-activity-chart-wrapper">
      <svg viewBox={`0 0 ${width} ${height}`} className="dash-activity-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="logsAreaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00d68f" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#00d68f" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Y-axis dashed grid lines & labels */}
        {yTicks.map((tick) => {
          const y = padTop + chartH - (tick / maxVal) * chartH;
          return (
            <g key={tick}>
              <line
                x1={padLeft}
                y1={y}
                x2={width - padRight}
                y2={y}
                stroke="var(--theme-border)"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={y + 3}
                fontSize="10"
                fill="var(--theme-text-muted)"
                textAnchor="end"
                fontWeight="500"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Area fill for logs */}
        {logsArea && <path d={logsArea} fill="url(#logsAreaGradient)" />}

        {/* Line paths */}
        <path
          d={logsPath}
          fill="none"
          stroke="#00d68f"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
        <path
          d={anomaliesPath}
          fill="none"
          stroke="#00b4d8"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Data points & hover triggers */}
        {logsPoints.map((pt, i) => {
          const isHovered = hoveredIdx === i;
          const anomPt = anomaliesPoints[i];

          return (
            <g
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Invisible wide hit target */}
              <circle cx={pt.x} cy={pt.y} r={14} fill="transparent" />

              {/* X Axis Label */}
              <text
                x={pt.x}
                y={height - 12}
                fontSize="11"
                fill="var(--theme-text-sub)"
                textAnchor="middle"
                fontWeight="500"
              >
                {pt.label}
              </text>

              {/* Logs point circle */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 5 : 3.5}
                fill="#ffffff"
                stroke="#00d68f"
                strokeWidth="2.2"
              />

              {/* Anomalies point circle */}
              {anomPt && (
                <circle
                  cx={anomPt.x}
                  cy={anomPt.y}
                  r={isHovered ? 4.5 : 3}
                  fill="#ffffff"
                  stroke="#00b4d8"
                  strokeWidth="2.2"
                />
              )}

              {/* Tooltip on hover */}
              {isHovered && (
                <g>
                  <rect
                    x={Math.min(width - 120, Math.max(10, pt.x - 55))}
                    y={Math.max(6, Math.min(pt.y, anomPt ? anomPt.y : pt.y) - 44)}
                    width="110"
                    height="36"
                    rx="6"
                    fill="var(--theme-card)"
                    stroke="var(--theme-border-strong)"
                    strokeWidth="1"
                    filter="drop-shadow(0 2px 8px rgba(0,0,0,0.35))"
                  />
                  <text
                    x={Math.min(width - 65, Math.max(65, pt.x))}
                    y={Math.max(22, Math.min(pt.y, anomPt ? anomPt.y : pt.y) - 28)}
                    fill="#00d68f"
                    fontSize="10"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    Logs: {pt.val}
                  </text>
                  <text
                    x={Math.min(width - 65, Math.max(65, pt.x))}
                    y={Math.max(34, Math.min(pt.y, anomPt ? anomPt.y : pt.y) - 16)}
                    fill="#00b4d8"
                    fontSize="10"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    Anomalies: {anomPt?.val ?? 0}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Simplified Main Dashboard Component
 * Clean, balanced, and viva-ready for college project demonstration.
 */
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeView, setActiveView] = useState('admin');
  const [stats, setStats] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Preview simple user friendly dashboard if toggled
  if (activeView === 'user') {
    return (
      <UserDashboard
        onSwitchToAdmin={() => setActiveView('admin')}
      />
    );
  }

  // Fetch real-time statistics and recent alerts
  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, reportRes, alertsRes] = await Promise.allSettled([
        api.get('/dashboard/stats'),
        api.get('/reports/summary'),
        api.get('/alerts'),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
        setStats(statsRes.value.data);
      }
      if (reportRes.status === 'fulfilled' && reportRes.value?.data) {
        setReportData(reportRes.value.data);
      }
      if (alertsRes.status === 'fulfilled' && Array.isArray(alertsRes.value?.data)) {
        setAlerts(alertsRes.value.data);
      }
    } catch (err) {
      console.warn('[Dashboard] Data fetch notice:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  // Real Counts from MongoDB
  const totalLogsCount = stats?.totalLogs ?? reportData?.summary?.totalLogs ?? 0;
  const anomaliesCount = stats?.anomaliesDetected ?? reportData?.summary?.anomalyLogs ?? 0;
  const activeAlertsCount =
    stats?.activeAlerts ??
    alerts.filter((a) => a.status !== 'resolved').length;
  const resolvedAlertsCount =
    stats?.resolvedAlerts ??
    alerts.filter((a) => a.status === 'resolved').length;

  // Recent 5 alerts list from MongoDB
  const recentAlertsList = useMemo(() => {
    if (alerts.length > 0) {
      return alerts.slice(0, 5).map((a) => ({
        id: a._id || a.id,
        title: a.title || 'Anomaly Event',
        severity: a.severity || 'high',
        status: a.status || 'new',
        timestamp: a.detectedAt || a.createdAt || new Date(),
        anomalyScore: a.anomalyScore,
        sourceLog: a.sourceLog?.originalName || null,
      }));
    }

    if (stats?.recentActivity && stats.recentActivity.length > 0) {
      return stats.recentActivity.slice(0, 5).map((a) => ({
        id: a.id,
        title: a.event || a.title || 'Anomaly Event',
        severity: a.severity || 'high',
        status: a.status || 'new',
        timestamp: a.rawTimestamp || new Date(),
        anomalyScore: a.score,
        sourceLog: a.sourceLogName || null,
      }));
    }

    return [];
  }, [alerts, stats]);

  // Determine if chart is using real data or demonstration baseline
  const hasLiveTrend =
    Array.isArray(reportData?.logTrend) && reportData.logTrend.length >= 2;

  return (
    <div className="green-dash-wrapper">
      <main className="green-dash-main">
        {/* ==================================================================
            1. PAGE HEADER BAR
            ================================================================== */}
        <header className="green-dash-header">
          <div className="green-dash-header-title-wrap">
            <h1 className="green-dash-header-title">Dashboard</h1>
            <p className="green-dash-header-sub">
              Overview of system log ingestion, machine learning anomalies, and active alerts
            </p>
          </div>

          <div className="green-dash-header-actions">
            <button
              type="button"
              className="green-dash-btn-secondary"
              onClick={() => setActiveView('user')}
              title="Preview User-Facing View"
            >
              <span>User View</span>
            </button>

            <button
              className="green-dash-btn-secondary"
              onClick={() => navigate('/log-upload')}
              title="Upload new log files"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Upload Log</span>
            </button>

            <button
              className="green-dash-btn-primary"
              onClick={() => navigate('/ml-analysis')}
              title="Run ML Anomaly Analysis"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>ML Analysis</span>
            </button>
          </div>
        </header>

        {/* ==================================================================
            2. SUMMARY CARDS: 4 Clean Metrics
            Total Logs Analyzed, Anomalies Detected, Active Alerts, System Status
            ================================================================== */}
        <section className="dash-summary-cards-row">
          {/* Card 1: Total Logs Analyzed */}
          <div
            className="dash-summary-card"
            onClick={() => navigate('/log-upload')}
            title="Click to manage and upload logs"
          >
            <div className="dash-card-icon-wrap icon-logs">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            </div>
            <div className="dash-card-content">
              <span className="dash-card-label">Total Logs Analyzed</span>
              <div className="dash-card-value">
                {loading ? '...' : totalLogsCount.toLocaleString()}
              </div>
              <span className="dash-card-meta">
                {totalLogsCount > 0 ? `${totalLogsCount - anomaliesCount} Normal logs` : 'Ingested for ML evaluation'}
              </span>
            </div>
          </div>

          {/* Card 2: Anomalies Detected */}
          <div
            className="dash-summary-card"
            onClick={() => navigate('/ml-analysis')}
            title="Click to view ML analysis details"
          >
            <div className="dash-card-icon-wrap icon-anomalies">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div className="dash-card-content">
              <span className="dash-card-label">Anomalies Detected</span>
              <div className="dash-card-value text-anomalies">
                {loading ? '...' : anomaliesCount.toLocaleString()}
              </div>
              <span className="dash-card-meta">
                {stats?.anomalyRate ? `${stats.anomalyRate}% anomaly rate` : 'Outliers flagged by Isolation Forest'}
              </span>
            </div>
          </div>

          {/* Card 3: Active Alerts */}
          <div
            className="dash-summary-card"
            onClick={() => navigate('/alerts')}
            title="Click to triage active alerts"
          >
            <div className="dash-card-icon-wrap icon-alerts">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <div className="dash-card-content">
              <span className="dash-card-label">Active Alerts</span>
              <div className="dash-card-value text-alerts">
                {loading ? '...' : activeAlertsCount.toLocaleString()}
              </div>
              <span className="dash-card-meta">
                {resolvedAlertsCount} Resolved & Bull; Needs Analyst Review
              </span>
            </div>
          </div>

          {/* Card 4: System Status */}
          <div
            className="dash-summary-card status-card"
            onClick={() => navigate('/settings')}
            title="Click to view system settings"
          >
            <div className="dash-card-icon-wrap icon-status">
              <span className="dash-pulse-dot" />
            </div>
            <div className="dash-card-content">
              <span className="dash-card-label">System Status</span>
              <div className="dash-card-value text-operational">
                Operational
              </div>
              <span className="dash-card-meta">
                Active Monitoring &bull; ML Engine Online
              </span>
            </div>
          </div>
        </section>

        {/* ==================================================================
            3. ACTIVITY CHART: Log Analysis & Anomaly Activity Over Time
            ================================================================== */}
        <section className="dash-section-card">
          <div className="dash-section-header">
            <div>
              <h2 className="dash-section-title">Activity Timeline</h2>
              <p className="dash-section-sub">
                Trend of ingested server telemetry compared to detected security anomalies
              </p>
            </div>

            <div className="dash-chart-controls">
              <div className="dash-legend-group">
                <span className="dash-legend-item">
                  <span className="dash-legend-dot mint" />
                  Logs Analyzed
                </span>
                <span className="dash-legend-item">
                  <span className="dash-legend-dot cyan" />
                  Anomalies Detected
                </span>
              </div>

              <span className={`dash-data-badge ${hasLiveTrend ? 'live' : 'demo'}`}>
                {hasLiveTrend ? 'Live MongoDB Telemetry' : 'Demo Baseline Curve'}
              </span>
            </div>
          </div>

          <ActivityChart
            logTrend={reportData?.logTrend || []}
            alertTrend={reportData?.trend || []}
            isDemo={!hasLiveTrend}
          />
        </section>

        {/* ==================================================================
            4. RECENT ALERTS: Compact & Readable List
            ================================================================== */}
        <section className="dash-section-card">
          <div className="dash-section-header">
            <div>
              <h2 className="dash-section-title">Recent Alerts</h2>
              <p className="dash-section-sub">
                Latest security notices and anomaly alerts flagged by the system
              </p>
            </div>

            <button
              className="dash-view-all-btn"
              onClick={() => navigate('/alerts')}
            >
              <span>View All Alerts</span>
              <span>&rarr;</span>
            </button>
          </div>

          {recentAlertsList.length === 0 ? (
            <div className="dash-empty-alerts">
              <div className="dash-empty-icon">🛡️</div>
              <div className="dash-empty-title">No Active Alerts Detected</div>
              <p className="dash-empty-sub">
                Your system is operating cleanly. Any newly detected anomalies or user threat reports will appear here.
              </p>
              <button
                className="green-dash-btn-secondary"
                onClick={() => navigate('/alerts')}
                style={{ marginTop: '10px' }}
              >
                Go to Alerts Center
              </button>
            </div>
          ) : (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Alert Title</th>
                    <th>Severity</th>
                    <th>Source Log</th>
                    <th>Detected Time</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAlertsList.map((alt) => {
                    const sev = (alt.severity || 'high').toLowerCase();
                    const statusStr = alt.status?.toLowerCase() || 'new';
                    const isResolved = statusStr === 'resolved';

                    return (
                      <tr
                        key={alt.id}
                        onClick={() => navigate('/alerts')}
                        className="dash-table-row-clickable"
                      >
                        <td className="cell-title">
                          <span className="dash-alert-dot" />
                          <span className="dash-alert-title-text">{alt.title}</span>
                        </td>
                        <td>
                          <span className={`badge-sev-${sev}`}>
                            {alt.severity.toUpperCase()}
                          </span>
                        </td>
                        <td className="cell-source">
                          {alt.sourceLog || 'System Stream'}
                        </td>
                        <td className="cell-time">
                          {formatTimeAgo(alt.timestamp)}
                        </td>
                        <td>
                          <span className={`status-pill-${isResolved ? 'resolved' : statusStr === 'investigating' ? 'investigating' : 'open'}`}>
                            {isResolved ? 'Resolved' : statusStr === 'investigating' ? 'Investigating' : 'Active'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="dash-inspect-link">
                            Triage &rarr;
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
