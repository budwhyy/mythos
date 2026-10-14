import { expect, test } from '@playwright/test';

const OPENING = 'Before the gods, before Olympus, before time had a story — there was Chaos.';

test.describe('MYTHOS smoke', () => {
  test('home shows the opening line, then the dual timeline', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('opening')).toContainText(OPENING);
    await page.getByRole('button', { name: 'Enter the cosmos' }).click();
    await expect(page.getByTestId('opening')).toHaveCount(0);
    await expect(page.getByTestId('where-am-i')).toContainText('Mythic: Primordial Origins');
    await expect(page.getByTestId('where-am-i')).toContainText('First attested');
  });

  test('timeline: both frames, at least 12 attestation bridges, bridge explains itself', async ({ page }) => {
    await page.goto('/timeline/');
    await expect(page.getByText('MYTHIC SEQUENCE · ORDINAL, UNDATED')).toBeVisible();
    await expect(page.getByText('HISTORICAL AXIS · DATED')).toBeVisible();
    const bridges = page.getByTestId('attestation-bridge');
    expect(await bridges.count()).toBeGreaterThanOrEqual(12);
    await page.getByRole('button', { name: /Attestation bridge: The hinge/ }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('detail-panel')).toContainText('What this link means');
    await expect(page.getByTestId('detail-panel')).toContainText('does not say the story happened then or there');
  });

  test('timeline: mythic stages carry no dates', async ({ page }) => {
    await page.goto('/timeline/');
    await page.getByRole('button', { name: 'Olympian Age', exact: true }).first().click();
    const panel = page.getByTestId('detail-panel');
    await expect(panel).toContainText('Mythic stage 5 of 8');
    // Everything above the bridges section is mythic and must be undated; bridges show the dated historical side by design.
    const mythicPart = (await panel.innerText()).split(/attestation bridges/i)[0];
    expect(mythicPart).not.toMatch(/\d{2,4}\s*(BCE|CE)/);
    expect(mythicPart.length).toBeGreaterThan(100);
  });

  test('family tree: graph renders with 40+ figures and traces a path', async ({ page }) => {
    await page.goto('/tree/');
    await expect(page.getByTestId('family-graph').locator('canvas').first()).toBeVisible();
    await page.getByRole('button', { name: 'All' }).nth(1).click(); // all generations
    await expect(page.getByText(/62 of 62 figures shown/)).toBeVisible();
    await page.getByLabel('From', { exact: true }).selectOption('odysseus');
    await page.getByLabel('To', { exact: true }).selectOption('gaia');
    await expect(page.getByRole('list', { name: 'Relationship path' })).toContainText('Source:');
  });

  test('family tree: source toggles change Aphrodite’s parentage', async ({ page }) => {
    await page.goto('/character/');
    await page.getByRole('button', { name: 'Aphrodite', exact: true }).click();
    await expect(page.getByTestId('character-panel')).toContainText('Ancient sources disagree');
    await expect(page.getByTestId('character-panel')).toContainText('Uranus');
    await expect(page.getByTestId('character-panel')).toContainText('Dione');
  });

  test('character: reading level toggle changes the summary', async ({ page }) => {
    await page.goto('/character/');
    const panel = page.getByTestId('character-panel');
    await expect(panel.getByRole('heading', { name: 'Zeus' })).toBeVisible();
    await panel.getByRole('tab', { name: 'scholarly' }).click();
    await expect(panel).toContainText('Indo-European');
    await expect(panel).toContainText('Modern scholarship');
  });

  test('map: classified places, symbolic map and Odysseus journey', async ({ page }) => {
    await page.goto('/map/');
    await expect(page.getByRole('heading', { name: 'Map' })).toBeVisible();
    await expect(page.getByRole('list', { name: 'Journey legs' }).getByRole('listitem')).toHaveCount(15);
    await expect(page.getByRole('group', { name: 'Symbolic map of the mythic cosmos' })).toBeVisible();
    await page.getByTestId('journey-play').click();
    await expect(page.locator('[aria-current="step"]')).toBeVisible();
    await page.getByRole('button', { name: 'Ogygia' }).first().click();
    await expect(page.getByTestId('detail-panel')).toContainText('No terrestrial coordinates');
  });

  test('relationship: path and narrative links between two figures', async ({ page }) => {
    await page.goto('/relationship/');
    await expect(page.getByTestId('relationship-result')).toContainText('Odysseus ↔ Zeus');
    await expect(page.getByRole('list', { name: 'Relationship path' })).toBeVisible();
  });

  test('learning: eight steps and a jump into a mode', async ({ page }) => {
    await page.goto('/learn/');
    await expect(page.getByTestId('learning-step')).toContainText('Step 1 of 8');
    await page.getByRole('button', { name: 'Next step →' }).click();
    await expect(page.getByTestId('learning-step')).toContainText('Step 2 of 8');
    await page.getByRole('button', { name: /Explore in Character/ }).click();
    await expect(page).toHaveURL(/\/character\/$/);
    await expect(page.getByTestId('character-panel')).toContainText('Chaos');
  });

  test('stub modes say coming soon and fake nothing', async ({ page }) => {
    for (const path of ['/compare/', '/story/']) {
      await page.goto(path);
      await expect(page.getByText('Coming soon')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Return to the Timeline' })).toBeVisible();
    }
  });

  test('search and bookmarks', async ({ page }) => {
    await page.goto('/timeline/');
    await page.keyboard.press('/');
    await page.keyboard.type('Persephone');
    await page.keyboard.press('Enter');
    const panel = page.getByTestId('detail-panel');
    await expect(panel.getByRole('heading', { name: 'Persephone' })).toBeVisible();
    await panel.getByRole('button', { name: '☆ Bookmark' }).click();
    await page.getByRole('button', { name: 'History & bookmarks' }).click();
    await expect(page.getByRole('dialog', { name: 'History and bookmarks' })).toContainText('Persephone');
  });
});
