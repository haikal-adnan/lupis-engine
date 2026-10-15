import { test, expect } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Asset E2E Complete',
    description: 'Comprehensive E2E coverage for Asset Management & Entity Assignments',
  },
});

test.describe('Asset Management Comprehensive E2E Tests', () => {
  test.beforeEach(async ({ assets }) => {
    await assets.ensureOpen();
  });

  // =========================================================================
  // 1. UPLOAD ASSET AT ROOT & INSIDE FOLDERS (IMAGE, FONT, AUDIO)
  // =========================================================================
  test('uploads image, font, and audio assets to root and subfolder', async ({ assets, popup }) => {
    // Upload & Auto-wait via AssetPanelPage.upload
    await assets.upload('sample_image.png');
    await assets.upload('sample_font.ttf');
    await assets.upload('sample_audio.ogg');

    await expect(assets.card('sample_image')).toBeVisible();
    await expect(assets.card('sample_font')).toBeVisible();
    await expect(assets.card('sample_audio')).toBeVisible();

    // Create a target folder via context menu
    await popup.selectContextMenu(assets.grid, 'New Folder');
    await popup.fillPromptAndSubmit('New Folder', 'MediaVault', 'Create');
    const folderCard = assets.card('MediaVault');
    await expect(folderCard).toBeVisible();

    // Enter subfolder and upload assets inside
    await folderCard.dblclick();
    await expect(assets.breadcrumb('MediaVault')).toBeVisible();

    await assets.upload('sample_image.png');
    await expect(assets.cardContaining('sample_image')).toBeVisible();

    // Return to root folder
    await assets.breadcrumbRoot.click();
    await expect(folderCard).toBeVisible();
  });

  // =========================================================================
  // 2. FOLDER DEPTH 5 & BREADCRUMB NAVIGATION
  // =========================================================================
  test('creates a folder tree of depth 5 and navigates breadcrumbs accurately', async ({ assets, popup }) => {
    const folderTree = ['Level1', 'Level2', 'Level3', 'Level4', 'Level5'];

    await assets.createNestedFolders(folderTree, popup);

    for (const name of folderTree) {
      await expect(assets.breadcrumb(name)).toBeVisible();
    }

    await assets.upload('sample_image.png');
    await expect(assets.card('sample_image')).toBeVisible();

    await assets.breadcrumb('Level3').click();
    await expect(assets.breadcrumb('Level3')).toBeVisible();
    await expect(assets.breadcrumb('Level4')).toBeHidden();
    await expect(assets.card('Level4')).toBeVisible();

    await assets.breadcrumbRoot.click();
    await expect(assets.card('Level1')).toBeVisible();
  });

  // =========================================================================
  // 3. MOVE ASSET TO DIFFERENT FOLDER DEPTHS
  // =========================================================================
  test('moves asset across different folder depth levels using Cut & Paste', async ({ assets, popup }) => {
    await assets.createNestedFolders(['Level1', 'Level2'], popup);

    await assets.upload('sample_image.png');
    const assetCard = assets.card('sample_image');
    await expect(assetCard).toBeVisible();

    await popup.selectContextMenu(assetCard, 'Cut');

    await assets.breadcrumbRoot.click();
    await expect(assets.card('Level1')).toBeVisible();

    await popup.selectContextMenu(assets.grid, 'Paste');

    await expect(assets.card('sample_image')).toBeVisible();

    await assets.card('Level1').dblclick();
    await assets.card('Level2').dblclick();
    await expect(assets.cardsByTitle('sample_image')).toHaveCount(0);
  });

  // =========================================================================
  // 4. ALL CONTEXT MENU OPERATIONS (COPY ID, CUT, COPY, RENAME, DELETE)
  // =========================================================================
  test('executes Copy ID, Cut, Copy, Rename, and Delete context menu actions', async ({ page, context, assets, popup }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await assets.upload('sample_image.png');
    const assetCard = assets.card('sample_image');
    await expect(assetCard).toBeVisible();

    // 1. Copy ID
    await popup.selectContextMenu(assetCard, 'Copy ID');
    await popup.expectPopAlert('Success');

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).not.toBe('');

    // 2. Rename
    await popup.selectContextMenu(assetCard, 'Rename');
    await popup.fillPromptAndSubmit('Rename Asset', 'renamed_hero_bg', 'Rename');

    const renamedCard = assets.card('renamed_hero_bg');
    await expect(renamedCard).toBeVisible();
    await expect(assets.cardsByTitle('sample_image')).toHaveCount(0);

    // 3. Copy & Paste (Duplicate)
    await popup.selectContextMenu(renamedCard, 'Copy');
    await popup.selectContextMenu(assets.grid, 'Paste');
    const duplicatedCard = assets.cardContaining('renamed_hero_bg (Copy)');
    await expect(duplicatedCard).toBeVisible();

    // 4. Delete
    await popup.selectContextMenu(duplicatedCard, 'Delete');
    await popup.confirmAction('Delete Asset?', { action: 'confirm', confirmText: 'Confirm' });
    await expect(duplicatedCard).toBeHidden();
  });

  // =========================================================================
  // 5. SEARCH ASSET
  // =========================================================================
  test('filters assets by search query reactively and clears filter', async ({ assets, controls }) => {
    await assets.upload('sample_image.png');
    await assets.upload('sample_font.ttf');
    await assets.upload('sample_audio.ogg');

    await expect(assets.card('sample_image')).toBeVisible();
    await expect(assets.card('sample_font')).toBeVisible();
    await expect(assets.card('sample_audio')).toBeVisible();

    await assets.searchInput.fill('font');
    await expect(assets.card('sample_font')).toBeVisible();
    await expect(assets.cardsByTitle('sample_image')).toHaveCount(0);
    await expect(assets.cardsByTitle('sample_audio')).toHaveCount(0);

    // Section 7.4 pairing: search-input <-> search-clear-button (used by BaseControlHelper.clearSearch)
    await controls.clearSearch('search-input', assets.panel);

    await expect(assets.card('sample_image')).toBeVisible();
    await expect(assets.card('sample_font')).toBeVisible();
    await expect(assets.card('sample_audio')).toBeVisible();
  });

  // =========================================================================
  // 6. ASSET ATTACHMENT TO ENTITIES
  // =========================================================================
  // NOTE: configureAudioComponent has no `assetId` parameter. It supports
  // `audioFileName`, which uploads and applies the file in a single step, so the
  // test relies on that instead of a separate manual upload + apply.
  test('attaches Audio asset to an Empty Entity with Audio Component', async ({ hierarchyCrud, inspectorCrud, popup }) => {
    const mainLayer = await hierarchyCrud.layer.create('World', 'Main Layer');
    const emptyEntity = await hierarchyCrud.entity.create(mainLayer, 'empty');
    const entityId = await emptyEntity.getAttribute('data-node-id');

    await emptyEntity.click();
    await inspectorCrud.configureAudioComponent({
      volume: 90,
      audioFileName: 'sample_audio.ogg',
    });

    await popup.expectPopAlert('Success');
    const targetEntity = hierarchyCrud.hierarchy.nodeById(entityId);
    await expect(targetEntity).toBeVisible();
  });

  test('attaches Image asset to Empty Sprite and Tilemap entities', async ({ assets, hierarchyCrud, popup }) => {
    const mainLayer = await hierarchyCrud.layer.create('World', 'Main Layer');

    const spriteEntity = await hierarchyCrud.entity.create(mainLayer, 'sprite');
    const spriteId = await spriteEntity.getAttribute('data-node-id');

    const tilemapEntity = await hierarchyCrud.entity.create(mainLayer, 'tilemap');
    const tilemapId = await tilemapEntity.getAttribute('data-node-id');

    await assets.upload('sample_image.png');
    const imageCard = assets.card('sample_image');
    await expect(imageCard).toBeVisible();

    await spriteEntity.click();
    await popup.selectContextMenu(imageCard, 'Apply to SpriteRenderer');
    await popup.expectPopAlert('Success');
    await expect(hierarchyCrud.hierarchy.nodeById(spriteId)).toBeVisible();

    await tilemapEntity.click();
    await popup.selectContextMenu(imageCard, 'Apply to Tilemap');
    await popup.expectPopAlert('Success');
    await expect(hierarchyCrud.hierarchy.nodeById(tilemapId)).toBeVisible();
  });

  test('attaches Font asset to Text entity via TextRenderer', async ({ assets, hierarchyCrud, popup }) => {
    const mainLayer = await hierarchyCrud.layer.create('World', 'Main Layer');
    const textEntity = await hierarchyCrud.entity.create(mainLayer, 'text');
    const entityId = await textEntity.getAttribute('data-node-id');

    await assets.upload('sample_font.ttf');
    const fontCard = assets.card('sample_font');
    await expect(fontCard).toBeVisible();

    await textEntity.click();
    await expect(textEntity).toHaveAttribute('aria-selected', 'true');

    await popup.selectContextMenu(fontCard, 'Apply to TextRenderer');

    await popup.expectPopAlert('Success');
    const updatedEntity = hierarchyCrud.hierarchy.nodeById(entityId);
    await expect(updatedEntity).toBeVisible();
  });

  // =========================================================================
  // 7. [BAD PATH] SCENARIOS
  // =========================================================================
  test('[Bad Path] cancels deletion modal and ensures asset state remains intact', async ({ assets, popup }) => {
    await assets.upload('sample_image.png');
    const assetCard = assets.card('sample_image');
    await expect(assetCard).toBeVisible();

    await popup.selectContextMenu(assetCard, 'Delete');
    await popup.confirmAction('Delete Asset?', { action: 'cancel', cancelText: 'Cancel' });

    await expect(assetCard).toBeVisible();
  });

  test('[Bad Path] verifies audio applier option is hidden when target entity lacks Audio Component', async ({ page, assets, hierarchyCrud, popup }) => {
    const mainLayer = await hierarchyCrud.layer.create('World', 'Main Layer');
    const emptyEntity = await hierarchyCrud.entity.create(mainLayer, 'empty');
    await emptyEntity.click();

    await assets.upload('sample_audio.ogg');
    const audioCard = assets.card('sample_audio');
    await expect(audioCard).toBeVisible();

    await emptyEntity.click();
    await popup.selectContextMenu(audioCard, []);

    const menuItem = popup.activeMenus.getByRole('menuitem', { name: 'Apply to Audio Component' });
    await expect(menuItem).toHaveCount(0);

    // Cleanup open context menu
    await page.keyboard.press('Escape');
  });

  // =========================================================================
  // 8. METADATA SCHEMA INTEGRITY & OPFS PERSISTENCE (EDGE CASE)
  // =========================================================================
  test('persists accurate metadata in OPFS assets.json and excludes fntFile from non-font assets', async ({ page, assets }) => {
    // Arrange & Act: Upload image, audio, and font
    await assets.upload('sample_image.png');
    await assets.upload('sample_audio.ogg');
    await assets.upload('sample_font.ttf');

    await expect(assets.card('sample_image')).toBeVisible();
    await expect(assets.card('sample_audio')).toBeVisible();
    await expect(assets.card('sample_font')).toBeVisible();

    // Assert: Read workspaces/assets.json directly from OPFS
    const projectId = page.url().match(/\/editor\/([^/?#]+)/)?.[1];
    const assetsData = await page.evaluate(async (pid) => {
      const root = await navigator.storage.getDirectory();
      const appDir = await root.getDirectoryHandle('lupis-engine');
      const projectsDir = await appDir.getDirectoryHandle('projects');
      const projDir = await projectsDir.getDirectoryHandle(pid);
      const workspacesDir = await projDir.getDirectoryHandle('workspaces');
      const assetsFile = await workspacesDir.getFileHandle('assets.json');
      const file = await assetsFile.getFile();
      return JSON.parse(await file.text());
    }, projectId);

    const imageAsset = assetsData.find((a) => a.name === 'sample_image');
    const audioAsset = assetsData.find((a) => a.name === 'sample_audio');
    const fontAsset = assetsData.find((a) => a.name === 'sample_font');

    expect(imageAsset).toBeDefined();
    expect(imageAsset.type).toBe('texture');
    expect(imageAsset.meta.hasBmFont).toBe(false);
    expect(imageAsset.meta.fntFile).toBeUndefined();
    expect(imageAsset.meta.pngFiles).toBeUndefined();

    expect(audioAsset).toBeDefined();
    expect(audioAsset.type).toBe('audio');
    expect(audioAsset.meta.hasBmFont).toBe(false);
    expect(audioAsset.meta.fntFile).toBeUndefined();
    expect(audioAsset.meta.pngFiles).toBeUndefined();

    expect(fontAsset).toBeDefined();
    expect(fontAsset.type).toBe('font');
    expect(fontAsset.meta.hasBmFont).toBe(true);
    expect(typeof fontAsset.meta.fntFile).toBe('string');
    expect(fontAsset.meta.fntFile.endsWith('.fnt')).toBe(true);
    expect(Array.isArray(fontAsset.meta.pngFiles)).toBe(true);
  });
});
