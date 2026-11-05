import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { ProgressProvider } from './store/useProgress';
import ErrorBoundary from './components/ui/ErrorBoundary';
import './styles/global.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <ProgressProvider>
          <App />
        </ProgressProvider>
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

// Her progress lives only in this browser. Without asking, Safari may clear a
// site's storage after a week unopened; a granted persist() exempts it. Asking
// is silent where it is granted and harmless where it is not.
if (navigator.storage?.persist) {
  navigator.storage.persisted?.().then((already) => {
    if (!already) void navigator.storage.persist().catch(() => {});
  }).catch(() => {});
}

// Offline support. Registered after load so it never competes with the first
// paint, and failures are ignored: the app works fine without it, it just
// won't launch from the home screen without a connection.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
