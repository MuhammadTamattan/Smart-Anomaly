import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './LogUpload.css';

const ALLOWED_EXTENSIONS = ['.log', '.txt', '.csv'];
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

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

const getFileIcon = (ext) => {
  if (ext === '.csv') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="16" y2="17" />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
};

const getStatusConfig = (status) => {
  switch (status) {
    case 'uploaded':
      return { label: 'Uploaded', className: 'status-uploaded' };
    case 'processing':
      return { label: 'Processing', className: 'status-processing' };
    case 'completed':
      return { label: 'Completed', className: 'status-completed' };
    case 'failed':
      return { label: 'Failed', className: 'status-failed' };
    default:
      return { label: status, className: 'status-uploaded' };
  }
};

export default function LogUpload() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const validateFile = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Unsupported file type. Accepted: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }
    if (file.size === 0) {
      return 'Empty files are not allowed';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`;
    }
    return null;
  };

  const handleFileSelect = (file) => {
    const error = validateFile(file);
    if (error) {
      setUploadError(error);
      setSelectedFile(null);
      return;
    }
    setUploadError('');
    setUploadSuccess(false);
    setSelectedFile(file);
  };

  const handleInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadError('');
    setUploadSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!selectedFile || uploading) return;

    try {
      setUploading(true);
      setUploadError('');
      setUploadSuccess(false);

      const formData = new FormData();
      formData.append('file', selectedFile);

      await api.post('/logs/upload', formData);

      setUploadSuccess(true);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchLogs();
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed. Please try again.';
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (deletingId) return;
    try {
      setDeletingId(id);
      await api.delete(`/logs/${id}`);
      setLogs((prev) => prev.filter((l) => l._id !== id));
    } catch {
      // silent
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Log Upload', path: '/log-upload', active: true },
    { label: 'ML Analysis', path: '/ml-analysis' },
    { label: 'Alerts', path: '/alerts' },
    { label: 'Settings', path: '#' },
  ];

  return (
    <div className="logupload">
      <div className="logupload-bg">
        <div className="logupload-orb logupload-orb-1" />
        <div className="logupload-orb logupload-orb-2" />
        <div className="logupload-grid" />
      </div>

      <nav className="logupload-navbar">
        <div className="logupload-nav-left">
          <button className="logupload-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="logupload-brand">
            <div className="logupload-logo">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <span className="logupload-title">SecureOps</span>
          </div>
        </div>
        <div className="logupload-nav-right">
          <div className="logupload-status">
            <span className="logupload-status-dot" />
            <span>System Online</span>
          </div>
          <div className="logupload-user">
            <div className="logupload-avatar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="logupload-username">{user?.name || 'Analyst'}</span>
          </div>
          <button className="logupload-logout" onClick={handleLogout}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <div className="logupload-body">
        {sidebarOpen && <div className="logupload-overlay" onClick={() => setSidebarOpen(false)} />}
        <aside className={`logupload-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="logupload-sidebar-nav">
            {sidebarItems.map((item) => (
              <button
                key={item.label}
                className={`logupload-sidebar-item ${item.active ? 'active' : ''}`}
                onClick={() => {
                  setSidebarOpen(false);
                  if (item.path !== '#') navigate(item.path);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        <main className="logupload-main">
          <div className="logupload-header">
            <h1>Log Upload</h1>
            <p>Upload security logs for analysis and anomaly detection</p>
          </div>

          <div className="logupload-content">
            <div className="logupload-left">
              <div className="logupload-upload-section">
                <div
                  ref={dropRef}
                  className={`logupload-dropzone ${isDragOver ? 'drag-over' : ''} ${selectedFile ? 'has-file' : ''}`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => !selectedFile && fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".log,.txt,.csv"
                    onChange={handleInputChange}
                    className="logupload-file-input"
                  />

                  {!selectedFile ? (
                    <div className="logupload-dropzone-content">
                      <div className="logupload-dropzone-icon">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                      </div>
                      <p className="logupload-dropzone-title">Drop security logs here</p>
                      <p className="logupload-dropzone-sub">or browse files from your computer</p>
                      <p className="logupload-dropzone-formats">Accepted: .log, .txt, .csv (max 50MB)</p>
                    </div>
                  ) : (
                    <div className="logupload-selected-file">
                      <div className="logupload-file-icon">
                        {getFileIcon('.' + selectedFile.name.split('.').pop().toLowerCase())}
                      </div>
                      <div className="logupload-file-info">
                        <span className="logupload-file-name">{selectedFile.name}</span>
                        <span className="logupload-file-meta">
                          {'.' + selectedFile.name.split('.').pop().toUpperCase()} &middot; {formatFileSize(selectedFile.size)}
                        </span>
                      </div>
                      <button
                        className="logupload-file-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile();
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {uploadError && (
                  <div className="logupload-error">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <span>{uploadError}</span>
                  </div>
                )}

                {uploadSuccess && (
                  <div className="logupload-success">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    <span>Log uploaded successfully</span>
                  </div>
                )}

                <button
                  className="logupload-btn"
                  disabled={!selectedFile || uploading}
                  onClick={handleUpload}
                >
                  {uploading ? (
                    <>
                      <span className="logupload-spinner" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Upload Log
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="logupload-right">
              <div className="logupload-history">
                <div className="logupload-history-header">
                  <h2>Upload History</h2>
                  <span className="logupload-history-count">{logs.length} files</span>
                </div>

                {loadingLogs ? (
                  <div className="logupload-history-loading">
                    <span className="logupload-spinner" />
                  </div>
                ) : logs.length === 0 ? (
                  <div className="logupload-history-empty">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <p>No security logs uploaded yet</p>
                    <span>Upload your first log file to begin analysis.</span>
                  </div>
                ) : (
                  <div className="logupload-history-list">
                    {logs.map((log) => {
                      const statusConf = getStatusConfig(log.status);
                      return (
                        <div key={log._id} className="logupload-history-item">
                          <div className="logupload-history-icon">
                            {getFileIcon(log.fileType)}
                          </div>
                          <div className="logupload-history-details">
                            <span className="logupload-history-name">{log.originalName}</span>
                            <span className="logupload-history-meta">
                              {log.fileType.toUpperCase()} &middot; {formatFileSize(log.fileSize)} &middot; {formatDate(log.createdAt)}
                            </span>
                          </div>
                          <span className={`logupload-history-status ${statusConf.className}`}>
                            {statusConf.label}
                          </span>
                          <button
                            className="logupload-history-delete"
                            onClick={() => handleDelete(log._id)}
                            disabled={deletingId === log._id}
                          >
                            {deletingId === log._id ? (
                              <span className="logupload-spinner-sm" />
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
