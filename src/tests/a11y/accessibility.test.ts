import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);
  });

  test('should pass accessibility checks', async ({ page }) => {
    await checkA11y(page, {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    });
  });

  test('should have proper heading structure', async ({ page }) => {
    const headings = await page.evaluate(() => {
      const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      return Array.from(headingElements).map(heading => ({
        level: heading.tagName.toLowerCase(),
        text: heading.textContent?.trim(),
      }));
    });

    // Verify h1 is present and used only once
    const h1Headings = headings.filter(h => h.level === 'h1');
    expect(h1Headings.length).toBe(1);

    // Verify heading levels don't skip
    let previousLevel = 1;
    for (const heading of headings) {
      const currentLevel = parseInt(heading.level.slice(1));
      expect(currentLevel).toBeLessThanOrEqual(previousLevel + 1);
      previousLevel = currentLevel;
    }
  });

  test('should have proper focus management', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    const firstFocusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocusedElement).toBeTruthy();

    // Verify focus is visible
    const focusVisible = await page.evaluate(() => {
      const activeElement = document.activeElement;
      if (!activeElement) return false;
      const styles = window.getComputedStyle(activeElement);
      return styles.outlineStyle !== 'none' || styles.boxShadow !== 'none';
    });
    expect(focusVisible).toBe(true);
  });

  test('should have proper ARIA attributes', async ({ page }) => {
    // Check for proper button labels
    const buttons = await page.$$('button');
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      expect(ariaLabel || text).toBeTruthy();
    }

    // Check for proper form labels
    const formControls = await page.$$('input, select, textarea');
    for (const control of formControls) {
      const id = await control.getAttribute('id');
      if (id) {
        const label = await page.$(`label[for="${id}"]`);
        expect(label).toBeTruthy();
      }
    }
  });

  test('should have proper color contrast', async ({ page }) => {
    await checkA11y(page, {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
      axeOptions: {
        runOnly: ['color-contrast'],
      },
    });
  });
}); 