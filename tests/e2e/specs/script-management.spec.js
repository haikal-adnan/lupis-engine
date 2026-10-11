import { test, expect } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Script E2E',
    description: 'Workspace isolasi untuk E2E Testing Panel Script & Script Controller Integration',
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
      // Act: Buat folder baru via context menu
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
  test.describe('Search & View Controls', () => {
    test('filters visible scripts reactively via search input', async ({ scripts, controls, popup }) => {
      // Arrange: Buat dua script
      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', 'PlayerMotor', 'Create');

      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', 'EnemyAI', 'Create');

      const playerScript = scripts.itemByName('PlayerMotor');
      const enemyScript = scripts.itemByName('EnemyAI');

      // Act: Filter berdasarkan kata kunci 'Player' di-scope ke panel Script
      await controls.fillSearch('Search scripts...', 'Player', scripts.panel);
      await expect(playerScript).toBeVisible();
      await expect(enemyScript).not.toBeVisible();

      // Act: Clear search query
      await controls.clearSearch('Search scripts...', scripts.panel);
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

  // =========================================================================
  // 6. SCRIPT CONTROLLER ATTACHMENT & INSPECTOR CRUD
  // =========================================================================
  test.describe('Script Controller Attachment & Component CRUD', () => {
    test('attaches a script to an entity and verifies script controller inspector controls', async ({ hierarchy, inspector, popup, scripts }) => {
      // 1. Buat script di Script Panel
      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', 'PlayerControllerScript', 'Create');
      await popup.expectPopAlert('Script Created');

      // 2. Buat entity target 'PlayerCharacter', pilih entity & tambahkan komponen ScriptController
      const worldLayer = hierarchy.nodeByName('World Layer');
      await popup.selectContextMenu(worldLayer, ['Add Entity', 'Empty Entity']);
      const entityNode = hierarchy.nodesByText(/Empty/i).first();
      await entityNode.click();
      await inspector.setEntityName('PlayerCharacter');
      await inspector.ensureScriptControllerComponent();

      // Pastikan reaktivitas nama entity di Pinia selesai & entity terpilih aktif
      const playerNode = hierarchy.nodeByName('PlayerCharacter');
      await expect(playerNode).toBeVisible();
      await playerNode.click();

      // 3. Karena PlayerCharacter sedang dipilih dan memiliki ScriptController,
      //    opsi context menu 'Add to PlayerCharacter' dijamin muncul
      const scriptItem = scripts.itemByName('PlayerControllerScript');
      await popup.selectContextMenu(scriptItem, 'Add to PlayerCharacter');

      // 4. Verifikasi Inspector memperlihatkan script yang terpasang
      await playerNode.click();

      await expect(inspector.scriptControllerSection).toBeVisible();
      const dropdownTrigger = inspector.scriptControllerSection.getByTestId('script-controller-dropdown-trigger');
      await expect(dropdownTrigger).toContainText('PlayerControllerScript');
    });

    test('performs CRUD operations on attached script component (toggle active, change script, detach/remove)', async ({ hierarchy, inspector, popup, scripts, page }) => {
      // 1. Buat dua script
      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', 'BaseEnemyLogic', 'Create');
      await popup.expectPopAlert('Script Created');

      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', 'BossSpecialAttack', 'Create');
      await popup.expectPopAlert('Script Created');

      // 2. Buat entity 'EnemyBoss', pilih & pasang ScriptController
      const worldLayer = hierarchy.nodeByName('World Layer');
      await popup.selectContextMenu(worldLayer, ['Add Entity', 'Empty Entity']);
      const entityNode = hierarchy.nodesByText(/Empty/i).first();
      await entityNode.click();
      await inspector.setEntityName('EnemyBoss');
      await inspector.ensureScriptControllerComponent();

      // Pastikan reaktivitas nama entity di Pinia selesai & entity terpilih aktif
      const bossNode = hierarchy.nodeByName('EnemyBoss');
      await expect(bossNode).toBeVisible();
      await bossNode.click();

      // 3. Attach kedua script ke EnemyBoss via Context Menu
      const baseScript = scripts.itemByName('BaseEnemyLogic');
      await popup.selectContextMenu(baseScript, 'Add to EnemyBoss');

      const bossScript = scripts.itemByName('BossSpecialAttack');
      await popup.selectContextMenu(bossScript, 'Add to EnemyBoss');

      // Act 1: Focus ke EnemyBoss & Toggle Active Status pada active script
      await bossNode.click();
      await expect(inspector.scriptControllerSection).toBeVisible();

      await inspector.toggleScriptActive();
      const activeToggle = inspector.scriptControllerSection.getByTestId('script-controller-active-toggle');
      await expect(activeToggle).toHaveAttribute('data-active', 'false');

      await inspector.toggleScriptActive();
      await expect(activeToggle).toHaveAttribute('data-active', 'true');

      // Act 2: Ganti active script di Inspector menggunakan helper selectAttachedScript
      await inspector.selectAttachedScript('BossSpecialAttack');
      const dropdownTrigger = inspector.scriptControllerSection.getByTestId('script-controller-dropdown-trigger');
      await expect(dropdownTrigger).toContainText('BossSpecialAttack');

      // Act 3: Detach current script via Script Options dropdown menu
      const optionsTrigger = inspector.scriptControllerSection.getByTestId('script-controller-options-trigger');
      await optionsTrigger.click();

      const removeScriptBtn = page.getByTestId('script-controller-remove-btn');
      await expect(removeScriptBtn).toBeVisible();
      await removeScriptBtn.click();

      await popup.confirmAction('Detach Script?', { confirmText: 'Yes, Detach' });

      // Assert: Script kedua terpasang kembali / aktif
      await expect(dropdownTrigger).toContainText('BaseEnemyLogic');

      // Act 4: Remove seluruh komponen Script Controller via Section Menu
      const section = inspector.scriptControllerSection;
      await section.scrollIntoViewIfNeeded();

      const menuTrigger = section.locator('[data-element="section-menu-trigger"]').first();
      await expect(menuTrigger).toBeVisible();
      await menuTrigger.click();

      const removeComponentBtn = page.getByTestId('script-controller-menu-remove');
      await expect(removeComponentBtn).toBeVisible();
      await removeComponentBtn.click();

      // Konfirmasi modal dialog hapus komponen jika muncul
      try {
        await popup.confirmAction(/Remove/i, { confirmText: 'Remove' });
      } catch {
        // Fallback jika komponen langsung terhapus tanpa modal konfirmasi
      }

      // Assert: Komponen Script Controller sudah tidak ada di Inspector
      await expect(inspector.scriptControllerSection).toHaveCount(0);
    });

    test('reactively updates inspector binding when attached script is renamed', async ({ hierarchy, inspector, popup, scripts }) => {
      // 1. Buat script 'OldHeroScript'
      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', 'OldHeroScript', 'Create');
      await popup.expectPopAlert('Script Created');

      // 2. Buat entity 'HeroCharacter', pilih & tambahkan ScriptController
      const worldLayer = hierarchy.nodeByName('World Layer');
      await popup.selectContextMenu(worldLayer, ['Add Entity', 'Empty Entity']);
      const entityNode = hierarchy.nodesByText(/Empty/i).first();
      await entityNode.click();
      await inspector.setEntityName('HeroCharacter');
      await inspector.ensureScriptControllerComponent();

      // Pastikan reaktivitas nama entity di Pinia selesai & entity terpilih aktif
      const heroNode = hierarchy.nodeByName('HeroCharacter');
      await expect(heroNode).toBeVisible();
      await heroNode.click();

      // 3. Attach script ke HeroCharacter
      const scriptItem = scripts.itemByName('OldHeroScript');
      await popup.selectContextMenu(scriptItem, 'Add to HeroCharacter');

      // 4. Rename Script di Script Panel
      await popup.selectContextMenu(scriptItem, 'Rename');
      await popup.fillPromptAndSubmit('Rename Script', 'SuperHeroScript', 'Rename');
      await popup.expectPopAlert('Renamed');

      // 5. Select kembali HeroCharacter di Hierarchy untuk verifikasi
      await heroNode.click();

      // Assert: Dynamic binding nama script di Inspector ter-update secara reaktif
      const dropdownTrigger = inspector.scriptControllerSection.getByTestId('script-controller-dropdown-trigger');
      await expect(dropdownTrigger).toContainText('SuperHeroScript');
    });
  });

  // =========================================================================
  // 7. MULTI-SCRIPT & ENTITY SHARING SCENARIOS
  // =========================================================================
  test.describe('Multi-Script & Entity Sharing Scenarios', () => {
    test('attaches more than 10 scripts to a single entity', async ({ hierarchy, inspector, popup, scripts, page }) => {
      // 1. Buat entity utama 'MegaEntity', pilih & tambahkan ScriptController
      const worldLayer = hierarchy.nodeByName('World Layer');
      await popup.selectContextMenu(worldLayer, ['Add Entity', 'Empty Entity']);
      const entityNode = hierarchy.nodesByText(/Empty/i).first();
      await entityNode.click();
      await inspector.setEntityName('MegaEntity');
      await inspector.ensureScriptControllerComponent();

      const megaNode = hierarchy.nodeByName('MegaEntity');
      await expect(megaNode).toBeVisible();
      await megaNode.click();

      // 2. Buat & attach 11 script berbeda ke MegaEntity
      const scriptCount = 11;
      for (let i = 1; i <= scriptCount; i++) {
        const scriptName = `ModuleScript_${String(i).padStart(2, '0')}`;
        await scripts.createBtn.click();
        await popup.fillPromptAndSubmit('Create New Component', scriptName, 'Create');
        await popup.expectPopAlert('Script Created');

        // MegaEntity tetap terpilih sebagai target entity
        const scriptItem = scripts.itemByName(scriptName);
        await popup.selectContextMenu(scriptItem, 'Add to MegaEntity');
      }

      // Assert: Buka dropdown list di Inspector & pastikan ke-11 script terdaftar
      await megaNode.click();

      const dropdownTrigger = inspector.scriptControllerSection.getByTestId('script-controller-dropdown-trigger');
      await dropdownTrigger.click();

      const dropdownList = page.getByTestId('script-controller-dropdown-list');
      await expect(dropdownList).toBeVisible();

      const attachedScriptItems = dropdownList.getByTestId('script-controller-item');
      await expect(attachedScriptItems).toHaveCount(scriptCount);
    });

    test('attaches the same script to 3 entities of different types (Sprite, Shape, Text)', async ({ hierarchy, inspector, popup, scripts }) => {
      // 1. Buat 1 script utama yang akan di-share
      const sharedScriptName = 'SharedGameLogic';
      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', sharedScriptName, 'Create');
      await popup.expectPopAlert('Script Created');

      const scriptItem = scripts.itemByName(sharedScriptName);
      const worldLayer = hierarchy.nodeByName('World Layer');

      // 2. Tipe 1: Sprite Entity (HeroSprite)
      await popup.selectContextMenu(worldLayer, ['Add Entity', 'Sprite']);
      const spriteRaw = hierarchy.nodesByText(/Sprite/i).first();
      await popup.selectContextMenu(spriteRaw, 'Rename Entity');
      await popup.fillPromptAndSubmit('Rename Entity', 'HeroSprite', 'Rename');
      const spriteEntity = hierarchy.nodeByName('HeroSprite');
      await spriteEntity.click();
      await inspector.ensureScriptControllerComponent();
      await popup.selectContextMenu(scriptItem, 'Add to HeroSprite');

      // 3. Tipe 2: Shape Entity (BoundaryShape)
      await popup.selectContextMenu(worldLayer, ['Add Entity', 'Shape']);
      const shapeRaw = hierarchy.nodesByText(/Shape/i).first();
      await popup.selectContextMenu(shapeRaw, 'Rename Entity');
      await popup.fillPromptAndSubmit('Rename Entity', 'BoundaryShape', 'Rename');
      const shapeEntity = hierarchy.nodeByName('BoundaryShape');
      await shapeEntity.click();
      await inspector.ensureScriptControllerComponent();
      await popup.selectContextMenu(scriptItem, 'Add to BoundaryShape');

      // 4. Tipe 3: Text Entity (StatusText)
      await popup.selectContextMenu(worldLayer, ['Add Entity', 'Text']);
      const textRaw = hierarchy.nodesByText(/Text/i).first();
      await popup.selectContextMenu(textRaw, 'Rename Entity');
      await popup.fillPromptAndSubmit('Rename Entity', 'StatusText', 'Rename');
      const textEntity = hierarchy.nodeByName('StatusText');
      await textEntity.click();
      await inspector.ensureScriptControllerComponent();
      await popup.selectContextMenu(scriptItem, 'Add to StatusText');

      // Assert 1: Verify di HeroSprite (Sprite)
      await spriteEntity.click();
      await expect(inspector.scriptControllerSection).toBeVisible();
      await expect(inspector.scriptControllerSection.getByTestId('script-controller-dropdown-trigger')).toContainText(sharedScriptName);

      // Assert 2: Verify di BoundaryShape (Shape)
      await shapeEntity.click();
      await expect(inspector.scriptControllerSection).toBeVisible();
      await expect(inspector.scriptControllerSection.getByTestId('script-controller-dropdown-trigger')).toContainText(sharedScriptName);

      // Assert 3: Verify di StatusText (Text)
      await textEntity.click();
      await expect(inspector.scriptControllerSection).toBeVisible();
      await expect(inspector.scriptControllerSection.getByTestId('script-controller-dropdown-trigger')).toContainText(sharedScriptName);
    });
  });
});