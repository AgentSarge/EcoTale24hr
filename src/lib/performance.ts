import * as Sentry from '@sentry/react';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
}

interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];

  constructor() {
    this.initObservers();
  }

  private initObservers() {
    // Core Web Vitals
    this.observeWebVitals();
    // Resource timing
    this.observeResourceTiming();
    // Long tasks
    this.observeLongTasks();
  }

  private observeWebVitals() {
    if (!('PerformanceObserver' in window)) return;

    const webVitalsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          this.recordMetric('LCP', entry.startTime, 'ms');
        } else if (entry.entryType === 'first-input') {
          const fid = (entry as PerformanceEventTiming).processingStart - entry.startTime;
          this.recordMetric('FID', fid, 'ms');
        } else if (entry.entryType === 'layout-shift') {
          const cls = (entry as LayoutShift).value;
          this.recordMetric('CLS', cls, '');
        }
      }
    });

    try {
      webVitalsObserver.observe({
        entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift']
      });
    } catch (error) {
      console.error('Failed to observe web vitals:', error);
    }
  }

  private observeResourceTiming() {
    if (!('PerformanceObserver' in window)) return;

    const resourceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resource = entry as PerformanceResourceTiming;
          this.recordMetric(
            `Resource-${resource.name}`,
            resource.duration,
            'ms'
          );
        }
      }
    });

    try {
      resourceObserver.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.error('Failed to observe resource timing:', error);
    }
  }

  private observeLongTasks() {
    if (!('PerformanceObserver' in window)) return;

    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'longtask') {
          this.recordMetric('LongTask', entry.duration, 'ms');
        }
      }
    });

    try {
      longTaskObserver.observe({ entryTypes: ['longtask'] });
    } catch (error) {
      console.error('Failed to observe long tasks:', error);
    }
  }

  private recordMetric(name: string, value: number, unit: string) {
    this.metrics.push({ name, value, unit });
    Sentry.addBreadcrumb({
      category: 'performance',
      message: `${name}: ${value}${unit}`,
      level: 'info'
    });
  }

  public getMetrics(): PerformanceMetric[] {
    return this.metrics;
  }
}

export const performanceMonitor = new PerformanceMonitor(); 