import { test, expect } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Inspector Unified E2E',
    description: 'Exhaustive E2E testing for Project, Scene, Layer, Object, Transform, UI Transform, Collider, Physics, Prefab Workflows, Sprite, Shape, Text, Tilemap, Script Controller, Animator, and Audio inspector components.',
  },
});

/**
 * Spy Event Bus Engine untuk memverifikasi payload data sinkronisasi WebGL secara terisolasi
 */
async function installBusSpy(page) {
  await page.waitForFunction(() => !!(window.bus || window.$bus));
  await page.evaluate(() => {
    if (window.__capturedEngineEvents) return;
    window.__capturedEngineEvents = [];

    const targetBus = window.bus || window.$bus;
    if (!targetBus) throw new Error('Engine event bus is not available');

    const originalEmit = targetBus.emit.bind(targetBus);

    targetBus.emit = (event, ...args) => {
      if (event === 'editor:entity:update-component' || event === 'editor:layer:update') {
        const payload = args[0];
        window.__capturedEngineEvents.push(JSON.parse(JSON.stringify(payload)));
      }
      return originalEmit(event, ...args);
    };
  });
}

/**
 * Tab workspace yang sedang aktif.
 *
 * PERBAIKAN: sebelumnya `[aria-selected="true"]` dipakai polos. Sekarang baris
 * hierarchy-node juga ber-aria-selected="true" saat dipilih, jadi locator lama
 * selalu cocok dengan node yang baru diklik dan assertion-nya lolos tanpa
 * benar-benar memverifikasi tab. Node hierarchy dikecualikan di sini.
 */
function activeWorkspaceTab(page, entityId) {
  return page
    .locator(`[data-tab-id="${entityId}"], [aria-selected="true"]:not([data-testid="hierarchy-node"])`)
    .first();
}

/**
 * Helper internal untuk membuat Prefab via Context Menu Hierarchy secara stabil
 */
async function createPrefabFromEntity(page, hierarchy, popup, entityNode, prefabName) {
  await expect(entityNode).toBeVisible();
  const nodeId = await entityNode.getAttribute('data-node-id');

  // Pastikan node ter-select dan aria-selected aktif sebelum klik kanan
  await entityNode.click();
  await expect(entityNode).toHaveAttribute('aria-selected', 'true');

  await popup.selectContextMenu(entityNode, 'Use as Prefab');
  await popup.fillPromptAndSubmit('Create Prefab', prefabName, 'Create');

  const stableNode = hierarchy.nodeById(nodeId);
  await expect(stableNode).toBeVisible();
  await expect(stableNode).toHaveAttribute('data-prefab', 'true');
  return { stableNode, nodeId };
}

