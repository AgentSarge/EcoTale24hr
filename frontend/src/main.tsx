import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { monitoring } from './lib/monitoring'
import { createSecurityService } from './middleware/security'
import { env } from './config/env'

// Initialize monitoring service
monitoring.initialize({
  sentryDsn: env.sentry.dsn,
  logRocketAppId: env.logRocket.appId,
  environment: env.app.environment,
  release: env.app.version,
})

// Apply security headers
const security = createSecurityService({
  supabaseUrl: env.supabase.url,
  isDevelopment: env.app.isDev,
})
security.applyHeaders()

// Validate headers in development
if (env.app.isDev) {
  security.validateHeaders()
}

const container = document.getElementById('root')
if (!container) {
  throw new Error('Root element not found')
}

const root = createRoot(container)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
