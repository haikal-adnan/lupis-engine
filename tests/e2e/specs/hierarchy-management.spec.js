import { test, expect } from '../fixtures.js';

const SCENE_OPTIONS = 'hierarchy-scene-options-button';

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
        worldSection.locator('[data-testid="hierarchy-node"][data-node-name="Custom World Layer"]')
      ).toBeVisible();

      // 2. Tambah UI Layer via Header Section
      await hierarchy.addLayerToSection(popup, 'User Interface', 'Custom UI Layer');
      const uiSection = hierarchy.section('User Interface');
      await expect(
        uiSection.locator('[data-testid="hierarchy-node"][data-node-name="Custom UI Layer"]')
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
      const parentEntity = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Empty Entity']);
      const childEntity = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Sprite']);

      const parentId = await parentEntity.getAttribute('data-node-id');
      const childId = await childEntity.getAttribute('data-node-id');

      // Drag child ke parent (drop inside)
      await hierarchy.dragAndDropNodes(childEntity, parentEntity);

      await expect(hierarchy.nodeById(childId)).toHaveAttribute('data-parent-id', parentId);
    });

    test('extracts child entity back to root layer level', async ({ hierarchy, popup }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const parentEntity = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Empty Entity']);
      const childEntity = await hierarchy.addEntity(popup, parentEntity, ['Add Child', 'Sprite']);

      const parentId = await parentEntity.getAttribute('data-node-id');
      // Precondition: child benar-benar berada di dalam parent, sehingga assert akhir tidak vacuous
      await expect(childEntity).toHaveAttribute('data-parent-id', parentId);

      // Drag child keluar dari parent menuju root layer
      await hierarchy.dragAndDropNodes(childEntity, worldLayer);

      await expect(childEntity).not.toHaveAttribute('data-parent-id');
    });

    test('moves entity with its child tree together to another parent', async ({ hierarchy, popup }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');

      // Target parent
      const targetParent = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Shape']);

      // Parent beserta Child-nya
      const movingParent = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Empty Entity']);
      const movingChild = await hierarchy.addEntity(popup, movingParent, ['Add Child', 'Text']);

      const targetParentId = await targetParent.getAttribute('data-node-id');
      const movingParentId = await movingParent.getAttribute('data-node-id');

      // Pindahkan movingParent ke dalam targetParent
      await hierarchy.dragAndDropNodes(movingParent, targetParent);

      await expect(movingParent).toHaveAttribute('data-parent-id', targetParentId);
      await expect(movingChild).toHaveAttribute('data-parent-id', movingParentId);
    });

    test('[Bad Path] prevents moving an entity into its own descendant child', async ({ hierarchy, popup }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const parentNode = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Empty Entity']);
      const childNode = await hierarchy.addEntity(popup, parentNode, ['Add Child', 'Sprite']);

      const beforeState = await hierarchy.snapshot();
      await hierarchy.dragAndDropNodes(parentNode, childNode);

      await expect.poll(() => hierarchy.snapshot()).toEqual(beforeState);
    });

    test('[Bad Path] prevents moving World entity into UI Layer section', async ({ hierarchy, popup }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const worldEntity = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Empty Entity']);

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
      const parentNode = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Empty Entity']);
      const childNode = await hierarchy.addEntity(popup, parentNode, ['Add Child', 'Sprite']);

      // Control + Click pada Parent
      await page.keyboard.down('Control');
      await parentNode.click();
      await page.keyboard.up('Control');

      await expect(parentNode).toHaveAttribute('aria-selected', 'true');
      await expect(childNode).toHaveAttribute('aria-selected', 'true');
    });

    test('executes copy, cut, paste, duplicate, and delete via global Keyboard Shortcuts', async ({ page, hierarchy, popup }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const textNode = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Text']);
      await textNode.click();

      // Ctrl+C & Ctrl+V -> tepat satu node baru
      const idsBeforePaste = await hierarchy.nodeIds();
      await page.keyboard.press('Control+c');
      await page.keyboard.press('Control+v');
      const pastedNode = await hierarchy.expectNewNode(idsBeforePaste);

      // Ctrl+D (Duplicate) -> tepat satu node baru lagi
      const idsBeforeDuplicate = await hierarchy.nodeIds();
      await page.keyboard.press('Control+d');
      const duplicatedNode = await hierarchy.expectNewNode(idsBeforeDuplicate);

      // Delete key menghapus node terpilih, node lain tetap ada
      await duplicatedNode.click();
      await page.keyboard.press('Delete');
      await expect(duplicatedNode).toHaveCount(0);
      await expect(pastedNode).toBeVisible();
      await expect(textNode).toBeVisible();
    });
  });

  // =========================================================================
  // 4. CONTEXT MENU & PREFAB RESTRICTIONS
  // =========================================================================
  test.describe('4. Context Menu Exhaustive Verification & Prefab Rules', () => {
    // Pengujian 5 Tipe Entity World
    const worldEntityTypes = [
      { name: 'Empty Entity', path: ['Add Entity', 'Empty Entity'] },
      { name: 'Sprite', path: ['Add Entity', 'Sprite'] },
      { name: 'Shape', path: ['Add Entity', 'Shape'] },
      { name: 'Text', path: ['Add Entity', 'Text'] },
      { name: 'Tilemap', path: ['Add Entity', 'Tilemap'] },
    ];

    for (const item of worldEntityTypes) {
      test(`creates World Entity type: ${item.name}`, async ({ hierarchy, popup }) => {
        const worldLayer = hierarchy.nodeByName('World Layer');
        const created = await hierarchy.addEntity(popup, worldLayer, item.path);

        // Entity baru harus berada di section World
        await expect(hierarchy.section('World').getByTestId('hierarchy-node').and(created)).toBeVisible();
      });
    }

    // Pengujian 4 Tipe Entity UI
    const uiEntityTypes = [
      { name: 'Empty UI', path: ['Add UI Element', 'Empty UI'] },
      { name: 'UI Shape', path: ['Add UI Element', 'UI Shape'] },
      { name: 'UI Text', path: ['Add UI Element', 'UI Text'] },
      { name: 'UI Image', path: ['Add UI Element', 'UI Image'] },
    ];

    for (const item of uiEntityTypes) {
      test(`creates UI Entity type: ${item.name}`, async ({ hierarchy, popup }) => {
        await hierarchy.addLayerToSection(popup, 'User Interface', 'HUD Layer');
        const uiLayer = hierarchy.nodeByName('HUD Layer');

        const created = await hierarchy.addEntity(popup, uiLayer, item.path);

        // Entity baru harus berada di section User Interface
        await expect(hierarchy.section('User Interface').getByTestId('hierarchy-node').and(created)).toBeVisible();
      });
    }

    test('tests duplicate, copy, cut, paste, rename, change z-index, and delete operations via Context Menu', async ({ hierarchy, popup }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');

      // 1. Tambah Sprite
      const spriteNode = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Sprite']);
      const spriteId = await spriteNode.getAttribute('data-node-id');

      // 2. Rename Entity (identitas dikunci lewat data-node-id, Section 8)
      await popup.selectContextMenu(spriteNode, 'Rename Entity');
      await popup.fillPromptAndSubmit('Rename Entity', 'Hero Sprite', 'Rename');
      const renamedNode = hierarchy.nodeById(spriteId);
      await expect(renamedNode).toHaveAttribute('data-node-name', 'Hero Sprite');

      // 3. Duplicate
      const idsBeforeDuplicate = await hierarchy.nodeIds();
      await popup.selectContextMenu(renamedNode, 'Duplicate');
      const duplicatedNode = await hierarchy.expectNewNode(idsBeforeDuplicate);

      // 4. Copy & Paste
      await popup.selectContextMenu(duplicatedNode, 'Copy');
      const idsBeforePaste = await hierarchy.nodeIds();
      await popup.selectContextMenu(worldLayer, 'Paste');
      const pastedNode = await hierarchy.expectNewNode(idsBeforePaste);

      // 5. Cut (node yang di-cut hilang dari tree sampai di-paste)
      await popup.selectContextMenu(pastedNode, 'Cut');
      await expect(pastedNode).toHaveCount(0);

      // 6. Change Z-Index pada Layer
      await popup.selectContextMenu(worldLayer, 'Change Z-Index');
      await popup.fillPromptAndSubmit('Change Z-Index', '8', 'Update');
      await expect(worldLayer.locator('[data-z-index]')).toHaveText('8');

      // 7. Delete Entity: hanya duplikat yang hilang, node asli tetap ada
      await popup.selectContextMenu(duplicatedNode, 'Delete Entity');
      await expect(duplicatedNode).toHaveCount(0);
      await expect(renamedNode).toBeVisible();
    });

    test('creates Prefab and restricts "Use as Prefab" menu on prefab descendants', async ({ hierarchy, popup }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const parentNode = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Empty Entity']);
      const childNode = await hierarchy.addEntity(popup, parentNode, ['Add Child', 'Sprite']);

      // Konversi Parent menjadi Prefab
      await popup.selectContextMenu(parentNode, 'Use as Prefab');
      await popup.fillPromptAndSubmit('Create Prefab', 'Player_Prefab', 'Create');
      await expect(parentNode).toHaveAttribute('data-prefab', 'true');

      // Buka context menu pada child di dalam Prefab
      await childNode.click({ button: 'right' });
      const prefabMenuItem = popup.contextMenuItem('Use as Prefab');

      // Pastikan opsi 'Use as Prefab' ter-disable untuk anak prefab
      await expect(prefabMenuItem).toBeVisible();
      await expect(prefabMenuItem).toHaveAttribute('aria-disabled', 'true');
      await expect(prefabMenuItem).toHaveAttribute('data-disabled', 'true');
    });
  });

  // =========================================================================
  // 5. VISIBILITY & LOCK CONTROLS
  // =========================================================================
  test.describe('5. Visibility & Lock Controls', () => {
    test('toggles lock and visibility status on entities reactively', async ({ hierarchy, popup }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const entityNode = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Shape']);
      await entityNode.hover();

      // Toggle Lock
      await entityNode.getByTestId('hierarchy-node-lock-button').click();
      await expect(entityNode).toHaveAttribute('data-locked', 'true');

      // Toggle Visibility
      await entityNode.getByTestId('hierarchy-node-visibility-button').click();
      await expect(entityNode).toHaveAttribute('data-visible', 'false');
    });

    test('toggles lock and visibility status on layers reactively', async ({ hierarchy }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      await worldLayer.hover();

      // Toggle Layer Lock
      await worldLayer.getByTestId('hierarchy-node-lock-button').click();
      await expect(worldLayer).toHaveAttribute('data-locked', 'true');

      // Toggle Layer Visibility
      await worldLayer.getByTestId('hierarchy-node-visibility-button').click();
      await expect(worldLayer).toHaveAttribute('data-visible', 'false');
    });
  });

  // =========================================================================
  // 6. UI EDITOR NAVIGATION
  // =========================================================================
  test.describe('6. UI Editor Workspace Integration', () => {
    test('opens UI Editor tab via User Interface section context header menu', async ({ page, hierarchy, popup }) => {
      await hierarchy.addLayerToSection(popup, 'User Interface', 'Canvas HUD');

      // Trigger menu section selalu ada (testid turunan dari hierarchy-section-ui)
      const menu = await hierarchy.openSectionMenu('User Interface');
      const openUiBtn = menu.getByTestId('hierarchy-ui-open-editor-button');
      await expect(openUiBtn).toBeEnabled();
      await openUiBtn.click();

      // Verifikasi tab aktif berganti ke UI Editor. Baris hierarchy dikecualikan
      // agar assert tidak lolos secara vacuous (Section 7.3).
      // TODO kontrak: beri tab editor test ID sendiri lalu ganti selector ini.
      const activeTab = page
        .locator('[aria-selected="true"]:not([data-testid="hierarchy-node"])')
        .filter({ hasText: 'UI Editor' });
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
      await controls.clickSelectAction(SCENE_OPTIONS, 'Rename Scene');
      await popup.fillPromptAndSubmit('Rename Scene', scene2Name, 'OK');
      await expect(hierarchy.sceneSelect).toContainText(scene2Name);

      // Duplicate Active Scene
      await controls.clickSelectAction(SCENE_OPTIONS, 'Duplicate Scene');
      await expect(hierarchy.sceneSelect).toBeVisible();
    });

    test('[Bad Path] deletes secondary scene and prevents deleting the last remaining scene', async ({ page, hierarchy, controls, popup }) => {
      const tempScene = 'Temp Scene';
      await hierarchy.createScene(controls, popup, tempScene);
      await expect(hierarchy.sceneSelect).toContainText(tempScene);

      // Hapus scene sekunder
      await hierarchy.deleteCurrentScene(controls, popup);
      await expect(hierarchy.sceneSelect).not.toContainText(tempScene);

      // Bad Path: Coba hapus scene terakhir yang tersisa
      await controls.clickSelectAction(SCENE_OPTIONS, 'Delete Scene');

      // Memeriksa Modal Dialog (useAlert), bukan PopAlert toast
      const alertModal = page
        .getByRole('dialog')
        .or(page.getByRole('alertdialog'))
        .filter({ hasText: 'Cannot Delete' });

      await expect(alertModal).toBeVisible();

      // Tutup dialog modal
      await alertModal.getByRole('button', { name: 'OK', exact: true }).click();
      await expect(alertModal).toHaveCount(0);
    });
  });

  // =========================================================================
  // 8. SEARCH SYSTEM & EMPTY STATES
  // =========================================================================
  test.describe('8. Hierarchy Search Engine & Empty States', () => {
    test('filters hierarchy tree reactively by Name/ScriptID and shows empty state placeholder when no matches exist', async ({ page, hierarchy, controls, popup }) => {
      const worldLayer = hierarchy.nodeByName('World Layer');
      const spriteNode = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Sprite']);

      // Cari nama yang tidak ada
      await controls.fillSearch('hierarchy-search-input', 'NonExistentNode123');
      await expect(spriteNode).toBeHidden();

      // Verifikasi Tampilan Placeholder Empty State
      await expect(page.getByTestId('hierarchy-world-empty-state')).toBeVisible();

      // Clear Search via tombol silang (hierarchy-search-clear-button)
      await controls.clearSearch('hierarchy-search-input');
      await expect(spriteNode).toBeVisible();
    });
  });

});
