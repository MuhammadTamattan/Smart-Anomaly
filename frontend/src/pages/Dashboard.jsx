import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

const menuItems = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    tooltip: 'System Overview',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    label: 'Log Upload',
    path: '/log-upload',
    tooltip: 'Upload Security Logs',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    label: 'ML Analysis',
    path: '/ml-analysis',
    tooltip: 'AI Threat Detection',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z" />
        <circle cx="12" cy="15" r="2" />
      </svg>
    ),
  },
  {
    label: 'Alerts',
    path: '/alerts',
    tooltip: 'Active Security Incidents',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    label: 'Reports',
    path: '#',
    tooltip: 'Analytics & Reports',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    path: '#',
    tooltip: 'Platform Configuration',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

const statCards = [
  {
    label: 'Total Logs',
    value: '24,891',
    sub: 'Processed today',
    change: '+12.5%',
    positive: true,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    color: '#3b82f6',
  },
  {
    label: 'Threats Detected',
    value: '142',
    sub: 'Last 24 hours',
    change: '+3.2%',
    positive: false,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
    color: '#f59e0b',
  },
  {
    label: 'Active Alerts',
    value: '7',
    sub: 'Requires attention',
    change: '-2 from yesterday',
    positive: true,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
    color: '#ef4444',
  },
  {
    label: 'System Health',
    value: '99.9%',
    sub: 'All systems operational',
    change: '99.9% uptime',
    positive: true,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
    color: '#10b981',
  },
];

const threatTrendData = [12, 19, 8, 25, 14, 32, 18, 28, 22, 35, 16, 24, 30, 20, 27, 15, 21, 29, 11, 26, 33, 17, 23, 38, 13, 20, 28, 31, 19, 25];

const severityData = [
  { label: 'Critical', value: 18, color: '#ef4444' },
  { label: 'High', value: 35, color: '#f59e0b' },
  { label: 'Medium', value: 52, color: '#3b82f6' },
  { label: 'Low', value: 37, color: '#10b981' },
];

const threatFeed = [
  { id: 1, time: '12:04:23', source: 'Firewall', event: 'Blocked inbound connection from 203.0.113.42', severity: 'critical' },
  { id: 2, time: '12:03:18', source: 'IDS', event: 'SQL injection attempt detected on /api/login', severity: 'high' },
  { id: 3, time: '12:02:45', source: 'WAF', event: 'Rate limit exceeded for IP 198.51.100.7', severity: 'medium' },
  { id: 4, time: '12:01:30', source: 'ML Engine', event: 'Anomalous outbound traffic pattern identified', severity: 'high' },
  { id: 5, time: '12:00:12', source: 'Auth', event: 'Multiple failed login attempts from 192.168.1.105', severity: 'medium' },
  { id: 6, time: '11:58:55', source: 'Scanner', event: 'Port scan detected from external IP', severity: 'low' },
  { id: 7, time: '11:57:20', source: 'SIEM', event: 'Privilege escalation attempt on server-03', severity: 'critical' },
  { id: 8, time: '11:55:48', source: 'Endpoint', event: 'Malware signature match quarantined', severity: 'high' },
];

const attackTypes = [
  { label: 'Brute Force', value: 42, max: 50 },
  { label: 'SQL Injection', value: 28, max: 50 },
  { label: 'XSS', value: 19, max: 50 },
  { label: 'DDoS', value: 35, max: 50 },
  { label: 'Phishing', value: 15, max: 50 },
  { label: 'Ransomware', value: 8, max: 50 },
];

const loginAttempts = [
  { user: 'admin', ip: '192.168.1.10', status: 'success', time: '12:04' },
  { user: 'unknown', ip: '203.0.113.42', status: 'failed', time: '12:03' },
  { user: 'jsmith', ip: '10.0.0.55', status: 'success', time: '12:01' },
  { user: 'unknown', ip: '198.51.100.7', status: 'failed', time: '11:58' },
  { user: 'admin', ip: '192.168.1.10', status: 'success', time: '11:55' },
];

const recentActivity = [
  { id: 1, event: 'Brute force attempt detected from IP 192.168.1.45', time: '2 minutes ago', type: 'alert' },
  { id: 2, event: 'ML model retrained with 1,200 new samples', time: '15 minutes ago', type: 'resolved' },
  { id: 3, event: 'Anomalous traffic pattern on port 8080', time: '1 hour ago', type: 'anomaly' },
  { id: 4, event: 'Firewall rules updated successfully', time: '2 hours ago', type: 'resolved' },
  { id: 5, event: 'Suspicious login attempt from unknown device', time: '3 hours ago', type: 'alert' },
];

const aiMessages = [
  { id: 1, text: 'System scan complete. No critical threats in the last 15 minutes.', type: 'status' },
  { id: 2, text: 'ML model confidence: 97.3%. Current threat landscape is elevated.', type: 'alert' },
  { id: 3, text: 'Recommended: Review blocked IPs from the last hour for potential false positives.', type: 'info' },
  { id: 4, text: 'All sensors reporting nominal. Dashboard metrics refreshed.', type: 'status' },
  { id: 5, text: 'Anomaly detected: Unusual DNS query volume from subnet 10.0.3.0/24.', type: 'alert' },
];

const CircularProgress = ({ value, max = 100, size = 80, strokeWidth = 6, color, label }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const offset = circumference * (1 - pct);

  return (
    <div className="circular-progress">
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        <circle
          className="progress-ring"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="progress-value">{Math.round(pct * 100)}%</div>
      <div className="progress-label">{label}</div>
    </div>
  );
};

const Gauge = ({ value, max = 100, label }) => {
  const pct = Math.min(value / max, 1);
  const startAngle = -135;
  const endAngle = 135;
  const totalAngle = endAngle - startAngle;
  const angle = startAngle + totalAngle * pct;
  const cx = 100;
  const cy = 100;
  const r = 80;
  const needleLen = 60;

  const toRad = (deg) => (deg * Math.PI) / 180;
  const arcPath = (a1, a2) => {
    const x1 = cx + r * Math.cos(toRad(a1));
    const y1 = cy + r * Math.sin(toRad(a1));
    const x2 = cx + r * Math.cos(toRad(a2));
    const y2 = cy + r * Math.sin(toRad(a2));
    const large = a2 - a1 > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const bgPath = arcPath(startAngle, endAngle);
  const fillPath = arcPath(startAngle, angle);

  const nx = cx + needleLen * Math.cos(toRad(angle));
  const ny = cy + needleLen * Math.sin(toRad(angle));

  const hue = pct * 120;

  return (
    <div className="gauge-container">
      <svg className="gauge-svg" viewBox="0 0 200 110">
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        <path d={bgPath} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" strokeLinecap="round" />
        <path className="gauge-fill" d={fillPath} fill="none" stroke={`hsl(${hue}, 70%, 55%)`} strokeWidth="12" strokeLinecap="round" />
        <circle className="gauge-dot" cx={nx} cy={ny} r="5" fill={`hsl(${hue}, 70%, 55%)`} />
      </svg>
      <div className="gauge-value">{Math.round(pct * 100)}%</div>
      <div className="gauge-label">{label}</div>
    </div>
  );
};

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [feedOffset, setFeedOffset] = useState(0);
  const mainRef = useRef(null);
  const feedRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMouseMove = useCallback((e) => {
    setMousePos({ x: e.clientX, y: e.clientY });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  useEffect(() => {
    const interval = setInterval(() => {
      setFeedOffset((prev) => prev + 1);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCardMouseMove = useCallback((e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -6;
    const rotateY = ((x - centerX) / centerX) * 6;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
  }, []);

  const handleCardMouseLeave = useCallback((e) => {
    e.currentTarget.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)';
  }, []);

  const lineChartData = useMemo(() => {
    const data = threatTrendData;
    const w = 600;
    const h = 200;
    const pad = 10;
    const max = Math.max(...data);
    const step = (w - pad * 2) / (data.length - 1);
    const points = data.map((v, i) => ({
      x: pad + i * step,
      y: pad + (1 - v / max) * (h - pad * 2),
    }));
    const linePath = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
    const areaPath = linePath + ` L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`;
    return { points, linePath, areaPath, w, h };
  }, []);

  const donutData = useMemo(() => {
    const total = severityData.reduce((s, d) => s + d.value, 0);
    const r = 70;
    const circumference = 2 * Math.PI * r;
    let accum = 0;
    const segments = severityData.map((d) => {
      const pct = d.value / total;
      const dash = circumference * pct;
      const offset = -circumference * accum;
      accum += pct;
      return { ...d, dash, offset, pct };
    });
    return { segments, total, r, circumference };
  }, []);

  const now = new Date();
  const timestamp = now.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="dashboard">
      <div className="dashboard-bg">
        <div className="dash-orb dash-orb-1" />
        <div className="dash-orb dash-orb-2" />
        <div className="dash-orb dash-orb-3" />
        <div className="dash-grid" />
        <div className="dash-particles">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="dash-particle" style={{
              left: `${(i * 67 + 13) % 100}%`,
              top: `${(i * 43 + 7) % 100}%`,
              animationDelay: `${(i * 1.3) % 20}s`,
              animationDuration: `${15 + (i * 2.7) % 25}s`,
            }} />
          ))}
        </div>
        <div className="dash-connections">
          <svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="none">
            <line x1="100" y1="200" x2="400" y2="350" className="conn-line" style={{ animationDelay: '0s' }} />
            <line x1="400" y1="350" x2="750" y2="180" className="conn-line" style={{ animationDelay: '2s' }} />
            <line x1="750" y1="180" x2="1100" y2="420" className="conn-line" style={{ animationDelay: '4s' }} />
            <line x1="1100" y1="420" x2="1500" y2="250" className="conn-line" style={{ animationDelay: '1s' }} />
            <line x1="1500" y1="250" x2="1800" y2="500" className="conn-line" style={{ animationDelay: '3s' }} />
            <line x1="200" y1="700" x2="550" y2="850" className="conn-line" style={{ animationDelay: '5s' }} />
            <line x1="550" y1="850" x2="900" y2="650" className="conn-line" style={{ animationDelay: '2.5s' }} />
            <line x1="900" y1="650" x2="1300" y2="800" className="conn-line" style={{ animationDelay: '1.5s' }} />
            <line x1="1300" y1="800" x2="1700" y2="600" className="conn-line" style={{ animationDelay: '3.5s' }} />
          </svg>
        </div>
      </div>

      <div className="mouse-glow" style={{ left: mousePos.x, top: mousePos.y }} />

      <nav className="dashboard-navbar">
        <div className="navbar-left">
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="navbar-brand">
            <div className="navbar-logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <span className="navbar-title">Smart Anomaly Detection & Alert System</span>
          </div>
        </div>
        <div className="navbar-right">
          <div className="status-indicator">
            <span className="status-dot" />
            <span>Operational</span>
          </div>
          <div className="navbar-user">
            <div className="user-avatar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="user-name">{user?.name || 'User'}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-body">
        <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
          <nav className="sidebar-nav">
            {menuItems.map((item, index) => (
              <button
                key={item.label}
                className={`sidebar-item ${activeMenu === item.label ? 'active' : ''}`}
                style={{ animationDelay: `${index * 0.06}s` }}
                onClick={() => {
                  setActiveMenu(item.label);
                  setSidebarOpen(false);
                  if (item.path && item.path !== '#') navigate(item.path);
                }}
              >
                {item.icon}
                <span>{item.label}</span>
                <span className="sidebar-tooltip">{item.tooltip}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="dashboard-main" ref={mainRef}>
          <div className="main-header">
            <h1>Security Operations Center</h1>
            <p className="main-subtitle">Real-time threat monitoring and intelligent analysis</p>
            <span className="main-timestamp">{timestamp}</span>
          </div>

          <div className="stats-grid">
            {statCards.map((card, index) => (
              <div
                key={card.label}
                className="stat-card"
                style={{ animationDelay: `${0.1 + index * 0.1}s` }}
                onMouseMove={handleCardMouseMove}
                onMouseLeave={handleCardMouseLeave}
              >
                <div className="stat-card-glow" style={{ background: card.color }} />
                <div className="stat-icon-wrap" style={{ background: `${card.color}18`, color: card.color }}>
                  {card.icon}
                </div>
                <div className="stat-info">
                  <span className="stat-label">{card.label}</span>
                  <h3>{card.value}</h3>
                  <span className="stat-sub">{card.sub}</span>
                  <span className={`stat-change ${card.positive ? 'positive' : 'negative'}`}>
                    {card.change}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="charts-row">
            <div className="chart-card threat-trend">
              <div className="chart-header">
                <h2>Threat Trend</h2>
                <span>Last 30 days</span>
              </div>
              <svg className="line-svg" viewBox={`0 0 ${lineChartData.w} ${lineChartData.h}`}>
                <defs>
                  <linearGradient id="lineAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {[0, 1, 2, 3, 4].map((i) => (
                  <line key={i} x1="10" y1={10 + i * 45} x2="590" y2={10 + i * 45} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                ))}
                <path className="line-area" d={lineChartData.areaPath} fill="url(#lineAreaGrad)" />
                <path className="line-path" d={lineChartData.linePath} fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                {lineChartData.points.map((p, i) => (
                  <circle key={i} className="line-dot" cx={p.x} cy={p.y} r="3" fill="#6366f1" stroke="#0a0a1a" strokeWidth="1.5" />
                ))}
              </svg>
            </div>

            <div className="chart-card severity-chart">
              <div className="chart-header">
                <h2>Severity Distribution</h2>
                <span>Current quarter</span>
              </div>
              <div className="severity-chart-body">
                <svg className="donut-svg" viewBox="0 0 200 200">
                  {donutData.segments.map((seg, i) => (
                    <circle
                      key={i}
                      className="donut-segment"
                      cx="100"
                      cy="100"
                      r={donutData.r}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth="24"
                      strokeDasharray={`${seg.dash} ${donutData.circumference - seg.dash}`}
                      strokeDashoffset={seg.offset}
                      strokeLinecap="butt"
                    />
                  ))}
                  <text x="100" y="95" textAnchor="middle" fill="#f1f5f9" fontSize="28" fontWeight="700">
                    {donutData.total}
                  </text>
                  <text x="100" y="115" textAnchor="middle" fill="rgba(148,163,184,0.7)" fontSize="11">
                    Total Alerts
                  </text>
                </svg>
                <div className="donut-legend">
                  {donutData.segments.map((seg) => (
                    <div key={seg.label} className="legend-item">
                      <span className="legend-dot" style={{ background: seg.color }} />
                      <span>{seg.label}</span>
                      <span>{seg.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bottom-grid">
            <div className="bottom-left">
              <section className="activity-section">
                <div className="section-header">
                  <h2>Recent Activity</h2>
                  <span className="section-badge">Live</span>
                </div>
                <div className="timeline">
                  {recentActivity.map((item, index) => (
                    <div key={item.id} className="timeline-item" style={{ animationDelay: `${0.3 + index * 0.08}s` }}>
                      <div className="timeline-marker">
                        <span className={`timeline-dot ${item.type}`} />
                        {index < recentActivity.length - 1 && <span className="timeline-line" />}
                      </div>
                      <div className="timeline-content">
                        <p>{item.event}</p>
                        <span className="timeline-time">{item.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <section className="widget-card threat-feed-widget">
                <div className="chart-header">
                  <h2>Live Threat Feed</h2>
                  <span className="section-badge">Live</span>
                </div>
                <div className="feed-list" ref={feedRef}>
                  {threatFeed.map((item) => (
                    <div key={item.id} className="feed-item">
                      <span className="feed-time">{item.time}</span>
                      <span className={`feed-severity ${item.severity}`}>{item.severity}</span>
                      <span className="feed-source">{item.source}</span>
                      <span className="feed-event">{item.event}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="bottom-right">
              <section className="widget-card ai-assistant">
                <div className="ai-header">
                  <div className="ai-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a4 4 0 0 0-4 4v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-2V6a4 4 0 0 0-4-4z" />
                      <circle cx="12" cy="15" r="2" />
                    </svg>
                  </div>
                  <div>
                    <h3>AI Guardian</h3>
                    <span className="ai-status"><span className="ai-online" /> Online</span>
                  </div>
                  <span className="ai-confidence">97.3% confidence</span>
                </div>
                <div className="ai-messages">
                  {aiMessages.map((msg) => (
                    <div key={msg.id} className={`ai-msg ${msg.type}`}>
                      <p>{msg.text}</p>
                    </div>
                  ))}
                </div>
                <div className="ai-typing">
                  <span className="typing-dot" style={{ animationDelay: '0s' }} />
                  <span className="typing-dot" style={{ animationDelay: '0.2s' }} />
                  <span className="typing-dot" style={{ animationDelay: '0.4s' }} />
                </div>
              </section>

              <section className="widget-card attack-types">
                <div className="chart-header">
                  <h2>Attack Types</h2>
                  <span>This session</span>
                </div>
                <div className="attack-bars">
                  {attackTypes.map((item) => (
                    <div key={item.label} className="attack-bar-row">
                      <span className="attack-label">{item.label}</span>
                      <div className="attack-bar-track">
                        <div
                          className="attack-bar-fill"
                          style={{ width: `${(item.value / item.max) * 100}%` }}
                        />
                      </div>
                      <span className="attack-value">{item.value}</span>
                    </div>
                  ))}
                </div>
              </section>

              <div className="widget-row">
                <section className="widget-card system-health">
                  <div className="chart-header">
                    <h2>System Health</h2>
                  </div>
                  <div className="health-circles">
                    <CircularProgress value={99.9} size={72} strokeWidth={5} color="#10b981" label="CPU" />
                    <CircularProgress value={87.3} size={72} strokeWidth={5} color="#3b82f6" label="Memory" />
                    <CircularProgress value={64.8} size={72} strokeWidth={5} color="#8b5cf6" label="Disk" />
                    <CircularProgress value={92.1} size={72} strokeWidth={5} color="#06b6d4" label="Network" />
                  </div>
                </section>

                <section className="widget-card confidence-gauge">
                  <div className="chart-header">
                    <h2>ML Confidence</h2>
                  </div>
                  <Gauge value={97.3} max={100} label="Model Accuracy" />
                </section>
              </div>

              <section className="widget-card login-attempts">
                <div className="chart-header">
                  <h2>Recent Logins</h2>
                  <span>Last hour</span>
                </div>
                <table className="login-table">
                  <thead>
                    <tr className="login-header-row">
                      <th>User</th>
                      <th>IP Address</th>
                      <th>Status</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loginAttempts.map((row, i) => (
                      <tr key={i} className="login-row">
                        <td>{row.user}</td>
                        <td>{row.ip}</td>
                        <td>
                          <span className={`login-status ${row.status}`}>{row.status}</span>
                        </td>
                        <td>{row.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
