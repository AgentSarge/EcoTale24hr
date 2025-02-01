import { test, expect } from '@playwright/test';
import { playAudit } from 'playwright-lighthouse';
import type { Config } from 'lighthouse';

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should pass Core Web Vitals thresholds', async ({ page }) => {
    const thresholds = {
      performance: 90,
      accessibility: 90,
      'best-practices': 90,
      seo: 90,
      pwa: 50,
    };

    const config: Config = {
      extends: 'lighthouse:default',
      settings: {
        formFactor: 'desktop',
        screenEmulation: { disabled: true },
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
      },
    };

    const results = await playAudit({
      page,
      port: 9222,
      thresholds,
      config,
      reports: {
        formats: {
          html: true,
        },
        name: 'lighthouse-report',
        directory: 'lighthouse-reports',
      },
    });

    // Check individual scores
    const scores = results.lhr.categories;
    const performanceScore = scores.performance?.score ?? 0;
    const accessibilityScore = scores.accessibility?.score ?? 0;
    const bestPracticesScore = scores['best-practices']?.score ?? 0;
    const seoScore = scores.seo?.score ?? 0;
    const pwaScore = scores.pwa?.score ?? 0;

    expect(performanceScore * 100).toBeGreaterThanOrEqual(thresholds.performance);
    expect(accessibilityScore * 100).toBeGreaterThanOrEqual(thresholds.accessibility);
    expect(bestPracticesScore * 100).toBeGreaterThanOrEqual(thresholds['best-practices']);
    expect(seoScore * 100).toBeGreaterThanOrEqual(thresholds.seo);
    expect(pwaScore * 100).toBeGreaterThanOrEqual(thresholds.pwa);
  });

  test('should load images efficiently', async ({ page }) => {
    const images = await page.$$('img');
    for (const image of images) {
      // Check if image has loading="lazy" for images below the fold
      const loading = await image.getAttribute('loading');
      const viewport = page.viewportSize();
      if (viewport) {
        const box = await image.boundingBox();
        if (box && box.y > viewport.height) {
          expect(loading).toBe('lazy');
        }
      }

      // Check if image has proper alt text
      const alt = await image.getAttribute('alt');
      expect(alt).toBeTruthy();

      // Check if image is properly sized
      const naturalWidth = await image.evaluate(img => (img as HTMLImageElement).naturalWidth);
      const displayWidth = await image.evaluate(img => img.clientWidth);
      expect(naturalWidth / displayWidth).toBeLessThan(2);
    }
  });

  test('should have proper caching headers', async ({ request }) => {
    const response = await request.get('/');
    const headers = response.headers();
    expect(headers['cache-control']).toBeTruthy();
  });

  test('should have proper resource hints', async ({ page }) => {
    const links = await page.$$('link[rel="preload"], link[rel="prefetch"], link[rel="preconnect"]');
    expect(links.length).toBeGreaterThan(0);

    for (const link of links) {
      const href = await link.getAttribute('href');
      expect(href).toBeTruthy();
    }
  });

  test('should have optimized JavaScript bundles', async ({ page }) => {
    const scripts = await page.$$('script[src]');
    for (const script of scripts) {
      // Check if script has proper attributes
      const defer = await script.getAttribute('defer');
      const async = await script.getAttribute('async');
      expect(defer || async).toBeTruthy();

      // Check if script is minified
      const src = await script.getAttribute('src');
      if (src) {
        const response = await page.goto(src);
        const content = await response?.text();
        if (content) {
          const minified = content.split('\n').length < 10;
          expect(minified).toBe(true);
        }
      }
    }
  });

  test('should have proper font loading strategy', async ({ page }) => {
    const fontLinks = await page.$$('link[rel="preload"][as="font"]');
    for (const link of fontLinks) {
      const crossorigin = await link.getAttribute('crossorigin');
      expect(crossorigin).toBe('anonymous');

      const type = await link.getAttribute('type');
      expect(type).toBe('font/woff2');
    }
  });
});