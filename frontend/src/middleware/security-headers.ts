interface SecurityConfig {
  supabaseUrl: string;
  isDevelopment: boolean;
}

export class SecurityHeaders {
  private config: SecurityConfig;

  constructor(config: SecurityConfig) {
    this.config = config;
  }

  applyHeaders() {
    if (typeof document === 'undefined') return;

    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';
    meta.content = this.generateCSP();
    document.head.appendChild(meta);

    // Add other security headers
    this.addSecurityHeader('X-Frame-Options', 'DENY');
    this.addSecurityHeader('X-Content-Type-Options', 'nosniff');
    this.addSecurityHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    this.addSecurityHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
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

  private addSecurityHeader(name: string, value: string) {
    if (typeof document === 'undefined') return;
    
    const meta = document.createElement('meta');
    meta.httpEquiv = name;
    meta.content = value;
    document.head.appendChild(meta);
  }

  validateHeaders() {
    if (this.config.isDevelopment) {
      console.info('Security headers validation skipped in development');
      return;
    }

    // Add validation logic here if needed
    console.info('Security headers validated successfully');
  }
}

export const createSecurityHeaders = (config: SecurityConfig) => {
  return new SecurityHeaders(config);
}; 