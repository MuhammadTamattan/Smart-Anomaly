import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import './Settings.css';

// Curated Cyber Specialist SVG Avatar Presets
const AVATAR_PRESETS = [
  {
    id: 'cyber-lead',
    name: 'SOC Lead Operator',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none'><rect width='100' height='100' fill='%23082824'/><circle cx='50' cy='38' r='20' fill='%2300d68f' opacity='0.25'/><circle cx='50' cy='38' r='14' fill='%2300d68f'/><rect x='36' y='34' width='28' height='6' rx='3' fill='%23061f1c'/><path d='M22 84c0-15.5 12.5-28 28-28s28 12.5 28 28' stroke='%2300d68f' stroke-width='4' stroke-linecap='round'/><circle cx='50' cy='50' r='46' stroke='%2300d68f' stroke-width='2' stroke-dasharray='4 3'/></svg>",
  },
  {
    id: 'threat-hunter',
    name: 'Threat Hunter Alpha',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none'><rect width='100' height='100' fill='%23061f1c'/><path d='M50 14L24 26v24c0 22 26 36 26 36s26-14 26-36V26L50 14z' fill='%230c3631' stroke='%2300d68f' stroke-width='3'/><path d='M40 50l7 7 14-14' stroke='%2300d68f' stroke-width='4' stroke-linecap='round' stroke-linejoin='round'/></svg>",
  },
  {
    id: 'neural-sentinel',
    name: 'Neural AI Sentinel',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none'><rect width='100' height='100' fill='%230c3631'/><circle cx='50' cy='50' r='30' stroke='%2300d68f' stroke-width='2'/><circle cx='50' cy='50' r='16' fill='%2300d68f' opacity='0.3'/><circle cx='50' cy='50' r='8' fill='%2300d68f'/><line x1='50' y1='10' x2='50' y2='34' stroke='%2300d68f' stroke-width='2'/><line x1='50' y1='66' x2='50' y2='90' stroke='%2300d68f' stroke-width='2'/><line x1='10' y1='50' x2='34' y2='50' stroke='%2300d68f' stroke-width='2'/><line x1='66' y1='50' x2='90' y2='50' stroke='%2300d68f' stroke-width='2'/></svg>",
  },
  {
    id: 'tactical-recon',
    name: 'Incident Responder',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none'><rect width='100' height='100' fill='%23082521'/><circle cx='50' cy='40' r='18' fill='%23134e47' stroke='%2300d68f' stroke-width='3'/><rect x='42' y='36' width='16' height='8' rx='2' fill='%2300d68f'/><path d='M20 88c2-20 14-30 30-30s28 10 30 30' fill='%23134e47' stroke='%2300d68f' stroke-width='3'/><polygon points='50,18 54,26 46,26' fill='%2300d68f'/></svg>",
  },
  {
    id: 'crypto-vault',
    name: 'Security Architect',
    url: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='none'><rect width='100' height='100' fill='%23061a17'/><rect x='28' y='42' width='44' height='36' rx='8' fill='%230c3631' stroke='%2300d68f' stroke-width='3'/><path d='M38 42V30a12 12 0 0 1 24 0v12' stroke='%2300d68f' stroke-width='3' stroke-linecap='round'/><circle cx='50' cy='58' r='4' fill='%2300d68f'/><line x1='50' y1='62' x2='50' y2='68' stroke='%2300d68f' stroke-width='3'/></svg>",
  },
];

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Active section tab: 'profile' | 'appearance' | 'notifications' | 'security'
  const [activeTab, setActiveTab] = useState('profile');

  // Cached profile fallback
  const cachedProfile = (() => {
    try {
      const stored = localStorage.getItem('soc_user_profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  // 1. Profile State
  const [profileData, setProfileData] = useState({
    name: cachedProfile?.name || user?.name || 'SOC Administrator',
    email: cachedProfile?.email || user?.email || 'admin@soc.io',
    avatar: cachedProfile?.avatar || user?.avatar || '',
    roleTitle: cachedProfile?.roleTitle || user?.roleTitle || 'Lead Threat Response Specialist',
    department: cachedProfile?.department || user?.department || 'SOC Incident Intelligence Unit',
    timezone: cachedProfile?.timezone || user?.timezone || 'UTC +05:30 (Indian Standard Time)',
    bio: cachedProfile?.bio || user?.bio || 'Cyber Threat Intelligence & Anomaly Response Specialist.',
  });

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showPresetPicker, setShowPresetPicker] = useState(false);

  // 3. Notifications State
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('soc_notifications_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      securityAlerts: cachedProfile?.notifications?.notifyP1 ?? true,
      incidentAlerts: cachedProfile?.notifications?.autoQuarantine ?? true,
    };
  });
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  // 4. Security / Password State
  const [passwordState, setPasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Toast feedback
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Fetch verified profile on mount
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/profile');
        if (isMounted && res.data) {
          const d = res.data;
          setProfileData((prev) => ({
            ...prev,
            name: d.name || prev.name,
            email: d.email || prev.email,
            avatar: d.avatar || prev.avatar,
            roleTitle: d.roleTitle || prev.roleTitle,
            department: d.department || prev.department,
            timezone: d.timezone || prev.timezone,
            bio: d.bio || prev.bio,
          }));

          if (d.notifications) {
            setNotifications({
              securityAlerts: d.notifications.notifyP1 ?? true,
              incidentAlerts: d.notifications.autoQuarantine ?? true,
            });
          }
        }
      } catch (err) {
        console.warn('[Settings] Failed to fetch server profile, using local state:', err.message);
      }
    };

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  // Profile Image Upload with HTML5 canvas auto-compression (< 100KB)
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WebP).', 'warning');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      showToast('Image file exceeds 8MB size limit.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxSize = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setProfileData((prev) => ({ ...prev, avatar: compressedDataUrl }));
        setShowPresetPicker(false);
        showToast('✓ Photo loaded. Click "Save Profile Changes" to apply.', 'success');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSelectPreset = (url) => {
    setProfileData((prev) => ({ ...prev, avatar: url }));
    setShowPresetPicker(false);
    showToast('✓ Preset avatar applied. Click "Save Profile Changes" to persist.', 'success');
  };

  const handleRemoveAvatar = () => {
    setProfileData((prev) => ({ ...prev, avatar: '' }));
    setShowPresetPicker(false);
    showToast('Profile photo removed.', 'info');
  };

  // Save Profile Changes
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setIsSavingProfile(true);

    const payload = {
      name: profileData.name.trim(),
      email: profileData.email.trim(),
      avatar: profileData.avatar,
      roleTitle: profileData.roleTitle,
      department: profileData.department,
      timezone: profileData.timezone,
      bio: profileData.bio,
    };

    try {
      const res = await api.put('/auth/profile', payload);
      localStorage.setItem('soc_user_profile', JSON.stringify(payload));
      if (updateUser) {
        updateUser(res.data || payload);
      }
      showToast('✓ Profile changes saved successfully!');
    } catch (err) {
      // Offline fallback
      localStorage.setItem('soc_user_profile', JSON.stringify(payload));
      if (updateUser) updateUser(payload);
      showToast(err.response?.data?.message || 'Profile saved locally.', 'success');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Save Notifications
  const handleToggleNotification = (key) => {
    setNotifications((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem('soc_notifications_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true);
    try {
      await api.put('/auth/profile', {
        notifications: {
          notifyP1: notifications.securityAlerts,
          autoQuarantine: notifications.incidentAlerts,
        },
      });
      showToast('✓ Notification preferences updated!');
    } catch {
      showToast('✓ Notification preferences saved locally.', 'success');
    } finally {
      setIsSavingNotifications(false);
    }
  };

  // Password Change Submission
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwordState.currentPassword) {
      showToast('Please enter your current password.', 'warning');
      return;
    }

    if (!passwordState.newPassword) {
      showToast('Please enter a new password.', 'warning');
      return;
    }

    if (passwordState.newPassword.length < 6) {
      showToast('New password must be at least 6 characters long.', 'warning');
      return;
    }

    if (passwordState.newPassword !== passwordState.confirmPassword) {
      showToast('New passwords do not match. Please verify.', 'error');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const res = await api.post('/auth/change-password', {
        currentPassword: passwordState.currentPassword,
        newPassword: passwordState.newPassword,
      });

      showToast(res.data?.message || '✓ Password changed successfully!', 'success');
      // Wipe password state immediately for security
      setPasswordState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Failed to update password. Please check your current password.';
      showToast(errMsg, 'error');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Session Logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // User Initials
  const initials = profileData.name
    ? profileData.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'AD';

  return (
    <div className="soc-settings-wrapper">
      {/* Toast Feedback */}
      <div className="soc-settings-toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`soc-settings-toast ${t.type}`}>
            <span className="soc-settings-toast-dot" />
            <span>{t.msg}</span>
          </div>
        ))}
      </div>

      <div className="soc-settings-container">
        {/* Header Bar */}
        <header className="soc-settings-header">
          <div>
            <div className="soc-settings-header-tag">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              SYSTEM SETTINGS &bull; ADMIN CONTROL
            </div>
            <h1 className="soc-settings-header-title">Settings</h1>
            <p className="soc-settings-header-desc">
              Manage your administrator profile, theme appearance, real-time alert rules, and account credentials.
            </p>
          </div>
        </header>

        {/* Section Tabs Navigation Bar */}
        <div className="soc-settings-tabs-bar">
          <button
            type="button"
            className={`soc-settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            1. Profile
          </button>

          <button
            type="button"
            className={`soc-settings-tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
            2. Appearance
          </button>

          <button
            type="button"
            className={`soc-settings-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            3. Notifications
          </button>

          <button
            type="button"
            className={`soc-settings-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            4. Security
          </button>
        </div>

        {/* ==================================================================
            TAB 1: PROFILE
            ================================================================== */}
        {activeTab === 'profile' && (
          <div className="soc-settings-card">
            <div className="soc-settings-card-head">
              <div className="soc-settings-icon-bubble">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <h2>Admin Profile</h2>
                <p>Update administrator credentials, operational contact, and verified profile picture.</p>
              </div>
            </div>

            {/* Profile Avatar Row */}
            <div className="soc-profile-avatar-row">
              <div className="soc-profile-avatar-large">
                {profileData.avatar ? (
                  <img src={profileData.avatar} alt={profileData.name} />
                ) : (
                  <span className="soc-avatar-initials-large">{initials}</span>
                )}
              </div>

              <div className="soc-profile-avatar-info">
                <span className="soc-profile-avatar-title">{profileData.name}</span>
                <span className="soc-profile-avatar-sub">
                  {profileData.avatar ? 'Custom profile insignia applied' : 'Using default initials avatar'}
                </span>
                <div className="soc-avatar-actions-btns" style={{ marginTop: '6px' }}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleImageUpload}
                  />

                  <button
                    type="button"
                    className="soc-btn-avatar-action"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="17 8 12 3 7 8" />
                      <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    Upload Photo
                  </button>

                  <button
                    type="button"
                    className="soc-btn-avatar-action"
                    onClick={() => setShowPresetPicker(!showPresetPicker)}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2z"/></svg>
                    Choose Cyber Insignia
                  </button>

                  {profileData.avatar && (
                    <button
                      type="button"
                      className="soc-btn-avatar-action soc-btn-avatar-danger"
                      onClick={handleRemoveAvatar}
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Preset Avatars Selector Popover */}
            {showPresetPicker && (
              <div className="soc-presets-panel">
                <span className="soc-presets-title">SELECT A CYBER OPERATOR PRESET</span>
                <div className="soc-presets-row">
                  {AVATAR_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className={`soc-preset-badge ${profileData.avatar === p.url ? 'active' : ''}`}
                      onClick={() => handleSelectPreset(p.url)}
                      title={p.name}
                    >
                      <img src={p.url} alt={p.name} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Form Fields Grid */}
            <form onSubmit={handleSaveProfile} className="soc-form-grid">
              <div className="soc-form-field">
                <label>
                  Admin Name <span className="req-star">*</span>
                </label>
                <div className="soc-form-input-wrap">
                  <span className="soc-input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </span>
                  <input
                    type="text"
                    className="soc-settings-input"
                    value={profileData.name}
                    placeholder="Admin Name"
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="soc-form-field">
                <label>
                  Admin Email <span className="req-star">*</span>
                </label>
                <div className="soc-form-input-wrap">
                  <span className="soc-input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 7l-10 6L2 7"/></svg>
                  </span>
                  <input
                    type="email"
                    className="soc-settings-input"
                    value={profileData.email}
                    placeholder="admin@soc.io"
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="soc-form-field">
                <label>Operational Role</label>
                <div className="soc-form-input-wrap">
                  <span className="soc-input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  </span>
                  <input
                    type="text"
                    className="soc-settings-input"
                    value={profileData.roleTitle}
                    placeholder="Lead Threat Response Specialist"
                    onChange={(e) => setProfileData({ ...profileData, roleTitle: e.target.value })}
                  />
                </div>
              </div>

              <div className="soc-form-field">
                <label>SOC Department</label>
                <div className="soc-form-input-wrap">
                  <span className="soc-input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><line x1="8" y1="6" x2="8.01" y2="6"/><line x1="16" y1="6" x2="16.01" y2="6"/><line x1="12" y1="6" x2="12.01" y2="6"/><line x1="8" y1="10" x2="8.01" y2="10"/><line x1="12" y1="10" x2="12.01" y2="10"/><line x1="16" y1="10" x2="16.01" y2="10"/><line x1="8" y1="14" x2="8.01" y2="14"/><line x1="12" y1="14" x2="12.01" y2="14"/><line x1="16" y1="14" x2="16.01" y2="14"/></svg>
                  </span>
                  <input
                    type="text"
                    className="soc-settings-input"
                    value={profileData.department}
                    placeholder="SOC Incident Intelligence Unit"
                    onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
                  />
                </div>
              </div>

              <div className="soc-form-field" style={{ gridColumn: 'span 2' }}>
                <label>Bio / Notes</label>
                <textarea
                  className="soc-settings-textarea"
                  rows={2}
                  value={profileData.bio}
                  placeholder="Administrator operational overview or SOC specialization..."
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                />
              </div>
            </form>

            {/* Quick Link to Change Password */}
            <div className="soc-profile-security-jump">
              <div className="soc-jump-text">
                <span className="soc-jump-title">Security & Password</span>
                <span className="soc-jump-sub">Looking to update your account password?</span>
              </div>
              <button
                type="button"
                className="soc-btn-jump"
                onClick={() => setActiveTab('security')}
              >
                Go to Change Password →
              </button>
            </div>

            {/* Save Profile Changes Button */}
            <div className="soc-card-bottom-bar">
              <button
                type="button"
                className="soc-btn-primary"
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
              >
                {isSavingProfile ? (
                  <>Saving Changes...</>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                      <polyline points="17 21 17 13 7 13 7 21" />
                      <polyline points="7 3 7 8 15 8" />
                    </svg>
                    Save Profile Changes
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ==================================================================
            TAB 2: APPEARANCE (DARK & LIGHT THEME SELECTOR)
            ================================================================== */}
        {activeTab === 'appearance' && (
          <div className="soc-settings-card">
            <div className="soc-settings-card-head">
              <div className="soc-settings-icon-bubble">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                </svg>
              </div>
              <div>
                <h2>Appearance & Theme</h2>
                <p>Select your interface theme. Updates instantly across all pages and widgets without page reload.</p>
              </div>
            </div>

            {/* Theme Selector Cards */}
            <div className="soc-appearance-grid">
              {/* 1. DARK MODE CARD */}
              <div
                className={`soc-theme-card ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => {
                  setTheme('dark');
                  showToast('✓ Dark Mode activated.', 'info');
                }}
                role="button"
                tabIndex={0}
              >
                <div className="soc-theme-preview-box preview-dark">
                  <div className="theme-preview-header">
                    <span className="preview-dot red" />
                    <span className="preview-dot yellow" />
                    <span className="preview-dot green" />
                  </div>
                  <div className="theme-preview-body">
                    <div className="preview-sidebar-mini" />
                    <div className="preview-main-mini">
                      <div className="preview-card-mini">
                        <div className="preview-bar mint" />
                        <div className="preview-bar muted-dark" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="soc-theme-meta">
                  <div className="soc-theme-title-row">
                    <span className="soc-theme-name" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                      Dark Mode (Default)
                    </span>
                    {theme === 'dark' && <span className="soc-theme-active-tag">ACTIVE</span>}
                  </div>
                  <p className="soc-theme-desc">
                    Deep forest & cyber slate palette. Engineered for 24/7 SOC command environments, low eye strain, and vibrant telemetry accents.
                  </p>
                </div>
              </div>

              {/* 2. LIGHT MODE CARD */}
              <div
                className={`soc-theme-card ${theme === 'light' ? 'active' : ''}`}
                onClick={() => {
                  setTheme('light');
                  showToast('✓ Light Mode activated.', 'info');
                }}
                role="button"
                tabIndex={0}
              >
                <div className="soc-theme-preview-box preview-light">
                  <div className="theme-preview-header">
                    <span className="preview-dot red" />
                    <span className="preview-dot yellow" />
                    <span className="preview-dot green" />
                  </div>
                  <div className="theme-preview-body">
                    <div className="preview-sidebar-mini" />
                    <div className="preview-main-mini">
                      <div className="preview-card-mini">
                        <div className="preview-bar mint" />
                        <div className="preview-bar muted-light" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="soc-theme-meta">
                  <div className="soc-theme-title-row">
                    <span className="soc-theme-name" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                      Light Mode
                    </span>
                    {theme === 'light' && <span className="soc-theme-active-tag">ACTIVE</span>}
                  </div>
                  <p className="soc-theme-desc">
                    Clean, high-contrast off-white canvas with crisp surfaces. Tailored for daylight shifts, presentation rooms, and executive reports.
                  </p>
                </div>
              </div>
            </div>

            {/* Note box */}
            <div className="soc-theme-note-box">
              <span style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--theme-accent)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-7 7c0 2.5 1.5 4.5 3 6h8c1.5-1.5 3-3.5 3-6a7 7 0 0 0-7-7z"/></svg>
              </span>
              <span>
                Theme choice is saved locally and applies across the Sidebar, Dashboard, Cards, Tables, Charts, Forms, Alerts, ML Analysis, Log Upload, Website Scanner, Incident Management, Reports, Settings, and the Floating AI Assistant.
              </span>
            </div>
          </div>
        )}

        {/* ==================================================================
            TAB 3: NOTIFICATIONS
            ================================================================== */}
        {activeTab === 'notifications' && (
          <div className="soc-settings-card">
            <div className="soc-settings-card-head">
              <div className="soc-settings-icon-bubble">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <div>
                <h2>Notification Preferences</h2>
                <p>Configure which real-time alerts and security incident notices you receive.</p>
              </div>
            </div>

            <div className="soc-notifications-list">
              {/* 1. Security Alert Notifications */}
              <div className="soc-notification-toggle-card">
                <div className="soc-toggle-text">
                  <span className="soc-toggle-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--theme-critical)' }}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                    Security Alert Notifications
                  </span>
                  <span className="soc-toggle-desc">
                    Receive immediate notifications whenever abnormal log activities, brute-force anomalies, or vulnerability scans trigger high-severity alerts.
                  </span>
                </div>
                <div
                  className={`soc-switch-ui ${notifications.securityAlerts ? 'on' : ''}`}
                  onClick={() => handleToggleNotification('securityAlerts')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="soc-switch-ui-thumb" />
                </div>
              </div>

              {/* 2. Incident Notifications */}
              <div className="soc-notification-toggle-card">
                <div className="soc-toggle-text">
                  <span className="soc-toggle-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--theme-accent)' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                    Incident Notifications
                  </span>
                  <span className="soc-toggle-desc">
                    Receive instant desktop and popup notifications when new security incidents are logged or submitted by operators and users.
                  </span>
                </div>
                <div
                  className={`soc-switch-ui ${notifications.incidentAlerts ? 'on' : ''}`}
                  onClick={() => handleToggleNotification('incidentAlerts')}
                  role="button"
                  tabIndex={0}
                >
                  <div className="soc-switch-ui-thumb" />
                </div>
              </div>
            </div>

            <div className="soc-card-bottom-bar">
              <button
                type="button"
                className="soc-btn-primary"
                onClick={handleSaveNotifications}
                disabled={isSavingNotifications}
              >
                {isSavingNotifications ? 'Saving...' : 'Save Notification Preferences'}
              </button>
            </div>
          </div>
        )}

        {/* ==================================================================
            TAB 4: SECURITY
            ================================================================== */}
        {activeTab === 'security' && (
          <div className="soc-settings-card">
            <div className="soc-settings-card-head">
              <div className="soc-settings-icon-bubble">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div>
                <h2>Security & Credentials</h2>
                <p>Manage administrator password hashing, session tokens, and authentication security.</p>
              </div>
            </div>

            {/* Change Password Form */}
            <div className="soc-security-section">
              <h3 className="soc-security-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--theme-accent)' }}><path d="M21 2l-2 2m-2-2l2 2m-4.5 4.5l-4-4a4.95 4.95 0 0 0-7 7l4 4a4.95 4.95 0 0 0 7-7z"/><circle cx="7.5" cy="16.5" r="1.5"/></svg>
                Change Password
              </h3>

              <form onSubmit={handleChangePasswordSubmit} className="soc-password-form">
                <div className="soc-form-field">
                  <label>
                    Current Password <span className="req-star">*</span>
                  </label>
                  <div className="soc-form-input-wrap">
                    <span className="soc-input-icon">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="soc-settings-input"
                      value={passwordState.currentPassword}
                      placeholder="Enter current password"
                      onChange={(e) => setPasswordState({ ...passwordState, currentPassword: e.target.value })}
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </div>

                <div className="soc-form-grid" style={{ gap: '14px' }}>
                  <div className="soc-form-field">
                    <label>
                      New Password (min 6 characters) <span className="req-star">*</span>
                    </label>
                    <div className="soc-form-input-wrap">
                      <span className="soc-input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-2-2l2 2m-4.5 4.5l-4-4a4.95 4.95 0 0 0-7 7l4 4a4.95 4.95 0 0 0 7-7z"/><circle cx="7.5" cy="16.5" r="1.5"/></svg>
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="soc-settings-input"
                        value={passwordState.newPassword}
                        placeholder="Enter new password"
                        onChange={(e) => setPasswordState({ ...passwordState, newPassword: e.target.value })}
                        autoComplete="new-password"
                        required
                      />
                    </div>
                  </div>

                  <div className="soc-form-field">
                    <label>
                      Confirm New Password <span className="req-star">*</span>
                    </label>
                    <div className="soc-form-input-wrap">
                      <span className="soc-input-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="soc-settings-input"
                        value={passwordState.confirmPassword}
                        placeholder="Re-type new password"
                        onChange={(e) => setPasswordState({ ...passwordState, confirmPassword: e.target.value })}
                        autoComplete="new-password"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '12.5px', color: 'var(--theme-text-sub)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input
                      type="checkbox"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    Show password characters
                  </label>
                </div>

                <button
                  type="submit"
                  className="soc-btn-password-submit"
                  disabled={isUpdatingPassword}
                >
                  {isUpdatingPassword ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--theme-border)', margin: '4px 0' }} />

            {/* Logout from Current Session */}
            <div className="soc-security-section">
              <h3 className="soc-security-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--theme-critical)' }}><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
                Session Management
              </h3>

              <div className="soc-danger-card">
                <div className="soc-danger-text">
                  <span className="soc-danger-title">Logout from Current Session</span>
                  <span className="soc-danger-sub">
                    Sign out of this administrative terminal session and clear your active token from this browser.
                  </span>
                </div>

                <button
                  type="button"
                  className="soc-btn-danger-logout"
                  onClick={handleLogout}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Log Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
