import { monitoring } from '../lib/monitoring';

interface SecurityHeadersConfig {
  enableHSTS: boolean;
  enableCSP: boolean;
  trustedDomains: string[];
}

const defaultConfig: SecurityHeadersConfig = {
  enableHSTS: true,
  enableCSP: true,
  trustedDomains: [
    'self',
    'https://ecotale.app',
    'https://*.supabase.co',
    'https://*.sentry.io',
    'https://*.logrocket.io'
  ]
};

export class SecurityHeaders {
  private config: SecurityHeadersConfig;

  constructor(config: Partial<SecurityHeadersConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private generateCSP(): string {
    const domains = this.config.trustedDomains.join(' ');
    return [
      "default-src 'self'",
      `connect-src 'self' ${domains}`,
      "img-src 'self' data: https:",
      `script-src 'self' ${domains} 'unsafe-inline' 'unsafe-eval'`,
      `style-src 'self' ${domains} 'unsafe-inline'`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "font-src 'self' data:",
      "manifest-src 'self'",
      "media-src 'self'",
      "worker-src 'self' blob:",
    ].join('; ');
  }

  public applySecurityHeaders(): void {
    try {
      // Apply CSP
      if (this.config.enableCSP) {
        const cspValue = this.generateCSP();
        this.setMetaTag('Content-Security-Policy', cspValue);
      }

      // Apply HSTS
      if (this.config.enableHSTS) {
        this.setMetaTag(
          'Strict-Transport-Security',
          'max-age=31536000; includeSubDomains; preload'
        );
      }

      // Other security headers
      this.setMetaTag('X-Content-Type-Options', 'nosniff');
      this.setMetaTag('X-Frame-Options', 'DENY');
      this.setMetaTag('X-XSS-Protection', '1; mode=block');
      this.setMetaTag('Referrer-Policy', 'strict-origin-when-cross-origin');
      this.setMetaTag('Permissions-Policy', 'geolocation=(), microphone=()');

      monitoring.setTag('security_headers', 'applied');
    } catch (error) {
      monitoring.captureException(error as Error, {
        context: 'SecurityHeaders.applySecurityHeaders'
      });
    }
  }

  private setMetaTag(name: string, content: string): void {
    const meta = document.createElement('meta');
    meta.httpEquiv = name;
    meta.content = content;
    document.head.appendChild(meta);
  }

  public validateHeaders(): boolean {
    try {
      const requiredHeaders = [
        'Content-Security-Policy',
        'Strict-Transport-Security',
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection',
        'Referrer-Policy',
        'Permissions-Policy'
      ];

      const metas = document.getElementsByTagName('meta');
      const presentHeaders = Array.from(metas).map(meta => meta.httpEquiv);

      const missingHeaders = requiredHeaders.filter(
        header => !presentHeaders.includes(header)
      );

      if (missingHeaders.length > 0) {
        monitoring.captureException(
          new Error('Missing security headers'),
          { missingHeaders }
        );
        return false;
      }

      return true;
    } catch (error) {
      monitoring.captureException(error as Error, {
        context: 'SecurityHeaders.validateHeaders'
      });
      return false;
    }
  }
} 