test.describe('Property Inspector: Basic Components & Prefab E2E', () => {

  test.beforeEach(async ({ page }) => {
    await installBusSpy(page);
  });

  // =========================================================================
  // 1. PROJECT & SCENE INSPECTOR (DEFAULT UNSELECTED STATE)
  // =========================================================================
  test('directly verifies EditorProject and EditorScene when no entity is selected on initial load', async ({ page, inspector }) => {
    await expect(inspector.projectSection).toBeVisible();
    await expect(inspector.sceneSection).toBeVisible();

    await expect(inspector.layerSection).toHaveCount(0);
    await expect(inspector.objectSection).toHaveCount(0);

    const showGridCheckbox = page.getByTestId('project-show-grid-toggle').locator('input[type="checkbox"]').or(page.getByTestId('project-show-grid-toggle')).first();
    const initialGridChecked = await showGridCheckbox.isChecked();

    await inspector.toggleProjectGridGuide();
    await expect(showGridCheckbox).toBeChecked({ checked: !initialGridChecked });

    const sceneBgColorPicker = page.getByTestId('scene-bg-color-picker');
    await expect(sceneBgColorPicker).toBeVisible();
  });

  // =========================================================================
  // 2. LAYER INSPECTOR TESTING
  // =========================================================================
  test('modifies layer properties and verifies reactive UI state', async ({ page, hierarchy, inspector }) => {
    const worldLayer = hierarchy.nodeByName('World Layer');
    await expect(worldLayer).toBeVisible();
    await worldLayer.click();

    await expect(inspector.layerSection).toBeVisible();

    await inspector.setLayerName('Main World Layer');
    await inspector.setLayerZIndex(5);
    await inspector.toggleLayerActive();

    const nameInput = page.getByTestId('layer-name-input').locator('input').first();
    await expect(nameInput).toHaveValue('Main World Layer');

    const activeToggle = page.getByTestId('layer-active-toggle');
    await expect(activeToggle).toHaveAttribute('data-active', 'false');
  });

  // =========================================================================
  // 3. OBJECT & TRANSFORM SYNC
  // =========================================================================
  test('modifies Object & Transform properties and captures engine sync payload via bus', async ({ page, hierarchy, popup, inspector }) => {
    const worldLayer = hierarchy.nodeByName('World Layer');
    await popup.selectContextMenu(worldLayer, ['Add Entity', 'Empty Entity']);

    const entityNode = hierarchy.nodesByText(/Empty/i).first();
    await expect(entityNode).toBeVisible();
    await entityNode.click();

    await inspector.setEntityName('MainPlayer');
    await inspector.setScriptId('player_main_id');
    await inspector.setPosition(250.75, -120.5);
    await inspector.setRotation(90);

    const nameInput = page.getByTestId('object-name-input').locator('input').first();
    await expect(nameInput).toHaveValue('MainPlayer');

    const posXInput = page.getByTestId('transform-pos-x').locator('input').first();
    await expect(posXInput).toHaveValue('250.75');

    await expect.poll(async () => {
      return await page.evaluate(() => window.__capturedEngineEvents || []);
    }).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ componentName: 'Transform', path: 'x', value: 250.75 }),
        expect.objectContaining({ componentName: 'Transform', path: 'y', value: -120.5 }),
        expect.objectContaining({ componentName: 'Transform', path: 'rotation', value: 90 })
      ])
    );
  });

  // =========================================================================
  // 4. UI TRANSFORM
  // =========================================================================
  test('modifies UI Transform properties on a UI entity', async ({ page, hierarchy, popup, inspector }) => {
    const uiLayer = hierarchy.nodeByName('UI Layer');
    await expect(uiLayer).toBeVisible();
    await uiLayer.click();

    await popup.selectContextMenu(uiLayer, ['Add UI Element', 'Empty UI']);

    const uiEntityNode = hierarchy.nodesByText(/Empty/i).first();
    await expect(uiEntityNode).toBeVisible();
    await uiEntityNode.click();

    await expect(inspector.uiTransformSection).toBeVisible();

    await inspector.setUIPosition(100, 50);
    await inspector.setUISize(400, 300);

    const posXInput = page.getByTestId('ui-transform-pos-x').locator('input').first();
    const sizeWInput = page.getByTestId('ui-transform-size-w').locator('input').first();

    await expect(posXInput).toHaveValue('100');
    await expect(sizeWInput).toHaveValue('400');
  });

  // =========================================================================
  // 5. COLLIDER COMPONENT INSPECTION
  // =========================================================================
  test('configures collider component and verifies AutoFit disable state', async ({ page, hierarchy, popup, inspector }) => {
    const worldLayer = hierarchy.nodeByName('World Layer');
    await popup.selectContextMenu(worldLayer, ['Add Entity', 'Empty Entity']);

    const entityNode = hierarchy.nodesByText(/Empty/i).first();
    await expect(entityNode).toBeVisible();
    await entityNode.click();

    await inspector.ensureColliderComponent();

    await inspector.setColliderType('Trigger (Zone)');
    await inspector.toggleColliderAutoFit(true);

    const offsetXInput = page.getByTestId('collider-offset-x').locator('input').first();
    await expect(offsetXInput).toBeDisabled();
  });

  // =========================================================================
  // 6. PHYSICS COMPONENT INSPECTION
  // =========================================================================
  test('modifies physics simulation properties', async ({ page, hierarchy, popup, inspector }) => {
    const worldLayer = hierarchy.nodeByName('World Layer');
    await popup.selectContextMenu(worldLayer, ['Add Entity', 'Empty Entity']);

    const entityNode = hierarchy.nodesByText(/Empty/i).first();
    await expect(entityNode).toBeVisible();
    await entityNode.click();

    await inspector.ensurePhysicsComponent();

    await inspector.setPhysicsBodyType('Dynamic (Standard)');
    await inspector.setPhysicsMass(12.5);
    await inspector.setPhysicsGravityScale(1.5);

    const massInput = page.getByTestId('physics-mass-input').locator('input').first();
    const gravityInput = page.getByTestId('physics-gravity-scale-input').locator('input').first();

    await expect(massInput).toHaveValue('12.5');
    await expect(gravityInput).toHaveValue('1.5');
  });

  // =========================================================================
  // 7. PREFAB CREATION, COMPONENT OVERRIDES & RESTRICTION RULES
  // =========================================================================
  test('attaches non-conflicting components, creates prefab via context menu, and verifies override status rules', async ({ page, hierarchy, popup, inspector }) => {
    const prefabName = 'EnemyMasterPrefab';

    const worldLayer = hierarchy.nodeByName('World Layer');
    await popup.selectContextMenu(worldLayer, ['Add Entity', 'Empty Entity']);

    const entityNode = hierarchy.nodesByText(/Empty/i).first();
    await expect(entityNode).toBeVisible();
    await entityNode.click();

    await inspector.ensureColliderComponent();
    await inspector.ensurePhysicsComponent();

    const { stableNode } = await createPrefabFromEntity(page, hierarchy, popup, entityNode, prefabName);

    await stableNode.click();

    const syncBadge = inspector.objectSection.getByText('Sync', { exact: true });
    await expect(syncBadge).toBeVisible();

    await inspector.setPosition(320, -150);
    await expect(syncBadge).toBeVisible();

    await inspector.setPhysicsMass(45);
    const overrideBadge = inspector.objectSection.getByText('Override', { exact: true });
    await expect(overrideBadge).toBeVisible();

    await inspector.addComponent('Audio');
    const restrictedToast = page.getByText(/Restricted|Cannot add components/i);
    await expect(restrictedToast.first()).toBeVisible();
  });

  // =========================================================================
  // 8. PREFAB ACTIONS MENU (APPLY, REVERT, UNPACK, COPY ID, DELETE)
  // =========================================================================
  test('tests all prefab context menu actions: Apply to Master, Revert to Sync, Unpack Prefab, Copy ID, and Delete Entity', async ({ page, hierarchy, popup, inspector }) => {
    const prefabName = 'PlayerMasterPrefab';

    const worldLayer = hierarchy.nodeByName('World Layer');
    await popup.selectContextMenu(worldLayer, ['Add Entity', 'Empty Entity']);

    const entityNode = hierarchy.nodesByText(/Empty/i).first();
    await expect(entityNode).toBeVisible();
    await entityNode.click();

    await inspector.setScriptId('player_entity_id');
    await inspector.ensurePhysicsComponent();

    const { stableNode, nodeId } = await createPrefabFromEntity(page, hierarchy, popup, entityNode, prefabName);
    await stableNode.click();

    // 1. Ubah nilai Physics Mass & flush fokus input aktif
    await inspector.setPhysicsMass(80);
    await page.evaluate(() => {
      if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }
    });
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));

    const objectSection = inspector.objectSection;
    await expect(objectSection).toBeVisible();

    const overrideBadge = objectSection.getByText('Override', { exact: true });
    await expect(overrideBadge).toBeVisible();

    // Helper deterministik untuk membuka Object Section menu
    const openObjectMenu = async () => {
      await page.evaluate(() => {
        if (document.activeElement && document.activeElement !== document.body) {
          document.activeElement.blur();
        }
      });
      await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));

      const menuContainer = page.getByTestId('object-section-menu').first();
      if (await menuContainer.isVisible()) {
        return menuContainer;
      }

      // PERBAIKAN: testid trigger sekarang diturunkan dari testid section
      // (`${base}-menu-trigger`), bukan lagi 'section-menu-trigger' statis.
      // Base-nya = data-testid yang dipasang EditorObject pada PropertySection
      // ('editor-object-section').
      const menuTrigger = objectSection.locator('[data-element="section-menu-trigger"]').first();
      await expect(menuTrigger).toBeVisible();
      await menuTrigger.click();

      await expect(menuContainer).toBeVisible();
      return menuContainer;
    };

    const clickObjectMenuItem = async (testId) => {
      const menu = await openObjectMenu();
      const item = menu.getByTestId(testId).first();
      await expect(item).toBeVisible();
      await item.dispatchEvent('click');
      await expect(menu).toBeHidden();
    };

    // Verifikasi keberadaan seluruh item menu saat pertama kali dibuka
    const menu = await openObjectMenu();
    await expect(menu.getByTestId('menu-item-apply-to-master')).toBeVisible();
    await expect(menu.getByTestId('menu-item-revert-to-sync')).toBeVisible();
    await expect(menu.getByTestId('menu-item-unpack-prefab')).toBeVisible();
    await expect(menu.getByTestId('menu-item-copy-id')).toBeVisible();
    await expect(menu.getByTestId('menu-item-delete-entity')).toBeVisible();

    // Revert to Sync
    await clickObjectMenuItem('menu-item-revert-to-sync');
    const massInput = page.getByTestId('physics-mass-input').locator('input').first();
    await expect(massInput).toHaveValue('1');

    // Unpack Prefab
    await clickObjectMenuItem('menu-item-unpack-prefab');
    await expect(page.getByTestId('editor-object-section').getByText('Prefab')).toHaveCount(0);

    // Copy ID
    await clickObjectMenuItem('menu-item-copy-id');

    // Delete Entity
    await clickObjectMenuItem('menu-item-delete-entity');
    await popup.confirmAction('Delete Entity', { confirmText: 'Delete' });

    const deletedNode = hierarchy.nodeById(nodeId);
    await expect(deletedNode).toHaveCount(0);
  });

  // =========================================================================
  // 9. [Bad Path] DUPLICATE SCRIPT ID REJECTION
  // =========================================================================
  test('[Bad Path] rejects assigning duplicate Script ID and triggers warning alert', async ({ popup, hierarchy, inspector }) => {
    const worldLayer = hierarchy.nodeByName('World Layer');
    await popup.selectContextMenu(worldLayer, ['Add Entity', 'Empty Entity']);

    const firstEntity = hierarchy.nodesByText(/Empty/i).first();
    await expect(firstEntity).toBeVisible();
    await firstEntity.click();
    await inspector.setScriptId('enemy_boss');

    await popup.selectContextMenu(worldLayer, ['Add Entity', 'Empty Entity']);
    const secondEntity = hierarchy.nodesByText(/Empty/i).nth(1);
    await expect(secondEntity).toBeVisible();
    await secondEntity.click();

    await inspector.setScriptId('enemy_boss');

    await popup.confirmAction('Duplicate ID', { confirmText: 'OK' });
  });
});

