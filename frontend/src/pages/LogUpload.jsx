import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { formatFileSize, formatDate, getFileIcon } from '../utils/helpers';
import './LogUpload.css';

const ALLOWED_EXTENSIONS = ['.log', '.txt', '.csv'];
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const getStatusConfig = (status) => {
  switch (status) {
    case 'uploaded':
      return { label: 'Uploaded', className: 'lu-status-uploaded' };
    case 'processing':
      return { label: 'Processing', className: 'lu-status-processing' };
    case 'completed':
      return { label: 'Completed', className: 'lu-status-completed' };
    case 'failed':
      return { label: 'Failed', className: 'lu-status-failed' };
    default:
      return { label: status, className: 'lu-status-uploaded' };
  }
};

export default function LogUpload() {
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

  return (
    <div className="lu-content">
      <div className="lu-header">
        <h1>Log Upload</h1>
        <p>Upload security logs for analysis and anomaly detection</p>
      </div>

      <div className="lu-layout">
        <div className="lu-left">
          <div className="lu-upload-section">
            <div
              ref={dropRef}
              className={`lu-dropzone ${isDragOver ? 'drag-over' : ''} ${selectedFile ? 'has-file' : ''}`}
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
                className="lu-file-input"
              />

              {!selectedFile ? (
                <div className="lu-dropzone-content">
                  <div className="lu-dropzone-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                  </div>
                  <p className="lu-dropzone-title">Drop security logs here</p>
                  <p className="lu-dropzone-sub">or browse files from your computer</p>
                  <p className="lu-dropzone-formats">Accepted: .log, .txt, .csv (max 50MB)</p>
                </div>
              ) : (
                <div className="lu-selected-file">
                  <div className="lu-file-icon">
                    {getFileIcon('.' + selectedFile.name.split('.').pop().toLowerCase())}
                  </div>
                  <div className="lu-file-info">
                    <span className="lu-file-name">{selectedFile.name}</span>
                    <span className="lu-file-meta">
                      {'.' + selectedFile.name.split('.').pop().toUpperCase()} &middot; {formatFileSize(selectedFile.size)}
                    </span>
                  </div>
                  <button
                    className="lu-file-remove"
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
              <div className="lu-error">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="lu-success">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <span>Log uploaded successfully</span>
              </div>
            )}

            <button
              className="lu-btn"
              disabled={!selectedFile || uploading}
              onClick={handleUpload}
            >
              {uploading ? (
                <>
                  <span className="lu-spinner" />
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

        <div className="lu-right">
          <div className="lu-history">
            <div className="lu-history-header">
              <h2>Upload History</h2>
              <span className="lu-history-count">{logs.length} files</span>
            </div>

            {loadingLogs ? (
              <div className="lu-history-loading">
                <span className="lu-spinner" />
              </div>
            ) : logs.length === 0 ? (
              <div className="lu-history-empty">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <p>No security logs uploaded yet</p>
                <span>Upload your first log file to begin analysis.</span>
              </div>
            ) : (
              <div className="lu-history-list">
                {logs.map((log) => {
                  const statusConf = getStatusConfig(log.status);
                  return (
                    <div key={log._id} className="lu-history-item">
                      <div className="lu-history-icon">
                        {getFileIcon(log.fileType)}
                      </div>
                      <div className="lu-history-details">
                        <span className="lu-history-name">{log.originalName}</span>
                        <span className="lu-history-meta">
                          {log.fileType.toUpperCase()} &middot; {formatFileSize(log.fileSize)} &middot; {formatDate(log.createdAt)}
                        </span>
                      </div>
                      <span className={`lu-history-status ${statusConf.className}`}>
                        {statusConf.label}
                      </span>
                      <button
                        className="lu-history-delete"
                        onClick={() => handleDelete(log._id)}
                        disabled={deletingId === log._id}
                      >
                        {deletingId === log._id ? (
                          <span className="lu-spinner-sm" />
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
    </div>
  );
}
