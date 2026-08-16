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
