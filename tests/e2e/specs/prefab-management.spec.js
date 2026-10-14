import { test, expect } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Prefab E2E',
    description: 'Isolated workspace for Prefab Management E2E tests',
  },
});

test.describe('Prefab Panel E2E Management', () => {

  test.beforeEach(async ({ prefabs }) => {
    await prefabs.ensureVisible();
    await prefabs.switchTab('world');
  });

  // =========================================================================
  // 1. CREATION & TAB SEPARATION WORKFLOWS
  // =========================================================================
  test.describe('Creation & Section Separation', () => {
    test('creates empty prefabs in World and UI tabs separately', async ({ prefabs, popup }) => {
      // Create World Prefab
      await popup.selectContextMenu(prefabs.panel, 'Create Empty Prefab');
      const worldItem = prefabs.itemByName('New_Prefab');
      await expect(worldItem).toBeVisible();
      await expect(worldItem).toHaveAttribute('data-node-type', 'world');

      // Switch to UI Tab
      await prefabs.switchTab('ui');
      await expect(worldItem).toBeHidden();

      // Create UI Prefab
      await popup.selectContextMenu(prefabs.panel, 'Create Empty Prefab');
      const uiItem = prefabs.itemByName('New_Prefab');
      await expect(uiItem).toBeVisible();
      await expect(uiItem).toHaveAttribute('data-node-type', 'ui');
    });

    test('creates and navigates inside a prefab folder', async ({ prefabs, popup }) => {
      await popup.selectContextMenu(prefabs.panel, 'New Folder');

      // The folder prompt's confirm button is labelled 'Create' in the UI
      await popup.fillPromptAndSubmit(/Folder/i, 'Characters', 'Create');

      const folderItem = prefabs.itemByName('Characters');
      await expect(folderItem).toBeVisible();
      
      await expect(folderItem).toHaveAttribute('data-node-id', /.+/);
      const folderId = await folderItem.getAttribute('data-node-id');

      // Navigate inside folder
      await folderItem.dblclick();

      // Assert breadcrumb updated
      const breadcrumbItem = prefabs.breadcrumbFolder(folderId);
      await expect(breadcrumbItem).toBeVisible();
      await expect(folderItem).toBeHidden();
    });
  });

  // =========================================================================
  // 2. MUTATION, RENAME & DUPLICATION
  // =========================================================================
  test.describe('Mutation & Duplication', () => {
    test('renames a prefab via context menu', async ({ prefabs, popup }) => {
      await popup.selectContextMenu(prefabs.panel, 'Create Empty Prefab');

      const item = prefabs.itemByName('New_Prefab');
      await expect(item).toBeVisible();
      const itemId = await item.getAttribute('data-node-id');

      await popup.selectContextMenu(item, 'Rename');
      await popup.fillPromptAndSubmit(/Rename/i, 'Player_Prefab', 'Rename');

      const renamedItem = prefabs.itemById(itemId);
      await expect(renamedItem).toBeVisible();
      await expect(renamedItem).toHaveAttribute('data-node-name', 'Player_Prefab');
    });

    test('duplicates a prefab and verifies duplicate suffix naming', async ({ prefabs, popup }) => {
      await popup.selectContextMenu(prefabs.panel, 'Create Empty Prefab');

      const originalItem = prefabs.itemByName('New_Prefab');
      await expect(originalItem).toBeVisible();

      await popup.selectContextMenu(originalItem, 'Duplicate');

      const duplicatedItem = prefabs.itemByName('New_Prefab_copy');
      await expect(duplicatedItem).toBeVisible();
    });
  });

  // =========================================================================
  // 3. CLIPBOARD & KEYBOARD SHORTCUT OPERATIONS
  // =========================================================================
  test.describe('Clipboard & Keyboard Shortcuts', () => {
    test('cuts and pastes a prefab into a folder using keyboard shortcuts', async ({ page, prefabs, popup }) => {
      // Create Folder & Prefab
      await popup.selectContextMenu(prefabs.panel, 'New Folder');
      await popup.fillPromptAndSubmit(/Folder/i, 'Props', 'Create');

      const folderItem = prefabs.itemByName('Props');
      await expect(folderItem).toBeVisible();

      await popup.selectContextMenu(prefabs.panel, 'Create Empty Prefab');
      const prefabItem = prefabs.itemByName('New_Prefab');
      await expect(prefabItem).toBeVisible();

      // Select and Cut
      await prefabItem.click();
      await expect(prefabItem).toHaveAttribute('aria-selected', 'true');
      await page.keyboard.press('Control+x');
      await expect(prefabItem).toHaveAttribute('data-cut', 'true');

      // Enter folder and Paste
      await folderItem.dblclick();
      await page.keyboard.press('Control+v');

      // Assert item moved into folder
      const movedItem = prefabs.itemByName('New_Prefab');
      await expect(movedItem).toBeVisible();
    });
  });

  // =========================================================================
  // 4. DELETION & BAD PATHS
  // =========================================================================
  test.describe('Deletion & Boundary Restrictions', () => {
    test('deletes a prefab after confirmation', async ({ prefabs, popup }) => {
      await popup.selectContextMenu(prefabs.panel, 'Create Empty Prefab');

      const item = prefabs.itemByName('New_Prefab');
      await expect(item).toBeVisible();

      await popup.selectContextMenu(item, 'Delete');

      await expect(item).toHaveCount(0);
    });

    test('[Bad Path] cancels folder deletion and ensures state remains unchanged', async ({ prefabs, popup }) => {
      await popup.selectContextMenu(prefabs.panel, 'New Folder');
      await popup.fillPromptAndSubmit(/Folder/i, 'Protected_Folder', 'Create');

      const folderItem = prefabs.itemByName('Protected_Folder');
      await expect(folderItem).toBeVisible();

      // Trigger delete and cancel confirmation
      await popup.selectContextMenu(folderItem, 'Delete');
      await popup.confirmAction(/Delete Folder\?/i, { action: 'cancel', cancelText: 'Cancel' });

      // Assert folder remains visible
      await prefabs.ensureVisible();
      await expect(folderItem).toBeVisible();
    });
  });

  // =========================================================================
  // 5. SEARCH & VIEW MODE CONTROLS
  // =========================================================================
  test.describe('Search & View Controls', () => {
    test('filters visible prefabs reactively via search input', async ({ prefabs, popup, controls }) => {
      await popup.selectContextMenu(prefabs.panel, 'Create Empty Prefab');
      const item = prefabs.itemByName('New_Prefab');
      await expect(item).toBeVisible();

      // Filter with non-matching query
      await controls.fillSearch('search-prefab-input', 'NonExistent');
      await expect(item).toBeHidden();

      // Clear search query
      await controls.clearSearch('search-prefab-input');
      await expect(item).toBeVisible();
    });

    test('toggles container view mode between grid and list', async ({ prefabs }) => {
      await expect(prefabs.container).toHaveAttribute('data-view-mode', 'grid');

      await prefabs.toggleViewMode();
      await expect(prefabs.container).toHaveAttribute('data-view-mode', 'list');
    });
  });
});