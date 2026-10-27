import { test, expect } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Inspector Unified E2E',
    description: 'Exhaustive E2E testing for Project, Scene, Layer, Object, Transform, UI Transform, Collider, Physics, Prefab Workflows, Sprite, Shape, Text, Tilemap, Script Controller, Animator, and Audio inspector components.',
  },
});

/**
 * Engine event bus spy that verifies WebGL sync payloads in isolation
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
      if (event === 'editor:entity:update-component' || event === 'editor:layer:update' || event === 'editor:entity:update-prop') {
        const payload = args[0];
        window.__capturedEngineEvents.push(JSON.parse(JSON.stringify(payload)));
      }
      return originalEmit(event, ...args);
    };
  });
}

/**
 * The active workspace tab is locked via data-tab-id (rendered by BaseTab in the tab bar).
 */
function activeWorkspaceTab(page, entityId) {
  return page.locator(`[data-tab-id="${entityId}"]`);
}

/**
 * Internal helper that creates a Prefab through the Hierarchy context menu reliably
 */
async function createPrefabFromEntity(page, hierarchy, popup, entityNode, prefabName) {
  await expect(entityNode).toBeVisible();
  const nodeId = await entityNode.getAttribute('data-node-id');

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
  // 1. PROJECT, SCENE & LAYER INSPECTOR
  // =========================================================================
  test('directly verifies Project, Scene, and Layer properties in unselected and selected states', async ({ page, hierarchy, inspector }) => {
    await expect(inspector.projectSection).toBeVisible();
    await expect(inspector.sceneSection).toBeVisible();

    await expect(inspector.layerSection).toHaveCount(0);
    await expect(inspector.objectSection).toHaveCount(0);

    const showBoundsCheckbox = inspector.checkbox('project-show-world-bounds-toggle');

    // The initial state is made deterministic (setChecked waits and verifies) instead of being read at a single point in time
    await showBoundsCheckbox.setChecked(true);
    await expect(showBoundsCheckbox).toBeChecked();

    await inspector.toggleProjectWorldBounds();
    await expect(showBoundsCheckbox).not.toBeChecked();

    const sceneBgColorPicker = page.getByTestId('scene-bg-color-picker');
    await expect(sceneBgColorPicker).toBeVisible();

    const worldLayer = hierarchy.nodeByName('World Layer');
    await expect(worldLayer).toBeVisible();
    await worldLayer.click();

    await expect(inspector.layerSection).toBeVisible();

    await inspector.setLayerName('Main World Layer');
    await inspector.setLayerZIndex(5);
    await inspector.toggleLayerActive();

    const nameInput = inspector.field('layer-script-id-input');
    await expect(nameInput).toHaveValue(/Main[ _]World[ _]Layer/i);

    const activeToggle = page.getByTestId('layer-active-toggle');
    await expect(activeToggle).toHaveAttribute('data-active', 'false');
  });

  // =========================================================================
  // 2. OBJECT & TRANSFORM SYNC
  // =========================================================================
  test('modifies Object & Transform properties and captures engine sync payload via bus', async ({ page, hierarchy, popup, inspector }) => {
    const worldLayer = hierarchy.nodeByName('World Layer');
    const entityNode = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Empty Entity']);
    await expect(entityNode).toBeVisible();
    await entityNode.click();

    await inspector.setEntityName('MainPlayer');
    await inspector.setScriptId('player_main_id');
    await inspector.setPosition(250.75, -120.5);
    await inspector.setRotation(90);

    const nameInput = inspector.field('object-script-id-input');
    await expect(nameInput).toHaveValue(/MainPlayer|player_main_id/);

    const posXInput = inspector.field('transform-pos-x');
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
  // MULTI-TAG ENTITY MANAGEMENT
  // =========================================================================
  test('assigns multiple tags to entity, renders tag chips, and removes tag via inspector', async ({ page, hierarchy, popup, inspector }) => {
    const worldLayer = hierarchy.nodeByName('World Layer');
    const entityNode = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Empty Entity']);
    await expect(entityNode).toBeVisible();
    await entityNode.click();

    await inspector.setEntityTag('Player');
    await expect(inspector.assignedTagItem('Player')).toBeVisible();

    await inspector.setEntityTag('Enemy');
    await expect(inspector.assignedTagItem('Enemy')).toBeVisible();

    await expect(inspector.assignedTagsList).toBeVisible();
    await expect(inspector.assignedTagItem('Player')).toBeVisible();
    await expect(inspector.assignedTagItem('Enemy')).toBeVisible();

    await inspector.removeEntityTag('Enemy');
    await expect(inspector.assignedTagItem('Enemy')).toHaveCount(0);
    await expect(inspector.assignedTagItem('Player')).toBeVisible();

    await expect.poll(async () => {
      const events = await page.evaluate(() => window.__capturedEngineEvents || []);
      return events.some(e => e.prop === 'tags');
    }).toBe(true);
  });

  // =========================================================================
  // 3. UI TRANSFORM
  // =========================================================================
  test('modifies UI Transform properties on a UI entity', async ({ hierarchy, popup, inspector }) => {
    const uiLayer = hierarchy.nodeByName('UI Layer');
    await expect(uiLayer).toBeVisible();
    await uiLayer.click();

    const uiEntityNode = await hierarchy.addEntity(popup, uiLayer, ['Add UI Element', 'Empty UI']);
    await expect(uiEntityNode).toBeVisible();
    await uiEntityNode.click();

    await expect(inspector.uiTransformSection).toBeVisible();

    await inspector.setUIPosition(100, 50);
    await inspector.setUISize(400, 300);

    const posXInput = inspector.field('ui-transform-pos-x');
    const sizeWInput = inspector.field('ui-transform-size-w');

    await expect(posXInput).toHaveValue('100');
    await expect(sizeWInput).toHaveValue('400');
  });

  // =========================================================================
  // 4. COLLIDER & PHYSICS COMPONENT INSPECTION
  // =========================================================================
  test('configures collider and physics simulation properties on an entity', async ({ hierarchy, popup, inspector }) => {
    const worldLayer = hierarchy.nodeByName('World Layer');
    const entityNode = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Empty Entity']);
    await expect(entityNode).toBeVisible();
    await entityNode.click();

    await inspector.ensureColliderComponent();
    await inspector.setColliderType('Trigger (Zone)');
    await inspector.toggleColliderAutoFit(true);

    const offsetXInput = inspector.field('collider-offset-x');
    await expect(offsetXInput).toBeDisabled();

    await inspector.ensurePhysicsComponent();
    await inspector.setPhysicsMotionMode('Platformer (Side-Scroll)');
    await inspector.setPhysicsDrag(12.5);
    await inspector.setPhysicsGravityScale(1.5);

    const dragInput = inspector.field('physics-drag-input');
    const gravityInput = inspector.field('physics-gravity-scale-input');

    await expect(dragInput).toHaveValue('12.5');
    await expect(gravityInput).toHaveValue('1.5');
  });

  // =========================================================================
  // 5. PREFAB WORKFLOWS & CONTEXT MENU ACTIONS
  // =========================================================================
  test('attaches components, creates prefab via context menu, and verifies override status and actions menu', async ({ page, hierarchy, popup, inspector, inspectorCrud }) => {
    const prefabName = 'EnemyMasterPrefab';

    const worldLayer = hierarchy.nodeByName('World Layer');
    const entityNode = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Empty Entity']);
    await expect(entityNode).toBeVisible();
    await entityNode.click();

    await inspector.setScriptId('enemy_prefab_id');
    await inspector.ensureColliderComponent();
    await inspector.ensurePhysicsComponent();

    const { stableNode, nodeId } = await createPrefabFromEntity(page, hierarchy, popup, entityNode, prefabName);

    await stableNode.click();

    const syncBadge = inspector.objectSection.getByText('Sync', { exact: true });
    await expect(syncBadge).toBeVisible();

    await inspector.setPosition(320, -150);
    await expect(syncBadge).toBeVisible();

    await inspector.setPhysicsDrag(45);
    const overrideBadge = inspector.objectSection.getByText('Override', { exact: true });
    await expect(overrideBadge).toBeVisible();

    await inspector.addComponent('Audio');
    await popup.expectPopAlert('Restricted');
    await popup.closePopAlert('Restricted');

    // Context menu actions verification
    const menuContainer = await inspectorCrud.openObjectSectionMenu();

    await expect(menuContainer.getByTestId('menu-item-apply-to-master')).toBeVisible();
    await expect(menuContainer.getByTestId('menu-item-revert-to-sync')).toBeVisible();
    await expect(menuContainer.getByTestId('menu-item-unpack-prefab')).toBeVisible();
    await expect(menuContainer.getByTestId('menu-item-copy-id')).toBeVisible();
    await expect(menuContainer.getByTestId('menu-item-delete-entity')).toBeVisible();

    await inspectorCrud.clickObjectSectionMenuItem('menu-item-revert-to-sync');
    const dragInput = inspector.field('physics-drag-input');
    await expect(dragInput).toHaveValue('1');

    await inspectorCrud.clickObjectSectionMenuItem('menu-item-unpack-prefab');
    await expect(page.getByTestId('editor-object-section').getByText('Prefab', { exact: true })).toHaveCount(0);

    await inspectorCrud.clickObjectSectionMenuItem('menu-item-copy-id');

    await inspectorCrud.clickObjectSectionMenuItem('menu-item-delete-entity');
    await popup.confirmAction('Delete Entity', { confirmText: 'Delete' });

    const deletedNode = hierarchy.nodeById(nodeId);
    await expect(deletedNode).toHaveCount(0);
  });

  // =========================================================================
  // 9. [Bad Path] DUPLICATE SCRIPT ID REJECTION
  // =========================================================================
  test('[Bad Path] rejects assigning duplicate Script ID and triggers warning alert', async ({ popup, hierarchy, inspector }) => {
    const worldLayer = hierarchy.nodeByName('World Layer');
    const firstEntity = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Empty Entity']);
    await expect(firstEntity).toBeVisible();
    await firstEntity.click();
    await inspector.setScriptId('enemy_boss');

    const secondEntity = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Empty Entity']);
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
    const entityNode = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Empty Entity']);
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
    const entityNode = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Empty Entity']);
    await expect(entityNode).toBeVisible();
    await entityNode.click();

    await inspector.setEntityName(entityName);
    await inspector.ensureScriptControllerComponent();

    await scriptCrud.createScript(scriptName);
    await scriptCrud.attachScriptToEntity(scriptName, entityName);

    const playerNode = hierarchy.nodeByName(entityName);
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
    const entityNode = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Empty Entity']);
    await expect(entityNode).toBeVisible();
    await entityNode.click();

    await inspector.ensureSpriteRendererComponent();

    await inspector.setSpriteSourceRect(8, 16, 128, 256);
    await inspector.setSpriteOpacity(60);

    const sourceX = inspector.field('sprite-renderer-source-x');
    const sourceW = inspector.field('sprite-renderer-source-w');
    const opacityInput = inspector.field('sprite-renderer-opacity');

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

    // Dropdown options have no per-item test ID: use the generic select-option + its text
    const textRendererOption = page.getByTestId('select-option').filter({ hasText: 'Text Renderer' });
    await expect(textRendererOption).toHaveAttribute('aria-disabled', 'true');
  });

  // =========================================================================
  // 13. TEXT RENDERER COMPONENT
  // =========================================================================
  test('tests all properties, text input, alignment, mode, and drop shadow in Text Renderer', async ({ page, hierarchy, popup, inspector, assetCrud }) => {
    const fontFileName = 'sample_font.ttf';

    const uiLayer = hierarchy.nodeByName('UI Layer');
    const uiEntityNode = await hierarchy.addEntity(popup, uiLayer, ['Add UI Element', 'Empty UI']);
    await expect(uiEntityNode).toBeVisible();
    await uiEntityNode.click();

    await inspector.ensureTextRendererComponent();

    await inspector.setTextContent('Level 1 - Start Game');
    await inspector.setTextMode('Rich Text');
    await inspector.setFontSize(36);
    await inspector.setTextAlign('center');

    const textInput = inspector.field('text-renderer-text-input', 'textarea, input');
    const fontSizeInput = inspector.field('text-renderer-font-size');
    const alignCenterBtn = page.getByTestId('text-renderer-align-center');

    await expect(textInput).toHaveValue('Level 1 - Start Game');
    await expect(fontSizeInput).toHaveValue('36');
    await expect(alignCenterBtn).toHaveAttribute('data-active', 'true');

    // Verify Auto Line and Max Line interaction
    const autoLineToggle = inspector.checkbox('text-renderer-auto-line-toggle');
    const maxLineInput = inspector.field('text-renderer-max-line');
    await expect(autoLineToggle).toBeChecked();
    await expect(maxLineInput).toBeDisabled();

    // Toggle Auto Line off and verify Max Line is enabled
    await inspector.toggleTextAutoLine(false);
    await expect(maxLineInput).toBeEnabled();

    // Toggle Auto Line back on and verify Max Line is disabled
    await inspector.toggleTextAutoLine(true);
    await expect(maxLineInput).toBeDisabled();

    await inspector.toggleTextShadow(true);
    const shadowToggle = inspector.checkbox('text-renderer-shadow-toggle');
    await expect(shadowToggle).toBeChecked();

    const shadowColorPicker = page.getByTestId('text-renderer-shadow-color-picker');
    await expect(shadowColorPicker).toBeVisible();

    const fontCard = await assetCrud.uploadAsset(fontFileName);
    await assetCrud.applyToActiveEntity(fontCard, 'Apply to TextRenderer');

    const fontBtn = page.getByTestId('text-renderer-font-btn');
    await expect(fontBtn).toBeVisible();
  });

  // =========================================================================
  // 10. SHAPE & TILEMAP RENDERER COMPONENTS & TAB NAVIGATION
  // =========================================================================
  test('tests specialized renderers (Shape & Tilemap) and opens respective workspace tabs', async ({ page, hierarchy, popup, inspector, assetCrud }) => {
    const worldLayer = hierarchy.nodeByName('World Layer');

    // 1. Shape Renderer
    const shapeEntityNode = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Shape']);
    await expect(shapeEntityNode).toBeVisible();
    await shapeEntityNode.click();

    const shapeId = await shapeEntityNode.getAttribute('data-node-id');
    await expect(inspector.shapeRendererSection).toBeVisible();

    await inspector.setShapeOutlineWidth(4);
    const outlineWidthInput = inspector.field('shape-renderer-outline-width');
    await expect(outlineWidthInput).toHaveValue('4');

    const polygonPhysicsBtn = inspector.checkbox('shape-renderer-polygon-collision');
    await polygonPhysicsBtn.click();

    await inspector.openShapeEditor();
    await expect(activeWorkspaceTab(page, shapeId)).toBeVisible();
    await expect(page.getByTestId('right-panel-title')).toHaveText('Custom Shape Inspector');

    // Switch back to Main Scene tab so the hierarchy and inspector are active
    await page.getByRole('tab', { name: /Main[ _]Scene/ }).click();
    await expect(worldLayer).toBeVisible();

    // 2. Tilemap Renderer
    const sampleImageName = 'sample_image.png';
    const tilemapEntityNode = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Tilemap']);
    await expect(tilemapEntityNode).toBeVisible();
    await tilemapEntityNode.click();

    const tilemapId = await tilemapEntityNode.getAttribute('data-node-id');
    await expect(inspector.tilemapSection).toBeVisible();

    const assetCard = await assetCrud.uploadAsset(sampleImageName);
    await assetCrud.applyToActiveEntity(assetCard, 'Apply to Tilemap');

    const thumbnail = page.getByTestId('tilemap-thumbnail');
    await expect(thumbnail).toBeVisible();

    await inspector.setTilemapOpacity(75);
    const opacityInput = inspector.field('tilemap-opacity-input');
    await expect(opacityInput).toHaveValue('75');

    await inspector.openTilemapEditor();
    await expect(activeWorkspaceTab(page, tilemapId)).toBeVisible();
    await expect(page.getByTestId('right-panel-title')).toHaveText('Tile Palette');
  });

  // =========================================================================
  // 16. SPRITE ANIMATOR COMPONENT & TAB NAVIGATION
  // =========================================================================
  test('attaches sample image, tests animator toggles, overlay status, and open animator tab', async ({ page, hierarchy, popup, inspector, assetCrud }) => {
    const sampleImageName = 'sample_image.png';

    const worldLayer = hierarchy.nodeByName('World Layer');
    const spriteEntityNode = await hierarchy.addEntity(popup, worldLayer, ['Add Entity', 'Sprite']);
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
    await expect(page.getByTestId('right-panel-title')).toHaveText('Properties');

    await expect.poll(async () => {
      return await page.evaluate(() => window.__capturedEngineEvents || []);
    }).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ componentName: 'SpriteAnimator' })
      ])
    );
  });

});