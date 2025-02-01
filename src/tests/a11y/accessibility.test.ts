import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Enable JavaScript in the page
    await page.setJavaScriptEnabled(true);
  });

  test('should pass accessibility tests on the login page', async ({ page }) => {
    await page.goto('/login');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should pass accessibility tests on the dashboard', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should pass accessibility tests on the profile page', async ({ page }) => {
    // Login and navigate to profile
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.goto('/profile');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should pass accessibility tests on the settings page', async ({ page }) => {
    // Login and navigate to settings
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.goto('/settings');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should pass accessibility tests on error pages', async ({ page }) => {
    await page.goto('/non-existent-page');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should pass accessibility tests on forms', async ({ page }) => {
    await page.goto('/signup');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('form') // Only test form elements
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should pass accessibility tests for interactive elements', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('button')
      .include('a')
      .include('input')
      .include('select')
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should pass accessibility tests for images', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .include('img')
      .include('svg')
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should pass accessibility tests for headings structure', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .options({
        rules: {
          'heading-order': { enabled: true }
        }
      })
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should pass accessibility tests for color contrast', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .options({
        rules: {
          'color-contrast': { enabled: true }
        }
      })
      .analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });
}); 