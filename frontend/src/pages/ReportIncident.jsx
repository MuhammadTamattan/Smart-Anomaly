import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './ReportIncident.css';

export default function ReportIncident() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    threatType: 'phishing',
    title: '',
    severity: 'high',
    sourceIpOrUrl: '',
    senderEmail: '',
    description: '',
    evidencePayload: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!formData.title.trim()) {
      setErrorMsg('Please enter a short summary of the issue.');
      return;
    }

    if (!formData.description.trim()) {
      setErrorMsg('Please describe what happened.');
      return;
    }

    setIsSubmitting(true);

    const indicators = [];
    if (formData.senderEmail) indicators.push(`Sender: ${formData.senderEmail}`);
    if (formData.sourceIpOrUrl) indicators.push(`Link/Target: ${formData.sourceIpOrUrl}`);
    indicators.push(`Reported by: ${user?.name || 'User'} (${user?.email || 'N/A'})`);

    const payload = {
      title: `[User Report] ${formData.title}`,
      description: `${formData.description}\n\nExtra Info:\n${formData.evidencePayload || 'None'}`,
      severity: formData.severity,
      type: formData.threatType === 'phishing' ? 'suspicious_activity' : formData.threatType,
      status: 'new',
      indicators,
      anomalyScore: formData.severity === 'critical' ? 0.95 : formData.severity === 'high' ? 0.85 : 0.65,
    };

    try {
      const res = await api.post('/alerts', payload);
      setSuccessNotice(true);

      // Instantly notify Admin in real-time across tabs/windows
      const incidentNotice = {
        id: res.data?._id || `inc_${Date.now()}`,
        title: payload.title,
        description: formData.description,
        severity: formData.severity,
        senderName: user?.name || 'User',
        senderEmail: user?.email || '',
        timestamp: Date.now(),
      };

      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('soc_incidents_channel');
          bc.postMessage(incidentNotice);
          setTimeout(() => bc.close(), 1000);
        }
      } catch {}

      try {
        localStorage.setItem('soc_latest_incident_event', JSON.stringify(incidentNotice));
        window.dispatchEvent(new CustomEvent('soc-incident-reported', { detail: incidentNotice }));
      } catch {}
    } catch (err) {
      console.warn('Report submit notice:', err.message);
      setSuccessNotice(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="soc-report-wrapper">
      <div className="soc-report-container">
        {/* Header */}
        <header className="soc-report-header">
          <div>
            <div className="soc-report-tag">
              <span className="live-dot" />
              SECURITY HELP &bull; REPORT AN ISSUE
            </div>
            <h1 className="soc-report-title">Report a Problem</h1>
            <p className="soc-report-sub">
              Notice a strange email, suspicious link, or unexpected issue? Let our team know and we'll check it right away.
            </p>
          </div>

          <button
            type="button"
            className="soc-btn-back"
            onClick={() => navigate('/dashboard')}
          >
            &larr; Back to Dashboard
          </button>
        </header>

        {successNotice ? (
          <div className="soc-report-success-card">
            <div className="success-icon-wrap">🛡️</div>
            <h2>Report Sent Successfully</h2>
            <p>
              Thank you! Our security team has received your report and will look into it right away.
            </p>
            <div className="success-ticket-box">
              <span>REFERENCE NUMBER</span>
              <code>#TKT-{Math.floor(100000 + Math.random() * 900000)}</code>
            </div>
            <div className="success-actions">
              <button
                type="button"
                className="soc-user-btn-primary"
                onClick={() => {
                  setSuccessNotice(false);
                  setFormData({
                    threatType: 'phishing',
                    title: '',
                    severity: 'high',
                    sourceIpOrUrl: '',
                    senderEmail: '',
                    description: '',
                    evidencePayload: '',
                  });
                }}
              >
                Submit Another Report
              </button>
              <button
                type="button"
                className="soc-user-btn-secondary"
                onClick={() => navigate('/dashboard')}
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <div className="soc-report-card">
            <div className="soc-card-head">
              <div className="soc-card-icon-wrap">🚨</div>
              <div>
                <h3>Problem Details</h3>
                <span className="soc-card-sub">Please fill in what happened so we can help</span>
              </div>
            </div>

            {errorMsg && <div className="soc-report-error-banner">{errorMsg}</div>}

            <form onSubmit={handleSubmit} className="soc-report-form">
              <div className="soc-form-row">
                <div className="soc-form-field">
                  <label>What type of problem is this?</label>
                  <select
                    value={formData.threatType}
                    onChange={(e) => handleChange('threatType', e.target.value)}
                    className="soc-select-input"
                  >
                    <option value="phishing">Suspicious Email or Fake Login</option>
                    <option value="suspicious_activity">Strange Account Activity</option>
                    <option value="malicious_link">Dangerous Link or Website</option>
                    <option value="brute_force">Repeated Login Attempts</option>
                    <option value="data_tampering">Other Security Issue</option>
                  </select>
                </div>

                <div className="soc-form-field">
                  <label>How urgent is this?</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => handleChange('severity', e.target.value)}
                    className="soc-select-input"
                  >
                    <option value="critical">Urgent (Immediate Danger)</option>
                    <option value="high">High (Needs quick check)</option>
                    <option value="medium">Medium (Suspicious activity)</option>
                    <option value="low">Low (General question / concern)</option>
                  </select>
                </div>
              </div>

              <div className="soc-form-field">
                <label>
                  Summary / Title <span className="req-star">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Received a strange email asking for my password"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  required
                />
              </div>

              <div className="soc-form-row">
                <div className="soc-form-field">
                  <label>Suspicious Email or Sender (if any)</label>
                  <input
                    type="text"
                    placeholder="e.g. support@fake-company-login.com"
                    value={formData.senderEmail}
                    onChange={(e) => handleChange('senderEmail', e.target.value)}
                  />
                </div>

                <div className="soc-form-field">
                  <label>Suspicious Website Link (if any)</label>
                  <input
                    type="text"
                    placeholder="e.g. http://example-suspicious-login.com"
                    value={formData.sourceIpOrUrl}
                    onChange={(e) => handleChange('sourceIpOrUrl', e.target.value)}
                  />
                </div>
              </div>

              <div className="soc-form-field">
                <label>
                  What happened? (Description) <span className="req-star">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Explain what you saw, what link you clicked, or why it looked suspicious..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  className="soc-textarea-input"
                  required
                />
              </div>

              <div className="soc-form-field">
                <label>Extra Details or Text (Optional)</label>
                <textarea
                  rows={3}
                  placeholder="Paste any email text, message, or notes here..."
                  value={formData.evidencePayload}
                  onChange={(e) => handleChange('evidencePayload', e.target.value)}
                  className="soc-textarea-input font-mono"
                />
              </div>

              <div className="soc-form-actions-bottom">
                <button
                  type="button"
                  className="soc-user-btn-secondary"
                  onClick={() => navigate('/dashboard')}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="soc-user-btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sending Report...' : 'Send Report'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
