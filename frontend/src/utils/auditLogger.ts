import * as Sentry from '@sentry/react';
import { supabase } from '@/lib/supabase';

export enum AuditEventType {
  AUTH = 'auth',
  DATA_MODIFICATION = 'data_modification',
  SECURITY = 'security',
  SYSTEM = 'system',
}

export interface AuditEvent {
  type: AuditEventType;
  action: string;
  userId?: string;
  details: Record<string, any>;
  timestamp: string;
}

class AuditLogger {
  private async logToSupabase(event: AuditEvent) {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert([event]);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Failed to log audit event to Supabase:', error);
      Sentry.captureException(error);
    }
  }

  private logToSentry(event: AuditEvent) {
    Sentry.addBreadcrumb({
      category: 'audit',
      message: event.action,
      level: 'info',
      data: {
        type: event.type,
        details: event.details,
        userId: event.userId,
      },
    });
  }

  async log(
    type: AuditEventType,
    action: string,
    details: Record<string, any> = {},
    userId?: string
  ) {
    const event: AuditEvent = {
      type,
      action,
      userId,
      details: this.sanitizeData(details),
      timestamp: new Date().toISOString(),
    };

    // Log to both Supabase and Sentry
    await this.logToSupabase(event);
    this.logToSentry(event);

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('Audit Event:', event);
    }
  }

  private sanitizeData(data: Record<string, any>): Record<string, any> {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'credit_card'];
    const sanitized = { ...data };

    const sanitizeObject = (obj: Record<string, any>) => {
      Object.keys(obj).forEach(key => {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        }
      });
    };

    sanitizeObject(sanitized);
    return sanitized;
  }

  // Convenience methods for common audit events
  async logAuth(action: string, details: Record<string, any> = {}, userId?: string) {
    return this.log(AuditEventType.AUTH, action, details, userId);
  }

  async logDataModification(action: string, details: Record<string, any> = {}, userId?: string) {
    return this.log(AuditEventType.DATA_MODIFICATION, action, details, userId);
  }

  async logSecurity(action: string, details: Record<string, any> = {}, userId?: string) {
    return this.log(AuditEventType.SECURITY, action, details, userId);
  }

  async logSystem(action: string, details: Record<string, any> = {}, userId?: string) {
    return this.log(AuditEventType.SYSTEM, action, details, userId);
  }
}

export const auditLogger = new AuditLogger(); 