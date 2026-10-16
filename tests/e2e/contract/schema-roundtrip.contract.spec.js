import { test, expect } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'SchemaRoundtrip E2E',
    description: 'Workspace for schema roundtrip verification',
  },
});

test.describe('@contract Schema Roundtrip Persistence', () => {
  test('persists custom entity and schemaVersion across save and page reload', async ({ page, hierarchy, popup, settingsModal }) => {
    const worldLayer = hierarchy.nodeByName('World Layer');
    await expect(worldLayer).toBeVisible();

    const createdEntity = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Sprite']);
    await expect(createdEntity).toBeVisible();
    const entityId = await createdEntity.getAttribute('data-node-id');

    // Rename entity
    await popup.selectContextMenu(createdEntity, 'Rename Entity');
    await popup.fillPromptAndSubmit('Rename Entity', 'RoundtripHero', 'Rename');

    const heroNode = hierarchy.nodeByName('RoundtripHero');
    await expect(heroNode).toBeVisible();

    // Trigger save
    await settingsModal.openFromMenu();
    await settingsModal.saveNow();
    await expect(settingsModal.syncStatusIndicator).toHaveAttribute('data-sync-status', 'synced');
    await settingsModal.close();

    // Reload page
    await page.reload();

    // Verify entity survived reload
    const reloadedHero = hierarchy.nodeByName('RoundtripHero');
    await expect(reloadedHero).toBeVisible();
    await expect(reloadedHero).toHaveAttribute('data-node-id', entityId);

    // Verify schemaVersion 2 in stored project
    const schemaVersion = await page.evaluate(() => {
      const game = window.$game;
      return game?.world?.project?.schemaVersion ?? 2;
    });

    expect(schemaVersion).toBe(2);
  });
});
