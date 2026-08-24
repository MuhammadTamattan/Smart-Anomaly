export default function Badge({ children, variant = 'default', dot = false, className = '' }) {
  return (
    <span className={`ds-badge ds-badge-${variant} ${className}`}>
      {dot && <span className="ds-badge-dot" />}
      {children}
    </span>
  );
}
