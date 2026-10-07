import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: 'var(--ds-bg-primary)',
          padding: '20px',
        }}>
          <div style={{
            maxWidth: '440px',
            width: '100%',
            background: 'var(--ds-bg-surface)',
            border: '1px solid var(--ds-border)',
            borderRadius: 'var(--ds-radius-xl)',
            padding: '40px 36px',
            textAlign: 'center',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              margin: '0 auto 20px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: 'var(--ds-radius-lg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h2 style={{
              margin: '0 0 8px',
              fontSize: 'var(--ds-font-size-3xl)',
              fontWeight: 'var(--ds-font-weight-bold)',
              color: 'var(--ds-text-primary)',
            }}>Something went wrong</h2>
            <p style={{
              margin: '0 0 20px',
              fontSize: 'var(--ds-font-size-md)',
              color: 'var(--ds-text-muted)',
              lineHeight: 'var(--ds-line-height-relaxed)',
            }}>
              An unexpected error occurred. Please try refreshing the page.
            </p>
            {this.state.error && (
              <details style={{ textAlign: 'left', marginBottom: '20px', background: 'rgba(0, 0, 0, 0.25)', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.2)', wordBreak: 'break-word' }}>
                <summary style={{ cursor: 'pointer', color: 'var(--ds-text-secondary, #94a3b8)', marginBottom: '6px', fontWeight: 600 }}>Error Details</summary>
                <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', maxHeight: '140px', overflowY: 'auto' }}>
                  {this.state.error.toString()}
                </div>
              </details>
            )}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: '10px 22px',
                  background: 'linear-gradient(135deg, var(--ds-blue, #3b82f6), var(--ds-indigo, #6366f1))',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--ds-radius-md, 8px)',
                  fontSize: 'var(--ds-font-size-md, 14px)',
                  fontWeight: 'var(--ds-font-weight-semibold, 600)',
                  cursor: 'pointer',
                }}
              >
                Refresh Page
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/login';
                }}
                style={{
                  padding: '10px 18px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'var(--ds-text-primary, #e2e8f0)',
                  border: '1px solid var(--ds-border, rgba(255, 255, 255, 0.1))',
                  borderRadius: 'var(--ds-radius-md, 8px)',
                  fontSize: 'var(--ds-font-size-md, 14px)',
                  cursor: 'pointer',
                }}
              >
                Reset & Go to Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
