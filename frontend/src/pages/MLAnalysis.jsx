import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { formatFileSize, formatDate, getFileIcon } from '../utils/helpers';
import './MLAnalysis.css';

const getStatusConfig = (status) => {
  switch (status) {
    case 'uploaded':
      return { label: 'Uploaded', className: 'mla-status-uploaded' };
    case 'processing':
      return { label: 'Processing', className: 'mla-status-processing' };
    case 'completed':
      return { label: 'Completed', className: 'mla-status-completed' };
    case 'failed':
      return { label: 'Failed', className: 'mla-status-failed' };
    default:
      return { label: status, className: 'mla-status-uploaded' };
  }
};

const getSeverityConfig = (severity) => {
  switch (severity) {
    case 'critical':
      return { label: 'CRITICAL', className: 'mla-severity-critical', color: '#ef4444' };
    case 'high':
      return { label: 'HIGH', className: 'mla-severity-high', color: '#f59e0b' };
    case 'medium':
      return { label: 'MEDIUM', className: 'mla-severity-medium', color: '#3b82f6' };
    case 'low':
      return { label: 'LOW', className: 'mla-severity-low', color: '#10b981' };
    case 'none':
      return { label: 'NONE', className: 'mla-severity-none', color: '#6b7280' };
    default:
      return { label: '--', className: '', color: '#6b7280' };
  }
};

