import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './UserDashboard.css';

export default function UserDashboard({ onSwitchToAdmin = null }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [userLogs, setUserLogs] = useState([]);
  const [userAlerts, setUserAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // In-dashboard quick website scan state
  const [quickUrl, setQuickUrl] = useState('');
  const [quickScanning, setQuickScanning] = useState(false);
  const [quickResult, setQuickResult] = useState(null);
  const [quickError, setQuickError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      try {
        const [logsRes, alertsRes] = await Promise.all([
          api.get('/logs').catch(() => ({ data: [] })),
          api.get('/alerts').catch(() => ({ data: [] })),
        ]);

        if (isMounted) {
          setUserLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
          setUserAlerts(Array.isArray(alertsRes.data) ? alertsRes.data : []);
        }
      } catch (err) {
        console.warn('[UserDashboard] Notice:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUserData();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalLogs = userLogs.length;
  const anomalyCount = userLogs.filter((l) => l.isAnomaly).length;
  const cleanCount = totalLogs - anomalyCount;

  // Handle in-dashboard instant website scan
  const handleQuickScan = async (targetUrl = null) => {
    const urlToTest = (typeof targetUrl === 'string' ? targetUrl : quickUrl).trim();
    if (!urlToTest) {
      setQuickError('Please enter a website address.');
      return;
    }

    setQuickError(null);
    setQuickScanning(true);
    setQuickResult(null);

    try {
      const res = await api.post('/website-scanner/scan', { url: urlToTest });
      if (res.data && res.data.scan) {
        setQuickResult(res.data.scan);
      }
    } catch (err) {
      setQuickError(err.response?.data?.message || 'Could not scan website. Please check the address.');
    } finally {
      setQuickScanning(false);
    }
  };

  return (
    <div className="ud-wrapper">
      <div className="ud-container">
        {/* Admin Preview Mode Switcher (if opened by Admin) */}
        {onSwitchToAdmin && (
          <div className="ud-admin-preview-bar">
            <span>👤 You are viewing the <strong>User Friendly Dashboard</strong></span>
            <button
              type="button"
              className="ud-admin-preview-btn"
              onClick={onSwitchToAdmin}
            >
              Switch to Admin SOC View &rarr;
            </button>
          </div>
        )}

        {/* TOP WELCOME BAR */}
        <header className="ud-header-bar">
          <div>
            <div className="ud-greeting-tag">
              <span className="ud-pulse-dot" />
              <span>PROTECTION IS ACTIVE</span>
            </div>
            <h1 className="ud-header-title">
              Hello, {user?.name || 'there'}! 👋
            </h1>
            <p className="ud-header-sub">
              Here is your personal security summary. Everything is safe and running normally.
            </p>
          </div>

          <button
            type="button"
            className="ud-report-btn"
            onClick={() => navigate('/report-incident')}
          >
            <span>🚨</span>
            <span>Report a Problem</span>
          </button>
        </header>

        {/* HERO PROTECTION CARD */}
        <section className="ud-hero-shield-card">
          <div className="ud-hero-content">
            <div className="ud-shield-icon-bubble">
              🛡️
            </div>
            <div className="ud-hero-text">
              <h2>Your Account is Safe & Protected</h2>
              <p>
                All your uploaded files, browsing links, and account credentials are secure. No dangerous threats have been detected.
              </p>
              <div className="ud-hero-badge-row">
                <span className="ud-status-pill-safe">
                  ✓ 100% Secure
                </span>
                <span style={{ fontSize: '12.5px', color: '#526b65' }}>
                  Account: <strong>{user?.email || 'user@example.com'}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="ud-hero-stats">
            <div className="ud-stat-badge" onClick={() => navigate('/log-upload')} style={{ cursor: 'pointer' }}>
              <div className="ud-stat-val">{totalLogs}</div>
              <div className="ud-stat-label">Files Checked</div>
            </div>
            <div className="ud-stat-badge" onClick={() => navigate('/alerts')} style={{ cursor: 'pointer' }}>
              <div className="ud-stat-val" style={{ color: userAlerts.length > 0 ? '#d97706' : '#0c3631' }}>
                {userAlerts.length}
              </div>
              <div className="ud-stat-label">Alerts</div>
            </div>
          </div>
        </section>

        {/* IN-DASHBOARD QUICK WEBSITE CHECKER TOOL */}
        <section className="ud-quick-scanner-card">
          <div className="ud-section-title-row">
            <div className="icon-box">🌐</div>
            <h3>Check Any Website Right Here</h3>
          </div>
          <p className="ud-section-sub">
            Type or paste any website link to quickly verify if it is safe, working, and secure.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleQuickScan();
            }}
          >
            <div className="ud-scan-bar">
              <div className="ud-scan-input-wrap">
                <span className="ud-scan-input-icon">🔍</span>
                <input
                  type="text"
                  className="ud-scan-input"
                  placeholder="e.g. example.com or https://example.com"
                  value={quickUrl}
                  onChange={(e) => setQuickUrl(e.target.value)}
                  disabled={quickScanning}
                />
              </div>
              <button
                type="submit"
                className="ud-scan-btn"
                disabled={quickScanning || !quickUrl.trim()}
              >
                {quickScanning ? 'Checking...' : 'Check Website'}
              </button>
            </div>
          </form>

          {/* Quick Clickable Chips */}
          <div className="ud-chips-row">
            <span>Try one:</span>
            <button
              type="button"
              className="ud-chip-btn"
              onClick={() => {
                setQuickUrl('https://example.com');
                handleQuickScan('https://example.com');
              }}
            >
              example.com
            </button>
            <button
              type="button"
              className="ud-chip-btn"
              onClick={() => {
                setQuickUrl('https://google.com');
                handleQuickScan('https://google.com');
              }}
            >
              google.com
            </button>
          </div>

          {/* Quick Result Box */}
          {quickError && (
            <div style={{ marginTop: '14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '12px 16px', color: '#b91c1c', fontSize: '13px', fontWeight: '600' }}>
              ⚠️ {quickError}
            </div>
          )}

          {quickResult && (
            <div className="ud-quick-result-card">
              <div className="ud-result-left">
                <span className="ud-result-icon">
                  {quickResult.riskLevel === 'high' ? '⚠️' : '✅'}
                </span>
                <div className="ud-result-info">
                  <h4>
                    {quickResult.hostname} — {quickResult.riskLevel === 'high' ? 'Needs Review' : 'Safe Website'}
                  </h4>
                  <p>
                    {quickResult.https?.enabled ? 'Secure HTTPS connection' : 'Plain HTTP'} &bull; Status: {quickResult.httpStatus} {quickResult.statusText} &bull; Response: {quickResult.responseTimeMs}ms
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="ud-result-btn"
                onClick={() => navigate('/website-scanner')}
              >
                View Full Audit &rarr;
              </button>
            </div>
          )}
        </section>

        {/* 3 BIG FEATURE TILES */}
        <section className="ud-cards-grid">
          {/* Card 1: Check a File */}
          <div className="ud-feature-card" onClick={() => navigate('/log-upload')}>
            <div>
              <div className="ud-card-icon-wrap green">📁</div>
              <div className="ud-card-text" style={{ marginTop: '16px' }}>
                <h4>Check a File</h4>
                <p>Upload any log file or spreadsheet to check for errors, unusual activity, or suspicious data.</p>
              </div>
            </div>
            <div className="ud-card-arrow-btn">
              <span>Upload a File</span>
              <span>&rarr;</span>
            </div>
          </div>

          {/* Card 2: Website Scanner */}
          <div className="ud-feature-card" onClick={() => navigate('/website-scanner')}>
            <div>
              <div className="ud-card-icon-wrap teal">🌐</div>
              <div className="ud-card-text" style={{ marginTop: '16px' }}>
                <h4>Website Scanner</h4>
                <p>Run deep security scans on any web link to inspect SSL certificates and security headers.</p>
              </div>
            </div>
            <div className="ud-card-arrow-btn">
              <span>Open Scanner</span>
              <span>&rarr;</span>
            </div>
          </div>

          {/* Card 3: Report a Problem */}
          <div className="ud-feature-card" onClick={() => navigate('/report-incident')}>
            <div>
              <div className="ud-card-icon-wrap amber">🚨</div>
              <div className="ud-card-text" style={{ marginTop: '16px' }}>
                <h4>Report a Problem</h4>
                <p>Found a strange email, suspicious login prompt, or malicious link? Send it to our team.</p>
              </div>
            </div>
            <div className="ud-card-arrow-btn">
              <span>Report Issue</span>
              <span>&rarr;</span>
            </div>
          </div>
        </section>

        {/* TWO-COLUMN DETAILS: Activity Feed + Security Tips */}
        <div className="ud-split-row">
          {/* Left: Recent Activity Feed */}
          <section className="ud-feed-card">
            <div className="ud-section-title-row">
              <div className="icon-box">📋</div>
              <h3>Recent Checks</h3>
            </div>
            <p className="ud-section-sub">
              Your recently analyzed files and security scans
            </p>

            {userLogs.length === 0 ? (
              <div className="ud-empty-state">
                <div className="icon">📂</div>
                <p>You haven't uploaded any files yet.</p>
                <button
                  type="button"
                  className="ud-result-btn"
                  onClick={() => navigate('/log-upload')}
                >
                  Upload Your First File
                </button>
              </div>
            ) : (
              <div className="ud-feed-list">
                {userLogs.slice(0, 5).map((log) => (
                  <div key={log._id} className="ud-feed-item">
                    <div className="ud-feed-item-left">
                      <span className="ud-feed-icon">📄</span>
                      <div>
                        <div className="ud-feed-title">{log.originalName}</div>
                        <div className="ud-feed-sub">
                          {new Date(log.createdAt).toLocaleDateString()} &bull; {log.fileType}
                        </div>
                      </div>
                    </div>
                    <span className={`ud-feed-badge ${log.isAnomaly ? 'warn' : 'safe'}`}>
                      {log.isAnomaly ? 'Needs Review' : 'Safe'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Right: Simple Online Safety Tips */}
          <section className="ud-tips-card">
            <div className="ud-section-title-row">
              <div className="icon-box">💡</div>
              <h3>Simple Safety Tips</h3>
            </div>
            <p className="ud-section-sub">
              Easy ways to keep your account safe
            </p>

            <div className="ud-tips-list">
              <div className="ud-tip-item">
                <div className="ud-tip-number">1</div>
                <div className="ud-tip-content">
                  <strong>Check Strange Links First</strong>
                  <p>Before clicking a link in an email, test it with the website scanner above.</p>
                </div>
              </div>

              <div className="ud-tip-item">
                <div className="ud-tip-number">2</div>
                <div className="ud-tip-content">
                  <strong>Never Share Passwords</strong>
                  <p>Our team will never ask you for your login password via email or message.</p>
                </div>
              </div>

              <div className="ud-tip-item">
                <div className="ud-tip-number">3</div>
                <div className="ud-tip-content">
                  <strong>Report Anything Unusual</strong>
                  <p>Notice unexpected activity? Use the Report button to notify our team right away.</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
