import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AppLayout.css';

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
    path: '/reports',
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
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mouseGlowRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleMouseMove = useCallback((e) => {
    if (mouseGlowRef.current) {
      mouseGlowRef.current.style.left = `${e.clientX}px`;
      mouseGlowRef.current.style.top = `${e.clientY}px`;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const getActiveLabel = () => {
    const match = menuItems.find((item) => location.pathname === item.path);
    return match ? match.label : 'Dashboard';
  };

  return (
    <div className="applayout">
      <div className="applayout-bg">
        <div className="applayout-orb applayout-orb-1" />
        <div className="applayout-orb applayout-orb-2" />
        <div className="applayout-orb applayout-orb-3" />
        <div className="applayout-grid" />
        <div className="applayout-particles">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="applayout-particle" style={{
              left: `${(i * 67 + 13) % 100}%`,
              top: `${(i * 43 + 7) % 100}%`,
              animationDelay: `${(i * 1.3) % 20}s`,
              animationDuration: `${15 + (i * 2.7) % 25}s`,
            }} />
          ))}
        </div>
        <div className="applayout-connections">
          <svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="none">
            <line x1="100" y1="200" x2="400" y2="350" className="applayout-conn-line" style={{ animationDelay: '0s' }} />
            <line x1="400" y1="350" x2="750" y2="180" className="applayout-conn-line" style={{ animationDelay: '2s' }} />
            <line x1="750" y1="180" x2="1100" y2="420" className="applayout-conn-line" style={{ animationDelay: '4s' }} />
            <line x1="1100" y1="420" x2="1500" y2="250" className="applayout-conn-line" style={{ animationDelay: '1s' }} />
            <line x1="1500" y1="250" x2="1800" y2="500" className="applayout-conn-line" style={{ animationDelay: '3s' }} />
            <line x1="200" y1="700" x2="550" y2="850" className="applayout-conn-line" style={{ animationDelay: '5s' }} />
            <line x1="550" y1="850" x2="900" y2="650" className="applayout-conn-line" style={{ animationDelay: '2.5s' }} />
            <line x1="900" y1="650" x2="1300" y2="800" className="applayout-conn-line" style={{ animationDelay: '1.5s' }} />
            <line x1="1300" y1="800" x2="1700" y2="600" className="applayout-conn-line" style={{ animationDelay: '3.5s' }} />
          </svg>
        </div>
      </div>

      <div className="applayout-mouse-glow" ref={mouseGlowRef} />

      <nav className="applayout-navbar">
        <div className="applayout-nav-left">
          <button className="applayout-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="applayout-brand">
            <div className="applayout-logo">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <span className="applayout-title">Smart Anomaly Detection & Alert System</span>
          </div>
        </div>
        <div className="applayout-nav-right">
          <div className="applayout-status">
            <span className="applayout-status-dot" />
            <span>Operational</span>
          </div>
          <div className="applayout-user">
            <div className="applayout-avatar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <span className="applayout-username">{user?.name || 'User'}</span>
          </div>
          <button onClick={handleLogout} className="applayout-logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        </div>
      </nav>

      <div className="applayout-body">
        {sidebarOpen && <div className="applayout-overlay" onClick={() => setSidebarOpen(false)} />}
        <aside className={`applayout-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <nav className="applayout-sidebar-nav">
            {menuItems.map((item, index) => (
              <button
                key={item.label}
                className={`applayout-sidebar-item ${getActiveLabel() === item.label ? 'active' : ''}`}
                style={{ animationDelay: `${index * 0.06}s` }}
                onClick={() => {
                  setSidebarOpen(false);
                  navigate(item.path);
                }}
              >
                {item.icon}
                <span>{item.label}</span>
                <span className="applayout-sidebar-tooltip">{item.tooltip}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="applayout-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
