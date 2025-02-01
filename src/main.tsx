import React from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import './index.css';
import { monitoring } from './lib/monitoring';
import { SecurityHeaders } from './middleware/security-headers';
import { performanceMonitor } from './lib/performance';

// Initialize monitoring service
monitoring.initialize({
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,
  logRocketAppId: import.meta.env.VITE_LOGROCKET_APP_ID,
  environment: import.meta.env.MODE as 'development' | 'staging' | 'production',
  release: import.meta.env.VITE_APP_VERSION || '1.0.0',
});

// Apply security headers
const securityHeaders = new SecurityHeaders();
securityHeaders.applySecurityHeaders();

// Validate headers in development
if (import.meta.env.DEV) {
  const headersValid = securityHeaders.validateHeaders();
  if (!headersValid) {
    console.warn('Security headers validation failed');
  }
}

// Performance monitoring is automatically initialized when imported
// We can access metrics through performanceMonitor.getMetrics() and performanceMonitor.getResourceMetrics()

// Initialize Sentry
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0,
  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 