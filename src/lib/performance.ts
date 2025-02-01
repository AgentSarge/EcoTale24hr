import { monitoring } from './monitoring';
import * as Sentry from '@sentry/react';
import { Metric } from '@sentry/types';

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  jsHeapSize: number; // JavaScript Heap Size
}

interface ResourceMetrics {
  name: string;
  duration: number;
  startTime: number;
  transferSize?: number;
}

class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metricsBuffer: PerformanceMetrics[] = [];
  private resourcesBuffer: ResourceMetrics[] = [];
  private readonly bufferSize = 100;
  private readonly flushInterval = 30000; // 30 seconds

  private constructor() {
    this.initializeObservers();
    this.startPeriodicFlush();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  private initializeObservers(): void {
    // Web Vitals Observer
    if ('PerformanceObserver' in window) {
      // First Contentful Paint
      this.observePerformanceEntry('paint', (entries) => {
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            this.recordWebVital('fcp', entry.startTime);
          }
        });
      });

      // Largest Contentful Paint
      this.observePerformanceEntry('largest-contentful-paint', (entries) => {
        entries.forEach((entry) => {
          this.recordWebVital('lcp', entry.startTime);
        });
      });

      // First Input Delay
      this.observePerformanceEntry('first-input', (entries) => {
        entries.forEach((entry) => {
          const fid = entry.processingStart - entry.startTime;
          this.recordWebVital('fid', fid);
        });
      });

      // Layout Shifts
      this.observePerformanceEntry('layout-shift', (entries) => {
        let cumulativeScore = 0;
        entries.forEach((entry) => {
          cumulativeScore += entry.value;
        });
        this.recordWebVital('cls', cumulativeScore);
      });

      // Resource Timing
      this.observePerformanceEntry('resource', (entries) => {
        entries.forEach((entry) => {
          this.recordResourceTiming(entry as PerformanceResourceTiming);
        });
      });
    }

    // Memory Usage
    this.monitorMemoryUsage();
  }

  private observePerformanceEntry(
    entryType: string,
    callback: (entries: PerformanceEntry[]) => void
  ): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ entryType, buffered: true });
    } catch (error) {
      monitoring.captureException(error as Error, {
        context: `PerformanceMonitor.observe.${entryType}`
      });
    }
  }

  private recordWebVital(metric: keyof PerformanceMetrics, value: number): void {
    const transaction = monitoring.startPerformanceTransaction(
      `web-vital-${metric}`,
      'web-vital'
    );

    Sentry.metrics.distribution(`web.vitals.${metric}`, value, {
      unit: 'millisecond',
    } as Metric);

    transaction.finish();
  }

  private recordResourceTiming(entry: PerformanceResourceTiming): void {
    this.resourcesBuffer.push({
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime,
      transferSize: entry.transferSize,
    });

    if (this.resourcesBuffer.length >= this.bufferSize) {
      this.flushResourceMetrics();
    }
  }

  private monitorMemoryUsage(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.recordWebVital('jsHeapSize', memory.usedJSHeapSize);
      }, 10000);
    }
  }

  private async flushResourceMetrics(): Promise<void> {
    if (this.resourcesBuffer.length === 0) return;

    const metrics = [...this.resourcesBuffer];
    this.resourcesBuffer = [];

    const transaction = monitoring.startPerformanceTransaction(
      'resource-metrics-flush',
      'performance'
    );

    try {
      // Send to monitoring service
      metrics.forEach((metric) => {
        Sentry.metrics.distribution('web.resource.duration', metric.duration, {
          unit: 'millisecond',
          resource: metric.name,
        } as Metric);

        if (metric.transferSize) {
          Sentry.metrics.distribution('web.resource.size', metric.transferSize, {
            unit: 'byte',
            resource: metric.name,
          } as Metric);
        }
      });
    } catch (error) {
      monitoring.captureException(error as Error, {
        context: 'PerformanceMonitor.flushResourceMetrics'
      });
    } finally {
      transaction.finish();
    }
  }

  private startPeriodicFlush(): void {
    setInterval(() => {
      this.flushResourceMetrics();
    }, this.flushInterval);
  }

  public getMetrics(): PerformanceMetrics[] {
    return [...this.metricsBuffer];
  }

  public getResourceMetrics(): ResourceMetrics[] {
    return [...this.resourcesBuffer];
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance(); 