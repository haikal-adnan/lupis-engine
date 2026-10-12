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
      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', 'PlayerController', 'Create');

      await popup.expectPopAlert('Script Created');
      const scriptItem = scripts.itemByName('PlayerController');
      await expect(scriptItem).toBeVisible();
      await expect(scriptItem).toHaveAttribute('data-node-type', 'script');
    });

    test('creates a new folder via context menu and navigates inside', async ({ scripts, popup }) => {
      await popup.selectContextMenu(scripts.container, 'New Folder');
      await popup.fillPromptAndSubmit('New Folder', 'Controllers', 'Create');

      const folderItem = scripts.itemByName('Controllers');
      await expect(folderItem).toBeVisible();
      await expect(folderItem).toHaveAttribute('data-node-type', 'folder');

      await folderItem.dblclick();

      await expect(scripts.breadcrumbFolder('Controllers')).toBeVisible();
      await expect(folderItem).toBeHidden();
    });

    test('navigates back to root folder via breadcrumb', async ({ scripts, popup }) => {
      await popup.selectContextMenu(scripts.container, 'New Folder');
      await popup.fillPromptAndSubmit('New Folder', 'Utils', 'Create');
      const folderItem = scripts.itemByName('Utils');
      await folderItem.dblclick();

      await scripts.breadcrumbRoot.click();

      await expect(folderItem).toBeVisible();
    });
  });

  // =========================================================================
  // 2. MUTATION, RENAME & DUPLICATION
  // =========================================================================
  test.describe('Mutation & Duplication', () => {
    test('renames a script via context menu', async ({ scripts, popup }) => {
      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', 'MovementLogic', 'Create');
      const scriptItem = scripts.itemByName('MovementLogic');
      const scriptId = await scriptItem.getAttribute('data-node-id');

      await popup.selectContextMenu(scriptItem, 'Rename');
      await popup.fillPromptAndSubmit('Rename Script', 'AdvancedMovement', 'Rename');

      await popup.expectPopAlert('Renamed');
      const renamedItem = scripts.itemById(scriptId);
      await expect(renamedItem).toBeVisible();
      await expect(renamedItem).toHaveAttribute('data-node-name', 'AdvancedMovement');
    });

    test('duplicates a script via context menu', async ({ scripts, popup }) => {
      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', 'HealthSystem', 'Create');
      const originalItem = scripts.itemByName('HealthSystem');

      await popup.selectContextMenu(originalItem, 'Duplicate');

      await popup.expectPopAlert('Duplicated');
      const duplicatedItem = scripts.itemByName('HealthSystem_Copy');
      await expect(duplicatedItem).toBeVisible();
    });

    test('copies script ID to clipboard', async ({ scripts, popup }) => {
      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', 'AudioController', 'Create');
      const scriptItem = scripts.itemByName('AudioController');

      await expect(scriptItem).toHaveAttribute('data-node-id', /.+/);

      await popup.selectContextMenu(scriptItem, 'Copy ID');

      await popup.expectPopAlert('Success');
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
    test('deletes a script after modal confirmation', async ({ scripts, popup }) => {
      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', 'TempScript', 'Create');
      const scriptItem = scripts.itemByName('TempScript');

      await popup.selectContextMenu(scriptItem, 'Delete');
      await popup.confirmAction('Delete Script', { action: 'confirm', confirmText: 'Delete' });

      await expect(scriptItem).toHaveCount(0);
    });

    test('[Bad Path] cancels folder deletion and ensures state remains unchanged', async ({ scripts, popup }) => {
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

    test('toggles container view mode between grid and list', async ({ scripts }) => {
      await expect(scripts.container).toHaveAttribute('data-view-mode', 'grid');

      await scripts.toggleViewMode();

      await expect(scripts.container).toHaveAttribute('data-view-mode', 'list');
    });
  });

  // =========================================================================
  // 6. SCRIPT CONTROLLER ATTACHMENT & INSPECTOR CRUD
  // =========================================================================
  test.describe('Script Controller Attachment & Component CRUD', () => {
    test('attaches a script to an entity and verifies script controller inspector controls', async ({ hierarchy, inspector, popup, scripts }) => {
      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', 'PlayerControllerScript', 'Create');
      await popup.expectPopAlert('Script Created');

      const worldLayer = hierarchy.nodeByName('World Layer');
      const entityNode = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Empty Entity']);
      await entityNode.click();
      await inspector.setEntityName('PlayerCharacter');
      await inspector.ensureScriptControllerComponent();

      const playerNode = hierarchy.nodeByName('PlayerCharacter');
      await expect(playerNode).toBeVisible();
      await playerNode.click();

      const scriptItem = scripts.itemByName('PlayerControllerScript');
      await scripts.ensureVisible();
      await scriptItem.scrollIntoViewIfNeeded();
      await popup.selectContextMenu(scriptItem, 'Add to PlayerCharacter');

      await playerNode.click();

      await expect(inspector.scriptControllerSection).toBeVisible();
      const dropdownTrigger = inspector.scriptControllerSection.getByTestId('script-controller-dropdown-trigger');
      await expect(dropdownTrigger).toContainText('PlayerControllerScript');
    });

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
    test('attaches more than 10 scripts to a single entity', async ({ hierarchy, inspector, popup, scripts, page }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const entityNode = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Empty Entity']);
      await entityNode.click();
      await inspector.setEntityName('MegaEntity');
      await inspector.ensureScriptControllerComponent();

      const megaNode = hierarchy.nodeByName('MegaEntity');
      await expect(megaNode).toBeVisible();
      await megaNode.click();

      const scriptCount = 11;
      for (let i = 1; i <= scriptCount; i++) {
        const scriptName = `ModuleScript_${String(i).padStart(2, '0')}`;
        await scripts.createBtn.click();
        await popup.fillPromptAndSubmit('Create New Component', scriptName, 'Create');
        await popup.expectPopAlert('Script Created');

        const scriptItem = scripts.itemByName(scriptName);
        await scripts.ensureVisible();
        await scriptItem.scrollIntoViewIfNeeded();
        await popup.selectContextMenu(scriptItem, 'Add to MegaEntity');
      }

      await megaNode.click();

      const dropdownTrigger = inspector.scriptControllerSection.getByTestId('script-controller-dropdown-trigger');
      await dropdownTrigger.click();

      const dropdownList = page.getByTestId('script-controller-dropdown-list');
      await expect(dropdownList).toBeVisible();

      const attachedScriptItems = dropdownList.getByTestId('script-controller-item');
      await expect(attachedScriptItems).toHaveCount(scriptCount);
    });

    test('attaches the same script to 3 entities of different types (Sprite, Shape, Text)', async ({ hierarchy, inspector, popup, scripts }) => {
      const sharedScriptName = 'SharedGameLogic';
      await scripts.createBtn.click();
      await popup.fillPromptAndSubmit('Create New Component', sharedScriptName, 'Create');
      await popup.expectPopAlert('Script Created');

      const scriptItem = scripts.itemByName(sharedScriptName);
      const worldLayer = hierarchy.nodeByName('World Layer');

      const spriteRaw = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Sprite']);
      await popup.selectContextMenu(spriteRaw, 'Rename Entity');
      await popup.fillPromptAndSubmit('Rename Entity', 'HeroSprite', 'Rename');
      const spriteEntity = hierarchy.nodeByName('HeroSprite');
      await spriteEntity.click();
      await inspector.ensureScriptControllerComponent();
      await scripts.ensureVisible();
      await scriptItem.scrollIntoViewIfNeeded();
      await popup.selectContextMenu(scriptItem, 'Add to HeroSprite');

      const shapeRaw = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Shape']);
      await popup.selectContextMenu(shapeRaw, 'Rename Entity');
      await popup.fillPromptAndSubmit('Rename Entity', 'BoundaryShape', 'Rename');
      const shapeEntity = hierarchy.nodeByName('BoundaryShape');
      await shapeEntity.click();
      await inspector.ensureScriptControllerComponent();
      await scripts.ensureVisible();
      await scriptItem.scrollIntoViewIfNeeded();
      await popup.selectContextMenu(scriptItem, 'Add to BoundaryShape');

      const textRaw = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Text']);
      await popup.selectContextMenu(textRaw, 'Rename Entity');
      await popup.fillPromptAndSubmit('Rename Entity', 'StatusText', 'Rename');
      const textEntity = hierarchy.nodeByName('StatusText');
      await textEntity.click();
      await inspector.ensureScriptControllerComponent();
      await scripts.ensureVisible();
      await scriptItem.scrollIntoViewIfNeeded();
      await popup.selectContextMenu(scriptItem, 'Add to StatusText');

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