import * as Sentry from '@sentry/react';
import LogRocket from 'logrocket';
import type { User } from '@supabase/supabase-js';

interface MonitoringConfig {
  sentryDsn: string;
  logRocketAppId: string;
  environment: 'development' | 'staging' | 'production';
  release: string;
}

interface UserTraits {
  [key: string]: string | number | boolean;
}

class MonitoringService {
  private initialized = false;

  initialize({ sentryDsn, logRocketAppId, environment, release }: MonitoringConfig): void {
    if (this.initialized) return;

    // Initialize Sentry
    if (sentryDsn) {
      Sentry.init({
        dsn: sentryDsn,
        environment,
        release,
        integrations: [
          new Sentry.BrowserTracing(),
          new Sentry.Replay(),
        ],
        tracesSampleRate: 1.0,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      });
    }

    // Initialize LogRocket
    if (logRocketAppId) {
      LogRocket.init(logRocketAppId, {
        release,
        console: {
          shouldAggregateConsoleErrors: true,
        },
        network: {
          requestSanitizer: (request) => {
            // Sanitize sensitive data from requests
            if (request.headers['authorization']) {
              request.headers['authorization'] = '***';
            }
            return request;
          },
          responseSanitizer: (response) => {
            // Sanitize sensitive data from responses
            return response;
          },
        },
      });
    }

    this.initialized = true;
  }

  identifyUser(user: User | null): void {
    if (user) {
      // Set user context in Sentry
      Sentry.setUser({
        id: user.id,
        email: user.email || undefined,
      });

      // Set user in LogRocket
      const traits: UserTraits = {
        id: user.id,
      };
      
      if (user.email) {
        traits.email = user.email;
      }
      
      if (user.user_metadata?.full_name) {
        traits.name = user.user_metadata.full_name;
      }

      LogRocket.identify(user.id, traits);
    } else {
      // Clear user context
      Sentry.setUser(null);
      LogRocket.identify('');
    }
  }

  captureException(error: Error, context?: Record<string, string | number | boolean>): void {
    Sentry.captureException(error, { contexts: { additional: context } });
    LogRocket.captureException(error, { tags: context });
  }

  setTag(key: string, value: string): void {
    Sentry.setTag(key, value);
    // LogRocket doesn't have a direct setTag method, so we use captureMessage
    LogRocket.captureMessage(`${key}: ${value}`, { tags: { [key]: value } });
  }

  startPerformanceTransaction(name: string, operation: string) {
    const transaction = Sentry.startTransaction({
      name,
      op: operation,
    });

    return {
      finish: () => {
        transaction.finish();
      },
    };
  }

  addBreadcrumb(message: string, category: string): void {
    Sentry.addBreadcrumb({
      message,
      category,
      level: 'info',
    });
  }
}

export const monitoring = new MonitoringService(); 