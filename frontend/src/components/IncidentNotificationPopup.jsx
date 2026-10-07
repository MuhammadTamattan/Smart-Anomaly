import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './IncidentNotificationPopup.css';

/**
 * Plays a subtle two-tone audio alert via Web Audio API
 */
const playNotificationChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // First tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.18);

    // Second higher tone
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.1); // A5
    gain2.gain.setValueAtTime(0.15, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.35);
  } catch {
    // Autoplay policy fallback
  }
};

export default function IncidentNotificationPopup({ notifications = [], onDismiss }) {
  const navigate = useNavigate();

  // Play chime whenever a new notification is added
  useEffect(() => {
    if (notifications.length > 0) {
      playNotificationChime();
    }
  }, [notifications.length]);

  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <div className="soc-popup-container" aria-live="polite">
      {notifications.map((item) => {
        const severityClass = (item.severity || 'high').toLowerCase();
        const initial = (item.senderName || 'U').charAt(0).toUpperCase();

        return (
          <div key={item.id} className="soc-incident-popup">
            {/* Header Strip */}
            <div className="soc-popup-header">
              <div className="soc-popup-header-left">
                <span className="soc-popup-siren">🚨</span>
                <span className="soc-popup-tag">NEW USER REPORT</span>
              </div>
              <button
                type="button"
                className="soc-popup-close-btn"
                onClick={() => onDismiss(item.id)}
                title="Dismiss"
              >
                ✕
              </button>
            </div>

            {/* Popup Body */}
            <div className="soc-popup-body">
              {/* Sender Details */}
              <div className="soc-popup-user-row">
                <div className="soc-popup-user-avatar">
                  {initial}
                </div>
                <div className="soc-popup-user-meta">
                  <span className="soc-popup-user-name">
                    {item.senderName || 'User'}
                  </span>
                  <span className="soc-popup-user-email">
                    {item.senderEmail || 'Client Account'} &bull; Just now
                  </span>
                </div>
              </div>

              {/* Problem Content Box */}
              <div className="soc-popup-content-box">
                <div className="soc-popup-title-row">
                  <h4 className="soc-popup-title">{item.title}</h4>
                  <span className={`soc-popup-severity-pill ${severityClass}`}>
                    {item.severity || 'HIGH'}
                  </span>
                </div>
                {item.description && (
                  <p className="soc-popup-snippet">{item.description}</p>
                )}
              </div>

              {/* Actions Footer */}
              <div className="soc-popup-actions">
                <button
                  type="button"
                  className="soc-popup-btn-dismiss"
                  onClick={() => onDismiss(item.id)}
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  className="soc-popup-btn-view"
                  onClick={() => {
                    onDismiss(item.id);
                    navigate('/alerts');
                  }}
                >
                  <span>View in Alerts</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
