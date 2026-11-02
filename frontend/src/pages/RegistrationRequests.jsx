import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './RegistrationRequests.css';

export default function RegistrationRequests() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedback, setFeedback] = useState(null); // { message, type: 'success' | 'error' }
  const [activeFilter, setActiveFilter] = useState('pending'); // 'pending' | 'all' | 'approved' | 'rejected'
  const [searchQuery, setSearchQuery] = useState('');

  // Access guard: strictly authenticated Main Admin only
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/registration-requests');
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setFeedback({
        message: err.response?.data?.message || 'Failed to load registration requests.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (id, name, email) => {
    try {
      setActionLoadingId(id);
      const res = await api.patch(`/auth/registration-requests/${id}/approve`);
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: 'approved' } : r))
      );
      setFeedback({
        message: res.data?.message || `Account for ${name} (${email}) approved successfully.`,
        type: 'success',
      });
    } catch (err) {
      setFeedback({
        message: err.response?.data?.message || 'Failed to approve registration request.',
        type: 'error',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (id, name, email) => {
    try {
      setActionLoadingId(id);
      const res = await api.patch(`/auth/registration-requests/${id}/reject`);
      setRequests((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: 'rejected' } : r))
      );
      setFeedback({
        message: res.data?.message || `Account registration for ${name} (${email}) was rejected.`,
        type: 'success',
      });
    } catch (err) {
      setFeedback({
        message: err.response?.data?.message || 'Failed to reject registration request.',
        type: 'error',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  // Stats Breakdown
  const stats = useMemo(() => {
    const pending = requests.filter((r) => r.status === 'pending').length;
    const approved = requests.filter((r) => r.status === 'approved').length;
    const rejected = requests.filter((r) => r.status === 'rejected').length;
    return { pending, approved, rejected, total: requests.length };
  }, [requests]);

  // Filtered requests list
  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      // Filter by tab
      if (activeFilter === 'pending' && item.status !== 'pending') return false;
      if (activeFilter === 'approved' && item.status !== 'approved') return false;
      if (activeFilter === 'rejected' && item.status !== 'rejected') return false;

      // Filter by search text
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name?.toLowerCase().includes(q);
        const matchesEmail = item.email?.toLowerCase().includes(q);
        return matchesName || matchesEmail;
      }
      return true;
    });
  }, [requests, activeFilter, searchQuery]);

  return (
    <div className="req-page-root">
      <div className="req-container">
        {/* HEADER BAR */}
        <header className="req-header-bar">
          <div>
            <div className="req-header-tag">
              <span className="req-pulse-dot" />
              <span>ACCESS CONTROL & GOVERNANCE</span>
            </div>
            <h1 className="req-header-title">Registration Requests</h1>
            <p className="req-header-sub">
              Admin-controlled authorization queue. Review, approve, or reject new user registrations before access is granted.
            </p>
          </div>

          <div className="req-header-actions">
            <button
              type="button"
              className="req-refresh-btn"
              onClick={fetchRequests}
              disabled={loading}
              title="Refresh requests list"
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
              </svg>
              <span>{loading ? 'Refreshing...' : 'Refresh Queue'}</span>
            </button>
          </div>
        </header>

        {/* FEEDBACK BANNER */}
        {feedback && (
          <div className={`req-alert-banner ${feedback.type}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {feedback.type === 'success' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              className="req-alert-close"
              onClick={() => setFeedback(null)}
              aria-label="Dismiss alert"
            >
              &times;
            </button>
          </div>
        )}

        {/* STATS OVERVIEW CARDS */}
        <section className="req-stats-grid" aria-label="Registration Statistics">
          <div className="req-stat-card">
            <div className="req-stat-icon-wrap amber">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div>
              <div className="req-stat-val">{stats.pending}</div>
              <div className="req-stat-label">Pending Approval</div>
            </div>
          </div>

          <div className="req-stat-card">
            <div className="req-stat-icon-wrap mint">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <polyline points="17 11 19 13 23 9" />
              </svg>
            </div>
            <div>
              <div className="req-stat-val">{stats.approved}</div>
              <div className="req-stat-label">Approved Accounts</div>
            </div>
          </div>

          <div className="req-stat-card">
            <div className="req-stat-icon-wrap rose">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div>
              <div className="req-stat-val">{stats.rejected}</div>
              <div className="req-stat-label">Rejected Requests</div>
            </div>
          </div>
        </section>

        {/* CONTROLS ROW: TABS & SEARCH */}
        <div className="req-controls-row">
          <div className="req-tabs-list" role="tablist">
            <button
              type="button"
              className={`req-tab-btn ${activeFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveFilter('pending')}
            >
              <span>Pending Requests</span>
              <span className="req-tab-badge">{stats.pending}</span>
            </button>
            <button
              type="button"
              className={`req-tab-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              <span>All Requests</span>
              <span className="req-tab-badge">{stats.total}</span>
            </button>
            <button
              type="button"
              className={`req-tab-btn ${activeFilter === 'approved' ? 'active' : ''}`}
              onClick={() => setActiveFilter('approved')}
            >
              <span>Approved</span>
              <span className="req-tab-badge">{stats.approved}</span>
            </button>
            <button
              type="button"
              className={`req-tab-btn ${activeFilter === 'rejected' ? 'active' : ''}`}
              onClick={() => setActiveFilter('rejected')}
            >
              <span>Rejected</span>
              <span className="req-tab-badge">{stats.rejected}</span>
            </button>
          </div>

          <div className="req-search-box">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#536c64" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', color: '#536c64', cursor: 'pointer', padding: 0 }}
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* REQUESTS TABLE */}
        <section className="req-table-card">
          {loading && requests.length === 0 ? (
            <div className="req-empty-state">
              <div className="req-empty-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1.2s linear infinite' }}>
                  <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                </svg>
              </div>
              <h3 className="req-empty-title">Loading Registration Queue...</h3>
              <p className="req-empty-sub">Fetching submitted accounts from MongoDB security store.</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="req-empty-state">
              <div className="req-empty-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 className="req-empty-title">
                {activeFilter === 'pending'
                  ? 'No Pending Registration Requests'
                  : 'No Requests Matching Filter'}
              </h3>
              <p className="req-empty-sub">
                {activeFilter === 'pending'
                  ? 'All user registrations have been reviewed. When new users submit the registration form, they will appear here for admin approval.'
                  : 'Try clearing the search query or switching to another filter tab above.'}
              </p>
            </div>
          ) : (
            <div className="req-table-wrap">
              <table className="req-table">
                <thead>
                  <tr>
                    <th>Applicant Details</th>
                    <th>Requested Role</th>
                    <th>Submission Date</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Admin Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((reqItem) => {
                    const initials = reqItem.name
                      ? reqItem.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()
                      : 'U';

                    const isActionLoading = actionLoadingId === reqItem._id;
                    const dateFormatted = reqItem.createdAt
                      ? new Date(reqItem.createdAt).toLocaleString(undefined, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : 'Recently';

                    return (
                      <tr key={reqItem._id}>
                        <td>
                          <div className="req-user-cell">
                            <div className="req-user-avatar">{initials}</div>
                            <div>
                              <div className="req-user-name">{reqItem.name}</div>
                              <div className="req-user-email">{reqItem.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ fontSize: '13px', color: 'var(--req-text-sub)' }}>
                            {reqItem.roleTitle || 'Operator / Analyst'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '12.5px', color: 'var(--req-text-sub)' }}>
                            {dateFormatted}
                          </span>
                        </td>
                        <td>
                          <span className={`req-status-pill ${reqItem.status || 'pending'}`}>
                            {reqItem.status === 'approved' && '✓ Approved'}
                            {reqItem.status === 'pending' && '⏳ Pending Review'}
                            {reqItem.status === 'rejected' && '✕ Rejected'}
                          </span>
                        </td>
                        <td>
                          <div className="req-actions-cell" style={{ justifyContent: 'flex-end' }}>
                            {reqItem.status === 'pending' ? (
                              <>
                                <button
                                  type="button"
                                  className="req-btn-approve"
                                  onClick={() => handleApprove(reqItem._id, reqItem.name, reqItem.email)}
                                  disabled={isActionLoading}
                                  title="Approve registration"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                  <span>{isActionLoading ? 'Processing...' : 'Approve'}</span>
                                </button>

                                <button
                                  type="button"
                                  className="req-btn-reject"
                                  onClick={() => handleReject(reqItem._id, reqItem.name, reqItem.email)}
                                  disabled={isActionLoading}
                                  title="Reject registration"
                                >
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>
                                  <span>Reject</span>
                                </button>
                              </>
                            ) : reqItem.status === 'rejected' ? (
                              <button
                                type="button"
                                className="req-btn-approve"
                                onClick={() => handleApprove(reqItem._id, reqItem.name, reqItem.email)}
                                disabled={isActionLoading}
                                title="Re-approve this account"
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>Re-Approve</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="req-btn-reject"
                                onClick={() => handleReject(reqItem._id, reqItem.name, reqItem.email)}
                                disabled={isActionLoading}
                                title="Revoke access and reject"
                              >
                                <span>Revoke / Reject</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
