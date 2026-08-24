export default function EmptyState({ icon, title, text }) {
  return (
    <div className="ds-empty">
      {icon && <div className="ds-empty-icon">{icon}</div>}
      <div className="ds-empty-title">{title}</div>
      {text && <div className="ds-empty-text">{text}</div>}
    </div>
  );
}
