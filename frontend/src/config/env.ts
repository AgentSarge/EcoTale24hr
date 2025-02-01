interface EnvConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  sentry: {
    dsn: string;
  };
  logRocket: {
    appId: string;
  };
  app: {
    version: string;
    environment: 'development' | 'staging' | 'production';
    isDev: boolean;
    isProd: boolean;
  };
}

export const env: EnvConfig = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  sentry: {
    dsn: import.meta.env.VITE_SENTRY_DSN,
  },
  logRocket: {
    appId: import.meta.env.VITE_LOGROCKET_APP_ID,
  },
  app: {
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    environment: import.meta.env.MODE as 'development' | 'staging' | 'production',
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
  },
}; 