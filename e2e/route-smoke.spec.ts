import { expect, test as base, type Page } from '@playwright/test';

const mainRoutes = ['/', '/compare', '/venues/spectrum-center'];
const test = base.extend<{ pageErrors: string[] }>({
  pageErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.addInitScript(() => {
      window.addEventListener('error', (event) => {
        document.documentElement.dataset.uncaughtError = event.message;
      });
      window.addEventListener('unhandledrejection', (event) => {
        document.documentElement.dataset.uncaughtError = String(event.reason);
      });
    });
    await use(errors);
    const uncaught = await page.evaluate(() => document.documentElement.dataset.uncaughtError).catch(() => undefined);
    expect(uncaught ? [...errors, uncaught] : errors).toEqual([]);
  }, { auto: true }],
});

async function expectNoDocumentOverflow(page: Page) {
  const overflow = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    document: document.documentElement.scrollWidth,
    viewport: document.documentElement.clientWidth,
  }));
  expect(Math.max(overflow.body, overflow.document)).toBeLessThanOrEqual(overflow.viewport + 1);
}

async function expectCanvasLoaded(page: Page) {
  await expect(page.locator('.scene-shell--loading')).toHaveCount(0, { timeout: 20_000 });
  const canvas = page.locator('.scene-shell canvas');
  await expect(canvas).toBeVisible({ timeout: 20_000 });
  await expect.poll(async () => canvas.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return rect.width > 240 && rect.height > 240;
  })).toBe(true);
}

test.describe('route browser smoke', () => {
  test('dashboard, comparison, and workspace load without document overflow on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Venue Twin Control Room' })).toBeVisible();
    await expect(page.locator('[data-uncaught-error]')).toHaveCount(0);
    await expectNoDocumentOverflow(page);

    await page.getByRole('link', { name: /Compare strongest sources/ }).click();
    await expect(page).toHaveURL(/\/compare$/);
    await expect(page.getByRole('heading', { name: 'Strongest venue comparison' })).toBeVisible();
    await expect(page.getByText(/Missing/).first()).toBeVisible();
    await expectNoDocumentOverflow(page);

    await page.goto('/venues/spectrum-center');
    await expect(page.getByRole('heading', { name: 'Spectrum Center' })).toBeVisible();
    await expectCanvasLoaded(page);
    await expect(page.getByRole('button', { name: 'Saved views coming soon' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Measure tool coming soon' })).toBeDisabled();
    await expect(page.getByText('Available external').first()).toBeVisible();
    await expectNoDocumentOverflow(page);
  });

  test('main routes avoid horizontal document overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    for (const route of mainRoutes) {
      await page.goto(route);
      if (route === '/venues/spectrum-center') await expectCanvasLoaded(page);
      await expectNoDocumentOverflow(page);
    }
  });

  test('route navigation works from dashboard to workspace', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 820 });
    await page.goto('/');
    await page.locator('a[href="/venues/spectrum-center"]').click();
    await expect(page).toHaveURL(/\/venues\/spectrum-center$/);
    await expect(page.getByRole('heading', { name: 'Spectrum Center' })).toBeVisible();
    await expectCanvasLoaded(page);
  });

  test('unknown venue falls back to the dashboard', async ({ page }) => {
    await page.goto('/venues/not-a-real-venue');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'Venue Twin Control Room' })).toBeVisible();
  });
});
