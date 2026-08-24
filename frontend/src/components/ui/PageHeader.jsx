export default function PageHeader({ title, subtitle, timestamp, children }) {
  return (
    <div className="ds-page-header">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
      {timestamp && <span className="ds-page-header-timestamp">{timestamp}</span>}
      {children}
    </div>
  );
}
