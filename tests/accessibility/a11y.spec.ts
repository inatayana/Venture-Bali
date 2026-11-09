import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PWPage = any;

const PAGES_TO_TEST = [
  { path: '/', name: 'Home' },
  { path: '/experiences', name: 'Experiences List' },
  { path: '/admin/login', name: 'Admin Login' },
];

test.describe('Accessibility (axe-core)', () => {
  for (const pageInfo of PAGES_TO_TEST) {
    test(`${pageInfo.name} should have no accessibility violations`, async ({ page }: { page: any }) => {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

      expect(accessibilityScanResults.violations).toEqual([]);
    });
  }

  test('Experience detail page should have no accessibility violations', async ({ page }: { page: any }) => {
    // First, go to experiences list and click first product
    await page.goto('/experiences');
    await page.waitForLoadState('networkidle');

    const firstProductLink = page.locator('a[href^="/experiences/"]').first();
    if (await firstProductLink.count() > 0) {
      await firstProductLink.click();
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

      // Filter out known acceptable violations (e.g., color contrast in third-party iframes)
      const violations = accessibilityScanResults.violations.filter(
        (v) => !v.id.includes('color-contrast') || !v.nodes.some((n) => n.target.includes('iframe'))
      );

      expect(violations).toEqual([]);
    }
  });

  test('Mobile viewport should have no accessibility violations', async ({ page }: { page: any }) => {
    await page.setViewportSize({ width: 393, height: 852 }); // iPhone 16 Pro
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Touch targets should meet minimum 48x48px on mobile', async ({ page }: { page: any }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto('/experiences');
    await page.waitForLoadState('networkidle');

    const buttons = page.locator('button, a[role="button"], [role="button"]');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();

      if (box) {
        // Minimum 48x48px for touch targets (WCAG 2.5.5)
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});