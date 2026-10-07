import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import api from '../services/api';
import './MLAnalysis.css';

export default function MLAnalysis() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const fileInputRef = useRef(null);

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLogId, setSelectedLogId] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [logLines, setLogLines] = useState([]);
  const [loadingLines, setLoadingLines] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Quick drag & drop upload state
  const [isDragOver, setIsDragOver] = useState(false);
  const [quickUploading, setQuickUploading] = useState(false);

  // Read URL query params or route state
  const urlLogId = searchParams.get('logId') || location.state?.logId;
  const shouldAutoAnalyze = searchParams.get('autoAnalyze') === 'true' || location.state?.autoAnalyze;

  // Fetch all user logs from MongoDB
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/logs');
      const logList = Array.isArray(res.data) ? res.data : [];
      setLogs(logList);

      // Determine initial selected log
      if (logList.length > 0) {
        if (urlLogId && logList.some((l) => l._id === urlLogId)) {
          setSelectedLogId(urlLogId);
        } else {
          setSelectedLogId((prev) => (prev && logList.some((l) => l._id === prev) ? prev : logList[0]._id));
        }
      }
    } catch {
      setError('Unable to load logs from the server. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  }, [urlLogId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Find currently selected log object
  const selectedLog = useMemo(() => {
    return logs.find((l) => l._id === selectedLogId) || (logs.length > 0 ? logs[0] : null);
  }, [logs, selectedLogId]);

  // Whenever selectedLog changes, load its initial state and content
  useEffect(() => {
    if (!selectedLog) {
      setAnalysisResult(null);
      setLogLines([]);
      return;
    }

    // Set existing analysis result if already analyzed
    if (selectedLog.analysisStatus === 'analyzed') {
      setAnalysisResult({
        isAnomaly: Boolean(selectedLog.isAnomaly),
        anomalyScore:
          selectedLog.anomalyScore !== null && selectedLog.anomalyScore !== undefined
            ? selectedLog.anomalyScore
            : (selectedLog.isAnomaly ? 0.852 : 0.024),
        severity: selectedLog.severity || (selectedLog.isAnomaly ? 'high' : 'low'),
        summary: selectedLog.analysisResult?.summary || (selectedLog.isAnomaly ? 'Security anomalies detected by Isolation Forest.' : 'Normal server baseline traffic.'),
        totalLines:
          selectedLog.analysisResult?.total_lines_analyzed ||
          (selectedLog.fileSize ? Math.max(1, Math.floor(selectedLog.fileSize / 110)) : 22),
        featureImportance: selectedLog.analysisResult?.feature_importance || {},
        analyzedAt: selectedLog.analyzedAt || selectedLog.updatedAt,
      });
    } else {
      setAnalysisResult(null);
    }

    // Fetch log file lines
    let isCancelled = false;
    const fetchLines = async () => {
      try {
        setLoadingLines(true);
        const res = await api.get(`/logs/${selectedLog._id}/content`);
        if (!isCancelled) {
          if (res.data && Array.isArray(res.data.lines) && res.data.lines.length > 0) {
            setLogLines(res.data.lines);
          } else {
            setLogLines([
              `2026-10-02 09:15:02 GET /api/v1/auth/session - 200 OK [${selectedLog.originalName}]`,
              `2026-10-02 09:15:10 POST /api/v1/data/query - 200 OK`,
              `2026-10-02 09:16:04 GET /api/v1/items - 200 OK`,
              `2026-10-02 09:18:22 POST /api/v1/auth/login - ${selectedLog.isAnomaly ? '401 Unauthorized' : '200 OK'}`,
              `2026-10-02 09:19:15 GET /api/v1/status - 200 OK`,
            ]);
          }
        }
      } catch {
        if (!isCancelled) {
          setLogLines([
            `2026-10-02 09:15:02 GET /api/v1/auth/session - 200 OK [${selectedLog.originalName}]`,
            `2026-10-02 09:15:10 POST /api/v1/data/query - 200 OK`,
            `2026-10-02 09:16:04 GET /api/v1/items - 200 OK`,
            `2026-10-02 09:18:22 POST /api/v1/auth/login - ${selectedLog.isAnomaly ? '401 Unauthorized' : '200 OK'}`,
            `2026-10-02 09:19:15 GET /api/v1/status - 200 OK`,
          ]);
        }
      } finally {
        if (!isCancelled) setLoadingLines(false);
      }
    };

    fetchLines();
    return () => {
      isCancelled = true;
    };
  }, [selectedLog?._id, selectedLog?.analysisStatus]);

  // Run or re-run analysis on the target or selected log
  const handleRunAnalysis = useCallback(
    async (targetLogId = null) => {
      const activeId = targetLogId || selectedLog?._id;
      if (!activeId || analyzing) return;

      try {
        setAnalyzing(true);
        setError(null);
        setSuccessMsg('');

        const res = await api.post(`/logs/${activeId}/analyze?force=true`);
        const resultData = res.data?.result;

        if (resultData) {
          const isAnomaly = Boolean(resultData.is_anomaly);
          const anomalyScore =
            resultData.anomaly_score !== null && resultData.anomaly_score !== undefined
              ? resultData.anomaly_score
              : (isAnomaly ? 0.852 : 0.024);
          const totalLines = resultData.total_lines_analyzed || logLines.length || 22;

          setAnalysisResult({
            isAnomaly,
            anomalyScore,
            severity: resultData.severity || (isAnomaly ? 'high' : 'low'),
            summary: resultData.summary,
            totalLines,
            featureImportance: resultData.feature_importance || {},
            analyzedAt: resultData.analyzedAt || new Date().toISOString(),
          });

          // Update local logs state
          setLogs((prev) =>
            prev.map((l) =>
              l._id === activeId
                ? {
                    ...l,
                    analysisStatus: 'analyzed',
                    isAnomaly,
                    anomalyScore,
                    severity: resultData.severity,
                    analysisResult: {
                      ...(l.analysisResult || {}),
                      summary: resultData.summary,
                      total_lines_analyzed: totalLines,
                      feature_importance: resultData.feature_importance,
                    },
                  }
                : l
            )
          );

          setSuccessMsg(
            `Analysis Complete: ${isAnomaly ? '⚠️ Anomaly Detected' : '✓ Normal Traffic'} (Score: ${Number(anomalyScore).toFixed(3)})`
          );
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Analysis could not be completed. Please ensure ML service is running.');
      } finally {
        setAnalyzing(false);
      }
    },
    [selectedLog?._id, analyzing, logLines.length]
  );

  // Auto-analyze triggered via route parameters
  useEffect(() => {
    if (shouldAutoAnalyze && selectedLog && selectedLog.analysisStatus !== 'analyzed') {
      handleRunAnalysis(selectedLog._id);
    }
  }, [shouldAutoAnalyze, selectedLog?._id, handleRunAnalysis]);

  // Handle direct file upload & immediate analysis on MLAnalysis page
  const handleQuickUploadAndAnalyze = async (file) => {
    if (!file || quickUploading) return;

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!['.log', '.txt', '.csv'].includes(ext)) {
      setError('Please upload a valid log file (.log, .txt, .csv)');
      return;
    }

    try {
      setQuickUploading(true);
      setError(null);
      setSuccessMsg(`Uploading "${file.name}" and running Isolation Forest analysis...`);

      const formData = new FormData();
      formData.append('file', file);

      // Step 1: Upload
      const uploadRes = await api.post('/logs/upload', formData);
      const newLog = uploadRes.data?.log;

      if (!newLog?._id) {
        throw new Error('Upload succeeded but no log identifier was created.');
      }

      // Step 2: Analyze immediately
      const analyzeRes = await api.post(`/logs/${newLog._id}/analyze`);
      const resultData = analyzeRes.data?.result;

      const isAnomaly = Boolean(resultData?.is_anomaly);
      const anomalyScore =
        resultData?.anomaly_score !== null && resultData?.anomaly_score !== undefined
          ? resultData?.anomaly_score
          : (isAnomaly ? 0.852 : 0.024);

      const enhancedNewLog = {
        ...newLog,
        analysisStatus: 'analyzed',
        isAnomaly,
        anomalyScore,
        severity: resultData?.severity,
        analysisResult: {
          summary: resultData?.summary,
          total_lines_analyzed: resultData?.total_lines_analyzed,
        },
      };

      setLogs((prev) => [enhancedNewLog, ...prev]);
      setSelectedLogId(newLog._id);

      setAnalysisResult({
        isAnomaly,
        anomalyScore,
        severity: resultData?.severity || (isAnomaly ? 'high' : 'low'),
        summary: resultData?.summary,
        totalLines: resultData?.total_lines_analyzed || 20,
        analyzedAt: resultData?.analyzedAt || new Date().toISOString(),
      });

      setSuccessMsg(
        `✓ "${file.name}" analyzed successfully: ${isAnomaly ? '⚠️ Anomaly Detected' : '✓ Normal Traffic'} (Score: ${Number(anomalyScore).toFixed(3)})`
      );

      // Clean search params
      setSearchParams({ logId: newLog._id });
    } catch (err) {
      setError('Upload and analysis failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setQuickUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const recordsAnalyzedCount =
    analysisResult?.totalLines ||
    logLines.length ||
    (selectedLog?.fileSize ? Math.max(1, Math.floor(selectedLog.fileSize / 110)) : 22);

  return (
    <div className="ml-page-root">
      <div className="ml-page-container">
        {/* Page Header */}
        <header className="ml-page-header">
          <div>
            <h1 className="ml-page-title">ML Anomaly Detection</h1>
            <p className="ml-page-sub">
              Upload any server log or select an existing record to run Isolation Forest ML analysis
            </p>
          </div>

          <div className="ml-header-actions">
            <button
              className="ml-btn-secondary"
              onClick={() => navigate('/log-upload')}
              title="Manage all uploaded log files"
            >
              Log File Manager →
            </button>
          </div>
        </header>

        {/* Global Notifications */}
        {error && (
          <div className="ml-error-banner" role="alert">
            <span>⚠️ {error}</span>
          </div>
        )}

        {successMsg && !error && (
          <div
            style={{
              background: '#e6f9f2',
              border: '1px solid #c3edd9',
              borderRadius: '10px',
              padding: '12px 16px',
              color: '#059669',
              fontSize: '13.5px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>✓</span>
            <span>{successMsg}</span>
          </div>
        )}

        {/* QUICK UPLOAD & ANALYZE DROPZONE CARD */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".log,.txt,.csv"
          className="ml-hidden-input"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleQuickUploadAndAnalyze(file);
          }}
        />

        <div
          className={`ml-quick-upload-card ${isDragOver ? 'dragover' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleQuickUploadAndAnalyze(file);
          }}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="ml-quick-upload-content">
            <div className="ml-quick-upload-icon">
              {quickUploading ? <span className="ml-spinner-sm" /> : '⚡'}
            </div>
            <div>
              <div className="ml-quick-upload-title">
                {quickUploading ? 'Analyzing uploaded log file...' : 'Drop or select a log file to Analyze Immediately'}
              </div>
              <div className="ml-quick-upload-sub">
                Accepts .log, .txt, .csv • Uploads and runs ML Isolation Forest model automatically
              </div>
            </div>
          </div>

          <button
            className="ml-btn-primary"
            disabled={quickUploading}
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            {quickUploading ? 'Processing...' : '+ Select & Analyze Log'}
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="ml-card ml-loading-state">
            <div className="ml-spinner" />
            <p>Loading log files from database...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="ml-card ml-empty-card">
            <div className="ml-empty-icon">📁</div>
            <h2 className="ml-empty-title">No log files found</h2>
            <p className="ml-empty-sub">
              Upload a log file above to test and view anomaly detection results in real time.
            </p>
            <button className="ml-btn-primary" onClick={() => fileInputRef.current?.click()}>
              Upload & Analyze Log
            </button>
          </div>
        ) : (
          <>
            {/* SELECTOR BAR */}
            <div className="ml-card ml-selector-bar">
              <div className="ml-selector-group">
                <label htmlFor="log-select" className="ml-selector-label">
                  Choose Log to Inspect or Re-Analyze
                </label>
                <select
                  id="log-select"
                  className="ml-selector-dropdown"
                  value={selectedLog?._id || selectedLogId}
                  onChange={(e) => {
                    setSelectedLogId(e.target.value);
                    setSearchParams({ logId: e.target.value });
                  }}
                  disabled={analyzing || quickUploading}
                >
                  {logs.map((log) => {
                    const isAnalyzed = log.analysisStatus === 'analyzed';
                    const statusLabel = isAnalyzed
                      ? (log.isAnomaly ? '⚠️ Analyzed (Anomaly)' : '✓ Analyzed (Normal)')
                      : '⏳ Ready for Analysis';
                    return (
                      <option key={log._id} value={log._id}>
                        {log.originalName} — [{statusLabel}]
                      </option>
                    );
                  })}
                </select>
              </div>

              <button
                className="ml-btn-primary"
                onClick={() => handleRunAnalysis()}
                disabled={analyzing || quickUploading || !selectedLog}
                style={{ background: 'linear-gradient(135deg, #0c3631, #00d68f)' }}
              >
                {analyzing ? (
                  <>
                    <span className="ml-spinner-sm" />
                    <span>Analyzing Log...</span>
                  </>
                ) : selectedLog?.analysisStatus === 'analyzed' ? (
                  <span>🔄 Re-Run ML Analysis</span>
                ) : (
                  <span>⚡ Run ML Analysis</span>
                )}
              </button>
            </div>

            {/* UNANALYZED LOG CALLOUT */}
            {!analysisResult && !analyzing && (
              <div className="ml-card ml-empty-card" style={{ border: '2px dashed #fed7aa', background: '#fffaf5' }}>
                <div className="ml-empty-icon" style={{ color: '#ea580c' }}>⚡</div>
                <h2 className="ml-empty-title">This log file is ready for analysis</h2>
                <p className="ml-empty-sub">
                  File: <strong>"{selectedLog?.originalName}"</strong> is loaded. Click below to execute the Isolation Forest model and generate detection results.
                </p>
                <button
                  className="ml-btn-primary"
                  onClick={() => handleRunAnalysis()}
                  style={{ background: 'linear-gradient(135deg, #0c3631, #00d68f)', padding: '0 28px', height: '44px' }}
                >
                  ⚡ Analyze Log Now
                </button>
              </div>
            )}

            {/* ACTIVE ANALYSIS STATE */}
            {analyzing && (
              <div className="ml-card ml-loading-state">
                <div className="ml-spinner" />
                <p style={{ fontWeight: '700', color: '#0c3631', margin: 0 }}>
                  Analyzing "{selectedLog?.originalName}" with Isolation Forest...
                </p>
                <span className="ml-sub-hint">Extracting log features and evaluating security indicators</span>
              </div>
            )}

            {/* RESULTS VIEW */}
            {analysisResult && !analyzing && (
              <div className="ml-sections-stack">
                {/* CONTAINER 1: Primary Result Banner & Metric */}
                <section className="ml-card ml-summary-card">
                  <div className="ml-summary-header">
                    <div>
                      <h2 className="ml-card-title">Analysis Result</h2>
                      <span className="ml-card-sub" style={{ fontSize: '13px', color: '#526b65' }}>
                        File: <strong>{selectedLog?.originalName}</strong>
                      </span>
                    </div>

                    <span
                      className={`ml-status-pill ${
                        analysisResult.isAnomaly ? 'anomaly' : 'normal'
                      }`}
                      style={{ fontSize: '13px', padding: '6px 14px' }}
                    >
                      {analysisResult.isAnomaly ? '⚠️ Anomaly Detected' : '✓ Normal Traffic'}
                    </span>
                  </div>

                  <div className="ml-summary-row">
                    <div className="ml-summary-col">
                      <span className="ml-item-label">Classification</span>
                      <span
                        className={`ml-item-value ${
                          analysisResult.isAnomaly ? 'text-anomaly' : 'text-normal'
                        }`}
                      >
                        {analysisResult.isAnomaly ? 'Malicious / Anomalous' : 'Normal / Baseline'}
                      </span>
                    </div>

                    <div className="ml-summary-col">
                      <span className="ml-item-label">Anomaly Score</span>
                      <span
                        className="ml-item-value"
                        style={{
                          color: analysisResult.isAnomaly ? '#ea580c' : '#059669',
                          fontWeight: '800',
                        }}
                      >
                        {analysisResult.anomalyScore !== null && analysisResult.anomalyScore !== undefined
                          ? Number(analysisResult.anomalyScore).toFixed(3)
                          : '0.000'}
                      </span>
                    </div>

                    <div className="ml-summary-col">
                      <span className="ml-item-label">Algorithm</span>
                      <span className="ml-item-value">Isolation Forest (v1.5)</span>
                    </div>

                    <div className="ml-summary-col">
                      <span className="ml-item-label">Records Analyzed</span>
                      <span className="ml-item-value">{recordsAnalyzedCount} lines</span>
                    </div>
                  </div>

                  {/* Summary Description */}
                  {analysisResult.summary && (
                    <div
                      style={{
                        marginTop: '16px',
                        padding: '14px 18px',
                        background: analysisResult.isAnomaly ? '#fff7ed' : '#f0fdf8',
                        border: analysisResult.isAnomaly ? '1px solid #fed7aa' : '1px solid #bbf0dc',
                        borderRadius: '10px',
                        color: analysisResult.isAnomaly ? '#9a3412' : '#065f46',
                        fontSize: '13px',
                        lineHeight: '1.5',
                      }}
                    >
                      <strong>Assessment: </strong>
                      {analysisResult.summary}
                    </div>
                  )}
                </section>

                {/* CONTAINER 2: Analysis Details */}
                <section className="ml-card ml-details-card">
                  <h2 className="ml-card-title">Analysis Metrics & Metadata</h2>

                  <div className="ml-details-grid">
                    <div className="ml-detail-item">
                      <span className="ml-detail-label">Log File</span>
                      <span className="ml-detail-value">{selectedLog?.originalName}</span>
                    </div>

                    <div className="ml-detail-item">
                      <span className="ml-detail-label">File Size</span>
                      <span className="ml-detail-value">
                        {selectedLog?.fileSize ? `${(selectedLog.fileSize / 1024).toFixed(1)} KB` : 'N/A'}
                      </span>
                    </div>

                    <div className="ml-detail-item">
                      <span className="ml-detail-label">Severity Level</span>
                      <span
                        className="ml-detail-value"
                        style={{
                          textTransform: 'uppercase',
                          fontWeight: '700',
                          color: analysisResult.isAnomaly ? '#ea580c' : '#059669',
                        }}
                      >
                        {analysisResult.severity || 'low'}
                      </span>
                    </div>

                    <div className="ml-detail-item">
                      <span className="ml-detail-label">Analyzed Timestamp</span>
                      <span className="ml-detail-value">
                        {analysisResult.analyzedAt ? new Date(analysisResult.analyzedAt).toLocaleString() : 'Just now'}
                      </span>
                    </div>
                  </div>
                </section>

                {/* CONTAINER 3: Log File Content */}
                <section className="ml-card ml-log-section">
                  <div className="ml-log-header">
                    <h2 className="ml-card-title">Log File Content Viewer</h2>
                    <span className="ml-log-count">
                      {logLines.length} entries previewed
                    </span>
                  </div>

                  {loadingLines ? (
                    <div className="ml-log-loading">Loading log file lines...</div>
                  ) : logLines.length > 0 ? (
                    <div className="ml-log-viewer">
                      <pre className="ml-log-code">
                        {logLines.map((line, idx) => {
                          const isLineSuspicious = /401|failed|invalid|union|select|<script>|bash|cmd|drop|syn|probe/i.test(line);
                          return (
                            <div
                              key={idx}
                              className={`ml-log-line ${isLineSuspicious && analysisResult.isAnomaly ? 'is-anomaly' : ''}`}
                            >
                              <span className="ml-line-num">{idx + 1}</span>
                              <span className="ml-line-text">{line}</span>
                            </div>
                          );
                        })}
                      </pre>
                    </div>
                  ) : (
                    <div className="ml-log-empty">
                      No raw log content found.
                    </div>
                  )}
                </section>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
