import { test, expect } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Inspector Comprehensive E2E',
    description: 'Exhaustive E2E testing for Audio, Script Controller, Sprite Renderer, and Text Renderer inspector components.',
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

test.describe('Property Inspector: Exhaustive Multi-Component E2E Testing', () => {

  test.beforeEach(async ({ page }) => {
    await installBusSpy(page);
  });

  // =========================================================================
  // 1. AUDIO INSPECTOR COMPONENT (EXHAUSTIVE TEST)
  // =========================================================================
  test('tests all properties and interactive features in Audio Editor component', async ({ page, hierarchy, popup, inspector, assetCrud }) => {
    const audioFileName = 'sample_audio.ogg';

    // 1. Buat Entity & Tambahkan Komponen Audio
    const worldLayer = hierarchy.nodeByName('World Layer');
    await popup.selectContextMenu(worldLayer, ['Add Entity', 'Empty Entity']);

    const entityNode = hierarchy.nodesByText(/Empty/i).first();
    await expect(entityNode).toBeVisible();
    await entityNode.click();

    await inspector.ensureAudioComponent();
    await inspector.audioSection.scrollIntoViewIfNeeded();

    // 2. Tambahkan Clip & Set Properti Teks/Angka
    await inspector.addAudioClip();
    await inspector.setClipScriptId('SFX_EXPLOSION_MAIN');
    await inspector.setAudioVolume(80);
    await inspector.setAudioPitch(1.5);

    // 3. Toggle Mute, Autoplay, dan Loop
    await inspector.toggleAudioMute();
    const muteBtn = page.getByTestId('audio-active-toggle');
    await expect(muteBtn).toHaveAttribute('data-active', 'false');

    await inspector.toggleAudioAutoplay();
    const autoplayBtn = page.getByTestId('audio-autoplay-toggle');
    await expect(autoplayBtn).toHaveAttribute('data-active', 'true');

    await inspector.toggleAudioLoop();
    const loopBtn = page.getByTestId('audio-loop-toggle');
    await expect(loopBtn).toHaveAttribute('data-active', 'true');

    // 4. Test Spatial 2D vs Persist Rule
    await inspector.toggleAudioSpatial();
    const spatialBtn = page.getByTestId('audio-spatial-toggle');
    await expect(spatialBtn).toHaveAttribute('data-active', 'true');

    // Saat Persist diaktifkan, Spatial harus ter-disable otomatis
    await inspector.toggleAudioPersist();
    const persistBtn = page.getByTestId('audio-persist-toggle');
    await expect(persistBtn).toHaveAttribute('data-active', 'true');
    await expect(spatialBtn).toBeDisabled();

    // Matikan Persist kembali untuk mengkonfirmasi Spatial aktif lagi
    await inspector.toggleAudioPersist();
    await expect(spatialBtn).toBeEnabled();

    // 5. Hubungkan Audio Asset menggunakan Context Menu
    const audioCard = await assetCrud.uploadAsset(audioFileName);
    await assetCrud.applyToActiveEntity(audioCard, 'Apply to Active Audio Clip');

    // Verifikasi Nama Asset terpasang pada tombol Audio Play
    const playBtn = page.getByTestId('audio-play-btn');
    await expect(playBtn).toContainText('sample_audio');

    // 6. Verifikasi Event Bus memuat pembaruan properti Audio
    await expect.poll(async () => {
      return await page.evaluate(() => window.__capturedEngineEvents || []);
    }).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ componentName: 'Audio' })
      ])
    );
  });

  // =========================================================================
  // 2. SCRIPT CONTROLLER COMPONENT (EXHAUSTIVE TEST)
  // =========================================================================
  test('tests all properties and attach flows in Script Controller component', async ({ hierarchy, popup, inspector, scriptCrud }) => {
    const entityName = 'PlayerCharacter';
    const scriptName = 'PlayerControllerScript';

    // 1. Buat Entity, Rename, dan pasangkan Script Controller
    const worldLayer = hierarchy.nodeByName('World Layer');
    await popup.selectContextMenu(worldLayer, ['Add Entity', 'Empty Entity']);

    const entityNode = hierarchy.nodesByText(/Empty/i).first();
    await expect(entityNode).toBeVisible();
    await entityNode.click();

    await inspector.setEntityName(entityName);
    await inspector.ensureScriptControllerComponent();

    // 2. Buat Script baru via Flow Script & Attach ke Entity
    await scriptCrud.createScript(scriptName);
    await scriptCrud.attachScriptToEntity(scriptName, entityName);

    // 3. Fokuskan kembali ke Entity di Hierarchy agar Inspector memuat Script aktif
    const playerNode = hierarchy.nodesByText(entityName).first();
    await expect(playerNode).toBeVisible();
    await playerNode.click();

    // 4. Verifikasi Script Name tertera pada Dropdown Trigger
    const scriptDropdownTrigger = inspector.scriptControllerSection.getByTestId('script-controller-dropdown-trigger');
    await expect(scriptDropdownTrigger).toContainText(scriptName);

    // 5. Uji Toggle Active Status setelah Script terpasang (Elemen v-if="currentScript" sudah ada)
    await inspector.toggleScriptActive();
    const scriptActiveToggle = inspector.scriptControllerSection.getByTestId('script-controller-active-toggle');
    await expect(scriptActiveToggle).toHaveAttribute('data-active', 'false');

    await inspector.toggleScriptActive();
    await expect(scriptActiveToggle).toHaveAttribute('data-active', 'true');
  });

  // =========================================================================
  // 3. SPRITE RENDERER COMPONENT (EXHAUSTIVE TEST)
  // =========================================================================
  test('tests all properties, rect controls, SDF, filter modes, and conflicts in Sprite Renderer', async ({ page, hierarchy, popup, inspector, assetCrud }) => {
    const textureFileName = 'sample_image.png';

    // 1. Buat Entity dan Pasang Sprite Renderer Component
    const worldLayer = hierarchy.nodeByName('World Layer');
    await popup.selectContextMenu(worldLayer, ['Add Entity', 'Empty Entity']);

    const entityNode = hierarchy.nodesByText(/Empty/i).first();
    await expect(entityNode).toBeVisible();
    await entityNode.click();

    await inspector.ensureSpriteRendererComponent();

    // 2. Modifikasi Source Rect & Opacity
    await inspector.setSpriteSourceRect(8, 16, 128, 256);
    await inspector.setSpriteOpacity(60);

    const sourceX = page.getByTestId('sprite-renderer-source-x').locator('input').first();
    const sourceW = page.getByTestId('sprite-renderer-source-w').locator('input').first();
    const opacityInput = page.getByTestId('sprite-renderer-opacity').locator('input').first();

    await expect(sourceX).toHaveValue('8');
    await expect(sourceW).toHaveValue('128');
    await expect(opacityInput).toHaveValue('60');

    // 3. Uji Rendering Filter Mode & Signed Distance Field (SDF) Toggle
    await inspector.setSpriteFilterMode('Smooth');
    await inspector.toggleSpriteSDF();

    const sdfToggle = page.getByTestId('sprite-renderer-sdf-toggle');
    await expect(sdfToggle).toHaveAttribute('data-active', 'true');

    // 4. Terapkan Texture Asset via Context Menu
    const textureCard = await assetCrud.uploadAsset(textureFileName);
    await assetCrud.applyToActiveEntity(textureCard, 'Apply to SpriteRenderer');

    // Verifikasi Asset Name terpasang
    const assetBtn = page.getByTestId('sprite-renderer-asset-btn');
    await expect(assetBtn).not.toContainText('None');

    // 5. Verifikasi aturan "Renderer Conflict" pada Add Component Dropdown
    await inspector.addComponentContainer.scrollIntoViewIfNeeded();
    await page.getByTestId('add-component-select').click();

    const textRendererOption = page.getByTestId('select-option').filter({ hasText: /Text Renderer/i }).first();
    await expect(textRendererOption).toHaveAttribute('aria-disabled', 'true');
  });

  // =========================================================================
  // 4. TEXT RENDERER COMPONENT (EXHAUSTIVE TEST)
  // =========================================================================
  test('tests all properties, text input, alignment, mode, and drop shadow in Text Renderer', async ({ page, hierarchy, popup, inspector, assetCrud }) => {
    const fontFileName = 'sample_font.ttf';

    // 1. Buat UI Entity dengan Text Renderer Component
    const uiLayer = hierarchy.nodeByName('UI Layer');
    await popup.selectContextMenu(uiLayer, ['Add UI Element', 'Empty UI']);

    const uiEntityNode = hierarchy.nodesByText(/Empty/i).first();
    await expect(uiEntityNode).toBeVisible();
    await uiEntityNode.click();

    await inspector.ensureTextRendererComponent();

    // 2. Modifikasi Isinya, Mode, Ukuran Font, dan Alignment
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

    // 3. Konfigurasi Drop Shadow Properti
    await inspector.toggleTextShadow(true);
    const shadowToggle = page.getByTestId('text-renderer-shadow-toggle').locator('input[type="checkbox"]').or(page.getByTestId('text-renderer-shadow-toggle')).first();
    await expect(shadowToggle).toBeChecked();

    const shadowColorPicker = page.getByTestId('text-renderer-shadow-color-picker');
    await expect(shadowColorPicker).toBeVisible();

    // 4. Hubungkan Font Asset dari Asset Flow menggunakan "Apply to TextRenderer"
    const fontCard = await assetCrud.uploadAsset(fontFileName);
    await assetCrud.applyToActiveEntity(fontCard, 'Apply to TextRenderer');

    // Verifikasi Font Button di Inspector
    const fontBtn = page.getByTestId('text-renderer-font-btn');
    await expect(fontBtn).toBeVisible();
  });

});