import { expect, test, type Locator, type Page } from '@playwright/test';

test.setTimeout(90_000);

async function expectCanvasLoaded(page: Page): Promise<Locator> {
  await expect(page.locator('.scene-shell--loading')).toHaveCount(0, { timeout: 20_000 });
  const canvas = page.locator('.scene-shell canvas');
  await expect(canvas).toBeVisible({ timeout: 20_000 });
  await expect.poll(async () => {
    const box = await canvas.boundingBox();
    return Boolean(box && box.width > 500 && box.height > 400);
  }, { timeout: 20_000 }).toBe(true);
  return canvas;
}

async function dragAt(canvas: Locator, startRatio: { x: number; y: number }, endRatio: { x: number; y: number }) {
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Planner canvas has no bounding box');
  const page = canvas.page();
  await page.mouse.move(box.x + box.width * startRatio.x, box.y + box.height * startRatio.y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * endRatio.x, box.y + box.height * endRatio.y, { steps: 8 });
  await page.mouse.up();
}

async function waitForSceneFrames(canvas: Locator) {
  await canvas.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
}

async function renderedGizmoPoint(canvas: Locator) {
  await expect(canvas).toHaveAttribute('data-gizmo-handle-position', /,/);
  const normalized = (await canvas.getAttribute('data-gizmo-handle-position'))?.split(',').map(Number);
  if (!normalized || normalized.length !== 2 || normalized.some((value) => !Number.isFinite(value))) throw new Error('Gizmo screen position is unavailable');
  return { x: normalized[0], y: normalized[1] };
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/venues/spectrum-center');
});

test('camera gestures never move production and transforms require an explicit unlocked handle', async ({ page }) => {
  const canvas = await expectCanvasLoaded(page);
  const shell = page.locator('.scene-shell');
  const undo = page.getByRole('button', { name: 'Undo last edit' });
  await expect(shell).toHaveAttribute('data-tool', 'SELECT');
  await expect(shell).toHaveAttribute('data-selected-object', '');
  await expect(shell).toHaveAttribute('data-transform-gizmo', 'NONE');
  await expect(undo).toBeDisabled();

  await page.getByText('Scene hierarchy', { exact: true }).click();
  const stageNode = page.locator('[data-object-id="drt-main-stage"]');
  const originalX = await stageNode.getAttribute('data-x-ft');
  const originalZ = await stageNode.getAttribute('data-z-ft');

  // This is the same ordinary left-button canvas drag that formerly moved the B-stage.
  await dragAt(canvas, { x: 0.50, y: 0.52 }, { x: 0.65, y: 0.64 });
  await expect(stageNode).toHaveAttribute('data-x-ft', originalX ?? '');
  await expect(stageNode).toHaveAttribute('data-z-ft', originalZ ?? '');
  await expect(shell).toHaveAttribute('data-selected-object', '');
  await expect(undo).toBeDisabled();

  await page.getByRole('button', { name: 'Use pan tool' }).click();
  await dragAt(canvas, { x: 0.45, y: 0.52 }, { x: 0.58, y: 0.62 });
  await page.mouse.wheel(0, -320);
  await expect(stageNode).toHaveAttribute('data-x-ft', originalX ?? '');
  await expect(stageNode).toHaveAttribute('data-z-ft', originalZ ?? '');
  await expect(undo).toBeDisabled();
  await page.getByRole('button', { name: 'Use select tool' }).click();

  await stageNode.click();
  await expect(shell).toHaveAttribute('data-selected-object', 'drt-main-stage');
  await expect(shell).toHaveAttribute('data-selected-locked', 'true');
  await page.getByRole('button', { name: 'Use move tool' }).click();
  await expect(shell).toHaveAttribute('data-transform-gizmo', 'NONE');
  await expect(page.getByTestId('selected-x')).toBeDisabled();
  await dragAt(canvas, { x: 0.50, y: 0.35 }, { x: 0.62, y: 0.35 });
  await expect(stageNode).toHaveAttribute('data-x-ft', originalX ?? '');
  await expect(stageNode).toHaveAttribute('data-z-ft', originalZ ?? '');

  await page.getByRole('button', { name: 'Reset camera' }).click();
  await page.locator('.measurement-panel').getByRole('button', { name: 'Unlock selected object' }).click();
  await expect(shell).toHaveAttribute('data-selected-locked', 'false');
  await expect(shell).toHaveAttribute('data-transform-gizmo', 'MOVE');
  await expect(page.getByTestId('selected-x')).toBeEnabled();
  await waitForSceneFrames(canvas);

  const moveHandle = await renderedGizmoPoint(canvas);
  await dragAt(canvas, moveHandle, { x: Math.min(0.97, moveHandle.x + 0.12), y: moveHandle.y });
  await expect.poll(async () => stageNode.getAttribute('data-x-ft')).not.toBe(originalX);
  const movedX = await stageNode.getAttribute('data-x-ft');
  await expect(undo).toBeEnabled();

  // One undo reverses the one committed drag, proving pointer-move drafts did not flood history.
  await undo.click();
  await expect(stageNode).toHaveAttribute('data-x-ft', originalX ?? '');
  expect(movedX).not.toBe(originalX);

  await page.getByRole('button', { name: 'Use rotate tool' }).click();
  await expect(shell).toHaveAttribute('data-transform-gizmo', 'ROTATE');
  await expect(page.getByTestId('selected-rotation')).toBeEnabled();
  const rotateHandle = await renderedGizmoPoint(canvas);
  const rotateEnd = { x: Math.max(0.05, rotateHandle.x - 0.17), y: Math.max(0.05, rotateHandle.y - 0.11) };
  await dragAt(canvas, rotateHandle, rotateEnd);
  await expect(page.getByTestId('selected-rotation')).not.toHaveValue('0');
  await undo.click();
  await expect(page.getByTestId('selected-rotation')).toHaveValue('0');

  const rotateBox = await canvas.boundingBox();
  if (!rotateBox) throw new Error('Planner canvas has no bounding box');
  const cancelHandle = await renderedGizmoPoint(canvas);
  await page.mouse.move(rotateBox.x + rotateBox.width * cancelHandle.x, rotateBox.y + rotateBox.height * cancelHandle.y);
  await page.mouse.down();
  await page.mouse.move(rotateBox.x + rotateBox.width * Math.max(0.05, cancelHandle.x - 0.17), rotateBox.y + rotateBox.height * Math.max(0.05, cancelHandle.y - 0.11), { steps: 8 });
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(page.getByTestId('selected-rotation')).toHaveValue('0');
});

test('empty click deselects and plan mode exposes the canonical drawing', async ({ page }) => {
  const canvas = await expectCanvasLoaded(page);
  const shell = page.locator('.scene-shell');
  await page.getByText('Scene hierarchy', { exact: true }).click();
  await page.locator('[data-object-id="drt-b-stage"]').click();
  await expect(shell).toHaveAttribute('data-selected-object', 'drt-b-stage');

  await page.getByRole('button', { name: 'Reset camera' }).click();
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Planner canvas has no bounding box');
  await page.mouse.click(box.x + 20, box.y + box.height - 20);
  await expect(shell).toHaveAttribute('data-selected-object', '');

  await page.locator('label.tool-select').filter({ hasText: 'View' }).locator('select').selectOption('PLAN');
  await expect(page.getByTestId('drt-plan-svg')).toBeVisible();
  await expect(page.getByTestId('plan-dimension-main-stage')).toContainText('78');
  await expect(page.getByTestId('plan-dimension-b-stage')).toContainText('26');
  await expect(page.getByText('6 unresolved design elements are excluded')).toBeVisible();
});
