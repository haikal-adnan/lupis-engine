import { test, expect } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Script E2E',
    description: 'Isolated workspace for Script Panel & Script Controller integration E2E tests',
  },
});

test.describe('Script Panel E2E Management', () => {

  test.beforeEach(async ({ scripts }) => {
    await scripts.ensureVisible();
  });

  // =========================================================================
  // 1. CREATION & NAVIGATION WORKFLOWS
  // =========================================================================
  test.describe('Creation, Mutation & Navigation', () => {
    test('creates and renames a script via top action button and context menu', async ({ scripts, popup }) => {
      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', 'MovementLogic', 'Create');

      await popup.expectPopAlert('Script Created');
      const scriptItem = scripts.itemByName('MovementLogic');
      await expect(scriptItem).toBeVisible();
      await expect(scriptItem).toHaveAttribute('data-node-type', 'script');
      const scriptId = await scriptItem.getAttribute('data-node-id');

      await popup.selectContextMenu(scriptItem, 'Rename');
      await popup.fillPromptAndSubmit('Rename Script', 'AdvancedMovement', 'Rename');

      await popup.expectPopAlert('Renamed');
      const renamedItem = scripts.itemById(scriptId);
      await expect(renamedItem).toBeVisible();
      await expect(renamedItem).toHaveAttribute('data-node-name', 'AdvancedMovement');
    });

    test('creates a new folder via context menu and navigates via breadcrumbs', async ({ scripts, popup }) => {
      await popup.selectContextMenu(scripts.container, 'New Folder');
      await popup.fillPromptAndSubmit('New Folder', 'Controllers', 'Create');

      const folderItem = scripts.itemByName('Controllers');
      await expect(folderItem).toBeVisible();
      await expect(folderItem).toHaveAttribute('data-node-type', 'folder');

      await folderItem.dblclick();
      await expect(scripts.breadcrumbFolder('Controllers')).toBeVisible();
      await expect(folderItem).toBeHidden();

      await scripts.breadcrumbRoot.click();
      await expect(folderItem).toBeVisible();
    });

    test('duplicates a script and copies script ID via context menu', async ({ scripts, popup }) => {
      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', 'HealthSystem', 'Create');
      const originalItem = scripts.itemByName('HealthSystem');

      await expect(originalItem).toHaveAttribute('data-node-id', /.+/);
      await popup.selectContextMenu(originalItem, 'Copy ID');
      await popup.expectPopAlert('Success');

      await popup.selectContextMenu(originalItem, 'Duplicate');
      await popup.expectPopAlert('Duplicated');
      const duplicatedItem = scripts.itemByName('HealthSystem_Copy');
      await expect(duplicatedItem).toBeVisible();
    });
  });

  // =========================================================================
  // 3. CLIPBOARD & KEYBOARD SHORTCUT OPERATIONS
  // =========================================================================
  test.describe('Clipboard & Keyboard Shortcuts', () => {
    test('cuts and pastes a script into a folder using keyboard shortcuts', async ({ page, scripts, popup }) => {
      await popup.selectContextMenu(scripts.container, 'New Folder');
      await popup.fillPromptAndSubmit('New Folder', 'Core', 'Create');
      const folderItem = scripts.itemByName('Core');

      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', 'GameManager', 'Create');
      const scriptItem = scripts.itemByName('GameManager');

      await scriptItem.click();
      await page.keyboard.press('Control+x');
      await expect(scriptItem).toHaveAttribute('data-cut', 'true');

      await folderItem.dblclick();
      await page.keyboard.press('Control+v');

      const movedItem = scripts.itemByName('GameManager');
      await expect(movedItem).toBeVisible();
    });
  });

  // =========================================================================
  // 4. DELETION & BAD PATHS
  // =========================================================================
  test.describe('Deletion & Boundary Restrictions', () => {
    test('verifies script deletion confirmation and folder deletion cancellation', async ({ scripts, popup }) => {
      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', 'TempScript', 'Create');
      const scriptItem = scripts.itemByName('TempScript');

      await popup.selectContextMenu(scriptItem, 'Delete');
      await popup.confirmAction('Delete Script', { action: 'confirm', confirmText: 'Delete' });

      await expect(scriptItem).toHaveCount(0);

      await popup.selectContextMenu(scripts.container, 'New Folder');
      await popup.fillPromptAndSubmit('New Folder', 'ImportantFolder', 'Create');
      const folderItem = scripts.itemByName('ImportantFolder');

      await popup.selectContextMenu(folderItem, 'Delete');
      await popup.confirmAction(/Delete Folder\?/i, { action: 'cancel', cancelText: 'Cancel' });

      await expect(folderItem).toBeVisible();
    });
  });

  // =========================================================================
  // 5. SEARCH & VIEW MODE CONTROLS
  // =========================================================================
  test.describe('Search & View Controls', () => {
    test('filters visible scripts reactively via search input', async ({ scripts, controls, popup }) => {
      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', 'PlayerMotor', 'Create');

      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', 'EnemyAI', 'Create');

      const playerScript = scripts.itemByName('PlayerMotor');
      const enemyScript = scripts.itemByName('EnemyAI');

      await controls.fillSearch('Search scripts...', 'Player', scripts.panel);
      await expect(playerScript).toBeVisible();
      await expect(enemyScript).toBeHidden();

      await controls.clearSearch('Search scripts...', scripts.panel);
      await expect(playerScript).toBeVisible();
      await expect(enemyScript).toBeVisible();
    });
  });

  // =========================================================================
  // 6. SCRIPT CONTROLLER ATTACHMENT & INSPECTOR CRUD
  // =========================================================================
  test.describe('Script Controller Attachment & Component CRUD', () => {

    test('performs CRUD operations on attached script component (toggle active, change script, detach/remove)', async ({ hierarchy, inspector, popup, scripts, page }) => {
      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', 'BaseEnemyLogic', 'Create');
      await popup.expectPopAlert('Script Created');

      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', 'BossSpecialAttack', 'Create');
      await popup.expectPopAlert('Script Created');

      const worldLayer = hierarchy.nodeByName('World Layer');
      const entityNode = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Empty Entity']);
      await entityNode.click();
      await inspector.setEntityName('EnemyBoss');
      await inspector.ensureScriptControllerComponent();

      const bossNode = hierarchy.nodeByName('EnemyBoss');
      await expect(bossNode).toBeVisible();
      await bossNode.click();

      const baseScript = scripts.itemByName('BaseEnemyLogic');
      await scripts.ensureVisible();
      await baseScript.scrollIntoViewIfNeeded();
      await popup.selectContextMenu(baseScript, 'Add to EnemyBoss');

      const bossScript = scripts.itemByName('BossSpecialAttack');
      await scripts.ensureVisible();
      await bossScript.scrollIntoViewIfNeeded();
      await popup.selectContextMenu(bossScript, 'Add to EnemyBoss');

      await bossNode.click();
      await expect(inspector.scriptControllerSection).toBeVisible();

      await inspector.toggleScriptActive();
      const activeToggle = inspector.scriptControllerSection.getByTestId('script-controller-active-toggle');
      await expect(activeToggle).toHaveAttribute('data-active', 'false');

      await inspector.toggleScriptActive();
      await expect(activeToggle).toHaveAttribute('data-active', 'true');

      await inspector.selectAttachedScript('BossSpecialAttack');
      const dropdownTrigger = inspector.scriptControllerSection.getByTestId('script-controller-dropdown-trigger');
      await expect(dropdownTrigger).toContainText('BossSpecialAttack');

      const optionsTrigger = inspector.scriptControllerSection.getByTestId('script-controller-options-trigger');
      await optionsTrigger.click();

      const removeScriptBtn = page.getByTestId('script-controller-remove-btn');
      await expect(removeScriptBtn).toBeVisible();
      await removeScriptBtn.click();

      await popup.confirmAction('Detach Script?', { confirmText: 'Yes, Detach' });

      await expect(dropdownTrigger).toContainText('BaseEnemyLogic');

      const section = inspector.scriptControllerSection;
      await section.scrollIntoViewIfNeeded();

      const menuTrigger = section.locator('[data-element="section-menu-trigger"]');
      await expect(menuTrigger).toBeVisible();
      await menuTrigger.click();

      const removeComponentBtn = page.getByTestId('script-controller-menu-remove');
      await expect(removeComponentBtn).toBeVisible();
      await removeComponentBtn.click();

      await popup.confirmAction(/Remove/i, { confirmText: 'Remove' });

      await expect(inspector.scriptControllerSection).toHaveCount(0);
    });

    test('reactively updates inspector binding when attached script is renamed', async ({ hierarchy, inspector, popup, scripts }) => {
      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', 'OldHeroScript', 'Create');
      await popup.expectPopAlert('Script Created');

      const worldLayer = hierarchy.nodeByName('World Layer');
      const entityNode = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Empty Entity']);
      await entityNode.click();
      await inspector.setEntityName('HeroCharacter');
      await inspector.ensureScriptControllerComponent();

      const heroNode = hierarchy.nodeByName('HeroCharacter');
      await expect(heroNode).toBeVisible();
      await heroNode.scrollIntoViewIfNeeded();
      await heroNode.click();

      const scriptItem = scripts.itemByName('OldHeroScript');
      await expect(scriptItem).toBeVisible();
      await scriptItem.scrollIntoViewIfNeeded();
      await popup.selectContextMenu(scriptItem, 'Add to HeroCharacter');

      await popup.selectContextMenu(scriptItem, 'Rename');
      await popup.fillPromptAndSubmit('Rename Script', 'SuperHeroScript', 'Rename');
      await popup.expectPopAlert('Renamed');

      await heroNode.click();

      const dropdownTrigger = inspector.scriptControllerSection.getByTestId('script-controller-dropdown-trigger');
      await expect(dropdownTrigger).toContainText('SuperHeroScript');
    });
  });

  // =========================================================================
  // 7. MULTI-SCRIPT & ENTITY SHARING SCENARIOS
  // =========================================================================
  test.describe('Multi-Script & Entity Sharing Scenarios', () => {
    test('attaches the same script to 3 entities of different types (Sprite, Shape, Text)', async ({ hierarchy, inspector, popup, scripts }) => {
      // Slow test: performs 3 consecutive entity creations, renames, inspector attachments and context menu actions
      test.slow();

      const sharedScriptName = 'SharedGameLogic';
      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', sharedScriptName, 'Create');
      await popup.expectPopAlert('Script Created');

      const scriptItem = scripts.itemByName(sharedScriptName);
      const worldLayer = hierarchy.nodeByName('World Layer');

      // 1. Sprite Entity
      const spriteRaw = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Sprite']);
      const spriteId = await spriteRaw.getAttribute('data-node-id');
      await popup.selectContextMenu(spriteRaw, 'Rename Entity');
      await popup.fillPromptAndSubmit('Rename Entity', 'HeroSprite', 'Rename');

      const spriteEntity = hierarchy.nodeById(spriteId);
      await expect(spriteEntity).toHaveAttribute('data-node-name', 'HeroSprite');
      await expect(spriteEntity).toBeVisible();
      await spriteEntity.click();
      await expect(spriteEntity).toHaveAttribute('aria-selected', 'true');
      await inspector.ensureScriptControllerComponent();
      await spriteEntity.click();
      await expect(spriteEntity).toHaveAttribute('aria-selected', 'true');
      await scripts.ensureVisible();
      await scriptItem.scrollIntoViewIfNeeded();
      await popup.selectContextMenu(scriptItem, 'Add to HeroSprite');

      // 2. Shape Entity
      const shapeRaw = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Shape']);
      const shapeId = await shapeRaw.getAttribute('data-node-id');
      await popup.selectContextMenu(shapeRaw, 'Rename Entity');
      await popup.fillPromptAndSubmit('Rename Entity', 'BoundaryShape', 'Rename');

      const shapeEntity = hierarchy.nodeById(shapeId);
      await expect(shapeEntity).toHaveAttribute('data-node-name', 'BoundaryShape');
      await expect(shapeEntity).toBeVisible();
      await shapeEntity.click();
      await expect(shapeEntity).toHaveAttribute('aria-selected', 'true');
      await inspector.ensureScriptControllerComponent();
      await shapeEntity.click();
      await expect(shapeEntity).toHaveAttribute('aria-selected', 'true');
      await scripts.ensureVisible();
      await scriptItem.scrollIntoViewIfNeeded();
      await popup.selectContextMenu(scriptItem, 'Add to BoundaryShape');

      // 3. Text Entity
      const textRaw = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Text']);
      const textId = await textRaw.getAttribute('data-node-id');
      await popup.selectContextMenu(textRaw, 'Rename Entity');
      await popup.fillPromptAndSubmit('Rename Entity', 'StatusText', 'Rename');

      const textEntity = hierarchy.nodeById(textId);
      await expect(textEntity).toHaveAttribute('data-node-name', 'StatusText');
      await expect(textEntity).toBeVisible();
      await textEntity.click();
      await expect(textEntity).toHaveAttribute('aria-selected', 'true');
      await inspector.ensureScriptControllerComponent();
      await textEntity.click();
      await expect(textEntity).toHaveAttribute('aria-selected', 'true');
      await scripts.ensureVisible();
      await scriptItem.scrollIntoViewIfNeeded();
      await popup.selectContextMenu(scriptItem, 'Add to StatusText');

      // Verify every script attachment
      await spriteEntity.click();
      await expect(inspector.scriptControllerSection).toBeVisible();
      await expect(inspector.scriptControllerSection.getByTestId('script-controller-dropdown-trigger')).toContainText(sharedScriptName);

      await shapeEntity.click();
      await expect(inspector.scriptControllerSection).toBeVisible();
      await expect(inspector.scriptControllerSection.getByTestId('script-controller-dropdown-trigger')).toContainText(sharedScriptName);

      await textEntity.click();
      await expect(inspector.scriptControllerSection).toBeVisible();
      await expect(inspector.scriptControllerSection.getByTestId('script-controller-dropdown-trigger')).toContainText(sharedScriptName);
    });
  });
});