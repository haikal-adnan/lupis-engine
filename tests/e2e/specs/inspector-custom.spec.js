import { test, expect } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Inspector Custom E2E',
    description: 'Exhaustive E2E testing for Animator, Shape Renderer, and Tilemap inspector components.',
  },
});

/**
 * Spy Event Bus Engine untuk memverifikasi payload data sinkronisasi WebGL
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

test.describe('Property Inspector: Animator, Shape, and Tilemap Custom E2E', () => {

  test.beforeEach(async ({ page }) => {
    await installBusSpy(page);
  });

  // =========================================================================
  // 1. SHAPE RENDERER COMPONENT & TAB NAVIGATION TEST
  // =========================================================================
  test('tests all properties, collision toggles, and open shape_editor tab', async ({ page, hierarchy, popup, inspector }) => {
    // 1. Buat entity dengan tipe shape di World Layer
    const worldLayer = hierarchy.nodeByName('World Layer');
    await popup.selectContextMenu(worldLayer, ['Add Entity', 'Shape']);

    const shapeEntityNode = hierarchy.nodesByText(/Shape/i).first();
    await expect(shapeEntityNode).toBeVisible();
    await shapeEntityNode.click();

    const entityId = await shapeEntityNode.getAttribute('data-node-id');
    await expect(inspector.shapeRendererSection).toBeVisible();

    // 2. Modifikasi properti Fill & Outline
    await inspector.setShapeOutlineWidth(4);
    const outlineWidthInput = page.getByTestId('shape-renderer-outline-width').locator('input').first();
    await expect(outlineWidthInput).toHaveValue('4');

    // 3. Toggle Collision Checkbox
    const polygonPhysicsBtn = page.getByTestId('shape-renderer-polygon-collision').locator('input[type="checkbox"]').or(page.getByTestId('shape-renderer-polygon-collision')).first();
    await polygonPhysicsBtn.click();

    // 4. Buka Tab Editor Shape & Verifikasi Pindah Tab Berdasarkan Entity ID
    await inspector.openShapeEditor();

    // Verifikasi Tab Aktif
    const activeTab = page.locator(`[data-tab-id="${entityId}"], [aria-selected="true"]`).first();
    await expect(activeTab).toBeVisible();

    // Verifikasi Panel Shape Inspector Muncul di Right Layout
    const shapePanelTitle = page.getByText(/Custom Shape Inspector|Shape Editor/i).first();
    await expect(shapePanelTitle).toBeVisible();

    // 5. Verifikasi Event Bus memuat pembaruan ShapeRenderer
    await expect.poll(async () => {
      return await page.evaluate(() => window.__capturedEngineEvents || []);
    }).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ componentName: 'ShapeRenderer' })
      ])
    );
  });

  // =========================================================================
  // 2. TILEMAP COMPONENT, ASSET ATTACH, & TAB NAVIGATION TEST
  // =========================================================================
  test('attaches sample image, tests tilemap properties, auto-fit, and open tilemap tab', async ({ page, hierarchy, popup, inspector, assetCrud }) => {
    const sampleImageName = 'sample_image.png';

    // 1. Buat entity dengan tipe tilemap di World Layer
    const worldLayer = hierarchy.nodeByName('World Layer');
    await popup.selectContextMenu(worldLayer, ['Add Entity', 'Tilemap']);

    const tilemapEntityNode = hierarchy.nodesByText(/Tilemap/i).first();
    await expect(tilemapEntityNode).toBeVisible();
    await tilemapEntityNode.click();

    const entityId = await tilemapEntityNode.getAttribute('data-node-id');
    await expect(inspector.tilemapSection).toBeVisible();

    // 2. Unggah sampel image dan attach ke Tilemap via Context Menu Asset
    const assetCard = await assetCrud.uploadAsset(sampleImageName);
    await assetCrud.applyToActiveEntity(assetCard, 'Apply to Tilemap');

    // Verifikasi Thumbnail Tilemap memperbarui gambar
    const thumbnail = page.getByTestId('tilemap-thumbnail');
    await expect(thumbnail).toBeVisible();

    // 3. Modifikasi Opacity & Toggle AutoFit
    await inspector.setTilemapOpacity(75);
    const opacityInput = page.getByTestId('tilemap-opacity-input').locator('input').first();
    await expect(opacityInput).toHaveValue('75');

    const autoFitBtn = page.getByTestId('tilemap-autofit-btn');
    await autoFitBtn.click();
    await expect(autoFitBtn).toHaveAttribute('data-active', 'false');

    // 4. Buka Tab Editor Tilemap & Verifikasi Pindah Tab Berdasarkan Entity ID
    await inspector.openTilemapEditor();

    const activeTab = page.locator(`[data-tab-id="${entityId}"], [aria-selected="true"]`).first();
    await expect(activeTab).toBeVisible();

    // Verifikasi Layout Tilemap Panel Muncul (Tile Palette)
    const tilePaletteTitle = page.getByText(/Tile Palette|Tilemap/i).first();
    await expect(tilePaletteTitle).toBeVisible();

    // 5. Verifikasi Event Bus Sync
    await expect.poll(async () => {
      return await page.evaluate(() => window.__capturedEngineEvents || []);
    }).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ componentName: 'Tilemap' })
      ])
    );
  });

  // =========================================================================
  // 3. SPRITE ANIMATOR COMPONENT, ASSET ATTACH, & TAB NAVIGATION TEST
  // =========================================================================
  test('attaches sample image, tests animator toggles, overlay status, and open animator tab', async ({ page, hierarchy, popup, inspector, assetCrud }) => {
    const sampleImageName = 'sample_image.png';

    // 1. Buat entity dengan tipe sprite
    const worldLayer = hierarchy.nodeByName('World Layer');
    await popup.selectContextMenu(worldLayer, ['Add Entity', 'Sprite']);

    const spriteEntityNode = hierarchy.nodesByText(/Sprite/i).first();
    await expect(spriteEntityNode).toBeVisible();
    await spriteEntityNode.click();

    const entityId = await spriteEntityNode.getAttribute('data-node-id');

    // Pastikan Sprite Animator terpasang
    await inspector.ensureSpriteAnimatorComponent();
    await expect(inspector.spriteAnimatorSection).toBeVisible();

    // 2. Unggah sampel image dan attach ke SpriteRenderer
    const assetCard = await assetCrud.uploadAsset(sampleImageName);
    await assetCrud.applyToActiveEntity(assetCard, 'Apply to SpriteRenderer');

    // 3. Uji Opsi Active & Playback Toggle
    await inspector.toggleAnimatorActive();
    const activeBtn = page.getByTestId('animator-active-toggle');
    await expect(activeBtn).toHaveAttribute('data-active', 'false');

    // Aktifkan kembali animator
    await inspector.toggleAnimatorActive();
    await expect(activeBtn).toHaveAttribute('data-active', 'true');

    // Verifikasi Overlay Animator pada SpriteRenderer Section
    const animatorOverlay = page.getByTestId('sprite-renderer-animator-overlay');
    await expect(animatorOverlay).toBeVisible();

    // 4. Buka Tab Editor Animator & Verifikasi Pindah Tab Berdasarkan Entity ID
    await inspector.openAnimatorEditor();

    const activeTab = page.locator(`[data-tab-id="${entityId}"], [aria-selected="true"]`).first();
    await expect(activeTab).toBeVisible();

    // Verifikasi Layout Animator (Clip/Properties/Panel Header)
    const animatorTitle = page.getByText(/Clip|Properties/i).first();
    await expect(animatorTitle).toBeVisible();

    // 5. Verifikasi Event Bus Sync
    await expect.poll(async () => {
      return await page.evaluate(() => window.__capturedEngineEvents || []);
    }).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ componentName: 'SpriteAnimator' })
      ])
    );
  });

});