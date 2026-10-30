import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authCyberDeskImg from '../assets/auth-cyber-desk.png';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="auth-page-root login-layout">
      {/* LEFT SIDE: FORM CONTAINER */}
      <main className="auth-form-panel" aria-label="Sign in to your account">
        <div className="auth-form-inner">
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
          <div className="auth-content-box">
            <div className="auth-intro-block">
              <span className="auth-kicker">WELCOME BACK</span>
              <h1 className="auth-title">
                <span className="auth-title-highlight">Sign in</span> to your account
              </h1>
              <p className="auth-subtitle">
                Access your security dashboard and keep your systems safe from potential threats.
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

            <form onSubmit={handleSubmit} className="auth-form" noValidate>
              {/* Email / Username Field */}
              <div className="auth-form-group">
                <label htmlFor="email" className="auth-field-label">
                  Email or Username
                </label>
                <div className="auth-input-container">
                  <span className="auth-input-icon" aria-hidden="true">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your email or username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    disabled={loading}
                    className="auth-input"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="auth-form-group">
                <label htmlFor="password" className="auth-field-label">
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
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    disabled={loading}
                    className="auth-input"
                  />
                  <button
                    type="button"
                    className="auth-toggle-visibility-btn"
                    onClick={togglePassword}
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

              {/* Options: Remember me & Forgot Password */}
              <div className="auth-options-row">
                <label className="auth-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="auth-native-checkbox"
                  />
                  <span className="auth-styled-checkbox" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                  <span className="auth-checkbox-text">Remember me</span>
                </label>

                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Please contact your SOC security administrator to reset your credentials.'); }} className="auth-forgot-password-link">
                  Forgot password?
                </a>
              </div>

              {/* Submit Button */}
              <button type="submit" className="auth-primary-submit-btn" disabled={loading}>
                {loading ? (
                  <span className="auth-btn-spinner" aria-hidden="true" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            {/* Registration Callout */}
            <p className="auth-switch-footer">
              Don't have an account?{' '}
              <Link to="/register" className="auth-switch-link">
                Create account
              </Link>
            </p>
          </div>

          {/* Bottom Accent Line */}
          <div className="auth-bottom-accent-bar" aria-hidden="true" />
        </div>

        {/* Angled Divider Element */}
        <div className="auth-angled-edge" aria-hidden="true">
          <svg viewBox="0 0 40 1000" preserveAspectRatio="none" className="auth-edge-svg">
            <path d="M 0 0 L 2 0 L 36 500 L 2 1000 L 0 1000 Z" fill="#ffffff" />
            <path d="M 2 0 L 36 500 L 2 1000" fill="none" stroke="#00d68f" strokeWidth="4" />
          </svg>
        </div>
      </main>

      {/* RIGHT SIDE: CYBERSECURITY WORKSPACE VISUAL */}
      <aside className="auth-visual-panel" aria-label="Cybersecurity system highlights">
        <div
          className="auth-visual-bg"
          style={{ backgroundImage: `url(${authCyberDeskImg})` }}
        />
        <div className="auth-visual-overlay" />

        <div className="auth-visual-inner">
          {/* Top Tagline */}
          <div className="auth-visual-header">
            <h2 className="auth-visual-headline">
              <span className="headline-green">Better</span>
              <br />
              Detection.
              <br />
              Safer
              <br />
              Tomorrow.
            </h2>
            <div className="auth-visual-dash" />
            <p className="auth-visual-intro-text">
              Real-time telemetry and ML anomaly scoring to detect threats, intrusions, and system anomalies before they escalate.
            </p>
          </div>

          {/* Bottom 3 Feature Highlights */}
          <div className="auth-features-row">
            <div className="auth-feature-card">
              <div className="auth-feat-icon-wrap" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d68f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <rect x="10" y="11" width="4" height="4" rx="1" fill="#00d68f" />
                </svg>
              </div>
              <h3 className="auth-feat-title">Real-time Monitoring</h3>
              <p className="auth-feat-desc">Detect threats as they happen</p>
            </div>

            <div className="auth-feat-divider-line" aria-hidden="true" />

            <div className="auth-feature-card">
              <div className="auth-feat-icon-wrap" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d68f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </svg>
              </div>
              <h3 className="auth-feat-title">AI-Powered Analysis</h3>
              <p className="auth-feat-desc">Find unusual patterns</p>
            </div>

            <div className="auth-feat-divider-line" aria-hidden="true" />

            <div className="auth-feature-card">
              <div className="auth-feat-icon-wrap" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d68f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <h3 className="auth-feat-title">Faster Response</h3>
              <p className="auth-feat-desc">Reduce risk, minimize damage</p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default Login;