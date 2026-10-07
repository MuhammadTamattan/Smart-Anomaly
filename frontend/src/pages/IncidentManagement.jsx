import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import { formatDate } from '../utils/helpers';
import './IncidentManagement.css';

const SEVERITY_COLORS = {
  critical: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
  high: { bg: '#ffedd5', text: '#9a3412', border: '#fed7aa' },
  medium: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
  low: { bg: '#e0f2fe', text: '#075985', border: '#bae6fd' },
};

const STATUS_CONFIG = {
  open: { label: 'Open', bg: '#fee2e2', text: '#b91c1c' },
  investigating: { label: 'Investigating', bg: '#fef3c7', text: '#b45309' },
  resolved: { label: 'Resolved', bg: '#dcfce7', text: '#15803d' },
};

export default function IncidentManagement() {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState({ total: 0, open: 0, investigating: 0, resolved: 0 });
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  // Modals state
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form state for creating incident
  const [formData, setFormData] = useState({
    selectedAlertId: '',
    title: '',
    type: 'anomaly_detected',
    severity: 'high',
    source: '',
    description: '',
    note: '',
  });

  // Note input for details view
  const [newNoteText, setNewNoteText] = useState('');

  // Fetch incidents & summary stats
  const fetchIncidentsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [incRes, statsRes] = await Promise.all([
        api.get('/incidents'),
        api.get('/incidents/stats'),
      ]);

      if (Array.isArray(incRes.data)) {
        setIncidents(incRes.data);
      }
      if (statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load incidents');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch available alerts for incident escalation
  const fetchAlertsForSelect = useCallback(async () => {
    try {
      const res = await api.get('/alerts');
      if (Array.isArray(res.data)) {
        setAlerts(res.data);
      }
    } catch (err) {
      console.warn('Failed to fetch alerts for selection:', err);
    }
  }, []);

  useEffect(() => {
    fetchIncidentsData();
    fetchAlertsForSelect();
  }, [fetchIncidentsData, fetchAlertsForSelect]);

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const matchesStatus = statusFilter === 'all' || inc.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        inc.title?.toLowerCase().includes(q) ||
        inc.incidentId?.toLowerCase().includes(q) ||
        inc.type?.toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [incidents, statusFilter, searchQuery]);

  // Handle alert selection in Create Incident Modal
  const handleAlertSelectChange = (alertId) => {
    if (!alertId) {
      setFormData({
        selectedAlertId: '',
        title: '',
        type: 'anomaly_detected',
        severity: 'medium',
        source: '',
        description: '',
        note: '',
      });
      return;
    }

    const matched = alerts.find((a) => a._id === alertId);
    if (matched) {
      setFormData({
        selectedAlertId: alertId,
        title: matched.title || '',
        type: matched.type || 'anomaly_detected',
        severity: matched.severity || 'high',
        source: matched.sourceLog?.originalName ? `Log: ${matched.sourceLog.originalName}` : 'Alert System',
        description: matched.description || '',
        note: '',
      });
    }
  };

  // Submit Create Incident
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Incident title is required.');
      return;
    }

    try {
      setActionLoading(true);
      const payload = {
        title: formData.title.trim(),
        type: formData.type,
        severity: formData.severity,
        description: formData.description.trim(),
        source: formData.source.trim(),
        note: formData.note.trim(),
      };

      if (formData.selectedAlertId) {
        payload.alertId = formData.selectedAlertId;
      }

      const res = await api.post('/incidents', payload);
      if (res.data) {
        setCreateModalOpen(false);
        setFormData({
          selectedAlertId: '',
          title: '',
          type: 'anomaly_detected',
          severity: 'high',
          source: '',
          description: '',
          note: '',
        });
        await fetchIncidentsData();
        // Open details of created incident
        setSelectedIncident(res.data);
      }
    } catch (err) {
      alert('Failed to create incident: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // Update Status
  const handleStatusChange = async (incidentId, newStatus) => {
    try {
      setActionLoading(true);
      const res = await api.patch(`/incidents/${incidentId}/status`, { status: newStatus });
      if (res.data) {
        setIncidents((prev) =>
          prev.map((item) => (item._id === incidentId ? res.data : item))
        );
        if (selectedIncident && selectedIncident._id === incidentId) {
          setSelectedIncident(res.data);
        }
        // Refresh stats
        const statsRes = await api.get('/incidents/stats');
        if (statsRes.data) setStats(statsRes.data);
      }
    } catch (err) {
      alert('Failed to update status: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // Add Investigation Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNoteText.trim() || !selectedIncident) return;

    try {
      setActionLoading(true);
      const res = await api.post(`/incidents/${selectedIncident._id}/notes`, {
        text: newNoteText.trim(),
      });
      if (res.data) {
        setSelectedIncident(res.data);
        setIncidents((prev) =>
          prev.map((item) => (item._id === res.data._id ? res.data : item))
        );
        setNewNoteText('');
      }
    } catch (err) {
      alert('Failed to add note: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Incident
  const handleDeleteIncident = async (incidentId) => {
    if (!window.confirm('Are you sure you want to delete this incident record?')) return;

    try {
      setActionLoading(true);
      await api.delete(`/incidents/${incidentId}`);
      setIncidents((prev) => prev.filter((item) => item._id !== incidentId));
      if (selectedIncident && selectedIncident._id === incidentId) {
        setSelectedIncident(null);
      }
      const statsRes = await api.get('/incidents/stats');
      if (statsRes.data) setStats(statsRes.data);
    } catch (err) {
      alert('Failed to delete incident: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="inc-page-root">
      <div className="inc-container">
        {/* Header Bar */}
        <header className="inc-header-bar">
          <div>
            <div className="inc-header-tag">SOC INCIDENT RESPONSE</div>
            <h1 className="inc-header-title">Incident Management</h1>
            <p className="inc-header-desc">
              Track, investigate, and document resolutions for flagged security alerts.
            </p>
          </div>

          <button
            className="inc-create-btn"
            onClick={() => setCreateModalOpen(true)}
          >
            <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span>
            <span>Create Incident</span>
          </button>
        </header>

        {/* Top Summary Cards */}
        <div className="inc-stats-grid">
          <div className="inc-stat-card">
            <span className="inc-stat-label">Total Incidents</span>
            <span className="inc-stat-value">{stats.total || 0}</span>
          </div>

          <div className="inc-stat-card">
            <span className="inc-stat-label">Open</span>
            <span className="inc-stat-value val-open">{stats.open || 0}</span>
          </div>

          <div className="inc-stat-card">
            <span className="inc-stat-label">Investigating</span>
            <span className="inc-stat-value val-investigating">{stats.investigating || 0}</span>
          </div>

          <div className="inc-stat-card">
            <span className="inc-stat-label">Resolved</span>
            <span className="inc-stat-value val-resolved">{stats.resolved || 0}</span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="inc-filter-bar">
          <div className="inc-status-chips">
            {['all', 'open', 'investigating', 'resolved'].map((s) => (
              <button
                key={s}
                className={`inc-chip-btn ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="inc-search-box">
            <input
              type="text"
              placeholder="Search by title, ID, or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="inc-search-input"
            />
          </div>
        </div>

        {/* Error notice if any */}
        {error && (
          <div className="inc-error-banner">
            <span>⚠️ {error}</span>
            <button onClick={fetchIncidentsData} className="inc-retry-btn">
              Retry
            </button>
          </div>
        )}

        {/* Incidents Table Card */}
        <div className="inc-table-card">
          {loading ? (
            <div className="inc-loading-state">
              <div className="inc-spinner" />
              <span>Loading incident records...</span>
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="inc-empty-state">
              <div className="inc-empty-icon">📋</div>
              <h3>No Incidents Found</h3>
              <p>
                {searchQuery || statusFilter !== 'all'
                  ? 'No incidents match your current search/filter criteria.'
                  : 'No active incident investigations yet. You can escalate an alert to an incident anytime.'}
              </p>
              <button
                className="inc-chip-btn active"
                style={{ marginTop: '8px' }}
                onClick={() => setCreateModalOpen(true)}
              >
                + Create First Incident
              </button>
            </div>
          ) : (
            <div className="inc-table-wrapper">
              <table className="inc-table">
                <thead>
                  <tr>
                    <th>INCIDENT ID</th>
                    <th>TITLE</th>
                    <th>TYPE</th>
                    <th>SEVERITY</th>
                    <th>STATUS</th>
                    <th>CREATED DATE</th>
                    <th style={{ textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncidents.map((inc) => {
                    const sevStyle = SEVERITY_COLORS[inc.severity] || SEVERITY_COLORS.medium;
                    const statStyle = STATUS_CONFIG[inc.status] || STATUS_CONFIG.open;

                    return (
                      <tr key={inc._id} className="inc-table-row">
                        <td className="inc-id-cell">
                          <span className="inc-id-tag">{inc.incidentId || 'INC-1000'}</span>
                        </td>
                        <td className="inc-title-cell">
                          <div className="inc-title-text" title={inc.title}>{inc.title}</div>
                          {inc.source && <span className="inc-source-sub">{inc.source}</span>}
                        </td>
                        <td>
                          <span className="inc-type-badge">
                            {inc.type?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>
                          <span
                            className="inc-sev-badge"
                            style={{
                              backgroundColor: sevStyle.bg,
                              color: sevStyle.text,
                              borderColor: sevStyle.border,
                            }}
                          >
                            {inc.severity?.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span
                            className="inc-status-badge"
                            style={{
                              backgroundColor: statStyle.bg,
                              color: statStyle.text,
                            }}
                          >
                            {statStyle.label}
                          </span>
                        </td>
                        <td className="inc-date-cell">
                          {formatDate(inc.createdAt)}
                        </td>
                        <td className="inc-actions-cell">
                          <button
                            className="inc-action-btn view-btn"
                            onClick={() => setSelectedIncident(inc)}
                            title="View Incident Details"
                          >
                            View
                          </button>
                          <button
                            className="inc-action-btn del-btn"
                            onClick={() => handleDeleteIncident(inc._id)}
                            title="Delete Incident"
                            disabled={actionLoading}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================================
          INCIDENT DETAILS MODAL
         ====================================================================== */}
      {selectedIncident && (
        <div className="inc-modal-backdrop" onClick={() => setSelectedIncident(null)}>
          <div className="inc-modal-box" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="inc-modal-header">
              <div>
                <div className="inc-modal-tag">{selectedIncident.incidentId}</div>
                <h2 className="inc-modal-title">{selectedIncident.title}</h2>
              </div>
              <button
                className="inc-modal-close-btn"
                onClick={() => setSelectedIncident(null)}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="inc-modal-body">
              {/* Meta Grid */}
              <div className="inc-detail-meta-grid">
                <div className="inc-meta-field">
                  <span className="inc-field-label">Status</span>
                  <div className="inc-status-switcher">
                    {['open', 'investigating', 'resolved'].map((st) => (
                      <button
                        key={st}
                        className={`inc-status-toggle-btn ${selectedIncident.status === st ? 'active' : ''}`}
                        onClick={() => handleStatusChange(selectedIncident._id, st)}
                        disabled={actionLoading}
                      >
                        {st.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="inc-meta-field">
                  <span className="inc-field-label">Severity</span>
                  <span
                    className="inc-sev-badge"
                    style={{
                      alignSelf: 'flex-start',
                      backgroundColor: SEVERITY_COLORS[selectedIncident.severity]?.bg,
                      color: SEVERITY_COLORS[selectedIncident.severity]?.text,
                    }}
                  >
                    {selectedIncident.severity?.toUpperCase()}
                  </span>
                </div>

                <div className="inc-meta-field">
                  <span className="inc-field-label">Threat Type</span>
                  <span className="inc-meta-val">{selectedIncident.type?.replace(/_/g, ' ')}</span>
                </div>

                <div className="inc-meta-field">
                  <span className="inc-field-label">Source</span>
                  <span className="inc-meta-val">{selectedIncident.source || 'Internal Telemetry'}</span>
                </div>

                <div className="inc-meta-field">
                  <span className="inc-field-label">Created At</span>
                  <span className="inc-meta-val">{formatDate(selectedIncident.createdAt)}</span>
                </div>

                <div className="inc-meta-field">
                  <span className="inc-field-label">Last Updated</span>
                  <span className="inc-meta-val">{formatDate(selectedIncident.updatedAt)}</span>
                </div>
              </div>

              {/* Description */}
              <div className="inc-section-block">
                <span className="inc-field-label">Description</span>
                <p className="inc-desc-text">
                  {selectedIncident.description || 'No description provided.'}
                </p>
              </div>

              {/* Related Alert Information if exists */}
              {selectedIncident.relatedAlert && (
                <div className="inc-alert-box">
                  <span className="inc-field-label">ORIGINATING SECURITY ALERT:</span>
                  <div className="inc-alert-inner">
                    <span className="inc-alert-title">
                      {selectedIncident.relatedAlert.title || 'Linked Alert'}
                    </span>
                    {selectedIncident.anomalyScore !== null && (
                      <span className="inc-alert-score">
                        Anomaly Score: {Number(selectedIncident.anomalyScore).toFixed(3)}
                      </span>
                    )}
                  </div>
                  {selectedIncident.indicators && selectedIncident.indicators.length > 0 && (
                    <div className="inc-indicators-list">
                      {selectedIncident.indicators.map((ind, i) => (
                        <span key={i} className="inc-indicator-tag">
                          {ind}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Investigation Notes Feed */}
              <div className="inc-notes-section">
                <span className="inc-field-label">INVESTIGATION NOTES & LOGS:</span>

                <div className="inc-notes-feed">
                  {(!selectedIncident.notes || selectedIncident.notes.length === 0) ? (
                    <p className="inc-no-notes">No notes added yet.</p>
                  ) : (
                    selectedIncident.notes.map((n, idx) => (
                      <div key={n._id || idx} className="inc-note-card">
                        <div className="inc-note-header">
                          <span className="inc-note-author">{n.authorName || 'Admin'}</span>
                          <span className="inc-note-date">{formatDate(n.createdAt)}</span>
                        </div>
                        <p className="inc-note-text">{n.text}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Note Form */}
                <form className="inc-add-note-form" onSubmit={handleAddNote}>
                  <input
                    type="text"
                    placeholder="Add an investigation note or mitigation step..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="inc-note-input"
                    disabled={actionLoading}
                  />
                  <button
                    type="submit"
                    className="inc-add-note-btn"
                    disabled={!newNoteText.trim() || actionLoading}
                  >
                    Add Note
                  </button>
                </form>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="inc-modal-footer">
              <button
                className="inc-modal-secondary-btn"
                onClick={() => setSelectedIncident(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          CREATE INCIDENT MODAL
         ====================================================================== */}
      {createModalOpen && (
        <div className="inc-modal-backdrop" onClick={() => setCreateModalOpen(false)}>
          <div className="inc-modal-box create-box" onClick={(e) => e.stopPropagation()}>
            <div className="inc-modal-header">
              <h2 className="inc-modal-title">Create Security Incident</h2>
              <button
                className="inc-modal-close-btn"
                onClick={() => setCreateModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="inc-form">
              <div className="inc-form-group">
                <label className="inc-label">Escalate from Existing Alert (Optional):</label>
                <select
                  value={formData.selectedAlertId}
                  onChange={(e) => handleAlertSelectChange(e.target.value)}
                  className="inc-select"
                >
                  <option value="">-- None (Create Manual Incident) --</option>
                  {alerts.map((alt) => (
                    <option key={alt._id} value={alt._id}>
                      [{alt.severity?.toUpperCase()}] {alt.title} ({alt.type})
                    </option>
                  ))}
                </select>
                <span className="inc-hint">
                  Selecting an alert automatically fills incident title, severity, threat type, and source.
                </span>
              </div>

              <div className="inc-form-group">
                <label className="inc-label">Incident Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Repeated SSH Brute Force on Production Cluster"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="inc-input"
                />
              </div>

              <div className="inc-form-row">
                <div className="inc-form-group" style={{ flex: 1 }}>
                  <label className="inc-label">Severity</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="inc-select"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div className="inc-form-group" style={{ flex: 1 }}>
                  <label className="inc-label">Threat / Attack Type</label>
                  <input
                    type="text"
                    placeholder="e.g. brute_force, sql_injection"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="inc-input"
                  />
                </div>
              </div>

              <div className="inc-form-group">
                <label className="inc-label">Source Telemetry / Location</label>
                <input
                  type="text"
                  placeholder="e.g. Log Stream: auth-audit.log, Port 443"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="inc-input"
                />
              </div>

              <div className="inc-form-group">
                <label className="inc-label">Description</label>
                <textarea
                  rows="3"
                  placeholder="Briefly describe the incident impact and symptoms..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="inc-textarea"
                />
              </div>

              <div className="inc-form-group">
                <label className="inc-label">Initial Investigation Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Blocked offending IP range at edge router."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  className="inc-input"
                />
              </div>

              <div className="inc-modal-footer" style={{ marginTop: '12px', padding: 0 }}>
                <button
                  type="button"
                  className="inc-modal-secondary-btn"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inc-create-btn"
                  disabled={actionLoading || !formData.title.trim()}
                >
                  {actionLoading ? 'Creating...' : 'Create Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