test.describe('Property Inspector: Assets, Scripts & Tab Navigation Components E2E', () => {

  test.beforeEach(async ({ page }) => {
    await installBusSpy(page);
  });

  // =========================================================================
  // 10. AUDIO INSPECTOR COMPONENT
  // =========================================================================
  test('tests all properties and interactive features in Audio Editor component', async ({ page, hierarchy, popup, inspector, assetCrud }) => {
    const audioFileName = 'sample_audio.ogg';

    const worldLayer = hierarchy.nodeByName('World Layer');
    await popup.selectContextMenu(worldLayer, ['Add Entity', 'Empty Entity']);

    const entityNode = hierarchy.nodesByText(/Empty/i).first();
    await expect(entityNode).toBeVisible();
    await entityNode.click();

    await inspector.ensureAudioComponent();
    await inspector.audioSection.scrollIntoViewIfNeeded();

    await inspector.setAudioVolume(80);
    await inspector.setAudioPitch(1.5);

    await inspector.toggleAudioMute();
    const muteBtn = page.getByTestId('audio-active-toggle');
    await expect(muteBtn).toHaveAttribute('data-active', 'false');

    await inspector.toggleAudioAutoplay();
    const autoplayBtn = page.getByTestId('audio-autoplay-toggle');
    await expect(autoplayBtn).toHaveAttribute('data-active', 'true');

    await inspector.toggleAudioLoop();
    const loopBtn = page.getByTestId('audio-loop-toggle');
    await expect(loopBtn).toHaveAttribute('data-active', 'true');

    await inspector.toggleAudioSpatial();
    const spatialBtn = page.getByTestId('audio-spatial-toggle');
    await expect(spatialBtn).toHaveAttribute('data-active', 'true');

    await inspector.toggleAudioPersist();
    const persistBtn = page.getByTestId('audio-persist-toggle');
    await expect(persistBtn).toHaveAttribute('data-active', 'true');
    await expect(spatialBtn).toBeDisabled();

    await inspector.toggleAudioPersist();
    await expect(spatialBtn).toBeEnabled();

    const audioCard = await assetCrud.uploadAsset(audioFileName);
    await assetCrud.applyToActiveEntity(audioCard, 'Apply to Audio Component');

    const playBtn = page.getByTestId('audio-play-btn');
    await expect(playBtn).toContainText('sample_audio');

    await expect.poll(async () => {
      return await page.evaluate(() => window.__capturedEngineEvents || []);
    }).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ componentName: 'Audio' })
      ])
    );
  });

  // =========================================================================
  // 11. SCRIPT CONTROLLER COMPONENT
  // =========================================================================
  test('tests all properties and attach flows in Script Controller component', async ({ hierarchy, popup, inspector, scriptCrud }) => {
    const entityName = 'PlayerCharacter';
    const scriptName = 'PlayerControllerScript';

    const worldLayer = hierarchy.nodeByName('World Layer');
    await popup.selectContextMenu(worldLayer, ['Add Entity', 'Empty Entity']);

    const entityNode = hierarchy.nodesByText(/Empty/i).first();
    await expect(entityNode).toBeVisible();
    await entityNode.click();

    await inspector.setEntityName(entityName);
    await inspector.ensureScriptControllerComponent();

    await scriptCrud.createScript(scriptName);
    await scriptCrud.attachScriptToEntity(scriptName, entityName);

    const playerNode = hierarchy.nodesByText(entityName).first();
    await expect(playerNode).toBeVisible();
    await playerNode.click();

    const scriptDropdownTrigger = inspector.scriptControllerSection.getByTestId('script-controller-dropdown-trigger');
    await expect(scriptDropdownTrigger).toContainText(scriptName);

    await inspector.toggleScriptActive();
    const scriptActiveToggle = inspector.scriptControllerSection.getByTestId('script-controller-active-toggle');
    await expect(scriptActiveToggle).toHaveAttribute('data-active', 'false');

    await inspector.toggleScriptActive();
    await expect(scriptActiveToggle).toHaveAttribute('data-active', 'true');
  });

  // =========================================================================
  // 12. SPRITE RENDERER COMPONENT
  // =========================================================================
  test('tests all properties, rect controls, SDF, filter modes, and conflicts in Sprite Renderer', async ({ page, hierarchy, popup, inspector, assetCrud }) => {
    const textureFileName = 'sample_image.png';

    const worldLayer = hierarchy.nodeByName('World Layer');
    await popup.selectContextMenu(worldLayer, ['Add Entity', 'Empty Entity']);

    const entityNode = hierarchy.nodesByText(/Empty/i).first();
    await expect(entityNode).toBeVisible();
    await entityNode.click();

    await inspector.ensureSpriteRendererComponent();

    await inspector.setSpriteSourceRect(8, 16, 128, 256);
    await inspector.setSpriteOpacity(60);

    const sourceX = page.getByTestId('sprite-renderer-source-x').locator('input').first();
    const sourceW = page.getByTestId('sprite-renderer-source-w').locator('input').first();
    const opacityInput = page.getByTestId('sprite-renderer-opacity').locator('input').first();

    await expect(sourceX).toHaveValue('8');
    await expect(sourceW).toHaveValue('128');
    await expect(opacityInput).toHaveValue('60');

    await inspector.setSpriteFilterMode('Smooth');
    await inspector.toggleSpriteSDF();

    const sdfToggle = page.getByTestId('sprite-renderer-sdf-toggle');
    await expect(sdfToggle).toHaveAttribute('data-active', 'true');

    const textureCard = await assetCrud.uploadAsset(textureFileName);
    await assetCrud.applyToActiveEntity(textureCard, 'Apply to SpriteRenderer');

    const assetBtn = page.getByTestId('sprite-renderer-asset-btn');
    await expect(assetBtn).not.toContainText('None');

    await inspector.addComponentContainer.scrollIntoViewIfNeeded();
    await page.getByTestId('add-component-select').click();

    const textRendererOption = page.getByTestId('select-option').filter({ hasText: /Text Renderer/i }).first();
    await expect(textRendererOption).toHaveAttribute('aria-disabled', 'true');
  });

  // =========================================================================
  // 13. TEXT RENDERER COMPONENT
  // =========================================================================
  test('tests all properties, text input, alignment, mode, and drop shadow in Text Renderer', async ({ page, hierarchy, popup, inspector, assetCrud }) => {
    const fontFileName = 'sample_font.ttf';

    const uiLayer = hierarchy.nodeByName('UI Layer');
    await popup.selectContextMenu(uiLayer, ['Add UI Element', 'Empty UI']);

    const uiEntityNode = hierarchy.nodesByText(/Empty/i).first();
    await expect(uiEntityNode).toBeVisible();
    await uiEntityNode.click();

    await inspector.ensureTextRendererComponent();

    await inspector.setTextContent('Level 1 - Start Game');
    await inspector.setTextMode('Rich Text');
    await inspector.setFontSize(36);
    await inspector.setTextAlign('center');

    const textInput = page.getByTestId('text-renderer-text-input').locator('textarea, input').first();
    const fontSizeInput = page.getByTestId('text-renderer-font-size').locator('input').first();
    const alignCenterBtn = page.getByTestId('text-renderer-align-center');

    await expect(textInput).toHaveValue('Level 1 - Start Game');
    await expect(fontSizeInput).toHaveValue('36');
    await expect(alignCenterBtn).toHaveAttribute('data-active', 'true');

    await inspector.toggleTextShadow(true);
    const shadowToggle = page.getByTestId('text-renderer-shadow-toggle').locator('input[type="checkbox"]').or(page.getByTestId('text-renderer-shadow-toggle')).first();
    await expect(shadowToggle).toBeChecked();

    const shadowColorPicker = page.getByTestId('text-renderer-shadow-color-picker');
    await expect(shadowColorPicker).toBeVisible();

    const fontCard = await assetCrud.uploadAsset(fontFileName);
    await assetCrud.applyToActiveEntity(fontCard, 'Apply to TextRenderer');

    const fontBtn = page.getByTestId('text-renderer-font-btn');
    await expect(fontBtn).toBeVisible();
  });

  // =========================================================================
  // 14. SHAPE RENDERER COMPONENT & TAB NAVIGATION
  // =========================================================================
  test('tests all properties, collision toggles, and open shape_editor tab', async ({ page, hierarchy, popup, inspector }) => {
    const worldLayer = hierarchy.nodeByName('World Layer');
    await popup.selectContextMenu(worldLayer, ['Add Entity', 'Shape']);

    const shapeEntityNode = hierarchy.nodesByText(/Shape/i).first();
    await expect(shapeEntityNode).toBeVisible();
    await shapeEntityNode.click();

    const entityId = await shapeEntityNode.getAttribute('data-node-id');
    await expect(inspector.shapeRendererSection).toBeVisible();

    await inspector.setShapeOutlineWidth(4);
    const outlineWidthInput = page.getByTestId('shape-renderer-outline-width').locator('input').first();
    await expect(outlineWidthInput).toHaveValue('4');

    const polygonPhysicsBtn = page.getByTestId('shape-renderer-polygon-collision').locator('input[type="checkbox"]').or(page.getByTestId('shape-renderer-polygon-collision')).first();
    await polygonPhysicsBtn.click();

    await inspector.openShapeEditor();

    await expect(activeWorkspaceTab(page, entityId)).toBeVisible();

    const shapePanelTitle = page.getByText(/Custom Shape Inspector|Shape Editor/i).first();
    await expect(shapePanelTitle).toBeVisible();

    await expect.poll(async () => {
      return await page.evaluate(() => window.__capturedEngineEvents || []);
    }).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ componentName: 'ShapeRenderer' })
      ])
    );
  });

  // =========================================================================
  // 15. TILEMAP COMPONENT & TAB NAVIGATION
  // =========================================================================
  test('attaches sample image, tests tilemap properties, auto-fit, and open tilemap tab', async ({ page, hierarchy, popup, inspector, assetCrud }) => {
    const sampleImageName = 'sample_image.png';

    const worldLayer = hierarchy.nodeByName('World Layer');
    await popup.selectContextMenu(worldLayer, ['Add Entity', 'Tilemap']);

    const tilemapEntityNode = hierarchy.nodesByText(/Tilemap/i).first();
    await expect(tilemapEntityNode).toBeVisible();
    await tilemapEntityNode.click();

    const entityId = await tilemapEntityNode.getAttribute('data-node-id');
    await expect(inspector.tilemapSection).toBeVisible();

    const assetCard = await assetCrud.uploadAsset(sampleImageName);
    await assetCrud.applyToActiveEntity(assetCard, 'Apply to Tilemap');

    const thumbnail = page.getByTestId('tilemap-thumbnail');
    await expect(thumbnail).toBeVisible();

    await inspector.setTilemapOpacity(75);
    const opacityInput = page.getByTestId('tilemap-opacity-input').locator('input').first();
    await expect(opacityInput).toHaveValue('75');

    const autoFitBtn = page.getByTestId('tilemap-autofit-btn');
    await autoFitBtn.click();
    await expect(autoFitBtn).toHaveAttribute('data-active', 'false');

    await inspector.openTilemapEditor();

    await expect(activeWorkspaceTab(page, entityId)).toBeVisible();

    const tilePaletteTitle = page.getByText(/Tile Palette|Tilemap/i).first();
    await expect(tilePaletteTitle).toBeVisible();

    await expect.poll(async () => {
      return await page.evaluate(() => window.__capturedEngineEvents || []);
    }).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ componentName: 'Tilemap' })
      ])
    );
  });

  // =========================================================================
  // 16. SPRITE ANIMATOR COMPONENT & TAB NAVIGATION
  // =========================================================================
  test('attaches sample image, tests animator toggles, overlay status, and open animator tab', async ({ page, hierarchy, popup, inspector, assetCrud }) => {
    const sampleImageName = 'sample_image.png';

    const worldLayer = hierarchy.nodeByName('World Layer');
    await popup.selectContextMenu(worldLayer, ['Add Entity', 'Sprite']);

    const spriteEntityNode = hierarchy.nodesByText(/Sprite/i).first();
    await expect(spriteEntityNode).toBeVisible();
    await spriteEntityNode.click();

    const entityId = await spriteEntityNode.getAttribute('data-node-id');

    await inspector.ensureSpriteAnimatorComponent();
    await expect(inspector.spriteAnimatorSection).toBeVisible();

    const assetCard = await assetCrud.uploadAsset(sampleImageName);
    await assetCrud.applyToActiveEntity(assetCard, 'Apply to SpriteRenderer');

    await inspector.toggleAnimatorActive();
    const activeBtn = page.getByTestId('animator-active-toggle');
    await expect(activeBtn).toHaveAttribute('data-active', 'false');

    await inspector.toggleAnimatorActive();
    await expect(activeBtn).toHaveAttribute('data-active', 'true');

    const animatorOverlay = page.getByTestId('sprite-renderer-animator-overlay');
    await expect(animatorOverlay).toBeVisible();

    await inspector.openAnimatorEditor();

    await expect(activeWorkspaceTab(page, entityId)).toBeVisible();

    const animatorTitle = page.getByText(/Clip|Properties/i).first();
    await expect(animatorTitle).toBeVisible();

    await expect.poll(async () => {
      return await page.evaluate(() => window.__capturedEngineEvents || []);
    }).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ componentName: 'SpriteAnimator' })
      ])
    );
  });

});
