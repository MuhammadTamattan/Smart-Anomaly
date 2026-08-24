const severityConfig = {
  critical: { label: 'Critical' },
  high: { label: 'High' },
  medium: { label: 'Medium' },
  low: { label: 'Low' },
  none: { label: 'None' },
};

export default function SeverityBadge({ severity }) {
  const config = severityConfig[severity] || severityConfig.none;
  return (
    <span className={`ds-badge ds-badge-${severity}`}>
      <span className="ds-badge-dot" />
      {config.label}
    </span>
  );
}
