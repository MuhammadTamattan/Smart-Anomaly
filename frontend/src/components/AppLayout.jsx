import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import IncidentNotificationPopup from './IncidentNotificationPopup';
import FloatingAIAssistant from './FloatingAIAssistant';
import api from '../services/api';
import './AppLayout.css';

const adminMenuItems = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  {
    label: 'ML Analysis',
    path: '/ml-analysis',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10" />
        <path d="M12 20V4" />
        <path d="M6 20v-6" />
        <circle cx="18" cy="7" r="3" />
        <circle cx="6" cy="11" r="3" />
      </svg>
    ),
  },
  {
    label: 'Log Upload',
    path: '/log-upload',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
  {
    label: 'Reports',
    path: '/reports',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    label: 'Registration Requests',
    path: '/registration-requests',
    adminOnly: true,
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="8.5" cy="7" r="4" />
        <polyline points="17 11 19 13 23 9" />
      </svg>
    ),
  },
  {
    label: 'Settings',
    path: '/settings',
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Real-time Admin Incident Notification Popups
  const [incidentPopups, setIncidentPopups] = useState([]);
  const seenIncidentIdsRef = useRef(new Set());
  const initialLoadDoneRef = useRef(false);

  const addIncidentPopup = useCallback((incident) => {
    if (!incident || !incident.id) return;
    if (seenIncidentIdsRef.current.has(incident.id)) return;
    seenIncidentIdsRef.current.add(incident.id);

    setIncidentPopups((prev) => {
      if (prev.some((p) => p.id === incident.id)) return prev;
      return [incident, ...prev.slice(0, 2)];
    });
  }, []);

  const handleDismissPopup = useCallback((id) => {
    setIncidentPopups((prev) => prev.filter((p) => p.id !== id));
  }, []);

  useEffect(() => {
    if (user?.role !== 'admin') return;

    let bc = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('soc_incidents_channel');
        bc.onmessage = (event) => {
          if (event.data) {
            addIncidentPopup(event.data);
          }
        };
      }
    } catch {}

    const handleStorage = (e) => {
      if (e.key === 'soc_latest_incident_event' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          addIncidentPopup(parsed);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    const handleCustomEvent = (e) => {
      if (e.detail) {
        addIncidentPopup(e.detail);
      }
    };
    window.addEventListener('soc-incident-reported', handleCustomEvent);

    const checkNewAlerts = async () => {
      try {
        const res = await api.get('/alerts');
        if (Array.isArray(res.data)) {
          if (!initialLoadDoneRef.current) {
            res.data.forEach((a) => seenIncidentIdsRef.current.add(a._id));
            initialLoadDoneRef.current = true;
            return;
          }

          res.data.forEach((alt) => {
            if (!seenIncidentIdsRef.current.has(alt._id)) {
              if (alt.title?.startsWith('[User Report]') || alt.status === 'new') {
                addIncidentPopup({
                  id: alt._id,
                  title: alt.title,
                  description: alt.description,
                  severity: alt.severity,
                  senderName: alt.user?.name || 'User',
                  senderEmail: alt.user?.email || '',
                  timestamp: alt.detectedAt ? new Date(alt.detectedAt).getTime() : Date.now(),
                });
              } else {
                seenIncidentIdsRef.current.add(alt._id);
              }
            }
          });
        }
      } catch {}
    };

    checkNewAlerts();
    const intervalId = setInterval(checkNewAlerts, 4000);

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('soc-incident-reported', handleCustomEvent);
      clearInterval(intervalId);
    };
  }, [user?.role, addIncidentPopup]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  }, [location.pathname]);

  // Click outside to close profile dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="aeux-desktop-frame">
      <div className="aeux-dashboard-shell">
        {/* Mobile Header Toggle */}
        <div className="aeux-mobile-bar">
          <div className="aeux-logo-row" style={{ padding: 0, cursor: 'pointer' }} onClick={() => navigate('/')} title="Return to Public Landing Page">
            <span className="aeux-logo-icon-wrap" style={{ width: 30, height: 30 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </span>
            <span className="aeux-brand-name" style={{ fontSize: 13.5 }}>Smart Anomaly</span>
          </div>
          <button className="aeux-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>

        {/* LEFT SIDEBAR (Distinctive Emerald/Teal Gradient with Wave Glow & Traffic Light Dots) */}
        <aside className={`aeux-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
          <div>
            {/* 1. macOS Window Traffic Light Controls */}
            <div className="aeux-window-dots">
              <span className="aeux-window-dot dot-red" />
              <span className="aeux-window-dot dot-yellow" />
              <span className="aeux-window-dot dot-green" />
            </div>

            {/* 2. Top Brand Header */}
            <div className="aeux-logo-row" style={{ cursor: 'pointer' }} onClick={() => navigate('/')} title="Return to Public Landing Page">
              <div className="aeux-logo-icon-wrap">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
              </div>
              <div className="aeux-brand-text">
                <span className="aeux-brand-name">Smart Anomaly</span>
                <span className="aeux-brand-sub">Detection System</span>
              </div>
            </div>

            {/* 3. Navigation Section */}
            <div className="aeux-nav-section">
              <nav className="aeux-nav-list">
                {adminMenuItems
                  .filter((item) => !item.adminOnly || user?.role === 'admin')
                  .map((item) => {
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
          </div>

          {/* 4. Bottom Promotional / Security Card (Matching Reference) */}
          <div
            className="aeux-bottom-promo-card"
            onClick={() => navigate('/settings')}
            style={{ cursor: 'pointer' }}
            title="Click to view Security Settings"
          >
            <div className="promo-card-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <circle cx="12" cy="11" r="2" />
                <path d="M12 13v2" />
              </svg>
            </div>
            <div className="promo-card-title">Stronger Security Together</div>
            <div className="promo-card-sub">Detect. Analyze. Protect.</div>
          </div>
        </aside>

        {/* RIGHT MAIN CANVAS WITH SLIM TOP HEADER */}
        <main className="aeux-main-content">
          {/* Top Header Bar (Search, Notifications, Theme Toggle, Profile Dropdown) */}
          <header className="aeux-top-header">
            <div className="aeux-search-box">
              <svg className="aeux-search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search anything..."
                className="aeux-search-input"
              />
            </div>

            <div className="aeux-header-actions">
              {/* Notification Bell */}
              <button
                className="aeux-header-btn"
                onClick={() => navigate('/alerts')}
                title="Notifications"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className="aeux-unread-dot" />
              </button>

              {/* Theme Toggle (Dark / Light Mode) */}
              <button
                className="aeux-header-btn aeux-theme-btn"
                onClick={toggleTheme}
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              >
                {theme === 'dark' ? (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>

              {/* Profile Dropdown */}
              <div className="aeux-profile-dropdown-wrap" ref={dropdownRef}>
                <button
                  className="aeux-profile-btn"
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  title="Account profile"
                >
                  <div className="aeux-avatar-circle">
                    {user?.avatar ? (
                      <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      'A'
                    )}
                  </div>
                  <span className="aeux-profile-name">
                    {user?.name ? user.name.split(' ')[0] : 'Admin'}
                  </span>
                  <svg className="aeux-chevron-down" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {profileDropdownOpen && (
                  <div className="aeux-dropdown-menu">
                    <div className="aeux-dropdown-header">
                      <div className="aeux-dropdown-user">{user?.name || 'Administrator'}</div>
                      <div className="aeux-dropdown-role">{user?.role || 'Admin'} • {user?.email || 'admin@soc.io'}</div>
                    </div>
                    <button
                      className="aeux-dropdown-item"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate('/settings');
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                      Settings & Profile
                    </button>
                    {user?.role === 'admin' && (
                      <button
                        className="aeux-dropdown-item"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          navigate('/registration-requests');
                        }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="8.5" cy="7" r="4" />
                          <polyline points="17 11 19 13 23 9" />
                        </svg>
                        Registration Requests
                      </button>
                    )}
                    <button
                      className="aeux-dropdown-item"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate('/');
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                      Public Landing Page
                    </button>
                    <button
                      className="aeux-dropdown-item danger"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleLogout();
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Child Page Content */}
          <Outlet />
        </main>
      </div>

      {/* Floating Popup Notifications for Incoming User Reports */}
      <IncidentNotificationPopup
        notifications={incidentPopups}
        onDismiss={handleDismissPopup}
      />

      {/* Floating AI Security Assistant (Admin Only) */}
      {user?.role === 'admin' && <FloatingAIAssistant />}
    </div>
  );
}
