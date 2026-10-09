import { test, expect } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Inspector E2E',
    description: 'Testing Property Inspector for Project, Scene, Layer, Object, Transform, UI Transform, Collider, and Physics',
  },
});

/**
 * Spy event bus engine untuk verifikasi data sinkronisasi secara terisolasi
 */
async function installBusSpy(page) {
  await page.waitForFunction(() => !!(window.bus || window.$bus), null, { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => {
    if (window.__capturedEngineEvents) return;
    window.__capturedEngineEvents = [];

    const targetBus = window.bus || window.$bus;
    if (!targetBus) return;

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

test.describe('Property Inspector: Comprehensive Testing', () => {

  test.beforeEach(async ({ page }) => {
    await installBusSpy(page);
  });

  // =========================================================================
  // 1. PROJECT & SCENE INSPECTOR (DEFAULT UNSELECTED STATE)
  // =========================================================================
  test('directly verifies EditorProject and EditorScene when no entity is selected on initial load', async ({ page, inspector }) => {
    // 1. Verifikasi EditorProject dan EditorScene tampil secara default saat editor terbuka
    await expect(inspector.projectSection).toBeVisible();
    await expect(inspector.sceneSection).toBeVisible();

    // 2. Verifikasi komponen khusus Entity/Layer tidak muncul
    await expect(inspector.layerSection).toHaveCount(0);
    await expect(inspector.objectSection).toHaveCount(0);

    // 3. Uji interaksi Quick Actions pada EditorProject
    const showGridCheckbox = page.getByTestId('project-show-grid-toggle').locator('input[type="checkbox"]').or(page.getByTestId('project-show-grid-toggle')).first();
    const initialGridChecked = await showGridCheckbox.isChecked();
    
    await inspector.toggleProjectGridGuide();
    await expect(showGridCheckbox).toBeChecked({ checked: !initialGridChecked });

    // 4. Uji elemen Background Color pada EditorScene
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
  // 7. [Bad Path] DUPLICATE SCRIPT ID REJECTION
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