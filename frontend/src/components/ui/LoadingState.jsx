export default function LoadingState({ text = 'Loading...' }) {
  return (
    <div className="ds-loading">
      <div className="ds-spinner" />
      <span className="ds-loading-text">{text}</span>
    </div>
  );
}