export default function MLAnalysis() {
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await api.get('/logs');
      setLogs(res.data);
    } catch {
      // silent
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleSelectLog = useCallback((log) => {
    setSelectedLog(log);
    setResult(null);
    setError('');

    if (log.analysisStatus === 'analyzed') {
      setResult({
        is_anomaly: log.isAnomaly,
        anomaly_score: log.anomalyScore,
        severity: log.severity,
        summary: log.analysisResult?.summary || 'Analysis previously completed.',
        total_lines_analyzed: log.analysisResult?.total_lines_analyzed || 0,
        analyzedAt: log.analyzedAt,
      });
    }
  }, []);

  const handleAnalyze = async () => {
    if (!selectedLog || analyzing) return;

    try {
      setAnalyzing(true);
      setError('');
      setResult(null);

      const res = await api.post(`/logs/${selectedLog._id}/analyze`);
      setResult(res.data.result);

      setLogs((prev) =>
        prev.map((l) =>
          l._id === selectedLog._id
            ? { ...l, status: 'completed', analysisStatus: 'analyzed', isAnomaly: res.data.result.is_anomaly, anomalyScore: res.data.result.anomaly_score, severity: res.data.result.severity, analyzedAt: res.data.result.analyzedAt }
            : l
        )
      );

      setSelectedLog((prev) =>
        prev && prev._id === selectedLog._id
          ? { ...prev, status: 'completed', analysisStatus: 'analyzed', isAnomaly: res.data.result.is_anomaly, anomalyScore: res.data.result.anomaly_score, severity: res.data.result.severity, analyzedAt: res.data.result.analyzedAt }
          : prev
      );
    } catch (err) {
      const msg = err.response?.data?.message || 'Analysis failed. Please try again.';
      setError(msg);

      setLogs((prev) =>
        prev.map((l) =>
          l._id === selectedLog._id
            ? { ...l, status: 'failed', analysisStatus: 'failed' }
            : l
        )
      );
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="mla-content">
      <div className="mla-header">
        <h1>ML Analysis</h1>
        <p>Analyze uploaded security logs using Isolation Forest anomaly detection</p>
      </div>

      <div className="mla-layout">
        <div className="mla-left">
          <div className="mla-log-selector">
            <div className="mla-section-header">
              <h2>Select Log File</h2>
              <span className="mla-count">{logs.length} files</span>
            </div>

            {loadingLogs ? (
              <div className="mla-loading">
                <span className="mla-spinner" />
              </div>
            ) : logs.length === 0 ? (
              <div className="mla-empty">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <p>No logs available</p>
                <span>Upload log files first to enable analysis.</span>
              </div>
            ) : (
              <div className="mla-log-list">
                {logs.map((log) => {
                  const statusConf = getStatusConfig(log.analysisStatus === 'analyzed' ? 'completed' : log.analysisStatus === 'processing' ? 'processing' : log.analysisStatus === 'failed' ? 'failed' : log.status);
                  const isSelected = selectedLog?._id === log._id;
                  return (
                    <button
                      key={log._id}
                      className={`mla-log-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleSelectLog(log)}
                    >
                      <div className="mla-log-icon">
                        {getFileIcon(log.fileType)}
                      </div>
                      <div className="mla-log-details">
                        <span className="mla-log-name">{log.originalName}</span>
                        <span className="mla-log-meta">
                          {log.fileType.toUpperCase()} &middot; {formatFileSize(log.fileSize)}
                        </span>
                      </div>
                      <span className={`mla-log-status ${statusConf.className}`}>
                        {statusConf.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {selectedLog && (
            <div className="mla-analyze-card">
              <div className="mla-file-info">
                <div className="mla-file-info-icon">
                  {getFileIcon(selectedLog.fileType)}
                </div>
                <div className="mla-file-info-text">
                  <span className="mla-file-info-name">{selectedLog.originalName}</span>
                  <span className="mla-file-info-meta">
                    {selectedLog.fileType.toUpperCase()} &middot; {formatFileSize(selectedLog.fileSize)} &middot; Uploaded {formatDate(selectedLog.createdAt)}
                  </span>
                </div>
              </div>

              {error && (
                <div className="mla-error">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                className="mla-analyze-btn"
                onClick={handleAnalyze}
                disabled={analyzing || selectedLog.analysisStatus === 'analyzed'}
              >
                {analyzing ? (
                  <>
                    <span className="mla-spinner" />
                    Analyzing...
                  </>
                ) : selectedLog.analysisStatus === 'analyzed' ? (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Already Analyzed
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    Analyze Log
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="mla-right">
          {analyzing ? (
            <div className="mla-result-card mla-analyzing">
              <div className="mla-analyzing-content">
                <div className="mla-analyzing-spinner">
                  <div className="mla-pulse-ring" />
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <h3>Analyzing Log File</h3>
                <p>Running Isolation Forest anomaly detection...</p>
                <div className="mla-progress-bar">
                  <div className="mla-progress-fill" />
                </div>
              </div>
            </div>
          ) : result ? (
            <div className="mla-result-card">
              <div className="mla-result-header">
                <h2>Analysis Complete</h2>
                <span className="mla-result-time">
                  {result.analyzedAt ? formatDate(result.analyzedAt) : ''}
                </span>
              </div>

              <div className={`mla-verdict ${result.is_anomaly ? 'anomaly' : 'normal'}`}>
                <div className="mla-verdict-icon">
                  {result.is_anomaly ? (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  )}
                </div>
                <div className="mla-verdict-text">
                  <span className="mla-verdict-label">Status</span>
                  <span className="mla-verdict-value">
                    {result.is_anomaly ? 'ANOMALY DETECTED' : 'NO ANOMALY DETECTED'}
                  </span>
                </div>
              </div>

              <div className="mla-metrics">
                <div className="mla-metric">
                  <span className="mla-metric-label">Severity</span>
                  <span className={`mla-metric-value ${getSeverityConfig(result.severity).className}`}>
                    {getSeverityConfig(result.severity).label}
                  </span>
                </div>
                <div className="mla-metric">
                  <span className="mla-metric-label">Anomaly Score</span>
                  <span className="mla-metric-value mla-score">
                    {result.anomaly_score?.toFixed(4) || '--'}
                  </span>
                </div>
                <div className="mla-metric">
                  <span className="mla-metric-label">Lines Analyzed</span>
                  <span className="mla-metric-value">
                    {result.total_lines_analyzed?.toLocaleString() || '--'}
                  </span>
                </div>
              </div>

              {result.summary && (
                <div className="mla-summary">
                  <h3>Summary</h3>
                  <p>{result.summary}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="mla-result-card mla-placeholder">
              <div className="mla-placeholder-content">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <h3>Select a Log to Analyze</h3>
                <p>Choose a log file from the list and click Analyze to run Isolation Forest anomaly detection.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
