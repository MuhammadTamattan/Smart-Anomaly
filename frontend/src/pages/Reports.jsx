import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Reports.css';

const DEFAULT_REPORT_DATA = {
  summary: {
    totalLogs: 0,
    analyzedLogs: 0,
    anomalyLogs: 0,
    totalAlerts: 0,
    resolvedAlerts: 0,
  },
};

export default function Reports() {
  const navigate = useNavigate();

  const [data, setData] = useState(DEFAULT_REPORT_DATA);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Toast notification helper
  const showToast = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const [reportRes, logsRes] = await Promise.allSettled([
        api.get('/reports/summary'),
        api.get('/logs'),
      ]);

      if (reportRes.status === 'fulfilled' && reportRes.value?.data) {
        setData(reportRes.value.data);
      }
      if (logsRes.status === 'fulfilled' && Array.isArray(logsRes.value?.data)) {
        setLogs(logsRes.value.data);
      }
    } catch {
      setData(DEFAULT_REPORT_DATA);
    } finally {
      setLoading(false);
    }
  };

  const totalLogs = data.summary?.totalLogs ?? logs.length ?? 0;
  const anomalyLogs = data.summary?.anomalyLogs ?? logs.filter((l) => l.isAnomaly).length ?? 0;
  const totalAlerts = data.summary?.totalAlerts ?? 0;
  const resolvedAlerts = data.summary?.resolvedAlerts ?? 0;

  const handleExport = useCallback(
    async (format) => {
      try {
        setExporting(true);
        showToast(`Preparing ${format.toUpperCase()} report...`, 'info');

        let content = '';
        let mimeType = 'text/plain';

        if (format === 'csv') {
          mimeType = 'text/csv';
          content =
            'Log Name,Result,Score,Date\n' +
            logs
              .map(
                (l) =>
                  `"${l.originalName}","${l.isAnomaly ? 'Anomaly' : 'Normal'}",${l.anomalyScore !== null && l.anomalyScore !== undefined ? Number(l.anomalyScore).toFixed(3) : '0.000'},"${l.createdAt}"`
              )
              .join('\n');
        } else {
          mimeType = 'application/json';
          content = JSON.stringify(
            {
              summary: {
                totalLogs,
                anomalyLogs,
                totalAlerts,
                resolvedAlerts,
              },
              recentAnalysis: logs.map((l) => ({
                logName: l.originalName,
                result: l.isAnomaly ? 'Anomaly' : 'Normal',
                score: l.anomalyScore !== null && l.anomalyScore !== undefined ? Number(l.anomalyScore).toFixed(3) : '0.000',
                date: l.createdAt,
              })),
            },
            null,
            2
          );
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `anomaly_report_${new Date().toISOString().slice(0, 10)}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        showToast(`✓ ${format.toUpperCase()} report downloaded!`);
      } catch (err) {
        showToast('Export failed: ' + err.message, 'warning');
      } finally {
        setExporting(false);
      }
    },
    [logs, totalLogs, anomalyLogs, totalAlerts, resolvedAlerts, showToast]
  );

  return (
    <div className="rpt-page-root">
      {/* Toast Notifications */}
      <div className="green-dash-toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`green-dash-toast ${t.type}`}>
            <span className="green-dash-toast-dot" />
            <span>{t.msg}</span>
          </div>
        ))}
      </div>

      <div className="rpt-container">
        {/* Header Bar */}
        <header className="rpt-header-bar">
          <div>
            <h1 className="rpt-header-title">Reports</h1>
            <p className="ml-page-sub">
              Summary and reports of analyzed logs and anomalies
            </p>
          </div>

          <div className="rpt-header-actions">
            <button
              className="rpt-btn-secondary"
              onClick={() => handleExport('csv')}
              disabled={exporting}
              title="Download CSV report"
            >
              <span>Export CSV</span>
            </button>
            <button
              className="rpt-btn-primary"
              onClick={() => handleExport('json')}
              disabled={exporting}
              title="Download JSON report"
            >
              <span>Export JSON</span>
            </button>
          </div>
        </header>

        {/* TOP EXISTING CONTAINERS */}
        <section className="rpt-metric-row">
          <div className="rpt-metric-card">
            <div className="rpt-metric-meta">
              <span className="rpt-metric-lbl">Total Logs</span>
              <div className="rpt-metric-val-wrap">
                <span className="rpt-metric-num">{totalLogs}</span>
                <span className="rpt-metric-unit">logs</span>
              </div>
            </div>
          </div>

          <div className="rpt-metric-card">
            <div className="rpt-metric-meta">
              <span className="rpt-metric-lbl">Anomalies Detected</span>
              <div className="rpt-metric-val-wrap">
                <span className="rpt-metric-num">{anomalyLogs}</span>
                <span className="rpt-metric-unit">anomalies</span>
              </div>
            </div>
          </div>

          <div className="rpt-metric-card">
            <div className="rpt-metric-meta">
              <span className="rpt-metric-lbl">Total Alerts</span>
              <div className="rpt-metric-val-wrap">
                <span className="rpt-metric-num">{totalAlerts}</span>
                <span className="rpt-metric-unit">alerts</span>
              </div>
            </div>
          </div>

          <div className="rpt-metric-card">
            <div className="rpt-metric-meta">
              <span className="rpt-metric-lbl">Resolved Alerts</span>
              <div className="rpt-metric-val-wrap">
                <span className="rpt-metric-num">{resolvedAlerts}</span>
                <span className="rpt-metric-unit">resolved</span>
              </div>
            </div>
          </div>
        </section>

        {/* PROJECT SUMMARY CONTAINER */}
        <section className="lu-card">
          <div className="lu-card-header" style={{ marginBottom: '8px' }}>
            <h3>Project Summary</h3>
          </div>

          <p style={{ fontSize: '15px', color: '#0c3631', lineHeight: '1.5', margin: 0, fontWeight: '500' }}>
            {totalLogs} log files have been analyzed and {anomalyLogs} anomalies were detected.
          </p>
        </section>

        {/* RECENT ANALYSIS CONTAINER / TABLE */}
        <section className="lu-card">
          <div className="lu-card-header" style={{ marginBottom: '16px' }}>
            <div>
              <h3>Recent Analysis</h3>
              <span className="lu-card-sub">Analyzed log records</span>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#526b65' }}>
              <div className="ml-spinner" style={{ margin: '0 auto 12px auto' }} />
              <span>Loading reports...</span>
            </div>
          ) : logs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: '#839b95' }}>
              <p style={{ margin: 0 }}>No analysis records found.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e8f1ed', color: '#526b65', fontSize: '11px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 14px' }}>Log Name</th>
                    <th style={{ padding: '12px 14px' }}>Result</th>
                    <th style={{ padding: '12px 14px' }}>Score</th>
                    <th style={{ padding: '12px 14px' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const isAnomaly = Boolean(log.isAnomaly);
                    const resultText = log.analysisStatus === 'analyzed'
                      ? (isAnomaly ? 'Anomaly' : 'Normal')
                      : 'Ready';
                    const scoreText = log.anomalyScore !== null && log.anomalyScore !== undefined
                      ? Number(log.anomalyScore).toFixed(3)
                      : '0.000';
                    const dateText = log.createdAt
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
                          {log.originalName}
                        </td>
                        <td style={{ padding: '14px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '3px 8px',
                              borderRadius: '5px',
                              fontSize: '11px',
                              fontWeight: '700',
                              backgroundColor: isAnomaly ? '#ffedd5' : '#e6f9f2',
                              color: isAnomaly ? '#c2410c' : '#059669',
                            }}
                          >
                            {resultText}
                          </span>
                        </td>
                        <td style={{ padding: '14px', color: '#ea580c', fontWeight: '600' }}>
                          {scoreText}
                        </td>
                        <td style={{ padding: '14px', color: '#839b95', fontSize: '12px' }}>
                          {dateText}
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
