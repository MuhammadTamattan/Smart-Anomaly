export default function Message({ type = 'info', children }) {
  return (
    <div className={`ds-message ds-message-${type}`}>
      {children}
    </div>
  );
}
