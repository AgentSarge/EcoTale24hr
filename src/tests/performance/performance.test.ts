import { test, expect } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';
import { launch } from 'chrome-launcher';
import * as lighthouse from 'lighthouse';

test.describe('Performance Tests', () => {
  const lighthouseDesktopConfig = {
    extends: 'lighthouse:default',
    settings: {
      formFactor: 'desktop',
      throttling: {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      },
      screenEmulation: {
        mobile: false,
        width: 1350,
        height: 940,
        deviceScaleFactor: 1,
        disabled: false,
      },
      skipAudits: ['uses-http2'],
    },
  };

  const lighthouseMobileConfig = {
    extends: 'lighthouse:default',
    settings: {
      formFactor: 'mobile',
      throttling: {
        rttMs: 150,
        throughputKbps: 1638.4,
        cpuSlowdownMultiplier: 4,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0,
      },
      screenEmulation: {
        mobile: true,
        width: 360,
        height: 640,
        deviceScaleFactor: 2.625,
        disabled: false,
      },
    },
  };

  const thresholds = {
    performance: 90,
    accessibility: 100,
    'best-practices': 90,
    seo: 90,
    pwa: 50,
  };

  test('should pass Lighthouse audit on desktop', async ({ page }) => {
    await page.goto('/');

    const { lhr } = await lighthouse(page.url(), {
      port: (new URL(page.url())).port,
      output: 'json',
      logLevel: 'info',
      config: lighthouseDesktopConfig,
    });

    expect(lhr.categories.performance.score * 100).toBeGreaterThanOrEqual(thresholds.performance);
    expect(lhr.categories.accessibility.score * 100).toBeGreaterThanOrEqual(thresholds.accessibility);
    expect(lhr.categories['best-practices'].score * 100).toBeGreaterThanOrEqual(thresholds['best-practices']);
    expect(lhr.categories.seo.score * 100).toBeGreaterThanOrEqual(thresholds.seo);
    expect(lhr.categories.pwa.score * 100).toBeGreaterThanOrEqual(thresholds.pwa);
  });

  test('should pass Lighthouse audit on mobile', async ({ page }) => {
    await page.goto('/');

    const { lhr } = await lighthouse(page.url(), {
      port: (new URL(page.url())).port,
      output: 'json',
      logLevel: 'info',
      config: lighthouseMobileConfig,
    });

    expect(lhr.categories.performance.score * 100).toBeGreaterThanOrEqual(thresholds.performance);
    expect(lhr.categories.accessibility.score * 100).toBeGreaterThanOrEqual(thresholds.accessibility);
    expect(lhr.categories['best-practices'].score * 100).toBeGreaterThanOrEqual(thresholds['best-practices']);
    expect(lhr.categories.seo.score * 100).toBeGreaterThanOrEqual(thresholds.seo);
    expect(lhr.categories.pwa.score * 100).toBeGreaterThanOrEqual(thresholds.pwa);
  });

  test('should load critical resources quickly', async ({ page }) => {
    const results = await playAudit({
      page,
      thresholds: {
        'first-contentful-paint': 1000,
        'largest-contentful-paint': 2500,
        'cumulative-layout-shift': 0.1,
        'total-blocking-time': 200,
      },
    });

    expect(results.errors).toHaveLength(0);
  });

  test('should have optimized images', async ({ page }) => {
    const results = await playAudit({
      page,
      thresholds: {
        'uses-optimized-images': 1,
        'uses-webp-images': 1,
        'offscreen-images': 1,
      },
    });

    expect(results.errors).toHaveLength(0);
  });

  test('should have efficient cache policy', async ({ page }) => {
    const results = await playAudit({
      page,
      thresholds: {
        'uses-long-cache-ttl': 1,
      },
    });

    expect(results.errors).toHaveLength(0);
  });

  test('should minimize main-thread work', async ({ page }) => {
    const results = await playAudit({
      page,
      thresholds: {
        'mainthread-work-breakdown': 1,
        'bootup-time': 1,
      },
    });

    expect(results.errors).toHaveLength(0);
  });

  test('should have efficient resource loading', async ({ page }) => {
    const results = await playAudit({
      page,
      thresholds: {
        'render-blocking-resources': 1,
        'unminified-css': 1,
        'unminified-javascript': 1,
        'unused-javascript': 1,
      },
    });

    expect(results.errors).toHaveLength(0);
  });
});