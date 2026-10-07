import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import './WebsiteScanner.css';

export default function WebsiteScanner() {
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((msg, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  // Fetch scan history on component mount
  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await api.get('/website-scanner/history?limit=10');
      if (res.data && res.data.scans) {
        setHistory(res.data.scans);
        if (!scanResult && res.data.scans.length > 0) {
          loadScanDetails(res.data.scans[0]._id, false);
        }
      }
    } catch {
      // Fallback
    } finally {
      setHistoryLoading(false);
    }
  }, [scanResult]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const loadScanDetails = async (scanId, scroll = true) => {
    try {
      const res = await api.get(`/website-scanner/${scanId}`);
      if (res.data && res.data.scan) {
        setScanResult(res.data.scan);
        setError(null);
        if (scroll) {
          window.scrollTo({ top: 380, behavior: 'smooth' });
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load scan details.', 'error');
    }
  };

  const handleScan = async (e) => {
    e?.preventDefault();
    setError(null);

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setError('Please enter a website URL to scan.');
      return;
    }

    setScanning(true);
    showToast(`Scanning ${trimmedUrl}...`, 'info');

    try {
      const res = await api.post('/website-scanner/scan', { url: trimmedUrl });
      if (res.data && res.data.scan) {
        setScanResult(res.data.scan);
        showToast(`Scan complete for ${res.data.scan.hostname}`, 'success');
        fetchHistory();
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        (err.code === 'ECONNABORTED' ? 'Website scan timed out.' : 'Unable to reach this website.');
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setScanning(false);
    }
  };

  const handleDelete = async (scanId) => {
    try {
      await api.delete(`/website-scanner/${scanId}`);
      setHistory((prev) => prev.filter((s) => s._id !== scanId));
      if (scanResult?._id === scanId) {
        setScanResult(null);
      }
      showToast('Scan record deleted.', 'info');
    } catch (err) {
      showToast('Failed to delete scan.', 'error');
    }
  };

  // Convert risk level to simple result label: Normal / Review Required
  const getSimpleResult = (scan) => {
    if (!scan) return 'Normal';
    const level = (scan.riskLevel || '').toLowerCase();
    if (level === 'high' || level === 'medium' || !scan.https?.enabled) {
      return 'Review Required';
    }
    return 'Normal';
  };

  return (
    <div className="web-page-root">
      {/* Toast Notifications */}
      <div className="green-dash-toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`green-dash-toast ${t.type}`}>
            <span className="green-dash-toast-dot" />
            <span>{t.msg}</span>
          </div>
        ))}
      </div>

      <div className="web-container">
        {/* Header Bar */}
        <header className="web-header-bar">
          <div>
            <h1 className="web-header-title">Website Scanner</h1>
            <p className="web-header-sub">
              Scan website URLs to check availability and security status
            </p>
          </div>
        </header>

        {/* MAIN CONTAINER: Website URL */}
        <section className="web-card web-input-card">
          <div className="lu-card-header" style={{ marginBottom: '8px' }}>
            <h3 style={{ fontSize: '16px', color: '#0c3631' }}>Website URL</h3>
          </div>

          <form className="web-scan-form" onSubmit={handleScan}>
            <div className="web-url-input-wrap">
              <span className="web-url-icon">🌐</span>
              <input
                type="text"
                className={`web-url-input ${error ? 'has-error' : ''}`}
                placeholder="Enter URL (e.g. example.com or https://example.com)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={scanning}
              />
              {url && (
                <button
                  type="button"
                  className="web-clear-btn"
                  onClick={() => setUrl('')}
                  title="Clear"
                >
                  ✕
                </button>
              )}
            </div>

            <button type="submit" className="web-btn-primary" disabled={scanning || !url.trim()}>
              {scanning ? 'Scanning...' : 'Scan Website'}
            </button>
          </form>

          {/* Quick Demo links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#526b65' }}>
            <span>Quick test:</span>
            <button
              type="button"
              className="web-btn-secondary"
              onClick={() => { setUrl('https://example.com'); }}
              style={{ padding: '4px 10px', fontSize: '11px' }}
            >
              example.com
            </button>
            <button
              type="button"
              className="web-btn-secondary"
              onClick={() => { setUrl('https://google.com'); }}
              style={{ padding: '4px 10px', fontSize: '11px' }}
            >
              google.com
            </button>
          </div>

          {error && (
            <div className="ml-error-banner" role="alert" style={{ marginTop: '8px' }}>
              <span>⚠️ {error}</span>
            </div>
          )}
        </section>

        {/* RESULT CONTAINER (Shown when scanResult exists) */}
        {scanResult && (
          <section className="web-card">
            <div className="lu-card-header" style={{ marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '16px', color: '#0c3631' }}>Scan Result</h3>
              </div>
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  backgroundColor: getSimpleResult(scanResult) === 'Normal' ? '#e6f9f2' : '#ffedd5',
                  color: getSimpleResult(scanResult) === 'Normal' ? '#059669' : '#c2410c',
                }}
              >
                {getSimpleResult(scanResult)}
              </span>
            </div>

            <div className="ml-summary-row">
              <div className="ml-summary-col">
                <span className="ml-item-label">URL</span>
                <span className="ml-item-value" style={{ fontWeight: '700' }}>
                  {scanResult.hostname || scanResult.url}
                </span>
              </div>

              <div className="ml-summary-col">
                <span className="ml-item-label">Result</span>
                <span
                  className="ml-item-value"
                  style={{
                    color: getSimpleResult(scanResult) === 'Normal' ? '#059669' : '#c2410c',
                    fontWeight: '700',
                  }}
                >
                  {getSimpleResult(scanResult)}
                </span>
              </div>

              <div className="ml-summary-col">
                <span className="ml-item-label">HTTP Status</span>
                <span className="ml-item-value">
                  {scanResult.httpStatus || 200} {scanResult.statusText || 'OK'}
                </span>
              </div>

              <div className="ml-summary-col">
                <span className="ml-item-label">Response Time</span>
                <span className="ml-item-value">
                  {scanResult.responseTimeMs || 120} ms
                </span>
              </div>
            </div>
          </section>
        )}

        {/* RECENT SCANS TABLE CONTAINER */}
        <section className="web-card">
          <div className="lu-card-header" style={{ marginBottom: '14px' }}>
            <div>
              <h3>Recent Scans</h3>
              <span className="lu-card-sub">History of scanned website URLs</span>
            </div>
          </div>

          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#526b65' }}>
              <span>Loading scans...</span>
            </div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#839b95' }}>
              <p style={{ margin: 0 }}>No websites scanned yet. Enter a URL above to scan.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e8f1ed', color: '#526b65', fontSize: '11px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 12px' }}>URL</th>
                    <th style={{ padding: '10px 12px' }}>Result</th>
                    <th style={{ padding: '10px 12px' }}>HTTP Status</th>
                    <th style={{ padding: '10px 12px' }}>Date</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((scan) => {
                    const resultText = getSimpleResult(scan);
                    return (
                      <tr
                        key={scan._id}
                        style={{ borderBottom: '1px solid #f0f5f2' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8faf9')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '12px', fontWeight: '600', color: '#0c3631' }}>
                          {scan.hostname || scan.url}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '700',
                              backgroundColor: resultText === 'Normal' ? '#e6f9f2' : '#ffedd5',
                              color: resultText === 'Normal' ? '#059669' : '#c2410c',
                            }}
                          >
                            {resultText}
                          </span>
                        </td>
                        <td style={{ padding: '12px', color: '#526b65' }}>
                          {scan.httpStatus || 200}
                        </td>
                        <td style={{ padding: '12px', color: '#839b95', fontSize: '12px' }}>
                          {new Date(scan.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <button
                            className="web-btn-secondary"
                            onClick={() => loadScanDetails(scan._id)}
                            style={{ padding: '4px 10px', fontSize: '11px', marginRight: '6px' }}
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleDelete(scan._id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                            title="Delete"
                          >
                            🗑️
                          </button>
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
