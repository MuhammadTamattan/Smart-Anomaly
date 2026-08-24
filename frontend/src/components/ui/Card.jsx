export default function Card({ children, className = '', header, headerExtra }) {
  return (
    <div className={`ds-card ${className}`}>
      {(header || headerExtra) && (
        <div className="ds-card-header">
          {header && <h2>{header}</h2>}
          {headerExtra}
        </div>
      )}
      {children}
    </div>
  );
}
