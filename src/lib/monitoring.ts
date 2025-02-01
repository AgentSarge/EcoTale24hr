import * as Sentry from '@sentry/react';
import LogRocket from 'logrocket';
import { User } from '@supabase/supabase-js';

class MonitoringService {
  private static instance: MonitoringService;

  private constructor() {
    // Initialize Sentry
    if (import.meta.env.VITE_SENTRY_DSN) {
      Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
        tracesSampleRate: 1.0,
        integrations: [
          new Sentry.BrowserTracing(),
          new Sentry.Replay({
            maskAllText: true,
            blockAllMedia: true,
          }),
        ],
      });
    }

    // Initialize LogRocket
    if (import.meta.env.VITE_LOGROCKET_APP_ID) {
      LogRocket.init(import.meta.env.VITE_LOGROCKET_APP_ID, {
        release: import.meta.env.VITE_APP_VERSION,
        console: {
          shouldAggregateConsoleErrors: true,
        },
        network: {
          requestSanitizer: (request) => {
            // Remove sensitive data from requests
            if (request.headers.Authorization) {
              request.headers.Authorization = '[FILTERED]';
            }
            return request;
          },
          responseSanitizer: (response) => {
            // Remove sensitive data from responses
            if (response.body) {
              try {
                const data = JSON.parse(response.body);
                if (data.token || data.password) {
                  response.body = '[FILTERED]';
                }
              } catch (e) {
                // If response is not JSON, leave it as is
              }
            }
            return response;
          },
        },
      });
    }
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  public setUser(user: User | null): void {
    if (user) {
      const userData = {
        id: user.id,
        email: user.email,
      };

      Sentry.setUser(userData);
      LogRocket.identify(user.id, userData);
    } else {
      Sentry.setUser(null);
      LogRocket.identify(null);
    }
  }

  public captureException(error: Error, context?: Record<string, any>): void {
    console.error(error);
    Sentry.captureException(error, { extra: context });
    LogRocket.captureException(error, context);
  }

  public setTag(key: string, value: string): void {
    Sentry.setTag(key, value);
    LogRocket.setTag(key, value);
  }

  public startPerformanceTransaction(name: string, operation: string) {
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
}

export const monitoring = MonitoringService.getInstance(); 