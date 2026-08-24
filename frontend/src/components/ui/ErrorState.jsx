export default function ErrorState({ title = 'Something went wrong', text, onRetry, children }) {
  return (
    <div className="ds-error">
      <div className="ds-error-icon">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      </div>
      <div className="ds-error-title">{title}</div>
      {text && <div className="ds-error-text">{text}</div>}
      {onRetry && (
        <button className="ds-btn ds-btn-secondary ds-btn-sm" onClick={onRetry}>
          Try Again
        </button>
      )}
      {children}
    </div>
  );
}
