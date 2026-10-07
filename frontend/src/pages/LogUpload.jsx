import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './LogUpload.css';

const ALLOWED_EXTENSIONS = ['.log', '.txt', '.csv'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const SAMPLE_PRESETS = {
  normal: {
    id: 'sample_normal',
    title: 'Normal Server Traffic',
    fileName: 'normal_traffic.log',
    fileType: 'log',
    linesCount: 20,
    isAnomaly: false,
    sampleLines: [
      { id: 1, time: '09:00:15', ip: '192.168.1.10', method: 'GET', target: '/index.html', status: '200', isAnomaly: false, label: 'Page load' },
      { id: 2, time: '09:01:22', ip: '192.168.1.10', method: 'GET', target: '/static/css/style.css', status: '200', isAnomaly: false, label: 'Asset request' },
      { id: 3, time: '09:03:40', ip: '192.168.1.15', method: 'POST', target: '/api/auth/login', status: '200', isAnomaly: false, label: 'User login' },
      { id: 4, time: '09:05:10', ip: '192.168.1.15', method: 'GET', target: '/dashboard', status: '200', isAnomaly: false, label: 'Dashboard access' },
      { id: 5, time: '09:10:05', ip: '192.168.1.20', method: 'GET', target: '/api/items', status: '200', isAnomaly: false, label: 'Data fetch' },
      { id: 6, time: '09:15:30', ip: '192.168.1.15', method: 'POST', target: '/api/auth/logout', status: '200', isAnomaly: false, label: 'User logout' },
    ],
  },
  anomaly: {
    id: 'sample_anomaly',
    title: 'Failed Logins (Brute Force)',
    fileName: 'failed_logins.log',
    fileType: 'log',
    linesCount: 22,
    isAnomaly: true,
    sampleLines: [
      { id: 1, time: '03:14:01', ip: '203.0.113.88', method: 'POST', target: '/api/auth/login', status: '401', isAnomaly: true, label: 'Failed login #1' },
      { id: 2, time: '03:14:03', ip: '203.0.113.88', method: 'POST', target: '/api/auth/login', status: '401', isAnomaly: true, label: 'Failed login #2' },
      { id: 3, time: '03:14:06', ip: '203.0.113.88', method: 'POST', target: '/api/auth/login', status: '401', isAnomaly: true, label: 'Failed login #3' },
      { id: 4, time: '03:14:10', ip: '203.0.113.88', method: 'POST', target: '/api/auth/login', status: '401', isAnomaly: true, label: 'Failed login #4' },
      { id: 5, time: '03:14:15', ip: '203.0.113.88', method: 'POST', target: '/api/auth/login', status: '429', isAnomaly: true, label: 'Rate limit hit' },
      { id: 6, time: '03:14:20', ip: '203.0.113.88', method: 'GET', target: '/admin/config.php', status: '403', isAnomaly: true, label: 'Unauthorized endpoint' },
    ],
  },
};

export default function LogUpload() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [toasts, setToasts] = useState([]);
  const [analyzingRowId, setAnalyzingRowId] = useState(null);

  // Toast notification helper
  const showToast = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Fetch all logs from MongoDB
  const fetchLogs = useCallback(async () => {
    try {
      setLoadingLogs(true);
      const res = await api.get('/logs');
      setLogs(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.warn('[LogUpload] Fetch notice:', err.message);
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // File validation
  const validateFile = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Supported formats: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }
    if (file.size === 0) return 'The selected file is empty.';
    if (file.size > MAX_FILE_SIZE) return 'File exceeds maximum 50MB limit.';
    return null;
  };

  const handleFileSelect = (file) => {
    const err = validateFile(file);
    if (err) {
      showToast(err, 'warning');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
    setUploadStatus('');
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  // Upload file to MongoDB via API
  const handleUpload = async () => {
    if (!selectedFile || uploading) return;

    try {
      setUploading(true);
      setUploadStatus('Uploading file...');
      const formData = new FormData();
      formData.append('file', selectedFile);

      await api.post('/logs/upload', formData);

      setUploadStatus('Successfully uploaded');
      showToast(`✓ Log "${selectedFile.name}" uploaded successfully!`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      fetchLogs();
    } catch (err) {
      showToast('Upload failed: ' + (err.response?.data?.message || err.message), 'warning');
      setUploadStatus('');
    } finally {
      setUploading(false);
    }
  };

  // Upload file and immediately run ML analysis
  const handleUploadAndAnalyze = async () => {
    if (!selectedFile || uploading) return;

    try {
      setUploading(true);
      setUploadStatus('1/2 Uploading log file...');
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await api.post('/logs/upload', formData);
      const newLog = res.data?.log;

      if (!newLog?._id) {
        throw new Error('Upload succeeded but no log identifier was returned.');
      }

      setUploadStatus('2/2 Analyzing log with Isolation Forest ML model...');
      const analyzeRes = await api.post(`/logs/${newLog._id}/analyze`);
      const result = analyzeRes.data?.result;

      showToast(
        `✓ Analyzed: ${result?.is_anomaly ? '⚠️ Anomaly Detected' : '✓ Normal Traffic'} (Score: ${Number(result?.anomaly_score || 0).toFixed(3)})`,
        result?.is_anomaly ? 'warning' : 'success'
      );

      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Immediately navigate to MLAnalysis to inspect results
      navigate(`/ml-analysis?logId=${newLog._id}`);
    } catch (err) {
      showToast('Process failed: ' + (err.response?.data?.message || err.message), 'warning');
      setUploadStatus('');
    } finally {
      setUploading(false);
    }
  };

  // Run analysis directly on any row in the table
  const handleAnalyzeRow = async (logId, logName) => {
    try {
      setAnalyzingRowId(logId);
      const res = await api.post(`/logs/${logId}/analyze`);
      const result = res.data?.result;

      showToast(
        `✓ "${logName}" analyzed: ${result?.is_anomaly ? '⚠️ Anomaly Detected' : '✓ Normal'} (Score: ${Number(result?.anomaly_score || 0).toFixed(3)})`,
        result?.is_anomaly ? 'warning' : 'success'
      );

      setLogs((prev) =>
        prev.map((l) =>
          l._id === logId
            ? {
                ...l,
                analysisStatus: 'analyzed',
                isAnomaly: result?.is_anomaly,
                anomalyScore: result?.anomaly_score,
                severity: result?.severity,
                analysisResult: {
                  summary: result?.summary,
                  total_lines_analyzed: result?.total_lines_analyzed,
                },
              }
            : l
        )
      );
    } catch (err) {
      showToast('Analysis error: ' + (err.response?.data?.message || err.message), 'warning');
    } finally {
      setAnalyzingRowId(null);
    }
  };

  // Quick sample log loader
  const handleLoadSample = async (type) => {
    const preset = SAMPLE_PRESETS[type];
    if (!preset) return;

    try {
      setUploadStatus('');
      await api.post('/logs/preset', {
        presetId: preset.id,
        fileName: preset.fileName,
        fileType: preset.fileType,
        sampleLines: preset.sampleLines,
        isAnomaly: preset.isAnomaly,
        severity: preset.isAnomaly ? 'high' : 'none',
        linesCount: preset.linesCount,
      });

      setUploadStatus('Successfully uploaded');
      showToast(`✓ "${preset.title}" added to your logs!`);
      fetchLogs();
    } catch (err) {
      showToast('Could not load sample log: ' + (err.response?.data?.message || err.message), 'warning');
    }
  };

  // Delete log from database
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;

    try {
      await api.delete(`/logs/${id}`);
      setLogs((prev) => prev.filter((l) => l._id !== id));
      showToast(`Deleted "${name}".`, 'info');
    } catch (err) {
      showToast('Failed to delete log: ' + (err.response?.data?.message || err.message), 'warning');
    }
  };

  // Filter logs by search query
  const filteredLogs = logs.filter((l) =>
    (l.originalName || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="lu-page-root">
      {/* Toast Notifications */}
      <div className="green-dash-toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`green-dash-toast ${t.type}`}>
            <span className="green-dash-toast-dot" />
            <span>{t.msg}</span>
          </div>
        ))}
      </div>

      <div className="lu-container">
        {/* Header Bar */}
        <header className="lu-header-bar">
          <div>
            <h1 className="lu-header-title">Log Upload</h1>
            <p className="ml-page-sub">
              Upload server logs to detect anomalies
            </p>
          </div>

          <div className="lu-header-actions">
            <button
              className="lu-btn-secondary"
              onClick={() => handleLoadSample('normal')}
              title="Add a sample normal activity log"
            >
              <span>+ Load Normal Sample</span>
            </button>
            <button
              className="lu-btn-secondary"
              onClick={() => handleLoadSample('anomaly')}
              title="Add a sample log containing failed login attempts"
            >
              <span>+ Load Anomaly Sample</span>
            </button>
          </div>
        </header>

        {/* MAIN UPLOAD CONTAINER */}
        <section className="lu-card lu-dropzone-card">
          <div className="lu-card-header">
            <div>
              <h3>Upload Log File</h3>
              <span className="lu-card-sub">Supported formats: .log, .txt, .csv</span>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".log,.txt,.csv"
            className="lu-hidden-input"
            onChange={handleInputChange}
          />

          {/* Select / drag file zone */}
          <div
            className={`lu-dropzone ${isDragOver ? 'dragover' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div style={{ fontSize: '36px', marginBottom: '10px' }}>📁</div>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', color: 'var(--lu-text-main)' }}>
              {selectedFile ? selectedFile.name : 'Select or drag a log file here'}
            </h4>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--lu-text-muted)' }}>
              {selectedFile
                ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                : 'Click to browse files (.log, .txt, .csv)'}
            </p>
          </div>

          {/* Selected File Details & Upload Button */}
          {selectedFile && (
            <div style={{ background: '#f8faf9', border: '1px solid #e8f1ed', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#0c3631' }}>
                  File Name: {selectedFile.name}
                </div>
                <div style={{ fontSize: '12px', color: '#526b65', marginTop: '2px' }}>
                  File Size: {(selectedFile.size / 1024).toFixed(1)} KB
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className="green-dash-btn-primary"
                  onClick={handleUploadAndAnalyze}
                  disabled={uploading}
                  style={{ background: 'linear-gradient(135deg, #0c3631, #00d68f)' }}
                >
                  {uploading ? (uploadStatus || 'Processing...') : '⚡ Upload & Analyze Immediately'}
                </button>
                <button
                  className="lu-btn-secondary"
                  onClick={handleUpload}
                  disabled={uploading}
                >
                  Upload Only
                </button>
                <button
                  className="lu-btn-secondary"
                  onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                  disabled={uploading}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Upload Status */}
          {uploadStatus && (
            <div style={{ background: '#e6f9f2', border: '1px solid #c3edd9', borderRadius: '10px', padding: '12px 16px', color: '#059669', fontSize: '13.5px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>✓</span>
              <span>{uploadStatus}</span>
            </div>
          )}
        </section>

        {/* UPLOADED LOGS TABLE CONTAINER */}
        <section className="lu-card">
          <div className="lu-card-header" style={{ marginBottom: '16px' }}>
            <div>
              <h3>Uploaded Logs ({logs.length})</h3>
              <span className="lu-card-sub">Existing log files stored in database</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input
                type="text"
                placeholder="Search logs by name..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{
                  background: '#f4f8f6',
                  border: '1px solid #c9dfd5',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  color: '#0c3631',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {loadingLogs ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#526b65' }}>
              <div className="ml-spinner" style={{ margin: '0 auto 12px auto' }} />
              <span>Loading logs...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#839b95' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>📂</div>
              <h4 style={{ margin: '0 0 6px 0', color: '#0c3631' }}>No logs found</h4>
              <p style={{ margin: 0, fontSize: '13px' }}>
                Upload a log file above to get started.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e8f1ed', color: '#526b65', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <th style={{ padding: '12px 14px' }}>File Name</th>
                    <th style={{ padding: '12px 14px' }}>File Size</th>
                    <th style={{ padding: '12px 14px' }}>Upload Date</th>
                    <th style={{ padding: '12px 14px' }}>ML Status</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => {
                    const isAnalyzed = log.analysisStatus === 'analyzed';
                    const isAnomaly = log.isAnomaly;
                    const dateStr = log.createdAt
                       ? new Date(log.createdAt).toLocaleDateString()
                      : 'Today';

                    return (
                      <tr
                        key={log._id}
                        style={{ borderBottom: '1px solid #f0f5f2' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8faf9')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <td style={{ padding: '14px', fontWeight: '700', color: '#0c3631' }}>
                          <span style={{ marginRight: '8px' }}>📄</span>
                          {log.originalName}
                        </td>
                        <td style={{ padding: '14px', color: '#526b65' }}>
                          {log.fileSize ? `${(log.fileSize / 1024).toFixed(1)} KB` : 'N/A'}
                        </td>
                        <td style={{ padding: '14px', color: '#839b95', fontSize: '12px' }}>
                          {dateStr}
                        </td>
                        <td style={{ padding: '14px' }}>
                          {isAnalyzed ? (
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                backgroundColor: isAnomaly ? '#ffedd5' : '#e6f9f2',
                                color: isAnomaly ? '#c2410c' : '#059669',
                              }}
                            >
                              {isAnomaly ? 'Anomaly' : 'Normal'}
                            </span>
                          ) : (
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                backgroundColor: '#f1f5f9',
                                color: '#64748b',
                              }}
                            >
                              Ready
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '8px' }}>
                            {isAnalyzed ? (
                              <button
                                className="green-dash-btn-primary"
                                onClick={() => navigate(`/ml-analysis?logId=${log._id}`)}
                                style={{ padding: '6px 14px', fontSize: '12px' }}
                              >
                                View Result
                              </button>
                            ) : (
                              <button
                                className="green-dash-btn-primary"
                                onClick={() => handleAnalyzeRow(log._id, log.originalName)}
                                disabled={analyzingRowId === log._id}
                                style={{
                                  padding: '6px 14px',
                                  fontSize: '12px',
                                  background: 'linear-gradient(135deg, #0c3631, #00d68f)',
                                }}
                              >
                                {analyzingRowId === log._id ? 'Analyzing...' : '⚡ Analyze Now'}
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(log._id, log.originalName)}
                              title="Delete log"
                              style={{
                                background: '#fff',
                                border: '1px solid #fecdd3',
                                color: '#e11d48',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                cursor: 'pointer',
                                fontSize: '12px',
                              }}
                            >
                              🗑️
                            </button>
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
