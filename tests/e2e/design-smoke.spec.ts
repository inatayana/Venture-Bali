import { expect, test, type Locator } from '@playwright/test';

const CARD = '[data-testid^="venture-card-"]';

function backgroundColor(locator: Locator): Promise<string> {
  return locator.evaluate((element) => getComputedStyle(element).backgroundColor);
}

test.describe('design tokens', () => {
  test('light mode uses the light surfaces at 360px', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('baliwild_theme', 'light'));
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/');

    const card = page.locator(CARD).first();
    await expect(card).toBeVisible();
    await expect.poll(() => backgroundColor(card)).toBe('rgb(255, 255, 255)');

    const header = page.locator('header').first();
    await expect.poll(() => backgroundColor(header)).toBe('rgb(255, 255, 255)');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('dark mode uses the dark surfaces at 360px', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.setItem('baliwild_theme', 'dark'));
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/');

    await expect(page.locator('html')).toHaveClass(/dark/);

    const card = page.locator(CARD).first();
    await expect(card).toBeVisible();
    await expect.poll(() => backgroundColor(card)).toBe('rgb(25, 25, 25)');

    const header = page.locator('header').first();
    await expect.poll(() => backgroundColor(header)).toBe('rgb(25, 25, 25)');

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test('system dark is used when no choice is stored', async ({ page }) => {
    await page.addInitScript(() => window.localStorage.removeItem('baliwild_theme'));
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');

    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});
