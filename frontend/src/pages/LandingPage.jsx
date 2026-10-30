import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleGetStarted = () => {
    navigate('/register');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-root">
      {/* 1. STICKY TOP NAVBAR */}
      <nav className={`landing-nav ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="landing-nav-container">
          {/* Brand Logo */}
          <div className="landing-brand" onClick={() => scrollToSection('hero')}>
            <div className="landing-logo-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#00d68f" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div className="landing-brand-text">
              <span className="brand-title">Smart Anomaly</span>
              <span className="brand-subtitle">Detection System</span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="landing-nav-links">
            <button onClick={() => scrollToSection('hero')} className="nav-link-btn">Home</button>
            <button onClick={() => scrollToSection('features')} className="nav-link-btn">Features</button>
            <button onClick={() => scrollToSection('how-it-works')} className="nav-link-btn">How It Works</button>
            <button onClick={() => { if (user) { navigate('/dashboard'); } else { scrollToSection('preview'); } }} className="nav-link-btn">Dashboard</button>
            <button onClick={() => scrollToSection('about')} className="nav-link-btn">About</button>
          </div>

          {/* Action Buttons */}
          <div className="landing-nav-actions">
            {user ? (
              <button className="landing-btn-primary" onClick={() => navigate('/dashboard')}>
                Go to Dashboard &rarr;
              </button>
            ) : (
              <>
                <button className="landing-btn-ghost" onClick={handleLogin}>
                  Login
                </button>
                <button className="landing-btn-primary" onClick={handleGetStarted}>
                  Get Started
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Hamburger */}
          <button
            className="landing-mobile-hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="landing-mobile-dropdown">
            <button onClick={() => scrollToSection('hero')} className="mobile-nav-item">Home</button>
            <button onClick={() => scrollToSection('features')} className="mobile-nav-item">Features</button>
            <button onClick={() => scrollToSection('how-it-works')} className="mobile-nav-item">How It Works</button>
            <button onClick={() => { setMobileMenuOpen(false); if (user) { navigate('/dashboard'); } else { scrollToSection('preview'); } }} className="mobile-nav-item">Dashboard</button>
            <button onClick={() => scrollToSection('about')} className="mobile-nav-item">About</button>
            <div className="mobile-nav-actions">
              {user ? (
                <button
                  className="landing-btn-primary w-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/dashboard');
                  }}
                >
                  Go to Dashboard &rarr;
                </button>
              ) : (
                <>
                  <button className="landing-btn-ghost w-full" onClick={handleLogin}>Login</button>
                  <button className="landing-btn-primary w-full" onClick={handleGetStarted}>Get Started</button>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* 2. HERO SECTION */}
      <section id="hero" className="landing-hero-section">
        <div className="landing-hero-backdrop-glow" />
        <div className="landing-container hero-grid">
          {/* Left Column: Headline & Description */}
          <div className="hero-content">
            <div className="hero-status-pill">
              <span className="pulse-dot-green" />
              <span>Next-Gen Cybersecurity Telemetry &bull; ML Engine</span>
            </div>

            <h1 className="hero-headline">
              Detect Anomalies Before They Become Threats.
            </h1>

            <p className="hero-description">
              Smart Anomaly Detection System uses machine learning and real-time log analysis to identify unusual patterns, detect potential security threats, and help protect your systems.
            </p>

            <div className="hero-cta-group">
              <button className="landing-btn-hero-primary" onClick={handleGetStarted}>
                <span>Get Started</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>

              <button className="landing-btn-hero-secondary" onClick={() => scrollToSection('features')}>
                <span>Learn More</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="hero-metrics-bar">
              <div className="metric-snippet">
                <span className="metric-val">99.9%</span>
                <span className="metric-label">System Uptime</span>
              </div>
              <div className="metric-divider" />
              <div className="metric-snippet">
                <span className="metric-val">&lt; 250ms</span>
                <span className="metric-label">Detection Latency</span>
              </div>
              <div className="metric-divider" />
              <div className="metric-snippet">
                <span className="metric-val">24/7</span>
                <span className="metric-label">Continuous Monitoring</span>
              </div>
            </div>
          </div>

          {/* Right Column: High-Fidelity Cyber Shield & Live Preview Card */}
          <div className="hero-visual">
            <div className="hero-card-frame">
              {/* Card Window Controls */}
              <div className="card-top-dots">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
                <span className="card-window-title">soc-telemetry-node // ACTIVE</span>
              </div>

              {/* Graphic Area */}
              <div className="hero-shield-display">
                <div className="shield-concentric-pulse" />
                <svg viewBox="0 0 160 160" className="hero-shield-svg">
                  {/* Outer glowing shield */}
                  <path
                    d="M80 18 L126 34 C126 88 106 122 80 142 C54 122 34 88 34 34 Z"
                    fill="url(#heroShieldGrad)"
                    stroke="#00d68f"
                    strokeWidth="2.5"
                    filter="drop-shadow(0 0 18px rgba(0, 214, 143, 0.45))"
                  />
                  {/* Inner Padlock */}
                  <rect x="70" y="74" width="20" height="18" rx="3" fill="#ffffff" />
                  <path d="M74 74 V67 A6 6 0 0 1 86 67 V74" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="80" cy="83" r="2" fill="#041a13" />

                  <defs>
                    <linearGradient id="heroShieldGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#00d68f" stopOpacity="0.85" />
                      <stop offset="50%" stopColor="#0a3d33" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#02140f" stopOpacity="0.95" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="shield-status-badge">
                  <span className="pulse-dot-green" />
                  <span>Isolation Forest Engine: Running</span>
                </div>
              </div>

              {/* Mini Preview Telemetry Data */}
              <div className="hero-mini-telemetry">
                <div className="telemetry-item">
                  <span className="tel-label">Threats Detected</span>
                  <span className="tel-val highlight-red">142</span>
                </div>
                <div className="telemetry-item">
                  <span className="tel-label">Logs Analyzed</span>
                  <span className="tel-val highlight-mint">24,891</span>
                </div>
                <div className="telemetry-item">
                  <span className="tel-label">Active Alerts</span>
                  <span className="tel-val highlight-amber">7</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section id="features" className="landing-features-section">
        <div className="landing-container">
          <div className="section-header-centered">
            <span className="section-pill-tag">INTELLIGENT DEFENSE</span>
            <h2 className="section-title">Engineered for Comprehensive System Protection</h2>
            <p className="section-subtitle">
              Leverage next-generation machine learning and automated cybersecurity workflows to identify threats across your entire digital surface.
            </p>
          </div>

          <div className="features-grid">
            {/* Feature 1 */}
            <div className="feature-card">
              <div className="feature-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 20V10" />
                  <path d="M12 20V4" />
                  <path d="M6 20v-6" />
                  <circle cx="18" cy="7" r="3" />
                  <circle cx="6" cy="11" r="3" />
                </svg>
              </div>
              <h3 className="feature-name">ML Anomaly Detection</h3>
              <p className="feature-desc">
                High-precision Isolation Forest algorithms detect multi-dimensional anomalous activity in server telemetry and identify zero-day threats without signature delays.
              </p>
              <div className="feature-tags">
                <span>Isolation Forest</span>
                <span>Unsupervised ML</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="feature-card">
              <div className="feature-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <h3 className="feature-name">Log Ingestion & Analysis</h3>
              <p className="feature-desc">
                Ingest CSV, JSON, Apache, and firewall logs seamlessly. Parse IP addresses, HTTP status codes, and request volumes to uncover abnormal spikes in milliseconds.
              </p>
              <div className="feature-tags">
                <span>Batch Upload</span>
                <span>Payload Parsing</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="feature-card">
              <div className="feature-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
              </div>
              <h3 className="feature-name">Website Scanner</h3>
              <p className="feature-desc">
                Audit public URLs for potential exploits, including SQL injection flags, malicious scripts, insecure headers, and SSL certificate vulnerabilities.
              </p>
              <div className="feature-tags">
                <span>URL Inspection</span>
                <span>Header Hygiene</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="feature-card">
              <div className="feature-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <h3 className="feature-name">Real-Time Alerts</h3>
              <p className="feature-desc">
                Receive instant priority alerts categorized into Critical, High, Medium, and Low severity. Never miss a suspicious login or distributed attack attempt.
              </p>
              <div className="feature-tags">
                <span>Instant Push</span>
                <span>Severity Filtering</span>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="feature-card">
              <div className="feature-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                </svg>
              </div>
              <h3 className="feature-name">Comprehensive Reports</h3>
              <p className="feature-desc">
                Generate executive audit summaries, inspect anomaly distributions, and export system security telemetry in CSV and JSON formats.
              </p>
              <div className="feature-tags">
                <span>Audit Export</span>
                <span>Security Metrics</span>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="feature-card">
              <div className="feature-icon-box">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="10" rx="3" />
                  <circle cx="12" cy="5" r="2" />
                  <path d="M12 7v4" />
                  <line x1="8" y1="16" x2="8.01" y2="16" strokeWidth="3" />
                  <line x1="16" y1="16" x2="16.01" y2="16" strokeWidth="3" />
                </svg>
              </div>
              <h3 className="feature-name">AI Security Assistant</h3>
              <p className="feature-desc">
                Interactive floating SOC assistant trained on live security telemetry to explain complex anomaly scores, triage incident reports, and advise remediation.
              </p>
              <div className="feature-tags">
                <span>LLM Copilot</span>
                <span>Automated Triage</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="landing-steps-section">
        <div className="landing-container">
          <div className="section-header-centered">
            <span className="section-pill-tag">THE DETECTION PIPELINE</span>
            <h2 className="section-title">How It Works in 4 Steps</h2>
            <p className="section-subtitle">
              From raw logs to threat resolution with automated intelligence.
            </p>
          </div>

          <div className="steps-container">
            {/* Step 1 */}
            <div className="step-card">
              <div className="step-badge">01</div>
              <div className="step-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00d68f" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <h3 className="step-title">Upload Logs</h3>
              <p className="step-desc">
                Submit log files from web servers, network firewalls, or applications via secure web upload or API ingestion.
              </p>
            </div>

            <div className="step-connector">&rarr;</div>

            {/* Step 2 */}
            <div className="step-card">
              <div className="step-badge">02</div>
              <div className="step-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00d68f" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              </div>
              <h3 className="step-title">Analyze Activity</h3>
              <p className="step-desc">
                The machine learning engine parses timestamps, IP frequencies, and request features to map baseline activity.
              </p>
            </div>

            <div className="step-connector">&rarr;</div>

            {/* Step 3 */}
            <div className="step-card">
              <div className="step-badge">03</div>
              <div className="step-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00d68f" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3 className="step-title">Detect Threats</h3>
              <p className="step-desc">
                Outliers receive anomaly scores. Critical security incidents trigger real-time alerts with recommended actions.
              </p>
            </div>

            <div className="step-connector">&rarr;</div>

            {/* Step 4 */}
            <div className="step-card">
              <div className="step-badge">04</div>
              <div className="step-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00d68f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h3 className="step-title">Triage & Resolve</h3>
              <p className="step-desc">
                Review alert telemetry, consult the AI Assistant for diagnostic insights, mark threats resolved, and generate audit reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SECURITY DASHBOARD PREVIEW SECTION */}
      <section id="preview" className="landing-preview-section">
        <div className="landing-container">
          <div className="section-header-centered">
            <span className="section-pill-tag">UNIFIED CONTROL CENTER</span>
            <h2 className="section-title">Powerful Real-Time SOC Intelligence</h2>
            <p className="section-subtitle">
              An intuitive interface designed to monitor threat distribution, live alerts, and anomaly trends at a single glance.
            </p>
          </div>

          {/* Interactive Mock Dashboard Shell Mirroring the Reference */}
          <div className="dashboard-preview-window">
            {/* Top Mac Window Controls */}
            <div className="preview-window-bar">
              <div className="preview-dots">
                <span className="dot dot-red" />
                <span className="dot dot-yellow" />
                <span className="dot dot-green" />
              </div>
              <div className="preview-window-search">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>Search anything...</span>
              </div>
              <div className="preview-window-user">
                <span className="preview-avatar">A</span>
                <span>Admin</span>
              </div>
            </div>

            {/* Mock Dashboard Body */}
            <div className="preview-dashboard-body">
              {/* Left Mini Sidebar */}
              <div className="preview-sidebar">
                <div className="preview-brand-row">
                  <span className="preview-mini-logo">🛡️</span>
                  <div className="preview-brand-texts">
                    <strong>Smart Anomaly</strong>
                    <small>DETECTOR</small>
                  </div>
                </div>

                <div className="preview-nav-items">
                  <div className="preview-nav-item active">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
                    <span>Dashboard</span>
                  </div>
                  <div className="preview-nav-item">
                    <span>ML Analysis</span>
                  </div>
                  <div className="preview-nav-item">
                    <span>Log Upload</span>
                  </div>
                  <div className="preview-nav-item">
                    <span>Website Scanner</span>
                  </div>
                  <div className="preview-nav-item">
                    <span>Alerts</span>
                  </div>
                </div>
              </div>

              {/* Main Content Preview */}
              <div className="preview-main-canvas">
                {/* Welcome Card */}
                <div className="preview-welcome-banner">
                  <div>
                    <h4>Welcome back, Admin!</h4>
                    <p>Your system is being monitored 24/7 for potential threats.</p>
                  </div>
                  <div className="preview-status-pill">
                    <span className="pulse-dot-green" />
                    <span>System Status: Operational</span>
                  </div>
                </div>

                {/* 4 Quick Stat Cards */}
                <div className="preview-stat-row">
                  <div className="preview-stat-card">
                    <span className="p-num">24,891</span>
                    <span className="p-label">Total Logs</span>
                    <span className="p-sub">&uarr; +12% this week</span>
                  </div>
                  <div className="preview-stat-card">
                    <span className="p-num text-red">142</span>
                    <span className="p-label">Threats Detected</span>
                    <span className="p-sub text-red">&uarr; +5% this week</span>
                  </div>
                  <div className="preview-stat-card">
                    <span className="p-num text-amber">7</span>
                    <span className="p-label">Active Alerts</span>
                    <span className="p-sub text-amber">&uarr; +2% this week</span>
                  </div>
                  <div className="preview-stat-card">
                    <span className="p-num text-teal">99.9%</span>
                    <span className="p-label">System Uptime</span>
                    <span className="p-sub text-mint">&uarr; Operational</span>
                  </div>
                </div>

                {/* Simulated Chart Waveform */}
                <div className="preview-chart-box">
                  <div className="preview-chart-header">
                    <span>Security Overview</span>
                    <span className="text-mint">&bull; Live ML Inference</span>
                  </div>
                  <svg viewBox="0 0 500 70" className="preview-waveform-svg">
                    <path
                      d="M 10 50 Q 80 15, 150 35 T 280 20 T 400 40 T 490 25"
                      fill="none"
                      stroke="#00d68f"
                      strokeWidth="2.5"
                    />
                    <path
                      d="M 10 60 Q 90 40, 160 50 T 290 45 T 410 55 T 490 48"
                      fill="none"
                      stroke="#00b4d8"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Overlay button */}
            <div className="preview-window-overlay">
              <button className="landing-btn-hero-primary" onClick={() => navigate('/dashboard')}>
                <span>Launch Live System</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. ABOUT SECTION */}
      <section id="about" className="landing-about-section">
        <div className="landing-container">
          <div className="about-grid">
            <div className="about-text-col">
              <span className="section-pill-tag">SECURITY FOUNDATION</span>
              <h2 className="section-title">Designed for Enterprise-Grade Precision</h2>
              <p className="about-body">
                Modern cyber threats evolve faster than static signature rulebooks. Smart Anomaly Detection combines machine learning algorithms with automated website scanning and real-time event telemetry to give security teams proactive defenses before vulnerabilities are exploited.
              </p>
              <div className="about-highlights">
                <div className="about-highlight-item">
                  <span className="highlight-icon">✓</span>
                  <div>
                    <strong>Unsupervised Outlier Detection</strong>
                    <p>Detect subtle deviations without requiring prior labelled attack samples.</p>
                  </div>
                </div>
                <div className="about-highlight-item">
                  <span className="highlight-icon">✓</span>
                  <div>
                    <strong>Integrated Website Scanner</strong>
                    <p>Evaluate domains against common injection, cross-site, and SSL risks.</p>
                  </div>
                </div>
                <div className="about-highlight-item">
                  <span className="highlight-icon">✓</span>
                  <div>
                    <strong>Role-Based Access & Audit Logging</strong>
                    <p>Granular privileges for Administrators and Security Analysts.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="about-stats-col">
              <div className="about-stat-box">
                <span className="about-big-num">24/7</span>
                <span className="about-label">Telemetry Protection</span>
                <p className="about-subtext">Continuous real-time anomaly surveillance</p>
              </div>
              <div className="about-stat-box">
                <span className="about-big-num">&lt;0.01%</span>
                <span className="about-label">False Positive Target</span>
                <p className="about-subtext">Tunable contamination thresholds</p>
              </div>
              <div className="about-stat-box">
                <span className="about-big-num">100%</span>
                <span className="about-label">Web Standard APIs</span>
                <p className="about-subtext">REST endpoints with robust JWT authorization</p>
              </div>
              <div className="about-stat-box">
                <span className="about-big-num">Instant</span>
                <span className="about-label">Threat Alerting</span>
                <p className="about-subtext">Cross-tab broadcast event notifications</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FINAL CALL TO ACTION (CTA) */}
      <section className="landing-cta-section">
        <div className="landing-container">
          <div className="cta-banner">
            <div className="cta-content">
              <h2 className="cta-heading">Stronger Security. A Safer Tomorrow.</h2>
              <p className="cta-sub">
                Protect your digital infrastructure with real-time machine learning anomaly detection today.
              </p>
            </div>
            <div className="cta-actions">
              <button className="landing-btn-hero-primary" onClick={handleGetStarted}>
                <span>Get Started Now</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
              <button className="landing-btn-ghost" onClick={handleLogin}>
                Sign In
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="landing-footer">
        <div className="landing-container footer-content">
          <div className="footer-brand-col">
            <div className="landing-brand">
              <div className="landing-logo-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d68f" strokeWidth="2.2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <div className="landing-brand-text">
                <span className="brand-title">Smart Anomaly</span>
                <span className="brand-subtitle">Detection System</span>
              </div>
            </div>
            <p className="footer-tagline">
              Intelligent anomaly detection and real-time security management for modern enterprise systems.
            </p>
            <div className="footer-status">
              <span className="pulse-dot-green" />
              <span>All Systems Operational &bull; 99.9% Telemetry Uptime</span>
            </div>
          </div>

          <div className="footer-links-col">
            <span className="footer-group-title">Platform</span>
            <button onClick={() => scrollToSection('features')} className="footer-link">ML Detection</button>
            <button onClick={() => scrollToSection('features')} className="footer-link">Log Analysis</button>
            <button onClick={() => scrollToSection('features')} className="footer-link">Website Scanner</button>
            <button onClick={() => scrollToSection('features')} className="footer-link">Real-time Alerts</button>
          </div>

          <div className="footer-links-col">
            <span className="footer-group-title">Navigation</span>
            <button onClick={() => scrollToSection('hero')} className="footer-link">Home</button>
            <button onClick={() => scrollToSection('how-it-works')} className="footer-link">How It Works</button>
            <button onClick={() => scrollToSection('preview')} className="footer-link">Dashboard Preview</button>
            <button onClick={() => scrollToSection('about')} className="footer-link">About</button>
          </div>

          <div className="footer-links-col">
            <span className="footer-group-title">Access</span>
            <button onClick={handleLogin} className="footer-link">Sign In</button>
            <button onClick={handleGetStarted} className="footer-link">Create Account</button>
            {user ? (
              <button onClick={() => navigate('/dashboard')} className="footer-link">Dashboard</button>
            ) : (
              <button onClick={() => navigate('/settings')} className="footer-link">Settings</button>
            )}
          </div>
        </div>

        <div className="footer-bottom-bar">
          <div className="landing-container bottom-bar-inner">
            <span>&copy; {new Date().getFullYear()} Smart Anomaly Detection System. All rights reserved.</span>
            <span>Detect. Analyze. Protect.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
