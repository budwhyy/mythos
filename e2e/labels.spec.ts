import { expect, test } from '@playwright/test';

/** Runs in both the desktop and the mobile project: 3D star labels must never overlap once the camera settles. */
test('3D sequence labels do not overlap (Olympian Age, the densest stage)', async ({ page }) => {
  // The suite runs with reduced motion, which defaults MYTHOS to 2D; force the 3D scene for this test.
  await page.addInitScript(() => localStorage.setItem('mythos-v1', JSON.stringify({ state: { prefer2D: false, introSeen: true }, version: 0 })));
  await page.goto('/timeline/');
  await page.getByRole('list', { name: 'Mythic stages' }).getByRole('button', { name: 'Olympian Age' }).click();
  await page.getByRole('button', { name: 'Close details' }).click();
  // The 3D chunk is lazy-loaded (slow over a real network); wait until labels are actually showing, then let the pass settle.
  await expect
    .poll(() => page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-kind]')].filter((e) => getComputedStyle(e).opacity === '1').length), { timeout: 30_000 })
    .toBeGreaterThan(0);
  await page.waitForTimeout(800);
  const result = await page.evaluate(() => {
    const vis = [...document.querySelectorAll<HTMLElement>('[data-kind]')].filter((e) => getComputedStyle(e).opacity === '1');
    const pairs: string[] = [];
    for (let i = 0; i < vis.length; i++)
      for (let j = i + 1; j < vis.length; j++) {
        const a = vis[i].getBoundingClientRect();
        const b = vis[j].getBoundingClientRect();
        if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) pairs.push(`${vis[i].textContent} × ${vis[j].textContent}`);
      }
    return { figures: vis.filter((e) => e.dataset.kind === 'entity').length, pairs };
  });
  expect(result.pairs).toEqual([]);
  expect(result.figures).toBe(10); // every figure of the stage keeps its name
});
