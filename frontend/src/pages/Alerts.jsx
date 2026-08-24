import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { formatDate, formatTimeAgo, getTypeLabel } from '../utils/helpers';
import './Alerts.css';

const getSeverityConfig = (severity) => {
  switch (severity) {
    case 'critical':
      return { label: 'CRITICAL', className: 'alertspg-sev-critical', color: 'var(--ds-severity-critical)' };
    case 'high':
      return { label: 'HIGH', className: 'alertspg-sev-high', color: 'var(--ds-severity-high)' };
    case 'medium':
      return { label: 'MEDIUM', className: 'alertspg-sev-medium', color: 'var(--ds-severity-medium)' };
    case 'low':
      return { label: 'LOW', className: 'alertspg-sev-low', color: 'var(--ds-severity-low)' };
    default:
      return { label: '--', className: '', color: 'var(--ds-severity-none)' };
  }
};

const getStatusConfig = (status) => {
  switch (status) {
    case 'new':
      return { label: 'New', className: 'alertspg-status-new' };
    case 'investigating':
      return { label: 'Investigating', className: 'alertspg-status-investigating' };
    case 'resolved':
      return { label: 'Resolved', className: 'alertspg-status-resolved' };
    default:
      return { label: status, className: '' };
  }
};

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedAlert, setSelectedAlert] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  const [stats, setStats] = useState({ total: 0, critical: 0, high: 0, newCount: 0, investigating: 0, resolved: 0 });

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/alerts');
      setAlerts(res.data);

      const s = { total: res.data.length, critical: 0, high: 0, newCount: 0, investigating: 0, resolved: 0 };
      res.data.forEach((a) => {
        if (a.severity === 'critical') s.critical++;
        if (a.severity === 'high') s.high++;
        if (a.status === 'new') s.newCount++;
        if (a.status === 'investigating') s.investigating++;
        if (a.status === 'resolved') s.resolved++;
      });
      setStats(s);
    } catch (err) {
      setError('Failed to load alerts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = useCallback(async (alertId, newStatus) => {
    try {
      setUpdatingId(alertId);
      await api.patch(`/alerts/${alertId}/status`, { status: newStatus });
      setAlerts((prev) =>
        prev.map((a) =>
          a._id === alertId
            ? { ...a, status: newStatus, resolvedAt: newStatus === 'resolved' ? new Date().toISOString() : a.resolvedAt }
            : a
        )
      );
      if (selectedAlert?._id === alertId) {
        setSelectedAlert((prev) =>
          prev ? { ...prev, status: newStatus, resolvedAt: newStatus === 'resolved' ? new Date().toISOString() : prev.resolvedAt } : prev
        );
      }
      setStats((prev) => {
        const s = { ...prev };
        const alert = alerts.find((a) => a._id === alertId);
        if (alert) {
          if (alert.status === 'new') s.newCount--;
          if (alert.status === 'investigating') s.investigating--;
          if (alert.status === 'resolved') s.resolved--;
          if (newStatus === 'new') s.newCount++;
          if (newStatus === 'investigating') s.investigating++;
          if (newStatus === 'resolved') s.resolved++;
        }
        return s;
      });
    } catch (err) {
      // silent
    } finally {
      setUpdatingId(null);
    }
  }, [alerts, selectedAlert]);

  const handleDelete = useCallback(async (alertId) => {
    try {
      await api.delete(`/alerts/${alertId}`);
      setAlerts((prev) => prev.filter((a) => a._id !== alertId));
      if (selectedAlert?._id === alertId) setSelectedAlert(null);
      setStats((prev) => ({ ...prev, total: prev.total - 1 }));
    } catch (err) {
      // silent
    }
  }, [selectedAlert]);

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="alertspg-content">
      <div className="alertspg-header">
        <h1>Security Alerts</h1>
        <p>Monitor and manage security incidents detected by the ML analysis engine</p>
      </div>

      <div className="alertspg-stats">
        <div className="alertspg-stat-card">
          <div className="alertspg-stat-icon alertspg-stat-total">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div className="alertspg-stat-info">
            <span className="alertspg-stat-value">{stats.total}</span>
            <span className="alertspg-stat-label">Total Alerts</span>
          </div>
        </div>
        <div className="alertspg-stat-card">
          <div className="alertspg-stat-icon alertspg-stat-critical">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div className="alertspg-stat-info">
            <span className="alertspg-stat-value">{stats.critical}</span>
            <span className="alertspg-stat-label">Critical</span>
          </div>
        </div>
        <div className="alertspg-stat-card">
          <div className="alertspg-stat-icon alertspg-stat-high">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="alertspg-stat-info">
            <span className="alertspg-stat-value">{stats.high}</span>
            <span className="alertspg-stat-label">High</span>
          </div>
        </div>
        <div className="alertspg-stat-card">
          <div className="alertspg-stat-icon alertspg-stat-investigating">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <div className="alertspg-stat-info">
            <span className="alertspg-stat-value">{stats.investigating}</span>
            <span className="alertspg-stat-label">Investigating</span>
          </div>
        </div>
        <div className="alertspg-stat-card">
          <div className="alertspg-stat-icon alertspg-stat-resolved">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="alertspg-stat-info">
            <span className="alertspg-stat-value">{stats.resolved}</span>
            <span className="alertspg-stat-label">Resolved</span>
          </div>
        </div>
      </div>

      <div className="alertspg-toolbar">
        <div className="alertspg-filters">
          <div className="alertspg-filter-group">
            <label>Severity</label>
            <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="alertspg-filter-group">
            <label>Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
        <span className="alertspg-result-count">{filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="alertspg-layout">
        <div className="alertspg-list-panel">
          {loading ? (
            <div className="alertspg-loading">
              <span className="alertspg-spinner" />
            </div>
          ) : error ? (
            <div className="alertspg-error-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span>{error}</span>
              <button onClick={fetchAlerts}>Retry</button>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="alertspg-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <p>No alerts found</p>
              <span>{severityFilter !== 'all' || statusFilter !== 'all' ? 'Try adjusting your filters.' : 'Alerts will appear here when anomalies are detected.'}</span>
            </div>
          ) : (
            <div className="alertspg-list">
              {filteredAlerts.map((alert) => {
                const sev = getSeverityConfig(alert.severity);
                const stat = getStatusConfig(alert.status);
                const isSelected = selectedAlert?._id === alert._id;
                return (
                  <button
                    key={alert._id}
                    className={`alertspg-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <div className="alertspg-item-sev" style={{ background: `${sev.color}18`, borderColor: `${sev.color}30` }}>
                      <span className="alertspg-item-sev-dot" style={{ background: sev.color }} />
                    </div>
                    <div className="alertspg-item-body">
                      <div className="alertspg-item-top">
                        <span className="alertspg-item-title">{alert.title}</span>
                        <span className={`alertspg-item-status ${stat.className}`}>{stat.label}</span>
                      </div>
                      <div className="alertspg-item-meta">
                        <span className={`alertspg-item-sev-label ${sev.className}`}>{sev.label}</span>
                        <span className="alertspg-item-type">{getTypeLabel(alert.type)}</span>
                        <span className="alertspg-item-time">{formatTimeAgo(alert.detectedAt)}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="alertspg-detail-panel">
          {selectedAlert ? (
            <>
              <div className="alertspg-detail-header">
                <h2>Alert Details</h2>
                <button className="alertspg-detail-close" onClick={() => setSelectedAlert(null)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="alertspg-detail-sev-banner" style={{ borderColor: getSeverityConfig(selectedAlert.severity).color + '40' }}>
                <span className="alertspg-detail-sev-dot" style={{ background: getSeverityConfig(selectedAlert.severity).color }} />
                <span className={`alertspg-detail-sev-label ${getSeverityConfig(selectedAlert.severity).className}`}>
                  {getSeverityConfig(selectedAlert.severity).label} SEVERITY
                </span>
              </div>

              <div className="alertspg-detail-section">
                <h3>{selectedAlert.title}</h3>
                <p>{selectedAlert.description}</p>
              </div>

              <div className="alertspg-detail-grid">
                <div className="alertspg-detail-field">
                  <span className="alertspg-detail-field-label">Type</span>
                  <span className="alertspg-detail-field-value">{getTypeLabel(selectedAlert.type)}</span>
                </div>
                <div className="alertspg-detail-field">
                  <span className="alertspg-detail-field-label">Status</span>
                  <span className={`alertspg-detail-field-value ${getStatusConfig(selectedAlert.status).className}`}>
                    {getStatusConfig(selectedAlert.status).label}
                  </span>
                </div>
                <div className="alertspg-detail-field">
                  <span className="alertspg-detail-field-label">Anomaly Score</span>
                  <span className="alertspg-detail-field-value alertspg-mono">{selectedAlert.anomalyScore?.toFixed(4) || '--'}</span>
                </div>
                <div className="alertspg-detail-field">
                  <span className="alertspg-detail-field-label">Detected At</span>
                  <span className="alertspg-detail-field-value">{formatDate(selectedAlert.detectedAt)}</span>
                </div>
                {selectedAlert.resolvedAt && (
                  <div className="alertspg-detail-field">
                    <span className="alertspg-detail-field-label">Resolved At</span>
                    <span className="alertspg-detail-field-value">{formatDate(selectedAlert.resolvedAt)}</span>
                  </div>
                )}
                {selectedAlert.sourceLog && (
                  <div className="alertspg-detail-field">
                    <span className="alertspg-detail-field-label">Source Log</span>
                    <span className="alertspg-detail-field-value">{selectedAlert.sourceLog.originalName || selectedAlert.sourceLog}</span>
                  </div>
                )}
              </div>

              {selectedAlert.indicators && selectedAlert.indicators.length > 0 && (
                <div className="alertspg-detail-section">
                  <h4>Indicators</h4>
                  <div className="alertspg-indicators">
                    {selectedAlert.indicators.map((ind, i) => (
                      <div key={i} className="alertspg-indicator-item">
                        <span className="alertspg-indicator-key">{ind.name || ind.indicator || ind}</span>
                        {ind.value !== undefined && <span className="alertspg-indicator-val">{String(ind.value)}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="alertspg-detail-actions">
                {selectedAlert.status === 'new' && (
                  <button
                    className="alertspg-action-btn alertspg-action-investigate"
                    disabled={updatingId === selectedAlert._id}
                    onClick={() => handleUpdateStatus(selectedAlert._id, 'investigating')}
                  >
                    {updatingId === selectedAlert._id ? <span className="alertspg-spinner-sm" /> : 'Begin Investigation'}
                  </button>
                )}
                {selectedAlert.status === 'investigating' && (
                  <button
                    className="alertspg-action-btn alertspg-action-resolve"
                    disabled={updatingId === selectedAlert._id}
                    onClick={() => handleUpdateStatus(selectedAlert._id, 'resolved')}
                  >
                    {updatingId === selectedAlert._id ? <span className="alertspg-spinner-sm" /> : 'Mark Resolved'}
                  </button>
                )}
                {selectedAlert.status === 'resolved' && (
                  <button
                    className="alertspg-action-btn alertspg-action-reopen"
                    disabled={updatingId === selectedAlert._id}
                    onClick={() => handleUpdateStatus(selectedAlert._id, 'new')}
                  >
                    {updatingId === selectedAlert._id ? <span className="alertspg-spinner-sm" /> : 'Reopen Alert'}
                  </button>
                )}
                <button
                  className="alertspg-action-btn alertspg-action-delete"
                  disabled={updatingId === selectedAlert._id}
                  onClick={() => handleDelete(selectedAlert._id)}
                >
                  Delete
                </button>
              </div>
            </>
          ) : (
            <div className="alertspg-detail-placeholder">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
              <h3>Select an Alert</h3>
              <p>Click on an alert from the list to view its details and take action.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
