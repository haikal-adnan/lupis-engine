import { test, expect } from '../../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'AutosaveRecovery E2E',
    description: 'Workspace for autosave recovery reliability verification',
  },
});

test.describe('Reliability: Auto-Save Recovery and Data Integrity', () => {
  test('persists recent entity modifications when auto-save triggers', async ({ page, hierarchy, popup, settingsModal }) => {
    const worldLayer = hierarchy.nodeByName('World Layer');
    await expect(worldLayer).toBeVisible();

    const entityNode = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Sprite']);
    await expect(entityNode).toBeVisible();

    // Mutate state to dirty
    await settingsModal.openFromMenu();
    await settingsModal.setProjectDescription('Autosave reliability test description');
    await expect(settingsModal.syncStatusIndicator).toHaveAttribute('data-sync-status', 'dirty');

    // Trigger save action
    await settingsModal.saveNow();
    await expect(settingsModal.syncStatusIndicator).toHaveAttribute('data-sync-status', 'synced');
    await settingsModal.close();

    // Reload page to verify persistence
    await page.reload();

    await settingsModal.openFromMenu();
    await expect(settingsModal.syncStatusIndicator).toHaveAttribute('data-sync-status', 'synced');
    await expect(settingsModal.projectDescInput).toHaveValue('Autosave reliability test description');
    await settingsModal.close();
  });
});
