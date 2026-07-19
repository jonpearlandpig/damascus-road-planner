import { expect, test } from '@playwright/test';

test.setTimeout(60_000);

async function expectCanvasLoaded(page: import('@playwright/test').Page) {
  await expect(page.locator('.scene-shell--loading')).toHaveCount(0, { timeout: 20_000 });
  const canvas = page.locator('.scene-shell canvas');
  await expect(canvas).toBeVisible({ timeout: 20_000 });
}

test('planner workflow covers grid edit, measurement, gear, truss, lighting, views, and persistence', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  await page.getByLabel('Venue type filter').selectOption('Arena');
  await page.locator('a[href="/venues/spectrum-center"]').click();
  await expect(page).toHaveURL(/\/venues\/spectrum-center$/);
  await expect(page.getByRole('heading', { name: 'Spectrum Center' })).toBeVisible();
  await expectCanvasLoaded(page);

  await page.getByText('Production library', { exact: true }).click();
  await page.getByText('Command console', { exact: true }).click();
  const inspectorRail = page.getByRole('complementary');
  await inspectorRail.locator('summary').filter({ hasText: /^Scene hierarchy$/ }).click();
  await inspectorRail.locator('summary').filter({ hasText: /^Lighting$/ }).click();
  await inspectorRail.locator('summary').filter({ hasText: /^Saved views$/ }).click();

  await page.getByRole('button', { name: 'Insert 40 ft straight truss' }).click();
  await expect(page.getByText('40 ft straight truss').first()).toBeVisible();
  await page.getByRole('button', { name: 'Use move tool' }).click();
  await page.getByTestId('selected-x').fill('12.3');
  await expect(page.getByTestId('selected-x')).toHaveValue('12');

  await page.getByLabel('Category').selectOption('Lighting fixtures');
  await page.getByRole('button', { name: 'Insert Moving fixture' }).click();
  await expect(page.getByText('Moving fixture').first()).toBeVisible();

  await page.getByRole('textbox', { name: 'Planner command' }).fill('attach moving-fixture-12 straight-truss-40-11 0');
  await page.getByRole('button', { name: 'Run planner command' }).click();
  await expect(page.getByRole('region', { name: 'Command console' }).getByText('Command applied')).toBeVisible();

  await expect(page.getByRole('heading', { name: 'Moving fixture' }).first()).toBeVisible();
  await expect(page.getByRole('region', { name: 'Lighting controls' })).toBeVisible();
  await page.locator('.lighting-controls input[type="range"]').first().evaluate((input) => {
    const element = input as HTMLInputElement;
    element.value = '0.5';
    element.dispatchEvent(new Event('input', { bubbles: true }));
  });

  await page.getByRole('button', { name: /Set start/ }).click();
  await page.locator('.scene-tree').getByRole('button', { name: /DRT B stage/ }).first().click();
  await page.getByRole('button', { name: /Set end/ }).click();
  await expect(page.getByTestId('measurement-total')).toContainText('ft');
  await page.getByRole('button', { name: 'Save measurement' }).click();
  await expect(page.locator('.saved-list').getByText(/Measurement/).first()).toBeVisible();

  await page.getByRole('button', { name: 'Save current view' }).click();
  await expect(page.locator('.saved-views-panel').getByRole('button', { name: 'View', exact: true })).toBeVisible();

  await page.getByRole('textbox', { name: 'Planner command' }).fill('add gear-lx-0001');
  await page.getByRole('button', { name: 'Run planner command' }).click();
  await expect(page.getByRole('region', { name: 'Command console' }).getByText('Command applied')).toBeVisible();

  await page.getByRole('button', { name: 'Save scene locally' }).click();
  await page.reload();
  await expectCanvasLoaded(page);
  await page.getByRole('complementary').locator('summary').filter({ hasText: /^Scene hierarchy$/ }).click();
  await expect(page.locator('.scene-tree').getByText('40 ft straight truss').first()).toBeVisible();
});
