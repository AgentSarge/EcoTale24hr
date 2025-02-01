import React from 'react';
import ReactDOM from 'react-dom/client';
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 