import * as Sentry from '@sentry/react';
import LogRocket from 'logrocket';
import { BrowserTracing } from '@sentry/tracing';

interface MonitoringConfig {
  sentryDsn: string;
  logRocketAppId: string;
  environment: 'development' | 'staging' | 'production';
  release: string;
}

class MonitoringService {
  private static instance: MonitoringService;
  private initialized = false;

  private constructor() {}

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  public initialize(config: MonitoringConfig): void {
    if (this.initialized) {
      console.warn('Monitoring service already initialized');
      return;
    }

    // Initialize LogRocket
    LogRocket.init(config.logRocketAppId, {
      release: config.release,
      console: {
        shouldAggregateConsoleErrors: true,
      },
      network: {
        requestSanitizer: (request) => {
          // Sanitize sensitive data from requests
          if (request.headers.authorization) {
            request.headers.authorization = '[REDACTED]';
          }
          return request;
        },
        responseSanitizer: (response) => {
          // Sanitize sensitive data from responses
          return response;
        },
      },
    });

    // Initialize Sentry
    Sentry.init({
      dsn: config.sentryDsn,
      environment: config.environment,
      release: config.release,
      integrations: [
        new BrowserTracing({
          tracePropagationTargets: ['localhost', 'ecotale.app'],
        }),
      ],
      tracesSampleRate: config.environment === 'production' ? 0.1 : 1.0,
      beforeSend: (event) => {
        // Sanitize sensitive data before sending to Sentry
        if (event.request?.headers?.authorization) {
          event.request.headers.authorization = '[REDACTED]';
        }
        return event;
      },
    });

    // Link Sentry and LogRocket
    LogRocket.getSessionURL((sessionURL) => {
      Sentry.configureScope((scope) => {
        scope.setExtra('logRocketSession', sessionURL);
      });
    });

    this.initialized = true;
  }

  public captureException(error: Error, context?: Record<string, any>): void {
    Sentry.withScope((scope) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      Sentry.captureException(error);
    });
    LogRocket.captureException(error, context);
  }

  public setUser(user: { id: string; email?: string; name?: string }): void {
    Sentry.setUser(user);
    LogRocket.identify(user.id, {
      name: user.name,
      email: user.email,
    });
  }

  public startPerformanceTransaction(
    name: string,
    operation: string
  ): Sentry.Transaction {
    const transaction = Sentry.startTransaction({
      name,
      op: operation,
    });
    return transaction;
  }

  public setTag(key: string, value: string): void {
    Sentry.setTag(key, value);
    LogRocket.track(key, { value });
  }
}

export const monitoring = MonitoringService.getInstance(); 