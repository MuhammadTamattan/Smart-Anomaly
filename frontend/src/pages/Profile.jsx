import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Profile.css';

// Curated Cyber Operator SVG Avatar Presets (High-Res Data URIs)
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

export default function Profile() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  // Cached profile fallback
  const cachedProfile = (() => {
    try {
      const stored = localStorage.getItem('soc_user_profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  // Core Profile State
  const [profileData, setProfileData] = useState({
    name: cachedProfile?.name || user?.name || 'Alex Vance',
    username: cachedProfile?.username || user?.username || 'alexvance',
    email: cachedProfile?.email || user?.email || 'demo@soc.io',
    phone: cachedProfile?.phone || user?.phone || '+1 (555) 123-4567',
    roleTitle: cachedProfile?.roleTitle || user?.roleTitle || 'Lead Threat Response Specialist',
    department: cachedProfile?.department || user?.department || 'SOC Incident Intelligence Unit',
    analystId: cachedProfile?.analystId || user?.analystId || '#SOC-2026-VANCE',
    clearance: cachedProfile?.clearance || user?.clearance || 'Level 4 — Root Administrator',
    timezone: cachedProfile?.timezone || user?.timezone || 'UTC +05:30 (Indian Standard Time)',
    bio: cachedProfile?.bio || user?.bio || 'Lead Cyber Threat Intelligence & Anomaly Response Analyst. Specialized in real-time intrusion mitigation and heuristic anomaly detection.',
    avatar: cachedProfile?.avatar || user?.avatar || '',
    notifications: {
      notifyP1: cachedProfile?.notifications?.notifyP1 ?? true,
      notifyDrift: cachedProfile?.notifications?.notifyDrift ?? true,
      notifyWeekly: cachedProfile?.notifications?.notifyWeekly ?? false,
      autoQuarantine: cachedProfile?.notifications?.autoQuarantine ?? true,
      soundAlerts: cachedProfile?.notifications?.soundAlerts ?? true,
    },
  });

  const [originalData, setOriginalData] = useState(null);
  const [activeTab, setActiveTab] = useState('identity'); // 'identity' | 'security' | 'notifications'
  const [isSaving, setIsSaving] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [tokenCopied, setTokenCopied] = useState(false);

  // Toast notification helper
  const showToast = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Fetch complete profile on mount
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const res = await api.get('/auth/profile');
        if (isMounted && res.data) {
          const data = res.data;
          const merged = {
            name: data.name || 'Alex Vance',
            username: data.username || data.email?.split('@')[0] || 'alexvance',
            email: data.email || 'demo@soc.io',
            phone: data.phone || '+1 (555) 123-4567',
            roleTitle: data.roleTitle || 'Lead Threat Response Specialist',
            department: data.department || 'SOC Incident Intelligence Unit',
            analystId: data.analystId || '#SOC-2026-VANCE',
            clearance: data.clearance || 'Level 4 — Root Administrator',
            timezone: data.timezone || 'UTC +05:30 (Indian Standard Time)',
            bio: data.bio || 'Lead Cyber Threat Intelligence & Anomaly Response Analyst. Specialized in real-time intrusion mitigation and heuristic anomaly detection.',
            avatar: data.avatar || '',
            notifications: {
              notifyP1: data.notifications?.notifyP1 ?? true,
              notifyDrift: data.notifications?.notifyDrift ?? true,
              notifyWeekly: data.notifications?.notifyWeekly ?? false,
              autoQuarantine: data.notifications?.autoQuarantine ?? true,
              soundAlerts: data.notifications?.soundAlerts ?? true,
            },
          };
          setProfileData(merged);
          setOriginalData(JSON.parse(JSON.stringify(merged)));
        }
      } catch (err) {
        console.warn('[Profile] Initial profile sync:', err.message);
        setOriginalData(JSON.parse(JSON.stringify(profileData)));
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  // Track if changes have been made
  const hasUnsavedChanges = Boolean(
    originalData && JSON.stringify(profileData) !== JSON.stringify(originalData)
  );

  const handleFieldChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNotificationToggle = (key) => {
    setProfileData((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key],
      },
    }));
  };

  // Profile Photo Upload with HTML5 Canvas auto-compression (< 100KB)
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
        const maxSize = 340;
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
        setAvatarModalOpen(false);
        showToast('✓ Profile photo updated. Click "Save Profile" to apply.', 'success');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSelectPresetAvatar = (url) => {
    setProfileData((prev) => ({ ...prev, avatar: url }));
    setAvatarModalOpen(false);
    showToast('✓ Preset cyber avatar applied.', 'success');
  };

  const handleRemoveAvatar = () => {
    setProfileData((prev) => ({ ...prev, avatar: '' }));
    setAvatarModalOpen(false);
    showToast('Profile photo removed.', 'info');
  };

  // Discard changes
  const handleDiscardChanges = () => {
    if (originalData) {
      setProfileData(JSON.parse(JSON.stringify(originalData)));
      showToast('Changes reverted.', 'info');
    }
  };

  // Save profile to backend & localStorage
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    const payload = {
      name: profileData.name,
      username: profileData.username,
      email: profileData.email,
      phone: profileData.phone,
      roleTitle: profileData.roleTitle,
      department: profileData.department,
      analystId: profileData.analystId,
      clearance: profileData.clearance,
      timezone: profileData.timezone,
      bio: profileData.bio,
      avatar: profileData.avatar,
      notifications: profileData.notifications,
    };

    try {
      const res = await api.put('/auth/profile', payload);
      localStorage.setItem('soc_user_profile', JSON.stringify(payload));
      setOriginalData(JSON.parse(JSON.stringify(payload)));

      if (updateUser) {
        updateUser(res.data || payload);
      }
      showToast('✓ Analyst profile and security parameters saved successfully!');
    } catch (err) {
      // Fallback local update if backend is unreachable
      localStorage.setItem('soc_user_profile', JSON.stringify(payload));
      setOriginalData(JSON.parse(JSON.stringify(payload)));
      if (updateUser) updateUser(payload);
      showToast('Profile saved locally (Offline mode active).', 'success');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyApiToken = () => {
    const token = localStorage.getItem('token') || 'soc-sec-tok-' + Math.random().toString(36).substring(2);
    navigator.clipboard.writeText(token);
    setTokenCopied(true);
    showToast('✓ API Secret Bearer Token copied to clipboard!');
    setTimeout(() => setTokenCopied(false), 2500);
  };

  // User initials
  const initials = profileData.name
    ? profileData.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'AV';

  return (
    <div className="soc-profile-wrapper">
      {/* Toast Notifications */}
      <div className="soc-profile-toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`soc-profile-toast ${t.type}`}>
            <span className="soc-profile-toast-dot" />
            <span>{t.msg}</span>
          </div>
        ))}
      </div>

      <div className="soc-profile-container">
        {/* Top Header */}
        <header className="soc-profile-header">
          <div>
            <div className="soc-profile-header-tag">SOC COMMAND CENTER &bull; USER ACCESS</div>
            <h1 className="soc-profile-header-title">Analyst Profile & Security Hub</h1>
            <p className="soc-profile-header-sub">
              Manage your verified operational identity, security clearance, and heuristic dispatch rules.
            </p>
          </div>

          <div className="soc-profile-header-actions">
            {hasUnsavedChanges && (
              <button
                type="button"
                className="soc-profile-btn-secondary"
                onClick={handleDiscardChanges}
                disabled={isSaving}
              >
                Discard Changes
              </button>
            )}

            <button
              type="button"
              className={`soc-profile-btn-primary ${hasUnsavedChanges ? 'has-changes-glow' : ''}`}
              onClick={handleSaveProfile}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="btn-loader-small" /> Saving Profile...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  Save Profile
                </>
              )}
            </button>
          </div>
        </header>

        {/* HERO EXECUTIVE CARD */}
        <section className="soc-profile-hero-card">
          <div className="soc-profile-hero-left">
            {/* Interactive Avatar Frame */}
            <div
              className="soc-profile-avatar-interactive"
              onClick={() => setAvatarModalOpen(true)}
              title="Click to change profile photo"
            >
              <div className="soc-avatar-glow-ring" />
              {profileData.avatar ? (
                <img
                  src={profileData.avatar}
                  alt={profileData.name}
                  className="soc-profile-avatar-img"
                />
              ) : (
                <div className="soc-profile-avatar-initials">
                  {initials}
                </div>
              )}

              {/* Hover Camera Icon Badge */}
              <div className="soc-avatar-edit-badge" title="Change photo">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>

              {/* Active Operator Status Dot */}
              <div className="soc-avatar-status-dot" title="Active Verified SOC Operator" />
            </div>

            {/* Hero Meta Information */}
            <div className="soc-profile-hero-meta">
              <div className="soc-profile-name-row">
                <h2>{profileData.name}</h2>
                <span className="soc-profile-clearance-pill">
                  {profileData.clearance}
                </span>
                <span className="soc-profile-analyst-id-pill">
                  {profileData.analystId}
                </span>
              </div>

              <p className="soc-profile-hero-role">
                <span className="role-highlight">{profileData.roleTitle}</span> &bull; {profileData.department}
              </p>

              <div className="soc-profile-hero-contact-line">
                <span>📧 {profileData.email}</span>
                <span>•</span>
                <span>@{profileData.username}</span>
                <span>•</span>
                <span>📞 {profileData.phone}</span>
              </div>

              <p className="soc-profile-hero-bio">
                "{profileData.bio}"
              </p>
            </div>
          </div>

          {/* Quick Telemetry Counters */}
          <div className="soc-profile-hero-stats">
            <div className="soc-profile-stat-box">
              <span className="stat-num text-mint">1,482</span>
              <span className="stat-label">THREATS ANALYZED</span>
            </div>
            <div className="soc-profile-stat-divider" />
            <div className="soc-profile-stat-box">
              <span className="stat-num text-mint">99.4%</span>
              <span className="stat-label">HEURISTIC ACCURACY</span>
            </div>
            <div className="soc-profile-stat-divider" />
            <div className="soc-profile-stat-box">
              <span className="stat-num">0.42s</span>
              <span className="stat-label">AVG RESPONSE SLA</span>
            </div>
          </div>
        </section>

        {/* PROFILE PHOTO STUDIO MODAL / POPOVER */}
        {avatarModalOpen && (
          <div className="soc-avatar-modal-backdrop" onClick={() => setAvatarModalOpen(false)}>
            <div className="soc-avatar-modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="soc-avatar-modal-header">
                <div>
                  <h3 className="soc-avatar-modal-title">Customize Profile Photo</h3>
                  <p className="soc-avatar-modal-sub">Upload your own photo or pick a verified cyber insignia</p>
                </div>
                <button
                  type="button"
                  className="soc-modal-close-btn"
                  onClick={() => setAvatarModalOpen(false)}
                >
                  ✕
                </button>
              </div>

              <div className="soc-avatar-modal-body">
                {/* Current Photo Preview & Upload Controls */}
                <div className="soc-avatar-current-preview">
                  <div className="soc-avatar-large-preview">
                    {profileData.avatar ? (
                      <img src={profileData.avatar} alt="Current avatar" />
                    ) : (
                      <div className="soc-preview-initials">{initials}</div>
                    )}
                  </div>

                  <div className="soc-avatar-upload-cta">
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      accept="image/png, image/jpeg, image/webp"
                      onChange={handleImageUpload}
                    />

                    <button
                      type="button"
                      className="soc-btn-upload-file"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                      </svg>
                      Upload New Image
                    </button>

                    {profileData.avatar && (
                      <button
                        type="button"
                        className="soc-btn-remove-avatar"
                        onClick={handleRemoveAvatar}
                      >
                        Remove Photo
                      </button>
                    )}

                    <span className="soc-upload-specs">
                      Supports JPG, PNG, WebP up to 8MB. Automatically scaled and formatted for SOC Command Center.
                    </span>
                  </div>
                </div>

                {/* Preset Avatars Selector */}
                <div className="soc-avatar-presets-section">
                  <span className="soc-presets-heading">OR CHOOSE A CYBER SPECIALIST PRESET</span>
                  <div className="soc-presets-grid">
                    {AVATAR_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        className={`soc-preset-item ${profileData.avatar === preset.url ? 'active-preset' : ''}`}
                        onClick={() => handleSelectPresetAvatar(preset.url)}
                      >
                        <img src={preset.url} alt={preset.name} />
                        <span className="preset-name">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="soc-avatar-modal-footer">
                <button
                  type="button"
                  className="soc-profile-btn-primary"
                  onClick={() => setAvatarModalOpen(false)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODERN NAVIGATION TABS */}
        <div className="soc-profile-tabs-bar">
          <button
            type="button"
            className={`soc-profile-tab-btn ${activeTab === 'identity' ? 'active' : ''}`}
            onClick={() => setActiveTab('identity')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Operator Identity & Contact
          </button>

          <button
            type="button"
            className={`soc-profile-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Clearance & Credentials
          </button>

          <button
            type="button"
            className={`soc-profile-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            Alert Rules & Policies
          </button>
        </div>

        {/* TAB 1: OPERATOR IDENTITY & CONTACT */}
        {activeTab === 'identity' && (
          <div className="soc-profile-tab-content">
            <div className="soc-profile-card">
              <div className="soc-card-head">
                <div className="soc-card-icon-wrap">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </div>
                <div>
                  <h3>General Account Information</h3>
                  <span className="soc-card-sub">Personal and operational contact details displayed in incident logs</span>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="soc-profile-form">
                <div className="soc-form-row">
                  <div className="soc-form-field">
                    <label>
                      Full Name <span className="req-star">*</span>
                    </label>
                    <div className="soc-input-wrapper">
                      <span className="soc-input-icon">👤</span>
                      <input
                        type="text"
                        value={profileData.name}
                        placeholder="Alex Vance"
                        onChange={(e) => handleFieldChange('name', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="soc-form-field">
                    <label>
                      Operator Handle / Username <span className="req-star">*</span>
                    </label>
                    <div className="soc-input-wrapper">
                      <span className="soc-input-icon">@</span>
                      <input
                        type="text"
                        value={profileData.username}
                        placeholder="alexvance"
                        onChange={(e) => handleFieldChange('username', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="soc-form-row">
                  <div className="soc-form-field">
                    <label>
                      Email Address <span className="req-star">*</span>
                    </label>
                    <div className="soc-input-wrapper">
                      <span className="soc-input-icon">✉️</span>
                      <input
                        type="email"
                        value={profileData.email}
                        placeholder="demo@soc.io"
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="soc-form-field">
                    <label>Emergency Dispatch Phone</label>
                    <div className="soc-input-wrapper">
                      <span className="soc-input-icon">📞</span>
                      <input
                        type="text"
                        value={profileData.phone}
                        placeholder="+1 (555) 123-4567"
                        onChange={(e) => handleFieldChange('phone', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="soc-form-row">
                  <div className="soc-form-field">
                    <label>Operational Role Title</label>
                    <div className="soc-input-wrapper">
                      <span className="soc-input-icon">🎖️</span>
                      <input
                        type="text"
                        value={profileData.roleTitle}
                        placeholder="Lead Threat Response Specialist"
                        onChange={(e) => handleFieldChange('roleTitle', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="soc-form-field">
                    <label>Organizational Department</label>
                    <div className="soc-input-wrapper">
                      <span className="soc-input-icon">🏢</span>
                      <input
                        type="text"
                        value={profileData.department}
                        placeholder="SOC Incident Intelligence Unit"
                        onChange={(e) => handleFieldChange('department', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="soc-form-row">
                  <div className="soc-form-field">
                    <label>Analyst Identification Code</label>
                    <div className="soc-input-wrapper">
                      <span className="soc-input-icon">🏷️</span>
                      <input
                        type="text"
                        value={profileData.analystId}
                        placeholder="#SOC-2026-VANCE"
                        onChange={(e) => handleFieldChange('analystId', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="soc-form-field">
                    <label>Operational Timezone</label>
                    <div className="soc-input-wrapper">
                      <span className="soc-input-icon">🌐</span>
                      <select
                        value={profileData.timezone}
                        onChange={(e) => handleFieldChange('timezone', e.target.value)}
                        className="soc-select-input"
                      >
                        <option value="UTC +05:30 (Indian Standard Time)">UTC +05:30 (Indian Standard Time - IST)</option>
                        <option value="UTC +00:00 (Greenwich Mean Time)">UTC +00:00 (Universal Time - GMT)</option>
                        <option value="UTC -05:00 (US Eastern Standard Time)">UTC -05:00 (US Eastern - EST)</option>
                        <option value="UTC -08:00 (US Pacific Standard Time)">UTC -08:00 (US Pacific - PST)</option>
                        <option value="UTC +08:00 (Singapore / China Standard)">UTC +08:00 (Singapore - SGT)</option>
                        <option value="UTC +01:00 (Central European Time)">UTC +01:00 (Central European - CET)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="soc-form-field">
                  <label>Professional Bio & Specialization</label>
                  <textarea
                    rows={3}
                    className="soc-textarea-input"
                    value={profileData.bio}
                    placeholder="Describe your security focus, threat hunting capabilities, or certifications..."
                    onChange={(e) => handleFieldChange('bio', e.target.value)}
                  />
                </div>

                <div className="soc-form-actions-bottom">
                  <button
                    type="submit"
                    className="soc-profile-btn-primary"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: CLEARANCE & CREDENTIALS */}
        {activeTab === 'security' && (
          <div className="soc-profile-tab-content soc-profile-grid">
            {/* Clearance & Roles */}
            <div className="soc-profile-card">
              <div className="soc-card-head">
                <div className="soc-card-icon-wrap">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <h3>Clearance & Authorization Tier</h3>
                  <span className="soc-card-sub">Granted privilege levels for ML models and forensic telemetry</span>
                </div>
              </div>

              <div className="soc-form-field" style={{ marginTop: '4px' }}>
                <label>Security Clearance Level</label>
                <select
                  value={profileData.clearance}
                  onChange={(e) => handleFieldChange('clearance', e.target.value)}
                  className="soc-select-input"
                >
                  <option value="Level 4 — Root Administrator">Level 4 — Root Administrator (Full SOC Authority)</option>
                  <option value="Level 3 — Senior Threat Hunter">Level 3 — Senior Threat Hunter (Forensics & Ingestion)</option>
                  <option value="Level 2 — Incident Analyst">Level 2 — Incident Analyst (Investigation & Reports)</option>
                  <option value="Level 1 — Standard Operator">Level 1 — Standard Operator (Read-Only Telemetry)</option>
                </select>
              </div>

              <div className="soc-permissions-list">
                <span className="soc-presets-heading" style={{ margin: '8px 0 2px' }}>ACTIVE SYSTEM PRIVILEGES</span>
                <div className="soc-permission-item">
                  <div className="perm-info">
                    <span className="perm-title">Isolation Forest Retraining</span>
                    <span className="perm-desc">Trigger adaptive model weights & anomaly threshold tuning</span>
                  </div>
                  <span className="perm-badge active">AUTHORIZED</span>
                </div>

                <div className="soc-permission-item">
                  <div className="perm-info">
                    <span className="perm-title">Automated IP Border Quarantine</span>
                    <span className="perm-desc">Apply edge firewall DROP rules for detected brute-force attacks</span>
                  </div>
                  <span className="perm-badge active">AUTHORIZED</span>
                </div>

                <div className="soc-permission-item">
                  <div className="perm-info">
                    <span className="perm-title">Dynamic Website Vulnerability Scanner</span>
                    <span className="perm-desc">Run passive security header and SSL handshake inspection</span>
                  </div>
                  <span className="perm-badge active">AUTHORIZED</span>
                </div>

                <div className="soc-permission-item">
                  <div className="perm-info">
                    <span className="perm-title">Forensic Audit Log Export</span>
                    <span className="perm-desc">Generate signed PDF compliance and vulnerability reports</span>
                  </div>
                  <span className="perm-badge active">AUTHORIZED</span>
                </div>
              </div>
            </div>

            {/* API Keys & 2FA */}
            <div className="soc-profile-card">
              <div className="soc-card-head">
                <div className="soc-card-icon-wrap">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </div>
                <div>
                  <h3>API Credentials & Multi-Factor</h3>
                  <span className="soc-card-sub">Programmatic ingestion keys and authentication hardening</span>
                </div>
              </div>

              <div className="soc-token-box">
                <div className="token-meta">
                  <span className="token-label">SOC BEARER AUTH TOKEN</span>
                  <span className="token-expiry">EXPIRES: 30 DAYS</span>
                </div>

                <div className="token-input-row">
                  <code>{localStorage.getItem('token')?.substring(0, 32) || 'demo-token-soc-2026-vance'}...</code>
                  <button
                    type="button"
                    className="soc-btn-copy"
                    onClick={handleCopyApiToken}
                  >
                    {tokenCopied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <span className="soc-upload-specs">
                  Include this Bearer token in the <code>Authorization</code> header when streaming syslog packets via REST.
                </span>
              </div>

              <div className="soc-auth-flags">
                <div className="auth-flag-item">
                  <div>
                    <span className="flag-title">Two-Factor Authentication (2FA)</span>
                    <span className="flag-sub">FIDO2 / WebAuthn Hardware Security Key</span>
                  </div>
                  <span className="flag-pill-active">ENFORCED</span>
                </div>

                <div className="auth-flag-item">
                  <div>
                    <span className="flag-title">Session Hijacking Protection</span>
                    <span className="flag-sub">Client IP & TLS Fingerprint Binding</span>
                  </div>
                  <span className="flag-pill-active">ENABLED</span>
                </div>

                <div className="auth-flag-item">
                  <div>
                    <span className="flag-title">Active Station Protocol</span>
                    <span className="flag-sub">Workstation Alpha &bull; Windows 11 &bull; 192.168.1.10</span>
                  </div>
                  <span className="flag-pill-active">ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ALERT RULES & POLICIES */}
        {activeTab === 'notifications' && (
          <div className="soc-profile-tab-content">
            <div className="soc-profile-card">
              <div className="soc-card-head">
                <div className="soc-card-icon-wrap">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <div>
                  <h3>Heuristic Dispatch & Alerting Policies</h3>
                  <span className="soc-card-sub">Configure incident notification channels and automated quarantine actions</span>
                </div>
              </div>

              <div className="soc-toggle-list">
                {/* Switch 1 */}
                <div className="soc-toggle-row">
                  <div className="toggle-text">
                    <span className="toggle-title">Priority 1 (Critical) Threat Instant Dispatch</span>
                    <span className="toggle-desc">
                      Send immediate SMS and high-priority push notifications when an anomaly score exceeds 0.85 (e.g. Brute Force or SQL Injection).
                    </span>
                  </div>
                  <div
                    className={`soc-switch ${profileData.notifications.notifyP1 ? 'on' : ''}`}
                    onClick={() => handleNotificationToggle('notifyP1')}
                  >
                    <div className="soc-switch-thumb" />
                  </div>
                </div>

                {/* Switch 2 */}
                <div className="soc-toggle-row">
                  <div className="toggle-text">
                    <span className="toggle-title">ML Model Concept Drift Warning</span>
                    <span className="toggle-desc">
                      Notify analyst if baseline log feature distribution shifts by more than 15%, indicating model retraining is advised.
                    </span>
                  </div>
                  <div
                    className={`soc-switch ${profileData.notifications.notifyDrift ? 'on' : ''}`}
                    onClick={() => handleNotificationToggle('notifyDrift')}
                  >
                    <div className="soc-switch-thumb" />
                  </div>
                </div>

                {/* Switch 3 */}
                <div className="soc-toggle-row">
                  <div className="toggle-text">
                    <span className="toggle-title">Autonomous Malicious IP Quarantine</span>
                    <span className="toggle-desc">
                      Automatically blacklist source IP addresses verified to be orchestrating distributed credential stuffing or volumetric attacks.
                    </span>
                  </div>
                  <div
                    className={`soc-switch ${profileData.notifications.autoQuarantine ? 'on' : ''}`}
                    onClick={() => handleNotificationToggle('autoQuarantine')}
                  >
                    <div className="soc-switch-thumb" />
                  </div>
                </div>

                {/* Switch 4 */}
                <div className="soc-toggle-row">
                  <div className="toggle-text">
                    <span className="toggle-title">Acoustic Alert Sirens (Command Center Audio Chimes)</span>
                    <span className="toggle-desc">
                      Play alert audio sound whenever a critical cyber anomaly or brute force attempt is intercepted.
                    </span>
                  </div>
                  <div
                    className={`soc-switch ${profileData.notifications.soundAlerts ? 'on' : ''}`}
                    onClick={() => handleNotificationToggle('soundAlerts')}
                  >
                    <div className="soc-switch-thumb" />
                  </div>
                </div>

                {/* Switch 5 */}
                <div className="soc-toggle-row">
                  <div className="toggle-text">
                    <span className="toggle-title">Weekly Threat Intelligence & PDF Digest</span>
                    <span className="toggle-desc">
                      Receive an aggregated weekly executive PDF audit report with MTTD (Mean Time to Detect) metrics.
                    </span>
                  </div>
                  <div
                    className={`soc-switch ${profileData.notifications.notifyWeekly ? 'on' : ''}`}
                    onClick={() => handleNotificationToggle('notifyWeekly')}
                  >
                    <div className="soc-switch-thumb" />
                  </div>
                </div>
              </div>

              <div className="soc-form-actions-bottom">
                <button
                  type="button"
                  className="soc-profile-btn-primary"
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Policy Settings'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
