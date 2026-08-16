import React from 'react';

// A six-year-old cannot recover from a blank screen. Anything that throws during
// render lands here instead, with one big button back to safety.

interface Props { children: React.ReactNode }
interface State { hasError: boolean }

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // Kept for the parent looking at a console, not shown to the child.
    console.error('Math Stars hit an error:', error, info);
  }

  handleGoHome = () => {
    // Full reload rather than a route change: whatever state caused the throw
    // is gone afterwards, so she can't bounce straight back into it.
    window.location.hash = '#/';
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        height: '100dvh',
        background: 'linear-gradient(180deg, #87CEEB 0%, #4A90E2 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 24, padding: 32, textAlign: 'center',
      }}>
        <div style={{ fontSize: 76 }}>🐱</div>
        <div style={{ fontFamily: 'Nunito', fontWeight: 800, fontSize: 30, color: '#fff' }}>
          Oops! Let's start over.
        </div>
        <div style={{ fontFamily: 'Nunito', fontWeight: 700, fontSize: 18, color: 'rgba(255,255,255,0.9)', maxWidth: 340 }}>
          Something got mixed up. Your stars are all safe!
        </div>
        <button
          onClick={this.handleGoHome}
          style={{
            background: '#fff', color: '#4A90E2', border: 'none', borderRadius: 20,
            padding: '18px 40px', fontFamily: 'Nunito', fontWeight: 800, fontSize: 22,
            cursor: 'pointer', boxShadow: '0 4px 0 rgba(0,0,0,0.2)', minHeight: 64,
          }}
        >
          🏠 Go Home
        </button>
      </div>
    );
  }
}
