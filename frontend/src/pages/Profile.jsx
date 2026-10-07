import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Profile.css';

export default function Profile() {
  const { user, updateUser } = useAuth();

  // Initial cached profile
  const cachedProfile = (() => {
    try {
      const stored = localStorage.getItem('soc_user_profile');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  // Profile State: Name, Username, Email, Phone
  const [profileData, setProfileData] = useState({
    name: cachedProfile?.name || user?.name || 'Alex Vance',
    username: cachedProfile?.username || user?.username || 'alexvance',
    email: cachedProfile?.email || user?.email || 'demo@soc.io',
    phone: cachedProfile?.phone || user?.phone || '+1 (555) 123-4567',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Toast helper
  const showToast = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Fetch profile from MongoDB on mount only
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      try {
        const res = await api.get('/auth/profile');
        if (isMounted && res.data) {
          const data = res.data;
          setProfileData({
            name: data.name || 'Alex Vance',
            username: data.username || data.email?.split('@')[0] || 'alexvance',
            email: data.email || 'demo@soc.io',
            phone: data.phone || '+1 (555) 123-4567',
          });
        }
      } catch (err) {
        console.warn('[Profile] Profile load notice:', err.message);
      }
    };

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleFieldChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  // Save profile to MongoDB
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    const payload = {
      name: profileData.name,
      username: profileData.username,
      email: profileData.email,
      phone: profileData.phone,
    };

    try {
      const res = await api.put('/auth/profile', payload);
      localStorage.setItem('soc_user_profile', JSON.stringify(payload));
      if (updateUser) {
        updateUser(res.data || payload);
      }
      showToast('✓ Profile updated successfully.');
    } catch (err) {
      showToast('Could not save profile: ' + (err.response?.data?.message || err.message), 'warning');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="soc-profile-wrapper">
      {/* Toast Notifications */}
      <div className="green-dash-toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`green-dash-toast ${t.type}`}>
            <span className="green-dash-toast-dot" />
            <span>{t.msg}</span>
          </div>
        ))}
      </div>

      <div className="soc-profile-container">
        {/* Top Header */}
        <header className="soc-profile-header">
          <div>
            <h1 className="soc-profile-header-title">Profile</h1>
            <p className="ml-page-sub">
              Manage your user profile
            </p>
          </div>

          <button
            type="button"
            className="soc-profile-btn-primary"
            onClick={handleSaveProfile}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </header>

        {/* HERO CONTAINER: Profile photo, Name, Username, Email, Phone */}
        <section className="soc-profile-hero-card">
          <div className="soc-profile-hero-left">
            <div className="soc-profile-avatar-large">
              <span>👤</span>
            </div>

            <div className="soc-profile-hero-meta">
              <div className="soc-profile-name-row">
                <h2>{profileData.name}</h2>
              </div>
              <p className="soc-profile-hero-role">
                @{profileData.username} &bull; {profileData.email}
              </p>
              {profileData.phone && (
                <div style={{ fontSize: '13px', color: '#a3c4bd', marginTop: '2px' }}>
                  Phone: {profileData.phone}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* EDIT PROFILE CONTAINER */}
        <section className="soc-profile-card">
          <div className="soc-card-head" style={{ marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#0c3631' }}>Edit Profile</h3>
              <span className="soc-card-sub" style={{ fontSize: '12px', color: '#839b95' }}>
                Update your account information
              </span>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="soc-profile-form">
            <div className="soc-form-row">
              <div className="soc-form-field">
                <label>Name</label>
                <input
                  type="text"
                  value={profileData.name}
                  placeholder="Enter name"
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                />
              </div>

              <div className="soc-form-field">
                <label>Username</label>
                <input
                  type="text"
                  value={profileData.username}
                  placeholder="Enter username"
                  onChange={(e) => handleFieldChange('username', e.target.value)}
                />
              </div>
            </div>

            <div className="soc-form-row">
              <div className="soc-form-field">
                <label>Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  placeholder="Enter email"
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                />
              </div>

              <div className="soc-form-field">
                <label>Phone</label>
                <input
                  type="text"
                  value={profileData.phone}
                  placeholder="Enter phone number"
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                />
              </div>
            </div>

            <div style={{ marginTop: '16px' }}>
              <button
                type="submit"
                className="soc-profile-btn-primary"
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
