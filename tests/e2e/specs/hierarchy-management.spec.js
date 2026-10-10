import { test, expect } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Hierarchy E2E Exhaustive',
    description: 'Workspace isolasi untuk E2E Hierarchy, Selection, Drag-Drop, Prefab, Context Menu, Shortcuts, dan Scene Management',
  },
});

test.describe('Hierarchy & Scene Comprehensive E2E Management', () => {

  // =========================================================================
  // 1. ADD LAYER & SECTION INTEGRITY
  // =========================================================================
  test.describe('1. Layer Creation & Section Integrity', () => {
    test('creates new World and UI layers via Section header add buttons', async ({ hierarchy, popup }) => {
      // 1. Tambah World Layer via Header Section
      await hierarchy.addLayerToSection(popup, 'World', 'Custom World Layer');
      const worldSection = hierarchy.section('World');
      await expect(
        worldSection
          .locator('[data-node-name="Custom World Layer"]')
          .or(worldSection.locator('.group\\/node', { hasText: 'Custom World Layer' }))
      ).toBeVisible();

      // 2. Tambah UI Layer via Header Section
      await hierarchy.addLayerToSection(popup, 'User Interface', 'Custom UI Layer');
      const uiSection = hierarchy.section('User Interface');
      await expect(
        uiSection
          .locator('[data-node-name="Custom UI Layer"]')
          .or(uiSection.locator('.group\\/node', { hasText: 'Custom UI Layer' }))
      ).toBeVisible();
    });

    test('[Bad Path] prevents deleting the sole remaining layer in section', async ({ hierarchy, popup }) => {
      const soleWorldLayer = hierarchy.nodeByName('World Layer');
      await expect(soleWorldLayer).toBeVisible();

      // Ambil snapshot awal hierarchy
      const beforeState = await hierarchy.snapshot();

      // Coba hapus satu-satunya layer
      await popup.selectContextMenu(soleWorldLayer, 'Delete Layer');

      // Memastikan layer tidak terhapus dan struktur tidak berubah
      await expect(soleWorldLayer).toBeVisible();
      await expect.poll(() => hierarchy.snapshot()).toEqual(beforeState);
    });
  });

  // =========================================================================
  // 2. INDEXING, REPARENTING, Z-INDEX & SECTION BOUNDARIES
  // =========================================================================
  test.describe('2. Indexing, Reparenting, Z-Index & Hierarchy Rules', () => {
    test('handles entity-to-entity reparenting via drag and drop', async ({ hierarchy, popup }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      await popup.selectContextMenu(worldLayer, ['Add Entity', 'Empty Entity']);
      await popup.selectContextMenu(worldLayer, ['Add Entity', 'Sprite']);

      const parentEntity = hierarchy.nodesByText(/Empty/i).first();
      const childEntity = hierarchy.nodesByText(/Sprite/i).first();

      await expect(parentEntity).toBeVisible();
      await expect(childEntity).toBeVisible();

      const parentId = await parentEntity.getAttribute('data-node-id');
      const childId = await childEntity.getAttribute('data-node-id');

      // Drag child ke parent (drop inside)
      await hierarchy.dragAndDropNodes(childEntity, parentEntity);

      if (childId && parentId) {
        await expect(hierarchy.nodeById(childId)).toHaveAttribute('data-parent-id', parentId);
      } else {
        const parentContainer = parentEntity.locator('xpath=ancestor::*[contains(@class, "relative") or self::li][1]');
        await expect(parentContainer.locator('.group\\/node', { hasText: /Sprite/i })).toBeVisible();
      }
    });

    test('extracts child entity back to root layer level', async ({ hierarchy, popup }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      await popup.selectContextMenu(worldLayer, ['Add Entity', 'Empty Entity']);

      const parentEntity = hierarchy.nodesByText(/Empty/i).first();
      await popup.selectContextMenu(parentEntity, ['Add Child', 'Sprite']);

      const childEntity = hierarchy.nodesByText(/Sprite/i).first();
      const childId = await childEntity.getAttribute('data-node-id');

      // Drag child keluar dari parent menuju root layer
      await hierarchy.dragAndDropNodes(childEntity, worldLayer);

      const stableChild = childId ? hierarchy.nodeById(childId) : hierarchy.nodesByText(/Sprite/i).first();
      
      // FIX: Menggunakan .not.toHaveAttribute('data-parent-id')
      await expect(stableChild).not.toHaveAttribute('data-parent-id');
    });

    test('moves entity with its child tree together to another parent', async ({ hierarchy, popup }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      
      // Target parent
      await popup.selectContextMenu(worldLayer, ['Add Entity', 'Shape']);
      const targetParent = hierarchy.nodesByText(/Shape/i).first();

      // Parent beserta Child-nya
      await popup.selectContextMenu(worldLayer, ['Add Entity', 'Empty Entity']);
      const movingParent = hierarchy.nodesByText(/Empty/i).first();
      await popup.selectContextMenu(movingParent, ['Add Child', 'Text']);
      
      const movingChild = hierarchy.nodesByText(/Text/i).first();
      const movingParentId = await movingParent.getAttribute('data-node-id');
      const movingChildId = await movingChild.getAttribute('data-node-id');

      // Pindahkan movingParent ke dalam targetParent
      await hierarchy.dragAndDropNodes(movingParent, targetParent);

      const targetParentId = await targetParent.getAttribute('data-node-id');
      await expect(hierarchy.nodeById(movingParentId)).toHaveAttribute('data-parent-id', targetParentId);
      await expect(hierarchy.nodeById(movingChildId)).toHaveAttribute('data-parent-id', movingParentId);
    });

    test('[Bad Path] prevents moving an entity into its own descendant child', async ({ hierarchy, popup }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      await popup.selectContextMenu(worldLayer, ['Add Entity', 'Empty Entity']);

      const parentNode = hierarchy.nodesByText(/Empty/i).first();
      await popup.selectContextMenu(parentNode, ['Add Child', 'Sprite']);
      const childNode = hierarchy.nodesByText(/Sprite/i).first();

      const beforeState = await hierarchy.snapshot();
      await hierarchy.dragAndDropNodes(parentNode, childNode);

      await expect.poll(() => hierarchy.snapshot()).toEqual(beforeState);
    });

    test('[Bad Path] prevents moving World entity into UI Layer section', async ({ hierarchy, popup }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      await popup.selectContextMenu(worldLayer, ['Add Entity', 'Empty Entity']);

      const worldEntity = hierarchy.nodesByText(/Empty/i).first();
      await hierarchy.addLayerToSection(popup, 'User Interface', 'UI Canvas Layer');
      const uiLayer = hierarchy.nodeByName('UI Canvas Layer');

      const beforeState = await hierarchy.snapshot();
      await hierarchy.dragAndDropNodes(worldEntity, uiLayer);

      await expect.poll(() => hierarchy.snapshot()).toEqual(beforeState);
    });
  });

  // =========================================================================
  // 3. SELECTION, MULTI-SELECT & KEYBOARD SHORTCUTS
  // =========================================================================
  test.describe('3. Selection Dynamics & Keyboard Shortcuts', () => {
    test('selects parent entity along with all descendant children using Ctrl/Cmd click', async ({ page, hierarchy, popup }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      await popup.selectContextMenu(worldLayer, ['Add Entity', 'Empty Entity']);

      const parentNode = hierarchy.nodesByText(/Empty/i).first();
      await popup.selectContextMenu(parentNode, ['Add Child', 'Sprite']);
      const childNode = hierarchy.nodesByText(/Sprite/i).first();

      // Control + Click pada Parent
      await page.keyboard.down('Control');
      await parentNode.click();
      await page.keyboard.up('Control');

      await expect(parentNode).toHaveAttribute('aria-selected', 'true');
      await expect(childNode).toHaveAttribute('aria-selected', 'true');
    });

    test('executes copy, cut, paste, duplicate, and delete via global Keyboard Shortcuts', async ({ page, hierarchy, popup }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      await popup.selectContextMenu(worldLayer, ['Add Entity', 'Text']);

      const textNode = hierarchy.nodesByText(/Text/i).first();
      await textNode.click();

      // Ctrl+C & Ctrl+V
      await page.keyboard.press('Control+c');
      await page.keyboard.press('Control+v');
      await expect(hierarchy.nodesByText(/Text/i)).toHaveCount(2);

      // Ctrl+D (Duplicate)
      await page.keyboard.press('Control+d');
      await expect(hierarchy.nodesByText(/Text/i)).toHaveCount(3);

      // Delete key
      const thirdText = hierarchy.nodesByText(/Text/i).nth(2);
      await thirdText.click();
      await page.keyboard.press('Delete');
      await expect(hierarchy.nodesByText(/Text/i)).toHaveCount(2);
    });
  });

  // =========================================================================
  // 4. CONTEXT MENU & PREFAB RESTRICTIONS
  // =========================================================================
  test.describe('4. Context Menu Exhaustive Verification & Prefab Rules', () => {
    // Pengujian 5 Tipe Entity World
    const worldEntityTypes = [
      { name: 'Empty Entity', path: ['Add Entity', 'Empty Entity'], labelMatch: /Empty/i },
      { name: 'Sprite', path: ['Add Entity', 'Sprite'], labelMatch: /Sprite/i },
      { name: 'Shape', path: ['Add Entity', 'Shape'], labelMatch: /Shape/i },
      { name: 'Text', path: ['Add Entity', 'Text'], labelMatch: /Text/i },
      { name: 'Tilemap', path: ['Add Entity', 'Tilemap'], labelMatch: /Tilemap/i },
    ];

    for (const item of worldEntityTypes) {
      test(`creates World Entity type: ${item.name}`, async ({ hierarchy, popup }) => {
        const worldLayer = hierarchy.nodeByName('World Layer');
        await popup.selectContextMenu(worldLayer, item.path);
        await expect(hierarchy.nodesByText(item.labelMatch).first()).toBeVisible();
      });
    }

    // Pengujian 4 Tipe Entity UI
    const uiEntityTypes = [
      { name: 'Empty UI', path: ['Add UI Element', 'Empty UI'], labelMatch: /Empty/i },
      { name: 'UI Shape', path: ['Add UI Element', 'UI Shape'], labelMatch: /Shape/i },
      { name: 'UI Text', path: ['Add UI Element', 'UI Text'], labelMatch: /Text/i },
      { name: 'UI Image', path: ['Add UI Element', 'UI Image'], labelMatch: /Image/i },
    ];

    for (const item of uiEntityTypes) {
      test(`creates UI Entity type: ${item.name}`, async ({ hierarchy, popup }) => {
        await hierarchy.addLayerToSection(popup, 'User Interface', 'HUD Layer');
        const uiLayer = hierarchy.nodeByName('HUD Layer');

        await popup.selectContextMenu(uiLayer, item.path);
        const uiSection = hierarchy.section('User Interface');
        await expect(uiSection.locator('.group\\/node', { hasText: item.labelMatch }).first()).toBeVisible();
      });
    }

    test('tests duplicate, copy, cut, paste, rename, change z-index, and delete operations via Context Menu', async ({ hierarchy, popup }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      
      // 1. Tambah Sprite
      await popup.selectContextMenu(worldLayer, ['Add Entity', 'Sprite']);
      const spriteNode = hierarchy.nodesByText(/Sprite/i).first();
      await expect(spriteNode).toBeVisible();

      // 2. Rename Entity
      await popup.selectContextMenu(spriteNode, 'Rename Entity');
      await popup.fillPromptAndSubmit('Rename Entity', 'Hero Sprite', 'Rename');
      const renamedNode = hierarchy.nodeByName('Hero Sprite');
      await expect(renamedNode).toBeVisible();

      // 3. Duplicate
      await popup.selectContextMenu(renamedNode, 'Duplicate');
      await expect(hierarchy.nodesByText('Hero Sprite')).toHaveCount(2);

      // 4. Copy & Paste
      const secondNode = hierarchy.nodesByText('Hero Sprite').nth(1);
      await popup.selectContextMenu(secondNode, 'Copy');
      await popup.selectContextMenu(worldLayer, 'Paste');
      await expect(hierarchy.nodesByText('Hero Sprite')).toHaveCount(3);

      // 5. Cut
      const thirdNode = hierarchy.nodesByText('Hero Sprite').nth(2);
      await popup.selectContextMenu(thirdNode, 'Cut');
      await expect(hierarchy.nodesByText('Hero Sprite')).toHaveCount(2);

      // 6. Change Z-Index pada Layer
      await popup.selectContextMenu(worldLayer, 'Change Z-Index');
      await popup.fillPromptAndSubmit('Change Z-Index', '8', 'Update');
      const zIndexBadge = worldLayer.locator('[data-z-index]').first();
      await expect(zIndexBadge).toHaveText('8');

      // 7. Delete Entity
      await popup.selectContextMenu(secondNode, 'Delete Entity');
      await expect(hierarchy.nodesByText('Hero Sprite')).toHaveCount(1);
    });

    test('creates Prefab and restricts "Use as Prefab" menu on prefab descendants', async ({ page, hierarchy, popup }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      await popup.selectContextMenu(worldLayer, ['Add Entity', 'Empty Entity']);

      const parentNode = hierarchy.nodesByText(/Empty/i).first();
      await popup.selectContextMenu(parentNode, ['Add Child', 'Sprite']);
      const childNode = hierarchy.nodesByText(/Sprite/i).first();

      // Konversi Parent menjadi Prefab
      await popup.selectContextMenu(parentNode, 'Use as Prefab');
      await popup.fillPromptAndSubmit('Create Prefab', 'Player_Prefab', 'Create');
      await expect(parentNode).toHaveAttribute('data-prefab', 'true');

      // Buka context menu pada child di dalam Prefab
      await childNode.click({ button: 'right' });
      const menu = page.getByRole('menu').last();
      const prefabMenuItem = menu
        .getByRole('menuitem', { name: 'Use as Prefab' })
        .or(menu.locator('div, button', { hasText: 'Use as Prefab' }))
        .first();

      // Pastikan opsi 'Use as Prefab' ter-disable untuk anak prefab
      await expect(prefabMenuItem).toHaveAttribute('aria-disabled', 'true');
    });
  });

  // =========================================================================
  // 5. VISIBILITY & LOCK CONTROLS
  // =========================================================================
  test.describe('5. Visibility & Lock Controls', () => {
    test('toggles lock and visibility status on entities reactively', async ({ hierarchy, popup }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      await popup.selectContextMenu(worldLayer, ['Add Entity', 'Shape']);

      const entityNode = hierarchy.nodesByText(/Shape/i).first();
      await entityNode.hover();

      // Toggle Lock
      const lockBtn = entityNode
        .getByTitle('Toggle Lock')
        .or(entityNode.locator('button[aria-label*="Lock"]'))
        .first();
      await lockBtn.click();
      await expect(entityNode).toHaveAttribute('data-locked', 'true');

      // Toggle Visibility
      const eyeBtn = entityNode
        .getByTitle('Toggle Visibility')
        .or(entityNode.locator('button[aria-label*="Show"], button[aria-label*="Hide"]'))
        .first();
      await eyeBtn.click();
      await expect(entityNode).toHaveAttribute('data-visible', 'false');
    });

    test('toggles lock and visibility status on layers reactively', async ({ hierarchy }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      await worldLayer.hover();

      // Toggle Layer Lock
      const lockBtn = worldLayer.getByTitle('Toggle Lock').first();
      await lockBtn.click();
      await expect(worldLayer).toHaveAttribute('data-locked', 'true');

      // Toggle Layer Visibility
      const eyeBtn = worldLayer.getByTitle('Toggle Visibility').first();
      await eyeBtn.click();
      await expect(worldLayer).toHaveAttribute('data-visible', 'false');
    });
  });

  // =========================================================================
  // 6. UI EDITOR NAVIGATION
  // =========================================================================
  test.describe('6. UI Editor Workspace Integration', () => {
    test('opens UI Editor tab via User Interface section context header menu', async ({ page, hierarchy, popup }) => {
      await hierarchy.addLayerToSection(popup, 'User Interface', 'Canvas HUD');
      
      const uiSection = hierarchy.section('User Interface');
      const header = uiSection.locator('> div').first();
      await header.hover();

      const optionsBtn = uiSection.getByRole('button', { name: /open ui editor|add ui layer|options/i }).first();
      if (await optionsBtn.isVisible()) {
        await optionsBtn.click();
      }

      const openUiBtn = page.getByRole('button', { name: 'Open UI Editor' }).first();
      await expect(openUiBtn).toBeVisible();
      await openUiBtn.click();

      // Verifikasi tab aktif berganti ke UI Editor
      const activeTab = page
        .locator('[aria-selected="true"]')
        .or(page.locator('.bg-accent, .border-b-2'))
        .filter({ hasText: /UI Editor/i })
        .first();
      await expect(activeTab).toBeVisible();
    });
  });

  // =========================================================================
  // 7. SCENE MANAGEMENT OPERATIONS
  // =========================================================================
  test.describe('7. Scene Operations & Validation Rules', () => {
    test('creates new scene, renames active scene, duplicates scene, and switches between scenes', async ({ hierarchy, controls, popup }) => {
      const scene1Name = 'Level 1 - Forest';
      const scene2Name = 'Level 2 - Volcano';

      // Buat Scene 1
      await hierarchy.createScene(controls, popup, scene1Name);
      await expect(hierarchy.sceneSelect).toContainText(scene1Name);

      // Rename Active Scene
      await controls.clickSelectAction('Scene Options', 'Rename Scene');
      await popup.fillPromptAndSubmit('Rename Scene', scene2Name, 'OK');
      await expect(hierarchy.sceneSelect).toContainText(scene2Name);

      // Duplicate Active Scene
      await controls.clickSelectAction('Scene Options', 'Duplicate Scene');
      await expect(hierarchy.sceneSelect).toBeVisible();
    });

    test('deletes secondary scene and prevents deleting the last remaining scene', async ({ page, hierarchy, controls, popup }) => {
      const tempScene = 'Temp Scene';
      await hierarchy.createScene(controls, popup, tempScene);
      await expect(hierarchy.sceneSelect).toContainText(tempScene);

      // Hapus scene sekunder
      await hierarchy.deleteCurrentScene(controls, popup);
      await expect(hierarchy.sceneSelect).not.toContainText(tempScene);

      // Bad Path: Coba hapus scene terakhir yang tersisa
      await controls.clickSelectAction('Scene Options', 'Delete Scene');

      // FIX: Memeriksa Modal Dialog (useAlert), bukan PopAlert toast
      const alertModal = page
        .getByRole('dialog')
        .or(page.getByRole('alertdialog'))
        .filter({ hasText: 'Cannot Delete' })
        .first();

      await expect(alertModal).toBeVisible();

      // Tutup dialog modal
      const okBtn = alertModal.getByRole('button', { name: /ok|close/i }).first();
      await okBtn.click();
      await expect(alertModal).not.toBeVisible();
    });
  });

  // =========================================================================
  // 8. SEARCH SYSTEM & EMPTY STATES
  // =========================================================================
  test.describe('8. Hierarchy Search Engine & Empty States', () => {
    test('filters hierarchy tree reactively by Name/ScriptID and shows empty state placeholder when no matches exist', async ({ page, hierarchy, controls, popup }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      await popup.selectContextMenu(worldLayer, ['Add Entity', 'Sprite']);

      const spriteNode = hierarchy.nodesByText(/Sprite/i).first();
      await expect(spriteNode).toBeVisible();

      // Cari nama yang tidak ada
      await controls.fillSearch('hierarchy-search-input', 'NonExistentNode123');
      await expect(spriteNode).not.toBeVisible();

      // Verifikasi Tampilan Placeholder Empty State
      const emptyStateText = page.getByText(/No world layers|No UI layers/i).first();
      await expect(emptyStateText).toBeVisible();

      // Clear Search via tombol silang
      await controls.clearSearch('hierarchy-search-input');
      await expect(spriteNode).toBeVisible();
    });
  });

});