import { auditLogger, AuditEventType } from '@/utils/auditLogger';

interface SecurityConfig {
  enableCSP: boolean;
  enableHSTS: boolean;
  enableFrameGuard: boolean;
  enableXSSProtection: boolean;
  enableNoSniff: boolean;
  trustedDomains: string[];
}

class SecurityMiddleware {
  private config: SecurityConfig = {
    enableCSP: true,
    enableHSTS: true,
    enableFrameGuard: true,
    enableXSSProtection: true,
    enableNoSniff: true,
    trustedDomains: [
      'ecotale.app',
      '*.supabase.co',
      '*.sentry.io',
    ],
  };

  constructor(config?: Partial<SecurityConfig>) {
    this.config = { ...this.config, ...config };
  }

  private generateCSP(): string {
    const trustedDomains = this.config.trustedDomains.join(' ');
    
    return [
      "default-src 'self'",
      `connect-src 'self' ${trustedDomains}`,
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: ${trustedDomains}`,
      "font-src 'self' data:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join('; ');
  }

  private async logSecurityViolation(violation: any) {
    await auditLogger.logSecurity('csp_violation', {
      violatedDirective: violation.violatedDirective,
      blockedURI: violation.blockedURI,
      documentURI: violation.documentURI,
    });
  }

  setupSecurityHeaders() {
    // Set up CSP reporting
    if (this.config.enableCSP) {
      const cspHeader = this.generateCSP();
      document.head.appendChild(
        Object.assign(document.createElement('meta'), {
          httpEquiv: 'Content-Security-Policy',
          content: cspHeader,
        })
      );

      // Set up CSP violation reporting
      document.addEventListener('securitypolicyviolation', (e) => {
        this.logSecurityViolation(e);
      });
    }

    // Set up HSTS
    if (this.config.enableHSTS && window.location.protocol === 'https:') {
      const hstsHeader = 'max-age=31536000; includeSubDomains; preload';
      document.head.appendChild(
        Object.assign(document.createElement('meta'), {
          httpEquiv: 'Strict-Transport-Security',
          content: hstsHeader,
        })
      );
    }

    // Set up other security headers
    if (this.config.enableFrameGuard) {
      document.head.appendChild(
        Object.assign(document.createElement('meta'), {
          httpEquiv: 'X-Frame-Options',
          content: 'DENY',
        })
      );
    }

    if (this.config.enableXSSProtection) {
      document.head.appendChild(
        Object.assign(document.createElement('meta'), {
          httpEquiv: 'X-XSS-Protection',
          content: '1; mode=block',
        })
      );
    }

    if (this.config.enableNoSniff) {
      document.head.appendChild(
        Object.assign(document.createElement('meta'), {
          httpEquiv: 'X-Content-Type-Options',
          content: 'nosniff',
        })
      );
    }
  }

  async validateRequest(request: Request): Promise<boolean> {
    const origin = request.headers.get('origin');
    if (!origin) return true;

    const isAllowed = this.config.trustedDomains.some(domain => 
      origin.endsWith(domain.replace('*.', ''))
    );

    if (!isAllowed) {
      await auditLogger.logSecurity('invalid_origin', {
        origin,
        path: new URL(request.url).pathname,
      });
      return false;
    }

    return true;
  }

  async validateFileUpload(file: File): Promise<boolean> {
    // List of allowed file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
      'text/csv',
    ];

    // Maximum file size (5MB)
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      await auditLogger.logSecurity('invalid_file_type', {
        fileName: file.name,
        fileType: file.type,
      });
      return false;
    }

    if (file.size > maxSize) {
      await auditLogger.logSecurity('file_too_large', {
        fileName: file.name,
        fileSize: file.size,
      });
      return false;
    }

    return true;
  }
}

export const securityMiddleware = new SecurityMiddleware(); 