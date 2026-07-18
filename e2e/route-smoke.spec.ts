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
  await expect.poll(async () => {
    return canvas.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      return rect.width > 240 && rect.height > 240;
    });
  }, { timeout: 20_000 }).toBe(true);
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
    await expect(page.getByText(/Available external/).first()).toBeVisible();
    await expectNoDocumentOverflow(page);

    await page.goto('/venues/spectrum-center');
    await expect(page.getByRole('heading', { name: 'Spectrum Center' })).toBeVisible();
    await expectCanvasLoaded(page);
    await expect(page.getByRole('button', { name: 'Toggle measurement tool' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Save scene locally' })).toBeEnabled();
    await expect(page.getByRole('region', { name: 'Persistent measurement readout' })).toBeVisible();
    await expect(page.getByText('SOURCE INTEGRITY')).toBeVisible();
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

  test('source inventory matrix exposes 19 show statuses and filters', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    await expect(page.getByRole('heading', { name: '19-show source status' })).toBeVisible();
    await expect(page.locator('.source-matrix__row')).toHaveCount(19);
    await expect(page.getByText('bok_center_tulsa_ok.pdf')).toBeVisible();
    await expect(page.getByText(/Create 01 SOURCE DOCUMENTS folder/).first()).toBeVisible();
    await expect(page.getByText(/suspended-grid/)).toBeVisible();

    await page.getByRole('button', { name: 'Venue TBD' }).click();
    await expect(page.locator('.source-matrix__row')).toHaveCount(1);
    await expect(page.getByText('Playoff Contingency — Venue TBD')).toBeVisible();
    await expect(page.getByText('los-angeles-contingency')).toBeVisible();

    await page.getByRole('button', { name: 'Missing CAD' }).click();
    await expect(page.locator('.source-matrix__row')).toHaveCount(19);

    await page.getByLabel('Source status filters').getByRole('button', { name: 'Conflict', exact: true }).click();
    await expect(page.locator('.source-matrix__row')).toHaveCount(1);
    await expect(page.getByRole('table', { name: '19-show source completion matrix' }).getByText('Van Andel Arena')).toBeVisible();
  });

  test('venue source review panel exposes approvals, blockers, and filters', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Venue source review approvals' })).toBeVisible();
    await expect(page.locator('.source-review-table__row')).toHaveCount(11);
    await expect(page.getByRole('table', { name: 'Venue source review approval matrix' }).getByText('BOK Center')).toBeVisible();
    await expect(page.getByText('Venue source review is blocked.').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Approve Floor to rigging grid bottom steel/ })).toBeEnabled();

    await page.getByLabel('Venue review filters').getByRole('button', { name: 'CONFLICT', exact: true }).click();
    await expect(page.locator('.source-review-table__row')).toHaveCount(1);
    await expect(page.getByRole('table', { name: 'Venue source review approval matrix' }).getByText('Van Andel Arena')).toBeVisible();

    await page.getByLabel('Venue review filters').getByRole('button', { name: 'READY', exact: true }).click();
    await expect(page.locator('.source-review-table__row')).toHaveCount(3);
    await expect(page.getByRole('table', { name: 'Venue source review approval matrix' }).getByText('Spectrum Center')).toBeVisible();
  });

  test('unknown venue falls back to the dashboard', async ({ page }) => {
    await page.goto('/venues/not-a-real-venue');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: 'Venue Twin Control Room' })).toBeVisible();
  });
});
