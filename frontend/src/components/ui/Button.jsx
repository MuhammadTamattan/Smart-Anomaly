export default function Button({ children, variant = 'primary', size = 'md', disabled = false, onClick, className = '', type = 'button', ...props }) {
  return (
    <button
      type={type}
      className={`ds-btn ds-btn-${variant} ds-btn-${size === 'sm' ? 'sm' : ''} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
