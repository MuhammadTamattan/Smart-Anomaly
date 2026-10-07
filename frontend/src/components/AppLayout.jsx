import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import IncidentNotificationPopup from './IncidentNotificationPopup';
import FloatingAIAssistant from './FloatingAIAssistant';
import api from '../services/api';
import './AppLayout.css';

const adminMenuItems = [
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
    label: 'Incident Management',
    path: '/incident-management',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M9 15l2 2 4-4" />
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
    label: 'Settings',
    path: '/settings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

const userMenuItems = [
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
    label: 'Check Website',
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
    label: 'Check Files',
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
    label: 'Report a Problem',
    path: '/report-incident',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
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
    label: 'Settings',
    path: '/settings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    // Only admins receive the incoming incident notifications
    if (user?.role !== 'admin') return;

    // 1. BroadcastChannel (Instant cross-tab within same browser)
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

    // 2. Storage event (cross-tab fallback)
    const handleStorage = (e) => {
      if (e.key === 'soc_latest_incident_event' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          addIncidentPopup(parsed);
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Custom DOM event (in-app trigger)
    const handleCustomEvent = (e) => {
      if (e.detail) {
        addIncidentPopup(e.detail);
      }
    };
    window.addEventListener('soc-incident-reported', handleCustomEvent);

    // 4. Background Polling (Detects reports submitted across different browsers/machines)
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

  const isUserRole = user?.role === 'user';
  const currentNavItems = isUserRole ? userMenuItems : adminMenuItems;

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
              <span className="aeux-brand-sub">{isUserRole ? 'USER PORTAL' : 'DETECTOR'}</span>
            </div>
          </div>

          {/* Navigation Section */}
          <div className="aeux-nav-section">
            <span className="aeux-nav-section-title">{isUserRole ? 'MENU' : 'NAVIGATION'}</span>
            <nav className="aeux-nav-list">
              {currentNavItems.map((item) => {
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
              className={`aeux-user-card ${location.pathname === '/settings' ? 'active-profile' : ''}`}
              onClick={() => navigate('/settings')}
              title="Click to open Settings & Profile"
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
                <span className="aeux-user-tag">#soc-1974 • Settings</span>
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
