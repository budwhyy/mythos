import { expect, test } from '@playwright/test';

/** Phone-width smoke tests: content first, chrome small, nothing overflowing sideways. */
test.describe('MYTHOS on a phone', () => {
  test('chrome is compact and nothing scrolls sideways', async ({ page }) => {
    await page.goto('/timeline/');
    await expect(page.locator('nav.fixed[aria-label="Modes"]')).toBeVisible();
    const header = await page.locator('header').boundingBox();
    expect(header!.height).toBeLessThan(110);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBe(0);
    await expect(page.getByTestId('where-am-i')).toContainText('Primordial Origins');
  });

  test('detail sheet opens above the tab bar, expands, and closes', async ({ page }) => {
    await page.goto('/timeline/');
    await page.getByRole('list', { name: 'Mythic stages' }).getByRole('button', { name: 'Olympian Age' }).click();
    const sheet = page.getByTestId('detail-panel');
    await expect(sheet).toContainText('Mythic stage 5 of 8');
    const before = (await sheet.boundingBox())!;
    const nav = (await page.locator('nav.fixed[aria-label="Modes"]').boundingBox())!;
    expect(before.y + before.height).toBeLessThanOrEqual(nav.y + 1);
    await page.getByRole('button', { name: 'Expand details' }).click();
    const after = (await sheet.boundingBox())!;
    expect(after.height).toBeGreaterThan(before.height);
    await page.getByRole('button', { name: 'Close details' }).click();
    await expect(sheet).toHaveCount(0);
  });

  test('family tree shows the graph first with filters collapsed', async ({ page }) => {
    await page.goto('/tree/');
    const graph = (await page.getByTestId('family-graph').boundingBox())!;
    expect(graph.y).toBeLessThan(200);
    await expect(page.locator('#tree-controls-body')).toBeHidden();
    await page.getByRole('button', { name: 'Filters & path' }).click();
    await expect(page.locator('#tree-controls-body')).toBeVisible();
  });

  test('characters use a dropdown picker', async ({ page }) => {
    await page.goto('/character/');
    await page.getByLabel('Characters').selectOption('athena');
    await expect(page.getByTestId('character-panel').getByRole('heading', { name: 'Athena' })).toBeVisible();
  });

  test('map is above the fold and the journey shows its current leg on the map', async ({ page }) => {
    await page.goto('/map/');
    const map = (await page.getByTestId('map').boundingBox())!;
    expect(map.y).toBeLessThan(400);
    await page.getByTestId('journey-play').click();
    await expect(page.getByTestId('map').getByText(/^1\. Troy/)).toBeVisible();
  });

  test('More opens the menu with the remaining modes and settings', async ({ page }) => {
    await page.goto('/timeline/');
    await page.getByRole('button', { name: 'More' }).click();
    const menu = page.getByRole('dialog', { name: 'Menu' });
    await expect(menu.getByRole('link', { name: /Learning/ })).toBeVisible();
    await expect(menu.getByLabel('Reading level')).toBeVisible();
    await menu.getByRole('link', { name: /Learning/ }).click();
    await expect(page).toHaveURL(/\/learn\/$/);
  });
});
