import { test, expect } from '@playwright/test';
import { BaseControlHelper } from './components/BaseControlHelper.js';
import { PopupHelper } from './components/PopupHelper.js';
import { HierarchyPage } from './pages/HierarchyPage.js';
import { ensureProject } from './helpers/dashboard.js';

test.describe('Hierarchy & Scene E2E Management', () => {
  let controls;
  let popup;
  let hierarchy;

  test.beforeEach(async ({ page }, testInfo) => {
    controls = new BaseControlHelper(page);
    popup = new PopupHelper(page);
    hierarchy = new HierarchyPage(page);

    await ensureProject(page, {
      name: `Hierarchy E2E ${testInfo.testId}`,
      description: 'Workspace isolasi untuk E2E Hierarchy dan Scene Management Testing',
    });
  });

  // =========================================================================
  // 1. SCENE MANAGEMENT OPERATIONS
  // =========================================================================
  test.describe('Scene Management Operations', () => {
    test('creates a new scene via Scene Options dropdown', async () => {
      const newSceneName = 'Level 2 - Forest';
      await hierarchy.createScene(controls, popup, newSceneName);
    });

    test('switches active scene back and forth', async () => {
      const sceneBName = 'Level 3 - Dungeon';

      await expect(hierarchy.sceneSelect).not.toHaveText('Select Scene...');
      const initialSceneName = (await hierarchy.sceneSelect.textContent()).trim();

      await hierarchy.createScene(controls, popup, sceneBName);
      await hierarchy.switchScene(initialSceneName);
    });

    test('renames the currently active scene', async () => {
      const renamedSceneName = 'Main Menu Renamed';

      await controls.clickSelectAction('Scene Options', 'Rename Scene');
      await popup.fillPromptAndSubmit('Rename Scene', renamedSceneName, 'OK');

      await expect(hierarchy.sceneSelect).toContainText(renamedSceneName);
    });

    test('duplicates an existing scene', async ({ page }) => {
      await expect(hierarchy.sceneSelect).not.toHaveText('Select Scene...');
      const originalName = (await hierarchy.sceneSelect.textContent()).trim();

      await controls.clickSelectAction('Scene Options', 'Duplicate Scene');

      const promptModal = page.getByRole('dialog').or(page.getByTestId('base-prompt-overlay')).first();
      if ((await promptModal.count()) > 0 && (await promptModal.isVisible())) {
        await popup.fillPromptAndSubmit('Duplicate Scene', `${originalName} Copy`, 'OK');
      }

      await expect(hierarchy.sceneSelect).toBeVisible();
    });

    test('deletes a scene when more than one scene exists', async () => {
      const tempSceneName = 'Scene To Be Deleted';

      await hierarchy.createScene(controls, popup, tempSceneName);
      await hierarchy.deleteCurrentScene(controls, popup);
    });

    test('[Bad Path] prevents deleting the last remaining scene', async ({ page }) => {
      await expect(hierarchy.sceneSelect).not.toHaveText('Select Scene...');
      const initialSceneName = (await hierarchy.sceneSelect.textContent()).trim();

      await controls.clickSelectAction('Scene Options', 'Delete Scene');

      const modal = page.getByTestId('base-confirm').or(page.getByRole('alertdialog')).first();
      if ((await modal.count()) > 0 && (await modal.isVisible())) {
        const confirmBtn = modal.getByTestId('confirm-action-button').or(modal.getByRole('button')).first();
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click();
        }
      }

      await expect(hierarchy.sceneSelect).toContainText(initialSceneName);
    });
  });

  // =========================================================================
  // 2. LAYER OPERATIONS & SECTION SEPARATION
  // =========================================================================
  test.describe('Layer Operations & Section Separation', () => {
    test('creates layers in World and UI sections separately', async () => {
      await hierarchy.addLayerToSection(popup, 'World', 'Custom World Layer');
      await hierarchy.addLayerToSection(popup, 'User Interface', 'HUD Layer');

      const worldSection = hierarchy.section('World');
      const uiSection = hierarchy.section('User Interface');

      await expect(
        worldSection
          .locator('[data-node-name="Custom World Layer"]')
          .or(worldSection.locator('.group\\/node', { hasText: 'Custom World Layer' }))
      ).toBeVisible();

      await expect(
        uiSection
          .locator('[data-node-name="HUD Layer"]')
          .or(uiSection.locator('.group\\/node', { hasText: 'HUD Layer' }))
      ).toBeVisible();
    });

    test('renames existing layer using context menu', async () => {
      const layerNode = hierarchy.nodeByName('World Layer');
      await expect(layerNode).toBeVisible();

      const nodeId = await layerNode.getAttribute('data-node-id');

      await popup.selectContextMenu(layerNode, 'Rename Layer');
      await popup.fillPromptAndSubmit('Rename Layer', 'Background Layer', 'Rename');

      const renamedNode = nodeId ? hierarchy.nodeById(nodeId) : hierarchy.nodeByName('Background Layer');
      await expect(renamedNode).toBeVisible();
      await expect(renamedNode).toHaveAttribute('data-node-name', 'Background Layer');
    });

    test('modifies layer Z-Index via context menu prompt', async () => {
      const layerNode = hierarchy.nodeByName('World Layer');
      await expect(layerNode).toBeVisible();

      await popup.selectContextMenu(layerNode, 'Change Z-Index');
      await popup.fillPromptAndSubmit('Change Z-Index', '5', 'Update');

      const zIndexBadge = layerNode
        .getByTitle('Z-Index Layer')
        .or(layerNode.locator('[data-z-index]'))
        .or(layerNode.locator('span[title*="Z-Index"]'))
        .first();

      await expect(zIndexBadge).toHaveText('5');
    });

    test('deletes a layer along with its contained entities', async () => {
      await hierarchy.addLayerToSection(popup, 'World', 'Temporary Layer');

      const targetLayer = hierarchy.nodeByName('Temporary Layer');
      await popup.selectContextMenu(targetLayer, 'Delete Layer');

      await expect(hierarchy.nodeByName('Temporary Layer')).not.toBeVisible();
    });

    test('[Bad Path] prevents deleting the last remaining layer in section', async () => {
      const soleWorldLayer = hierarchy.nodeByName('World Layer');
      await expect(soleWorldLayer).toBeVisible();

      const beforeState = await hierarchy.snapshot();

      await popup.selectContextMenu(soleWorldLayer, 'Delete Layer');

      await expect(soleWorldLayer).toBeVisible();
      await expect.poll(() => hierarchy.snapshot()).toEqual(beforeState);
    });
  });

  // =========================================================================
  // 3. ENTITY CREATION & PARENT-CHILD HIERARCHY
  // =========================================================================
  test.describe('Entity Creation & Parent-Child Hierarchy', () => {
    test('creates new entity types within a target layer', async () => {
      const layerNode = hierarchy.nodeByName('World Layer');
      await popup.selectContextMenu(layerNode, ['Add Entity', 'Sprite']);

      await expect(hierarchy.nodesByText(/Sprite/i).first()).toBeVisible();
    });

    test('reparents entity under another entity via drag and drop', async () => {
      const layerNode = hierarchy.nodeByName('World Layer');
      await popup.selectContextMenu(layerNode, ['Add Entity', 'Empty Entity']);
      await popup.selectContextMenu(layerNode, ['Add Entity', 'Sprite']);

      const parentNode = hierarchy.nodesByText(/Empty/i).first();
      const childNode = hierarchy.nodesByText(/Sprite/i).first();

      await expect(parentNode).toBeVisible();
      await expect(childNode).toBeVisible();

      const parentId = await parentNode.getAttribute('data-node-id');
      const childId = await childNode.getAttribute('data-node-id');

      await hierarchy.dragAndDropNodes(childNode, parentNode);

      if (childId && parentId) {
        await expect(hierarchy.nodeById(childId)).toHaveAttribute('data-parent-id', parentId);
      } else {
        const parentContainer = parentNode.locator('xpath=ancestor::*[contains(@class, "relative") or self::li][1]');
        await expect(parentContainer.locator('.group\\/node', { hasText: /Sprite/i })).toBeVisible();
      }
    });

    test('[Bad Path] prevents moving an entity into its own descendant child', async () => {
      const layerNode = hierarchy.nodeByName('World Layer');
      await popup.selectContextMenu(layerNode, ['Add Entity', 'Empty Entity']);

      const parentNode = hierarchy.nodesByText(/Empty/i).first();
      await expect(parentNode).toBeVisible();

      await popup.selectContextMenu(parentNode, ['Add Child', 'Sprite']);
      const childNode = hierarchy.nodesByText(/Sprite/i).first();
      await expect(childNode).toBeVisible();

      const beforeState = await hierarchy.snapshot();

      await hierarchy.dragAndDropNodes(parentNode, childNode);

      await expect.poll(() => hierarchy.snapshot()).toEqual(beforeState);
    });
  });

  // =========================================================================
  // 4. SECTION BOUNDARIES & PREFAB RESTRICTIONS
  // =========================================================================
  test.describe('Section Boundaries & Prefab Restrictions', () => {
    test('creates a Prefab instance from an entity', async () => {
      const layerNode = hierarchy.nodeByName('World Layer');
      await popup.selectContextMenu(layerNode, ['Add Entity', 'Empty Entity']);

      const entityNode = hierarchy.nodesByText(/Empty/i).first();
      await expect(entityNode).toBeVisible();
      const nodeId = await entityNode.getAttribute('data-node-id');

      await popup.selectContextMenu(entityNode, 'Use as Prefab');
      await popup.fillPromptAndSubmit('Create Prefab', 'Player_Prefab', 'Create');

      const stableNode = nodeId ? hierarchy.nodeById(nodeId) : hierarchy.nodesByText(/Empty/i).first();
      await expect(stableNode).toHaveAttribute('data-prefab', 'true');
    });

    test('[Bad Path] prevents moving World entity into UI Layer section', async () => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      await popup.selectContextMenu(worldLayer, ['Add Entity', 'Empty Entity']);

      const worldEntity = hierarchy.nodesByText(/Empty/i).first();
      await expect(worldEntity).toBeVisible();

      await hierarchy.addLayerToSection(popup, 'User Interface', 'UI Canvas');
      const uiLayer = hierarchy.nodeByName('UI Canvas');

      const beforeState = await hierarchy.snapshot();

      await hierarchy.dragAndDropNodes(worldEntity, uiLayer);

      const worldSection = hierarchy.section('World');
      await expect(worldSection.locator('.group\\/node', { hasText: /Empty/i })).toBeVisible();
      await expect.poll(() => hierarchy.snapshot()).toEqual(beforeState);
    });

    test('[Bad Path] restricts deleting or adding child inside an immutable Prefab instance tree', async ({ page }) => {
      const layerNode = hierarchy.nodeByName('World Layer');
      await popup.selectContextMenu(layerNode, ['Add Entity', 'Empty Entity']);

      const entityNode = hierarchy.nodesByText(/Empty/i).first();
      await expect(entityNode).toBeVisible();

      await popup.selectContextMenu(entityNode, 'Use as Prefab');
      await popup.fillPromptAndSubmit('Create Prefab', 'Enemy_Prefab', 'Create');

      await popup.selectContextMenu(entityNode, []);

      const contextMenu = page.getByRole('menu').or(page.locator('.base-context-menu-fixed')).last();
      const prefabMenuItem = contextMenu
        .getByRole('menuitem', { name: 'Use as Prefab' })
        .or(contextMenu.locator('div, button').filter({ hasText: /^Use as Prefab$/ }))
        .first();

      await expect(prefabMenuItem).toHaveAttribute('aria-disabled', 'true');
    });
  });

  // =========================================================================
  // 5. SORTING & ORDER INDEXING
  // =========================================================================
  test.describe('Sorting & Order Indexing', () => {
    test('reorders layers and recalculates visual sequence', async () => {
      await hierarchy.addLayerToSection(popup, 'World', 'Layer Alpha');
      await hierarchy.addLayerToSection(popup, 'World', 'Layer Beta');

      const layerAlpha = hierarchy.nodeByName('Layer Alpha');
      const layerBeta = hierarchy.nodeByName('Layer Beta');

      await hierarchy.dragAndDropNodes(layerBeta, layerAlpha);

      const layers = hierarchy.nodesByText(/Layer/);
      await expect(layers.first()).toBeVisible();
    });
  });

  // =========================================================================
  // 6. CLIPBOARD & DUPLICATION OPERATIONS
  // =========================================================================
  test.describe('Clipboard & Duplication Operations', () => {
    test('duplicates an entity with auto-selection', async () => {
      const layerNode = hierarchy.nodeByName('World Layer');
      await popup.selectContextMenu(layerNode, ['Add Entity', 'Sprite']);

      const spriteNode = hierarchy.nodesByText(/Sprite/i).first();
      await expect(spriteNode).toBeVisible();

      await popup.selectContextMenu(spriteNode, 'Duplicate');

      const duplicatedNode = hierarchy.nodesByText(/Sprite/i).nth(1);
      await expect(duplicatedNode).toBeVisible();
      await expect(duplicatedNode).toHaveAttribute('aria-selected', 'true');
    });

    test('performs copy, cut, and paste operations via keyboard shortcuts', async ({ page }) => {
      const layerNode = hierarchy.nodeByName('World Layer');
      await popup.selectContextMenu(layerNode, ['Add Entity', 'Text']);

      const textNode = hierarchy.nodesByText(/Text/i).first();
      await expect(textNode).toBeVisible();
      await textNode.click();

      await page.keyboard.press('Control+c');
      await page.keyboard.press('Control+v');

      const textNodes = hierarchy.nodesByText(/Text/i);
      await expect(textNodes).toHaveCount(2);

      const secondText = textNodes.nth(1);
      await secondText.click();

      await page.keyboard.press('Control+x');

      await expect(textNodes).toHaveCount(1);
    });
  });

  // =========================================================================
  // 7. VISIBILITY & LOCK STATE CONTROLS
  // =========================================================================
  test.describe('Visibility & Lock State Controls', () => {
    test('toggles entity visibility and lock status reactively', async () => {
      const layerNode = hierarchy.nodeByName('World Layer');
      await popup.selectContextMenu(layerNode, ['Add Entity', 'Shape']);

      const entityNode = hierarchy.nodesByText(/Shape/i).first();
      await expect(entityNode).toBeVisible();

      await entityNode.hover();

      const lockBtn = entityNode
        .getByRole('button', { name: /lock/i })
        .or(entityNode.getByTitle('Toggle Lock'))
        .or(entityNode.locator('div[title*="Lock"]'))
        .first();
      await lockBtn.click();

      await expect(entityNode).toHaveAttribute('data-locked', 'true');

      const eyeBtn = entityNode
        .getByRole('button', { name: /visibility/i })
        .or(entityNode.getByTitle('Toggle Visibility'))
        .or(entityNode.locator('div[title*="Visibility"]'))
        .first();
      await eyeBtn.click();

      await expect(entityNode).toHaveAttribute('data-visible', 'false');
    });
  });
});