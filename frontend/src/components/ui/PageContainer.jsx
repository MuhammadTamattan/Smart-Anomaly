export default function PageContainer({ children, className = '' }) {
  return (
    <div className={`ds-content ${className}`}>
      {children}
    </div>
  );
}
