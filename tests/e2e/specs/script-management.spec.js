import { test, expect } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Script E2E',
    description: 'Workspace isolasi untuk E2E Testing Panel Script',
  },
});

test.describe('Script Panel E2E Management', () => {

  test.beforeEach(async ({ scripts }) => {
    await scripts.ensureVisible();
  });

  // =========================================================================
  // 1. CREATION & NAVIGATION WORKFLOWS
  // =========================================================================
  test.describe('Creation & Navigation', () => {
    test('creates a new script via top action button', async ({ scripts, popup }) => {
      // Act: Klik tombol New Script dan isi prompt
      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', 'PlayerController', 'Create');

      // Assert: Verify script dibuat dan dirender secara reaktif
      await popup.expectPopAlert('Script Created');
      const scriptItem = scripts.itemByName('PlayerController');
      await expect(scriptItem).toBeVisible();
      await expect(scriptItem).toHaveAttribute('data-node-type', 'script');
    });

    test('creates a new folder via context menu and navigates inside', async ({ scripts, popup }) => {
      // Act: Buat folder baru via context menu (Folder Prompt konfirmasi tombolnya 'Create')
      await popup.selectContextMenu(scripts.container, 'New Folder');
      await popup.fillPromptAndSubmit('New Folder', 'Controllers', 'Create');

      // Assert: Folder muncul di root
      const folderItem = scripts.itemByName('Controllers');
      await expect(folderItem).toBeVisible();
      await expect(folderItem).toHaveAttribute('data-node-type', 'folder');

      // Act: Masuk ke dalam folder
      await folderItem.dblclick();

      // Assert: Breadcrumb terupdate dan item folder root tidak lagi terlihat
      await expect(scripts.breadcrumbFolder('Controllers')).toBeVisible();
      await expect(folderItem).not.toBeVisible();
    });

    test('navigates back to root folder via breadcrumb', async ({ scripts, popup }) => {
      // Arrange: Buat folder dan masuk
      await popup.selectContextMenu(scripts.container, 'New Folder');
      await popup.fillPromptAndSubmit('New Folder', 'Utils', 'Create');
      const folderItem = scripts.itemByName('Utils');
      await folderItem.dblclick();

      // Act: Navigasi kembali ke root via breadcrumb
      await scripts.breadcrumbRoot.click();

      // Assert: Folder root kembali terlihat
      await expect(folderItem).toBeVisible();
    });
  });

  // =========================================================================
  // 2. MUTATION, RENAME & DUPLICATION
  // =========================================================================
  test.describe('Mutation & Duplication', () => {
    test('renames a script via context menu', async ({ scripts, popup }) => {
      // Arrange: Buat script awal
      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', 'MovementLogic', 'Create');
      const scriptItem = scripts.itemByName('MovementLogic');
      const scriptId = await scriptItem.getAttribute('data-node-id');

      // Act: Trigger Rename via context menu
      await popup.selectContextMenu(scriptItem, 'Rename');
      await popup.fillPromptAndSubmit('Rename Script', 'AdvancedMovement', 'Rename');

      // Assert: Nama ter-update secara reaktif dan ID tetap stabil
      await popup.expectPopAlert('Renamed');
      const renamedItem = scripts.itemById(scriptId);
      await expect(renamedItem).toBeVisible();
      await expect(renamedItem).toHaveAttribute('data-node-name', 'AdvancedMovement');
    });

    test('duplicates a script via context menu', async ({ scripts, popup }) => {
      // Arrange: Buat script
      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', 'HealthSystem', 'Create');
      const originalItem = scripts.itemByName('HealthSystem');

      // Act: Duplikat script via Context Menu
      await popup.selectContextMenu(originalItem, 'Duplicate');

      // Assert: Script duplikat muncul dengan sufiks _Copy
      await popup.expectPopAlert('Duplicated');
      const duplicatedItem = scripts.itemByName('HealthSystem_Copy');
      await expect(duplicatedItem).toBeVisible();
    });

    test('copies script ID to clipboard', async ({ scripts, popup }) => {
      // Arrange: Buat script
      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', 'AudioController', 'Create');
      const scriptItem = scripts.itemByName('AudioController');

      // Act: Trigger Copy ID
      await popup.selectContextMenu(scriptItem, 'Copy ID');

      // Assert: Feedback toast alert muncul
      await popup.expectPopAlert('Success');
    });
  });

  // =========================================================================
  // 3. CLIPBOARD & KEYBOARD SHORTCUT OPERATIONS
  // =========================================================================
  test.describe('Clipboard & Keyboard Shortcuts', () => {
    test('cuts and pastes a script into a folder using keyboard shortcuts', async ({ page, scripts, popup }) => {
      // Arrange: Buat Folder dan Script di root
      await popup.selectContextMenu(scripts.container, 'New Folder');
      await popup.fillPromptAndSubmit('New Folder', 'Core', 'Create');
      const folderItem = scripts.itemByName('Core');

      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', 'GameManager', 'Create');
      const scriptItem = scripts.itemByName('GameManager');

      // Act: Select script & Cut (Ctrl+X)
      await scriptItem.click();
      await page.keyboard.press('Control+x');
      await expect(scriptItem).toHaveAttribute('data-cut', 'true');

      // Act: Masuk ke folder & Paste (Ctrl+V)
      await folderItem.dblclick();
      await page.keyboard.press('Control+v');

      // Assert: Script telah berpindah ke dalam folder
      const movedItem = scripts.itemByName('GameManager');
      await expect(movedItem).toBeVisible();
    });
  });

  // =========================================================================
  // 4. DELETION & BAD PATHS
  // =========================================================================
  test.describe('Deletion & Boundary Restrictions', () => {
    test('deletes a script after modal confirmation', async ({ scripts, popup }) => {
      // Arrange: Buat script
      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', 'TempScript', 'Create');
      const scriptItem = scripts.itemByName('TempScript');

      // Act: Hapus script dan konfirmasi modal
      await popup.selectContextMenu(scriptItem, 'Delete');
      await popup.confirmAction('Delete Script', { action: 'confirm', confirmText: 'Delete' });

      // Assert: Script terhapus dari DOM
      await expect(scriptItem).toHaveCount(0);
    });

    test('[Bad Path] cancels folder deletion and ensures state remains unchanged', async ({ scripts, popup }) => {
      // Arrange: Buat folder
      await popup.selectContextMenu(scripts.container, 'New Folder');
      await popup.fillPromptAndSubmit('New Folder', 'ImportantFolder', 'Create');
      const folderItem = scripts.itemByName('ImportantFolder');

      // Act: Trigger hapus folder tetapi Batal/Cancel pada konfirmasi
      await popup.selectContextMenu(folderItem, 'Delete');
      await popup.confirmAction(/Delete Folder\?/i, { action: 'cancel', cancelText: 'Cancel' });

      // Assert: Folder tetap berada di DOM
      await expect(folderItem).toBeVisible();
    });
  });

  // =========================================================================
  // 5. SEARCH & VIEW MODE CONTROLS
  // =========================================================================
  // =========================================================================
  // 5. SEARCH & VIEW MODE CONTROLS
  // =========================================================================
  test.describe('Search & View Controls', () => {
    test('filters visible scripts reactively via search input', async ({ scripts, popup, controls }) => {
      // Arrange: Buat dua script
      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', 'PlayerMotor', 'Create');

      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', 'EnemyAI', 'Create');

      const playerScript = scripts.itemByName('PlayerMotor');
      const enemyScript = scripts.itemByName('EnemyAI');

      // Act: Gunakan placeholder 'Search scripts...' agar BaseControlHelper langsung menargetkan elemen <input>
      await controls.fillSearch('Search scripts...', 'Player');
      await expect(playerScript).toBeVisible();
      await expect(enemyScript).not.toBeVisible();

      // Act: Clear search query menggunakan placeholder yang sama
      await controls.clearSearch('Search scripts...');
      await expect(playerScript).toBeVisible();
      await expect(enemyScript).toBeVisible();
    });

    test('toggles container view mode between grid and list', async ({ scripts }) => {
      // Assert default view mode
      await expect(scripts.container).toHaveAttribute('data-view-mode', 'grid');

      // Act: Toggle Mode
      await scripts.toggleViewMode();

      // Assert mode berubah ke list
      await expect(scripts.container).toHaveAttribute('data-view-mode', 'list');
    });
  });
});