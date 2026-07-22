import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Alerts.css';

const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatTimeAgo = (dateStr) => {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now - d;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const getSeverityConfig = (severity) => {
  switch (severity) {
    case 'critical':
      return { label: 'CRITICAL', className: 'alert-sev-critical', color: '#ef4444' };
    case 'high':
      return { label: 'HIGH', className: 'alert-sev-high', color: '#f59e0b' };
    case 'medium':
      return { label: 'MEDIUM', className: 'alert-sev-medium', color: '#3b82f6' };
    case 'low':
      return { label: 'LOW', className: 'alert-sev-low', color: '#10b981' };
    default:
      return { label: '--', className: '', color: '#6b7280' };
  }
};

const getStatusConfig = (status) => {
  switch (status) {
    case 'new':
      return { label: 'New', className: 'alert-status-new' };
    case 'investigating':
      return { label: 'Investigating', className: 'alert-status-investigating' };
    case 'resolved':
      return { label: 'Resolved', className: 'alert-status-resolved' };
    default:
      return { label: status, className: '' };
  }
};

const getTypeLabel = (type) => {
  switch (type) {
    case 'anomaly': return 'Anomaly Detection';
    case 'brute_force': return 'Brute Force Attack';
    case 'sql_injection': return 'SQL Injection';
    case 'port_scan': return 'Port Scanning';
    case 'high_error_rate': return 'High Error Rate';
    case 'suspicious_activity': return 'Suspicious Activity';
    case 'malware': return 'Malware Detected';
    case 'intrusion': return 'Intrusion Attempt';
    default: return type?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Unknown';
  }
};

const menuItems = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: 'Log Upload',
    path: '/log-upload',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    label: 'ML Analysis',
    path: '/ml-analysis',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z" />
        <circle cx="12" cy="15" r="2" />
      </svg>
    ),
  },
  {
    label: 'Alerts',
    path: '/alerts',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    path: '#',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function Alerts() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeMenu] = useState('Alerts');

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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="alertspg">
      <div className="alertspg-bg">
        <div className="alertspg-orb alertspg-orb-1" />
        <div className="alertspg-orb alertspg-orb-2" />
        <div className="alertspg-grid-overlay" />
      </div>

      <nav className="alertspg-navbar">
        <div className="alertspg-nav-left">
          <button className="alertspg-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="alertspg-brand">
            <div className="alertspg-logo">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="alertspg-title">SecureOps</span>
          </div>
        </div>
        <div className="alertspg-nav-right">
          <div className="alertspg-status">
            <span className="alertspg-status-dot" />
            <span>System Online</span>
          </div>
          <div className="alertspg-user">
            <div className="alertspg-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="alertspg-username">{user?.name || 'Analyst'}</span>
          </div>
          <button className="alertspg-logout" onClick={handleLogout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <div className="alertspg-body">
        {sidebarOpen && <div className="alertspg-overlay" onClick={() => setSidebarOpen(false)} />}
        <aside className={`alertspg-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <nav className="alertspg-sidebar-nav">
            {menuItems.map((item) => (
              <button
                key={item.label}
                className={`alertspg-sidebar-item ${activeMenu === item.label ? 'active' : ''}`}
                onClick={() => {
                  setSidebarOpen(false);
                  if (item.path !== '#') navigate(item.path);
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="alertspg-main">
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

          <div className="alertspg-content">
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
        </main>
      </div>
    </div>
  );
}
