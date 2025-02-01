import { securityMiddleware } from '../security';
import { auditLogger } from '@/utils/auditLogger';

// Mock auditLogger
jest.mock('@/utils/auditLogger', () => ({
  auditLogger: {
    logSecurity: jest.fn(),
  },
}));

describe('SecurityMiddleware', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Reset the DOM
    document.head.innerHTML = '';
  });

  describe('setupSecurityHeaders', () => {
    it('sets up CSP headers', () => {
      securityMiddleware.setupSecurityHeaders();
      
      const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
      expect(cspMeta).toBeTruthy();
      expect(cspMeta?.getAttribute('content')).toContain("default-src 'self'");
    });

    it('sets up HSTS headers when using HTTPS', () => {
      // Mock HTTPS
      Object.defineProperty(window, 'location', {
        value: { protocol: 'https:' },
      });

      securityMiddleware.setupSecurityHeaders();
      
      const hstsMeta = document.querySelector('meta[http-equiv="Strict-Transport-Security"]');
      expect(hstsMeta).toBeTruthy();
      expect(hstsMeta?.getAttribute('content')).toContain('max-age=31536000');
    });

    it('sets up other security headers', () => {
      securityMiddleware.setupSecurityHeaders();
      
      expect(document.querySelector('meta[http-equiv="X-Frame-Options"]')).toBeTruthy();
      expect(document.querySelector('meta[http-equiv="X-XSS-Protection"]')).toBeTruthy();
      expect(document.querySelector('meta[http-equiv="X-Content-Type-Options"]')).toBeTruthy();
    });
  });

  describe('validateRequest', () => {
    it('allows requests from trusted domains', async () => {
      const request = new Request('https://api.ecotale.app/data', {
        headers: new Headers({
          'origin': 'https://ecotale.app'
        })
      });

      const isValid = await securityMiddleware.validateRequest(request);
      expect(isValid).toBe(true);
    });

    it('blocks requests from untrusted domains', async () => {
      const request = new Request('https://api.ecotale.app/data', {
        headers: new Headers({
          'origin': 'https://malicious-site.com'
        })
      });

      const isValid = await securityMiddleware.validateRequest(request);
      expect(isValid).toBe(false);
      expect(auditLogger.logSecurity).toHaveBeenCalledWith(
        'invalid_origin',
        expect.objectContaining({
          origin: 'https://malicious-site.com'
        })
      );
    });

    it('allows requests without origin header', async () => {
      const request = new Request('https://api.ecotale.app/data');
      const isValid = await securityMiddleware.validateRequest(request);
      expect(isValid).toBe(true);
    });
  });

  describe('validateFileUpload', () => {
    it('allows valid file types and sizes', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

      const isValid = await securityMiddleware.validateFileUpload(file);
      expect(isValid).toBe(true);
    });

    it('blocks invalid file types', async () => {
      const file = new File(['test content'], 'test.exe', { type: 'application/x-msdownload' });
      
      const isValid = await securityMiddleware.validateFileUpload(file);
      expect(isValid).toBe(false);
      expect(auditLogger.logSecurity).toHaveBeenCalledWith(
        'invalid_file_type',
        expect.objectContaining({
          fileName: 'test.exe'
        })
      );
    });

    it('blocks files that are too large', async () => {
      const file = new File(['test content'], 'large.pdf', { type: 'application/pdf' });
      Object.defineProperty(file, 'size', { value: 10 * 1024 * 1024 }); // 10MB

      const isValid = await securityMiddleware.validateFileUpload(file);
      expect(isValid).toBe(false);
      expect(auditLogger.logSecurity).toHaveBeenCalledWith(
        'file_too_large',
        expect.objectContaining({
          fileName: 'large.pdf'
        })
      );
    });
  });

  describe('CSP violation reporting', () => {
    it('logs CSP violations', () => {
      securityMiddleware.setupSecurityHeaders();

      const violation = new SecurityPolicyViolationEvent('securitypolicyviolation', {
        blockedURI: 'https://malicious-site.com/script.js',
        violatedDirective: 'script-src',
        documentURI: 'https://ecotale.app',
      });

      document.dispatchEvent(violation);

      expect(auditLogger.logSecurity).toHaveBeenCalledWith(
        'csp_violation',
        expect.objectContaining({
          blockedURI: 'https://malicious-site.com/script.js',
          violatedDirective: 'script-src',
        })
      );
    });
  });
}); 