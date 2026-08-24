import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { formatTimeAgo, getTypeLabel } from '../utils/helpers';
import './Reports.css';

const getSeverityConfig = (severity) => {
  switch (severity) {
    case 'critical':
      return { label: 'CRITICAL', className: 'rpt-sev-critical', color: 'var(--ds-danger)' };
    case 'high':
      return { label: 'HIGH', className: 'rpt-sev-high', color: 'var(--ds-warning)' };
    case 'medium':
      return { label: 'MEDIUM', className: 'rpt-sev-medium', color: 'var(--ds-blue)' };
    case 'low':
      return { label: 'LOW', className: 'rpt-sev-low', color: 'var(--ds-success)' };
    case 'none':
      return { label: 'NONE', className: 'rpt-sev-none', color: 'var(--ds-severity-none)' };
    default:
      return { label: '--', className: '', color: 'var(--ds-severity-none)' };
  }
};

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/reports/summary');
      setData(res.data);
    } catch (err) {
      setError('Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = useCallback(async (format) => {
    try {
      setExporting(true);
      const res = await api.get(`/reports/export?format=${format}`, {
        responseType: format === 'csv' ? 'text' : 'blob',
      });

      const content = format === 'csv' ? res.data : JSON.stringify(res.data, null, 2);
      const blob = new Blob([content], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `security-report.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      // silent
    } finally {
      setExporting(false);
    }
  }, []);

  const summary = data?.summary;
  const threatTypes = data?.threatTypes || [];
  const recentAlerts = data?.recentAlerts || [];
  const recentLogs = data?.recentLogs || [];
  const trend = data?.trend || [];
  const logSeverity = data?.logSeverity || {};

  const maxTrendAlerts = Math.max(...trend.map((t) => t.alerts), 1);

  const now = new Date();
  const timestamp = now.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="rpt-content">
      <div className="rpt-header">
        <div className="rpt-header-text">
          <h1>Security Reports</h1>
          <p>Comprehensive security analysis and incident reporting</p>
          <span className="rpt-timestamp">{timestamp}</span>
        </div>
        <div className="rpt-export-actions">
          <button
            className="rpt-export-btn"
            disabled={loading || exporting}
            onClick={() => handleExport('json')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {exporting ? 'Exporting...' : 'Export JSON'}
          </button>
          <button
            className="rpt-export-btn rpt-export-csv"
            disabled={loading || exporting}
            onClick={() => handleExport('csv')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rpt-loading">
          <span className="rpt-spinner" />
          <p>Loading report data...</p>
        </div>
      ) : error ? (
        <div className="rpt-error">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          <p>{error}</p>
          <button className="rpt-retry-btn" onClick={fetchReport}>Retry</button>
        </div>
      ) : !data || !summary || (!summary.totalLogs && !summary.totalAlerts) ? (
        <div className="rpt-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <h3>No Report Data Available</h3>
          <p>Upload and analyze log files to generate security reports.</p>
        </div>
      ) : (
        <>
          <div className="rpt-summary-grid">
            <div className="rpt-summary-card rpt-card-total-logs">
              <div className="rpt-summary-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div className="rpt-summary-info">
                <span className="rpt-summary-value">{summary.totalLogs}</span>
                <span className="rpt-summary-label">Total Logs</span>
              </div>
              <div className="rpt-summary-detail">{summary.analyzedLogs} analyzed</div>
            </div>

            <div className="rpt-summary-card rpt-card-total-alerts">
              <div className="rpt-summary-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <div className="rpt-summary-info">
                <span className="rpt-summary-value">{summary.totalAlerts}</span>
                <span className="rpt-summary-label">Total Alerts</span>
              </div>
              <div className="rpt-summary-detail">{summary.activeAlerts} active</div>
            </div>

            <div className="rpt-summary-card rpt-card-anomalies">
              <div className="rpt-summary-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="rpt-summary-info">
                <span className="rpt-summary-value">{summary.anomalyLogs}</span>
                <span className="rpt-summary-label">Anomalies Detected</span>
              </div>
              <div className="rpt-summary-detail">
                {summary.totalLogs > 0 ? ((summary.anomalyLogs / summary.totalLogs) * 100).toFixed(1) : 0}% rate
              </div>
            </div>

            <div className="rpt-summary-card rpt-card-resolved">
              <div className="rpt-summary-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="rpt-summary-info">
                <span className="rpt-summary-value">{summary.resolvedAlerts}</span>
                <span className="rpt-summary-label">Resolved</span>
              </div>
              <div className="rpt-summary-detail">{summary.investigatingAlerts} investigating</div>
            </div>
          </div>

          <div className="rpt-severity-row">
            <div className="rpt-severity-card">
              <h3>Alert Severity Distribution</h3>
              <div className="rpt-severity-bars">
                {[
                  { label: 'Critical', value: summary.criticalAlerts, color: 'var(--ds-danger)' },
                  { label: 'High', value: summary.highAlerts, color: 'var(--ds-warning)' },
                  { label: 'Medium', value: summary.mediumAlerts, color: 'var(--ds-blue)' },
                  { label: 'Low', value: summary.lowAlerts, color: 'var(--ds-success)' },
                ].map((s) => (
                  <div key={s.label} className="rpt-sev-bar-row">
                    <div className="rpt-sev-bar-header">
                      <span className="rpt-sev-bar-label">{s.label}</span>
                      <span className="rpt-sev-bar-value" style={{ color: s.color }}>{s.value}</span>
                    </div>
                    <div className="rpt-sev-bar-track">
                      <div
                        className="rpt-sev-bar-fill"
                        style={{
                          width: `${summary.totalAlerts > 0 ? (s.value / summary.totalAlerts) * 100 : 0}%`,
                          background: s.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rpt-severity-card">
              <h3>Log Severity Distribution</h3>
              <div className="rpt-severity-bars">
                {[
                  { label: 'Critical', value: logSeverity.critical || 0, color: 'var(--ds-danger)' },
                  { label: 'High', value: logSeverity.high || 0, color: 'var(--ds-warning)' },
                  { label: 'Medium', value: logSeverity.medium || 0, color: 'var(--ds-blue)' },
                  { label: 'Low', value: logSeverity.low || 0, color: 'var(--ds-success)' },
                  { label: 'None', value: logSeverity.none || 0, color: 'var(--ds-severity-none)' },
                ].map((s) => {
                  const totalSev = Object.values(logSeverity).reduce((a, b) => a + b, 0);
                  return (
                    <div key={s.label} className="rpt-sev-bar-row">
                      <div className="rpt-sev-bar-header">
                        <span className="rpt-sev-bar-label">{s.label}</span>
                        <span className="rpt-sev-bar-value" style={{ color: s.color }}>{s.value}</span>
                      </div>
                      <div className="rpt-sev-bar-track">
                        <div
                          className="rpt-sev-bar-fill"
                          style={{
                            width: `${totalSev > 0 ? (s.value / totalSev) * 100 : 0}%`,
                            background: s.color,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rpt-charts-row">
            {trend.length > 0 && (
              <div className="rpt-chart-card">
                <div className="rpt-chart-header">
                  <h3>Alert Trend</h3>
                  <span>Over time</span>
                </div>
                <div className="rpt-trend-chart">
                  <svg viewBox={`0 0 ${Math.max(trend.length * 40, 200)} 120`} className="rpt-trend-svg">
                    {trend.map((t, i) => {
                      const barHeight = (t.alerts / maxTrendAlerts) * 80;
                      const x = i * 40 + 10;
                      return (
                        <g key={t.date}>
                          <rect
                            x={x}
                            y={100 - barHeight}
                            width="24"
                            height={barHeight}
                            rx="3"
                            fill="url(#rptBarGrad)"
                            className="rpt-trend-bar"
                            style={{ animationDelay: `${i * 0.05}s` }}
                          />
                          <text x={x + 12} y={96 - barHeight} textAnchor="middle" style={{ fill: 'var(--ds-text-muted-strong)', fontSize: '9px' }}>
                            {t.alerts}
                          </text>
                          <text x={x + 12} y={114} textAnchor="middle" style={{ fill: 'var(--ds-text-muted)', fontSize: '7px' }}>
                            {t.date.slice(5)}
                          </text>
                        </g>
                      );
                    })}
                    <defs>
                      <linearGradient id="rptBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" style={{ stopColor: 'var(--ds-indigo)' }} />
                        <stop offset="100%" style={{ stopColor: 'var(--ds-blue)' }} />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            )}

            <div className="rpt-chart-card">
              <div className="rpt-chart-header">
                <h3>Threat Type Breakdown</h3>
                <span>By frequency</span>
              </div>
              {threatTypes.length > 0 ? (
                <div className="rpt-threat-types">
                  {threatTypes.map((t) => {
                    const maxCount = threatTypes[0]?.count || 1;
                    return (
                      <div key={t.type} className="rpt-threat-row">
                        <div className="rpt-threat-header">
                          <span className="rpt-threat-label">{getTypeLabel(t.type)}</span>
                          <span className="rpt-threat-count">{t.count}</span>
                        </div>
                        <div className="rpt-threat-bar-track">
                          <div
                            className="rpt-threat-bar-fill"
                            style={{ width: `${(t.count / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rpt-no-data">
                  <p>No threat types recorded yet.</p>
                </div>
              )}
            </div>
          </div>

          <div className="rpt-bottom-row">
            <div className="rpt-activity-card">
              <div className="rpt-chart-header">
                <h3>Recent Alerts</h3>
                {recentAlerts.length > 0 && <span>{recentAlerts.length} latest</span>}
              </div>
              {recentAlerts.length > 0 ? (
                <div className="rpt-alert-list">
                  {recentAlerts.map((alert) => {
                    const sev = getSeverityConfig(alert.severity);
                    return (
                      <div key={alert._id} className="rpt-alert-item">
                        <div className="rpt-alert-sev-dot" style={{ background: sev.color }} />
                        <div className="rpt-alert-info">
                          <span className="rpt-alert-title">{alert.title}</span>
                          <div className="rpt-alert-meta">
                            <span className={`rpt-alert-sev-badge ${sev.className}`}>{sev.label}</span>
                            <span className="rpt-alert-type">{getTypeLabel(alert.type)}</span>
                            <span className="rpt-alert-time">{formatTimeAgo(alert.detectedAt)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rpt-no-data">
                  <p>No security alerts recorded yet.</p>
                </div>
              )}
            </div>

            <div className="rpt-activity-card">
              <div className="rpt-chart-header">
                <h3>Recent Log Uploads</h3>
                {recentLogs.length > 0 && <span>{recentLogs.length} latest</span>}
              </div>
              {recentLogs.length > 0 ? (
                <div className="rpt-log-list">
                  {recentLogs.map((log) => (
                    <div key={log._id} className="rpt-log-item">
                      <div className="rpt-log-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div className="rpt-log-info">
                        <span className="rpt-log-name">{log.originalName}</span>
                        <div className="rpt-log-meta">
                          <span className={`rpt-log-status rpt-status-${log.analysisStatus}`}>
                            {log.analysisStatus}
                          </span>
                          {log.isAnomaly !== null && (
                            <span className={`rpt-log-anomaly ${log.isAnomaly ? 'anomaly' : 'normal'}`}>
                              {log.isAnomaly ? 'Anomaly' : 'Normal'}
                            </span>
                          )}
                          <span className="rpt-log-time">{formatTimeAgo(log.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rpt-no-data">
                  <p>No logs uploaded yet.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
