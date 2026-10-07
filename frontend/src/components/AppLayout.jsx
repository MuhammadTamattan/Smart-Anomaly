import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AppLayout.css';

const menuItems = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 8.5 4 21 20 21 22 8.5 12 2" />
      </svg>
    ),
  },
  {
    label: 'ML Analysis',
    path: '/ml-analysis',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
  {
    label: 'Log Upload',
    path: '/log-upload',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    label: 'Website Scanner',
    path: '/website-scanner',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    label: 'Alerts',
    path: '/alerts',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    label: 'Profile',
    path: '/profile',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="aeux-desktop-frame">
      <div className="aeux-dashboard-shell">
        {/* Mobile Header Toggle */}
        <div className="aeux-mobile-bar">
          <div className="aeux-logo-row">
            <span className="aeux-logo-leaf">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#00d68f">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </span>
            <span className="aeux-brand-name">Smart Anomaly Detector</span>
          </div>
          <button className="aeux-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            ☰
          </button>
        </div>

        {/* LEFT SIDEBAR (Dark Forest Green Full Height) */}
        <aside className={`aeux-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
          {/* Top Brand Logo */}
          <div className="aeux-logo-row">
            <div className="aeux-logo-leaf">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#00d68f">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div className="aeux-brand-text">
              <span className="aeux-brand-name">Smart Anomaly</span>
              <span className="aeux-brand-sub">DETECTOR</span>
            </div>
          </div>

          {/* Navigation Section */}
          <div className="aeux-nav-section">
            <span className="aeux-nav-section-title">NAVIGATION</span>
            <nav className="aeux-nav-list">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.label}
                    className={`aeux-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      if (item.path.startsWith('/')) {
                        navigate(item.path);
                      }
                    }}
                  >
                    <span className="aeux-nav-icon">{item.icon}</span>
                    <span className="aeux-nav-label">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Bottom User Profile Section */}
          <div className="aeux-user-section">
            <span className="aeux-user-section-title">USER ACCOUNT</span>
            <div
              className={`aeux-user-card ${location.pathname === '/profile' ? 'active-profile' : ''}`}
              onClick={() => navigate('/profile')}
              title="Click to view Analyst Profile"
              style={{ cursor: 'pointer' }}
            >
              <div className="aeux-avatar-wrap">
                <div className="aeux-avatar-img">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name || 'User'} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    '👨‍💻'
                  )}
                </div>
              </div>
              <div className="aeux-user-info">
                <span className="aeux-user-name">{user?.name || 'Lead Security Analyst'}</span>
                <span className="aeux-user-tag">#soc-1974 • Profile</span>
              </div>
              <button
                className="aeux-logout-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
                title="Log out"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        </aside>

        {/* RIGHT MAIN CANVAS */}
        <main className="aeux-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
