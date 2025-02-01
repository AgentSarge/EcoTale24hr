import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { Replay } from '@sentry/replay';

export const initSentry = () => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.VITE_SENTRY_ENVIRONMENT || 'production',
      integrations: [
        new BrowserTracing({
          tracePropagationTargets: [
            'localhost',
            /^https:\/\/[^/]*\.ecotale24hr\.com/,
          ],
        }),
        new Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
      tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.1'),
      replaysSessionSampleRate: parseFloat(import.meta.env.VITE_SENTRY_REPLAY_SAMPLE_RATE || '0.1'),
      replaysOnErrorSampleRate: 1.0,
      
      beforeSend(event) {
        // Don't send events in development
        if (import.meta.env.DEV) {
          return null;
        }

        // Scrub sensitive data
        if (event.request?.headers) {
          delete event.request.headers['Authorization'];
        }

        // Remove user IP
        if (event.user) {
          delete event.user.ip_address;
        }

        return event;
      },

      // Performance monitoring
      enableTracing: true,
      normalizeDepth: 5,
      
      // Error monitoring
      autoSessionTracking: true,
      attachStacktrace: true,
    });

    // Set user information when available
    const user = localStorage.getItem('supabase.auth.token');
    if (user) {
      try {
        const userData = JSON.parse(user);
        Sentry.setUser({
          id: userData.user.id,
          email: userData.user.email,
        });
      } catch (error) {
        console.error('Failed to parse user data for Sentry:', error);
      }
    }
  }
};

export const captureException = (error: Error, context?: Record<string, any>) => {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
};

export const startTransaction = (name: string, op: string) => {
  return Sentry.startTransaction({
    name,
    op,
  });
};

export const setTag = (key: string, value: string) => {
  Sentry.setTag(key, value);
};

export const addBreadcrumb = (
  message: string,
  category?: string,
  level?: Sentry.SeverityLevel
) => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now(),
  });
}; 