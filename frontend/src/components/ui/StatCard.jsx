export default function StatCard({ label, value, sub, change, positive, icon, color }) {
  return (
    <div className="ds-stat-card">
      <div className="ds-stat-icon" style={{ background: `${color}15`, color }}>
        {icon}
      </div>
      <div className="ds-stat-info">
        <span className="ds-stat-label">{label}</span>
        <h3>{value}</h3>
        {sub && <span className="ds-stat-sub">{sub}</span>}
        {change && (
          <span className={`ds-stat-change ${positive ? 'positive' : 'negative'}`}>
            {change}
          </span>
        )}
      </div>
    </div>
  );
}
