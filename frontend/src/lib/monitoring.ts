import * as Sentry from '@sentry/react';
import LogRocket from 'logrocket';

interface MonitoringConfig {
  sentryDsn?: string;
  logRocketAppId?: string;
  environment: 'development' | 'staging' | 'production';
  release: string;
}

class MonitoringService {
  private initialized = false;

  initialize(config: MonitoringConfig) {
    if (this.initialized) return;

    // Initialize Sentry
    if (config.sentryDsn) {
      Sentry.init({
        dsn: config.sentryDsn,
        environment: config.environment,
        release: config.release,
        tracesSampleRate: config.environment === 'production' ? 0.2 : 1.0,
      });
    }

    // Initialize LogRocket
    if (config.logRocketAppId) {
      LogRocket.init(config.logRocketAppId, {
        release: config.release,
        console: {
          shouldAggregateConsoleErrors: true,
        },
      });

      // Integrate LogRocket with Sentry
      LogRocket.getSessionURL(sessionURL => {
        Sentry.configureScope(scope => {
          scope.setExtra('logRocketSessionURL', sessionURL);
        });
      });
    }

    this.initialized = true;
  }

  setTag(key: string, value: string | number | boolean) {
    Sentry.setTag(key, value);
    LogRocket.track(key, { value });
  }

  captureException(error: Error, context?: Record<string, any>) {
    Sentry.captureException(error, { extra: context });
    LogRocket.captureException(error, { extra: context });
  }

  setUser(user: { id: string; email?: string; [key: string]: any } | null) {
    if (user) {
      Sentry.setUser(user);
      LogRocket.identify(user.id, user);
    } else {
      Sentry.setUser(null);
      // LogRocket doesn't have a clear user method
    }
  }
}

export const monitoring = new MonitoringService(); 