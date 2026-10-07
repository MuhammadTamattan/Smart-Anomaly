import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Dashboard.css';

/**
 * Responsive SVG Line Chart Component for Anomaly Trends
 */
function SvgLineChart({
  data = [],
  color = '#00d68f',
  valueKey = 'value',
  labelKey = 'label',
  emptyText = 'No activity data available yet',
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const hasData = useMemo(() => {
    return Array.isArray(data) && data.length > 0 && data.some((d) => (d[valueKey] || 0) > 0);
  }, [data, valueKey]);

  if (!hasData) {
    return (
      <div className="green-dash-empty-state">
        <span className="empty-icon">📈</span>
        <p>{emptyText}</p>
        <span className="empty-sub">Upload logs to view anomaly trends</span>
      </div>
    );
  }

  const width = 520;
  const height = 180;
  const padLeft = 36;
  const padRight = 24;
  const padTop = 22;
  const padBottom = 32;

  const chartW = width - padLeft - padRight;
  const chartH = height - padTop - padBottom;

  const maxVal = Math.max(...data.map((d) => d[valueKey] || 0), 4);

  const points = data.map((d, i) => {
    const x =
      data.length === 1
        ? padLeft + chartW / 2
        : padLeft + (i / (data.length - 1)) * chartW;
    const y = padTop + chartH - ((d[valueKey] || 0) / maxVal) * chartH;
    return { x, y, ...d };
  });

  let pathD = '';
  let areaD = '';
  if (points.length === 1) {
    pathD = `M ${padLeft} ${points[0].y} L ${width - padRight} ${points[0].y}`;
    areaD = `M ${padLeft} ${points[0].y} L ${width - padRight} ${points[0].y} L ${width - padRight} ${height - padBottom} L ${padLeft} ${height - padBottom} Z`;
  } else {
    pathD = points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`, '');
    areaD = `${pathD} L ${points[points.length - 1].x} ${height - padBottom} L ${points[0].x} ${height - padBottom} Z`;
  }

  const yTicks = [0, Math.round(maxVal / 2), maxVal];

  return (
    <div className="green-dash-svg-chart-container">
      <svg viewBox={`0 0 ${width} ${height}`} className="green-dash-svg-chart">
        <defs>
          <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.32" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid lines & Y-Axis Labels */}
        {yTicks.map((val, idx) => {
          const yPos = padTop + chartH - (val / maxVal) * chartH;
          return (
            <g key={idx}>
              <line x1={padLeft} y1={yPos} x2={width - padRight} y2={yPos} stroke="#e8f1ed" strokeDasharray="3,3" />
              <text x={padLeft - 6} y={yPos + 3} fontSize="10" fill="#839b95" textAnchor="end" fontWeight="600">
                {val}
              </text>
            </g>
          );
        })}

        {/* Filled Area */}
        <path d={areaD} fill="url(#trendGradient)" />

        {/* Main Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />

        {/* Points & Interactive Tooltips */}
        {points.map((pt, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <g
              key={idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isHovered ? 6 : 4}
                fill="#ffffff"
                stroke={color}
                strokeWidth="2.5"
                className="chart-point-circle"
              />

              {isHovered && (
                <g>
                  <rect
                    x={Math.min(width - 95, Math.max(10, pt.x - 42))}
                    y={Math.max(4, pt.y - 34)}
                    width="84"
                    height="24"
                    rx="6"
                    fill="#0c3631"
                  />
                  <text
                    x={Math.min(width - 53, Math.max(52, pt.x))}
                    y={Math.max(20, pt.y - 18)}
                    fill="#ffffff"
                    fontSize="10.5"
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {pt[valueKey]} {pt.tooltipLabel || 'anomalies'}
                  </text>
                </g>
              )}

              {/* X-axis date label */}
              <text
                x={pt.x}
                y={height - 10}
                fontSize="10"
                fill="#526b65"
                textAnchor="middle"
                fontWeight="600"
              >
                {pt[labelKey]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/**
 * Main Dashboard Component
 */
export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real-time statistics from MongoDB
  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsRes, reportRes, logsRes] = await Promise.allSettled([
        api.get('/dashboard/stats'),
        api.get('/reports/summary'),
        api.get('/logs'),
      ]);

      if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
        setStats(statsRes.value.data);
      }
      if (reportRes.status === 'fulfilled' && reportRes.value?.data) {
        setReportData(reportRes.value.data);
      }
      if (logsRes.status === 'fulfilled' && Array.isArray(logsRes.value?.data)) {
        setLogs(logsRes.value.data);
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

  // Derived counts from MongoDB
  const totalLogsCount = stats?.totalLogs ?? logs.length ?? 0;
  const anomaliesCount = stats?.anomaliesDetected ?? logs.filter((l) => l.isAnomaly).length ?? 0;
  const activeAlertsCount = stats?.activeAlerts ?? 0;
  const resolvedAlertsCount = stats?.resolvedAlerts ?? 0;

  // Anomaly Trend Points
  const anomalyTrendPoints = useMemo(() => {
    const rawTrend = reportData?.trend || [];
    return rawTrend.map((t) => {
      const d = new Date(t.date);
      const label = isNaN(d.getTime())
        ? t.date
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return {
        label,
        value: t.alerts || 0,
        tooltipLabel: 'anomalies',
      };
    });
  }, [reportData?.trend]);

  // Recent logs list for Recent Analysis container
  const recentLogsList = (stats?.recentLogs && stats.recentLogs.length > 0)
    ? stats.recentLogs.slice(0, 5)
    : logs.slice(0, 5);

  // Recent alerts list for Recent Alerts container
  const recentAlertsList = (stats?.recentActivity || stats?.recentAlerts || []).slice(0, 5);

  return (
    <div className="green-dash-wrapper">
      <main className="green-dash-main">
        {/* Header */}
        <header className="green-dash-header">
          <div className="green-dash-header-title-wrap">
            <h1 className="green-dash-header-title">Dashboard</h1>
            <p className="green-dash-header-sub">
              Smart Anomaly Detection and Alert System
            </p>
          </div>

          <div className="green-dash-header-actions">
            <button
              className="green-dash-btn-secondary"
              onClick={() => navigate('/log-upload')}
              title="Upload new log files"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span>Analyze Log</span>
            </button>
          </div>
        </header>

        {/* 4 TOP METRIC CARDS */}
        <section className="green-dash-top-row">
          {/* Card 1: Total Logs */}
          <div
            className="green-dash-card green-dash-metric-card clickable"
            onClick={() => navigate('/log-upload')}
            title="View Log Upload"
          >
            <div className="green-dash-metric-info">
              <span className="green-dash-card-label">Total Logs</span>
              <div className="green-dash-metric-value-row">
                <span className="green-dash-metric-num">
                  {loading ? '...' : totalLogsCount.toLocaleString()}
                </span>
                <span className="green-dash-metric-unit">logs</span>
              </div>
            </div>
            <div className="green-dash-mini-bars">
              {[35, 55, 45, 80, 65].map((h, i) => (
                <div key={i} className="green-dash-bar-wrap">
                  <div className="green-dash-bar-fill" style={{ height: `${h}%`, backgroundColor: '#00d68f' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Anomalies Detected */}
          <div
            className="green-dash-card green-dash-metric-card clickable"
            onClick={() => navigate('/ml-analysis')}
            title="View ML Analysis"
          >
            <div className="green-dash-metric-info">
              <span className="green-dash-card-label">Anomalies Detected</span>
              <div className="green-dash-metric-value-row">
                <span className="green-dash-metric-num">
                  {loading ? '...' : anomaliesCount.toLocaleString()}
                </span>
                <span className="green-dash-metric-unit">anomalies</span>
              </div>
            </div>
            <div className="green-dash-mini-bars">
              {[80, 40, 75, 50, 90].map((h, i) => (
                <div key={i} className="green-dash-bar-wrap">
                  <div className="green-dash-bar-fill" style={{ height: `${h}%`, backgroundColor: '#f97316' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Active Alerts */}
          <div
            className="green-dash-card green-dash-metric-card clickable"
            onClick={() => navigate('/alerts')}
            title="View Alerts"
          >
            <div className="green-dash-metric-info">
              <span className="green-dash-card-label">Active Alerts</span>
              <div className="green-dash-metric-value-row">
                <span className="green-dash-metric-num">
                  {loading ? '...' : activeAlertsCount.toLocaleString()}
                </span>
                <span className="green-dash-metric-unit">alerts</span>
              </div>
            </div>
            <div className="green-dash-mini-bars">
              {[60, 45, 85, 30, 70].map((h, i) => (
                <div key={i} className="green-dash-bar-wrap">
                  <div className="green-dash-bar-fill" style={{ height: `${h}%`, backgroundColor: '#ea580c' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Resolved Alerts */}
          <div
            className="green-dash-card green-dash-metric-card clickable"
            onClick={() => navigate('/alerts')}
            title="View Resolved Alerts"
          >
            <div className="green-dash-metric-info">
              <span className="green-dash-card-label">Resolved Alerts</span>
              <div className="green-dash-metric-value-row">
                <span className="green-dash-metric-num">
                  {loading ? '...' : resolvedAlertsCount.toLocaleString()}
                </span>
                <span className="green-dash-metric-unit">resolved</span>
              </div>
            </div>
            <div className="green-dash-mini-bars">
              {[40, 60, 50, 75, 95].map((h, i) => (
                <div key={i} className="green-dash-bar-wrap">
                  <div className="green-dash-bar-fill" style={{ height: `${h}%`, backgroundColor: '#00d68f' }} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MAIN SECTION: Anomaly Trend Graph & Recent Analysis */}
        <section className="green-dash-analytics-row">
          {/* Anomaly Trend Graph */}
          <div className="green-dash-card green-dash-chart-card">
            <div className="green-dash-card-header-row">
              <div>
                <h3 className="green-dash-section-title">Anomaly Detection Trend</h3>
                <p className="green-dash-section-sub">
                  Anomalies detected over time
                </p>
              </div>
              <span className="green-dash-badge clean">
                Isolation Forest
              </span>
            </div>

            <SvgLineChart
              data={anomalyTrendPoints}
              color="#00d68f"
              valueKey="value"
              labelKey="label"
              emptyText="No anomaly trend data recorded yet"
            />
          </div>

          {/* Recent Analysis Container */}
          <div className="green-dash-card">
            <div className="green-dash-card-header-row">
              <div>
                <h3 className="green-dash-section-title">Recent Analysis</h3>
                <p className="green-dash-section-sub">
                  Latest log files analyzed
                </p>
              </div>

              <button
                className="green-dash-link-btn"
                onClick={() => navigate('/ml-analysis')}
              >
                View ML Analysis →
              </button>
            </div>

            {recentLogsList.length > 0 ? (
              <div className="green-dash-simple-logs-list">
                {recentLogsList.map((log) => {
                  const isAnalyzed = log.analysisStatus === 'analyzed';
                  const isAnomaly = Boolean(log.isAnomaly);
                  const resultText = isAnalyzed ? (isAnomaly ? 'Anomaly' : 'Normal') : 'Ready';
                  const scoreVal = log.anomalyScore !== null && log.anomalyScore !== undefined
                    ? Number(log.anomalyScore).toFixed(3)
                    : '0.000';
                  const dateStr = log.createdAt
                    ? new Date(log.createdAt).toLocaleDateString()
                    : 'Today';

                  return (
                    <div
                      key={log._id}
                      className="green-dash-log-item"
                      onClick={() => navigate('/ml-analysis')}
                      title="Click to view analysis"
                    >
                      <div className="log-item-icon">📄</div>

                      <div className="log-item-info">
                        <span className="log-item-name">{log.originalName}</span>
                        <div className="log-item-meta">
                          <span>Result: <strong>{resultText}</strong></span>
                          <span>•</span>
                          <span>Score: {scoreVal}</span>
                          <span>•</span>
                          <span>{dateStr}</span>
                        </div>
                      </div>

                      <div className="log-item-status-wrap">
                        <span className={`green-dash-badge ${isAnomaly ? 'threat' : 'clean'}`}>
                          {resultText}
                        </span>
                        <span className="log-item-arrow">→</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="green-dash-empty-state">
                <span className="empty-icon">📂</span>
                <p>No log records analyzed yet</p>
                <span className="empty-sub">Upload a log file to run anomaly detection</span>
              </div>
            )}
          </div>
        </section>

        {/* BOTTOM SECTION: Recent Alerts */}
        <section className="green-dash-analytics-row">
          <div className="green-dash-card" style={{ gridColumn: 'span 2' }}>
            <div className="green-dash-card-header-row">
              <div>
                <h3 className="green-dash-section-title">Recent Alerts</h3>
                <p className="green-dash-section-sub">
                  Latest security anomaly alerts
                </p>
              </div>

              <button
                className="green-dash-link-btn"
                onClick={() => navigate('/alerts')}
              >
                View All Alerts ({stats?.totalAlerts ?? 0}) →
              </button>
            </div>

            {recentAlertsList.length > 0 ? (
              <div className="green-dash-alerts-list">
                {recentAlertsList.map((alt) => {
                  const alertName = alt.title || alt.event || 'Unusual Activity';
                  const isResolved = alt.status === 'resolved';
                  const statusText = isResolved ? 'Resolved' : 'Active';
                  const dateStr = alt.detectedAt || alt.createdAt
                    ? new Date(alt.detectedAt || alt.createdAt).toLocaleDateString()
                    : 'Recent';

                  return (
                    <div
                      key={alt.id || alt._id}
                      className="green-dash-alert-item"
                      onClick={() => navigate('/alerts')}
                      title="Click to view alert"
                    >
                      <div className="alert-item-header">
                        <span className={`green-dash-badge ${isResolved ? 'clean' : 'sev-high'}`}>
                          {statusText}
                        </span>
                        <span className="alert-item-time">{dateStr}</span>
                      </div>

                      <h4 className="alert-item-title">{alertName}</h4>

                      <div className="alert-item-footer">
                        <span className="alert-source-tag">
                          Status: <strong>{statusText}</strong> &bull; Date: {dateStr}
                        </span>
                        <span className="alert-view-link">View Alert →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="green-dash-empty-state">
                <span className="empty-icon">🛡️</span>
                <p>No alerts recorded</p>
                <span className="empty-sub">Anomalies detected in logs will appear here</span>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
