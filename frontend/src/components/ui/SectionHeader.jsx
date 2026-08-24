export default function SectionHeader({ title, children }) {
  return (
    <div className="ds-section-header">
      <h3>{title}</h3>
      {children}
    </div>
  );
}
