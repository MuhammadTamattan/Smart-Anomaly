import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authCyberDeskImg from '../assets/auth-cyber-desk-register.png';
import './Register.css';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please provide a valid work email.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }
    if (!agreeTerms) {
      setError('Please agree to the Security Terms & Acceptable Use Policy.');
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-root register-layout">
      {/* LEFT SIDE: CYBERSECURITY WORKSPACE VISUAL (Mirrored from Login) */}
      <aside className="auth-visual-panel register-visual-panel" aria-label="Cybersecurity platform capabilities">
        <div
          className="auth-visual-bg"
          style={{ backgroundImage: `url(${authCyberDeskImg})` }}
        />
        <div className="auth-visual-overlay" />

        <div className="auth-visual-inner">
          {/* Top Tagline */}
          <div className="auth-visual-header">
            <h2 className="auth-visual-headline">
              <span className="headline-green">Smart</span>
              <br />
              Defense.
              <br />
              Unified
              <br />
              Protection.
            </h2>
            <div className="auth-visual-dash" />
            <p className="auth-visual-intro-text">
              Deploy autonomous anomaly detection across your hybrid infrastructure. Get end-to-end visibility into threats, telemetry, and critical alerts.
            </p>
          </div>

          {/* Bottom 3 Feature Highlights */}
          <div className="auth-features-row">
            <div className="auth-feature-card">
              <div className="auth-feat-icon-wrap" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d68f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <h3 className="auth-feat-title">Zero Trust Core</h3>
              <p className="auth-feat-desc">Continuous posture verification</p>
            </div>

            <div className="auth-feat-divider-line" aria-hidden="true" />

            <div className="auth-feature-card">
              <div className="auth-feat-icon-wrap" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d68f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <h3 className="auth-feat-title">Instant Alerts</h3>
              <p className="auth-feat-desc">Automated SOC triage & logs</p>
            </div>

            <div className="auth-feat-divider-line" aria-hidden="true" />

            <div className="auth-feature-card">
              <div className="auth-feat-icon-wrap" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d68f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="4" width="16" height="16" rx="2" />
                  <rect x="9" y="9" width="6" height="6" />
                  <line x1="9" y1="1" x2="9" y2="4" />
                  <line x1="15" y1="1" x2="15" y2="4" />
                  <line x1="9" y1="20" x2="9" y2="23" />
                  <line x1="15" y1="20" x2="15" y2="23" />
                  <line x1="20" y1="9" x2="23" y2="9" />
                  <line x1="20" y1="14" x2="23" y2="14" />
                  <line x1="1" y1="9" x2="4" y2="9" />
                  <line x1="1" y1="14" x2="4" y2="14" />
                </svg>
              </div>
              <h3 className="auth-feat-title">Neural Engine</h3>
              <p className="auth-feat-desc">Adaptive ML anomaly scoring</p>
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT SIDE: REGISTRATION FORM CONTAINER */}
      <main className="auth-form-panel register-form-panel" aria-label="Create your security account">
        {/* Angled Divider Element (Pointing left towards the dark photo) */}
        <div className="auth-angled-edge register-angled-edge" aria-hidden="true">
          <svg viewBox="0 0 40 1000" preserveAspectRatio="none" className="auth-edge-svg">
            <path d="M 40 0 L 38 0 L 4 500 L 38 1000 L 40 1000 Z" fill="#ffffff" />
            <path d="M 38 0 L 4 500 L 38 1000" fill="none" stroke="#00d68f" strokeWidth="4" />
          </svg>
        </div>

        <div className="auth-form-inner register-form-inner">
          {/* Top Brand Header */}
          <header className="auth-header-bar">
            <div className="auth-brand-lockup">
              <div className="auth-logo-badge" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <rect x="9" y="11" width="6" height="5" rx="1.2" fill="currentColor" />
                  <path d="M10 11V9a2 2 0 1 1 4 0v2" />
                </svg>
              </div>
              <div className="auth-brand-text">
                <span className="auth-brand-name">Smart Anomaly</span>
                <span className="auth-brand-sub">Detection System</span>
              </div>
            </div>

            <div className="auth-brand-tagline">
              <span>Monitor</span>
              <span className="tagline-dot">&bull;</span>
              <span>Analyze</span>
              <span className="tagline-dot">&bull;</span>
              <span>Protect</span>
              <span className="tagline-dash" />
            </div>
          </header>

          {/* Form Content */}
          <div className="auth-content-box register-content-box">
            <div className="auth-intro-block">
              <span className="auth-kicker">GET STARTED</span>
              <h1 className="auth-title">
                <span className="auth-title-highlight">Create</span> your account
              </h1>
              <p className="auth-subtitle">
                Set up your operator credentials to access anomaly telemetry and SOC monitoring.
              </p>
            </div>

            {error && (
              <div className="auth-error-alert" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form register-form-grid" noValidate>
              {/* Full Name Field */}
              <div className="auth-form-group">
                <label htmlFor="reg-name" className="auth-field-label">
                  Full Name
                </label>
                <div className="auth-input-container">
                  <span className="auth-input-icon" aria-hidden="true">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    id="reg-name"
                    type="text"
                    placeholder="e.g. Sarah Connor"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                    disabled={loading}
                    className="auth-input"
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="auth-form-group">
                <label htmlFor="reg-email" className="auth-field-label">
                  Work Email Address
                </label>
                <div className="auth-input-container">
                  <span className="auth-input-icon" aria-hidden="true">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M22 7l-10 6L2 7" />
                    </svg>
                  </span>
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="analyst@enterprise.io"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={loading}
                    className="auth-input"
                  />
                </div>
              </div>

              {/* Password Fields Row or Stash */}
              <div className="register-password-row">
                {/* Password Field */}
                <div className="auth-form-group">
                  <label htmlFor="reg-password" className="auth-field-label">
                    Password
                  </label>
                  <div className="auth-input-container">
                    <span className="auth-input-icon" aria-hidden="true">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </span>
                    <input
                      id="reg-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      minLength={6}
                      disabled={loading}
                      className="auth-input"
                    />
                    <button
                      type="button"
                      className="auth-toggle-visibility-btn"
                      onClick={() => setShowPassword((prev) => !prev)}
                      disabled={loading}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {showPassword ? (
                          <>
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </>
                        ) : (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className="auth-form-group">
                  <label htmlFor="reg-confirm-password" className="auth-field-label">
                    Confirm Password
                  </label>
                  <div className="auth-input-container">
                    <span className="auth-input-icon" aria-hidden="true">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="M9 12l2 2 4-4" />
                      </svg>
                    </span>
                    <input
                      id="reg-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      minLength={6}
                      disabled={loading}
                      className="auth-input"
                    />
                    <button
                      type="button"
                      className="auth-toggle-visibility-btn"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      disabled={loading}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {showConfirmPassword ? (
                          <>
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </>
                        ) : (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Policy Checkbox */}
              <div className="auth-options-row register-terms-row">
                <label className="auth-checkbox-label">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="auth-native-checkbox"
                  />
                  <span className="auth-styled-checkbox" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span className="auth-checkbox-text">
                    I agree to the Security Terms & Acceptable Use Policy
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button type="submit" className="auth-primary-submit-btn" disabled={loading}>
                {loading ? (
                  <span className="auth-btn-spinner" aria-hidden="true" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Login Callout */}
            <p className="auth-switch-footer">
              Already have an account?{' '}
              <Link to="/login" className="auth-switch-link">
                Sign in
              </Link>
            </p>
          </div>

          {/* Bottom Accent Line */}
          <div className="auth-bottom-accent-bar" aria-hidden="true" />
        </div>
      </main>
    </div>
  );
};

export default Register;