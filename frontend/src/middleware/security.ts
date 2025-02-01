import { env } from '../config/env';

interface SecurityConfig {
  supabaseUrl: string;
  isDevelopment: boolean;
}

class SecurityService {
  private config: SecurityConfig;

  constructor(config: SecurityConfig) {
    this.config = config;
  }

  applyHeaders() {
    if (typeof document === 'undefined') return;

    this.applyCSP();
    this.applySecurityHeaders();
  }

  private applyCSP() {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = this.generateCSP();
    document.head.appendChild(meta);
  }

  private generateCSP(): string {
    const directives = {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'img-src': ["'self'", 'data:', 'https:', 'blob:'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'connect-src': [
        "'self'",
        this.config.supabaseUrl,
        'https://vitals.vercel-insights.com',
        this.config.isDevelopment ? 'ws:' : null,
      ].filter(Boolean),
      'frame-src': ["'self'"],
      'frame-ancestors': ["'none'"],
      'form-action': ["'self'"],
      'base-uri': ["'self'"],
      'object-src': ["'none'"],
    };

    return Object.entries(directives)
      .map(([key, values]) => `${key} ${values.join(' ')}`)
      .join('; ');
  }

  private applySecurityHeaders() {
    const headers = {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    };

    Object.entries(headers).forEach(([name, value]) => {
      const meta = document.createElement('meta');
      meta.httpEquiv = name;
      meta.content = value;
      document.head.appendChild(meta);
    });
  }

  validateHeaders() {
    if (this.config.isDevelopment) {
      console.info('Security headers validation skipped in development');
      return;
    }

    const requiredHeaders = [
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'Permissions-Policy',
    ];

    const missingHeaders = requiredHeaders.filter(header => {
      const meta = document.querySelector(`meta[http-equiv="${header}"]`);
      return !meta;
    });

    if (missingHeaders.length > 0) {
      console.warn('Missing security headers:', missingHeaders);
      return false;
    }

    console.info('Security headers validated successfully');
    return true;
  }
}

export const createSecurityService = (config: SecurityConfig) => {
  return new SecurityService(config);
}; 