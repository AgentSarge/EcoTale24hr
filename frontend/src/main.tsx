import React from 'react'
import { createRoot } from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App'
import './index.css'
import { monitoring } from './lib/monitoring'
import { SecurityHeaders, createSecurityHeaders } from './middleware/security-headers'
import { StoreProvider } from './providers/StoreProvider'

// Initialize monitoring service
monitoring.initialize({
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,
  logRocketAppId: import.meta.env.VITE_LOGROCKET_APP_ID,
  environment: import.meta.env.MODE as 'development' | 'staging' | 'production',
  release: import.meta.env.VITE_APP_VERSION || '1.0.0',
})

// Apply security headers
const securityHeaders = createSecurityHeaders({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  isDevelopment: import.meta.env.DEV,
})
securityHeaders.applyHeaders()

// Validate headers in development
if (import.meta.env.DEV) {
  securityHeaders.validateHeaders()
}

// Initialize Sentry
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of transactions in development
  // Session Replay
  replaysSessionSampleRate: 0.1, // Sample 10% of sessions
  replaysOnErrorSampleRate: 1.0, // Sample 100% of sessions with errors
  environment: import.meta.env.MODE,
  beforeSend(event) {
    // Sanitize sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }
    return event;
  },
})

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element not found')
}

const root = createRoot(container)
root.render(
  <React.StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </React.StrictMode>,
)
