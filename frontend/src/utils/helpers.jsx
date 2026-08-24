export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

export const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTimeAgo = (dateStr) => {
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

export const getFileIcon = (ext) => {
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

export const getSeverityConfig = (severity) => {
  switch (severity) {
    case 'critical':
      return { label: 'CRITICAL', color: '#ef4444' };
    case 'high':
      return { label: 'HIGH', color: '#f59e0b' };
    case 'medium':
      return { label: 'MEDIUM', color: '#3b82f6' };
    case 'low':
      return { label: 'LOW', color: '#10b981' };
    case 'none':
      return { label: 'NONE', color: '#6b7280' };
    default:
      return { label: '--', color: '#6b7280' };
  }
};

export const getStatusConfig = (status) => {
  switch (status) {
    case 'uploaded':
      return { label: 'Uploaded' };
    case 'processing':
      return { label: 'Processing' };
    case 'completed':
      return { label: 'Completed' };
    case 'analyzed':
      return { label: 'Analyzed' };
    case 'failed':
      return { label: 'Failed' };
    case 'new':
      return { label: 'New' };
    case 'investigating':
      return { label: 'Investigating' };
    case 'resolved':
      return { label: 'Resolved' };
    case 'pending':
      return { label: 'Pending' };
    default:
      return { label: status || '--' };
  }
};

export const getTypeLabel = (type) => {
  switch (type) {
    case 'anomaly_detected': return 'Anomaly Detection';
    case 'brute_force': return 'Brute Force Attack';
    case 'sql_injection': return 'SQL Injection';
    case 'port_scan': return 'Port Scanning';
    case 'high_error_rate': return 'High Error Rate';
    case 'suspicious_activity': return 'Suspicious Activity';
    case 'malware': return 'Malware Detected';
    case 'intrusion': return 'Intrusion Attempt';
    default: return type?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Unknown';
  }
};
