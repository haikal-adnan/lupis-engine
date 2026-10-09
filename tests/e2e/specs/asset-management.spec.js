import { test, expect } from '../fixtures.js';

// Spec ini boleh memakai flow hierarchy (hierarchyCrud) hanya untuk SETUP entity.
test.use({
  projectOptions: {
    prefix: 'Asset E2E',
    description: 'E2E testing workspace for Asset Management features',
  },
});

test.describe('Asset Management E2E Tests', () => {
  test.beforeEach(async ({ assets }) => {
    // Pastikan tab Assets aktif dan panel settle sebelum test berjalan
    await assets.ensureOpen();
  });

  test('uploads image asset and attaches to entity via SpriteRenderer', async ({ assets, hierarchyCrud, popup }) => {
    // Arrange: Create target entity with SpriteRenderer capability in World section
    const worldSection = hierarchyCrud.hierarchy.section('World');
    await expect(worldSection).toBeVisible();

    await hierarchyCrud.layer.create('World', 'Main Layer');
    const mainLayer = hierarchyCrud.hierarchy.nodeByName('Main Layer');
    const spriteEntity = await hierarchyCrud.entity.create(mainLayer, 'Sprite');
    const entityId = await spriteEntity.getAttribute('data-node-id');

    // Act: Upload real image asset
    await assets.upload('sample_image.png');

    // Assert: Verify asset renders in Asset Panel by exact title attribute
    const assetCard = assets.card('sample_image');
    await expect(assetCard).toBeVisible();

    // Act: Select entity in Hierarchy and attach asset via Context Menu
    await spriteEntity.click();
    await popup.selectContextMenu(assetCard, 'Apply to SpriteRenderer');

    // Assert: Verify feedback pop alert and ensure stable target entity remains intact
    await popup.expectPopAlert('Success');
    const targetEntity = hierarchyCrud.hierarchy.nodeById(entityId);
    await expect(targetEntity).toBeVisible();
  });

  test('uploads font asset and attaches to text entity via TextRenderer', async ({ page, assets, hierarchyCrud, popup }) => {
    // Arrange: Create layer and Text entity in World section
    const worldSection = hierarchyCrud.hierarchy.section('World');
    await expect(worldSection).toBeVisible();

    await hierarchyCrud.layer.create('World', 'Main Layer');
    const mainLayer = hierarchyCrud.hierarchy.nodeByName('Main Layer');

    await hierarchyCrud.entity.create(mainLayer, 'Text');

    // Re-locate specific non-layer entity node to avoid strict mode collisions
    const textEntity = page
      .locator('.group\\/node:not([data-node-type="layer"])')
      .filter({ hasText: /Text|Entity/i })
      .first();

    await expect(textEntity).toBeVisible();
    const entityId = await textEntity.getAttribute('data-node-id');

    // Act: Upload real font asset
    await assets.upload('sample_font.ttf');

    // Assert: Verify font card visibility
    const fontCard = assets.card('sample_font');
    await expect(fontCard).toBeVisible();

    // Act: Select text entity and attach font via Context Menu
    await textEntity.click();
    await popup.selectContextMenu(fontCard, 'Apply to TextRenderer');

    // Assert: Verify feedback pop alert and stable target entity
    await popup.expectPopAlert('Success');
    const targetEntity = hierarchyCrud.hierarchy.nodeById(entityId);
    await expect(targetEntity).toBeVisible();
  });

  test('uploads audio asset and verifies rendering in Asset Panel', async ({ assets }) => {
    // Act: Upload real audio asset
    await assets.upload('sample_audio.ogg');

    // Assert: Verify audio card is visible in workspace
    await expect(assets.card('sample_audio')).toBeVisible();
  });

  test('creates new folder, moves asset inside, and navigates via breadcrumbs', async ({ page, assets, popup }) => {
    // Arrange: Upload initial image asset
    await assets.upload('sample_image.png');

    const assetItem = assets.card('sample_image');
    await expect(assetItem).toBeVisible();

    // Act: Create new folder via Asset Grid Context Menu
    await popup.selectContextMenu(assets.grid, 'New Folder');
    await popup.fillPromptAndSubmit('New Folder', 'Textures', 'Create');

    const folderItem = assets.card('Textures');
    await expect(folderItem).toBeVisible();

    // Act: Drag and drop asset item into folder
    await assetItem.dragTo(folderItem);

    // Assert: Asset moved out of root container
    await expect(assetItem).toHaveCount(0);

    // Act: Navigate inside folder
    await folderItem.dblclick();

    // Assert: Breadcrumb updates and asset is visible inside folder
    await expect(assets.breadcrumb('Textures')).toBeVisible();
    await expect(assets.card('sample_image')).toBeVisible();

    // Act: Navigate back to root via Asset Panel specific breadcrumb
    await assets.breadcrumbRoot.click();

    // Assert: Folder item is visible at root level
    await expect(folderItem).toBeVisible();
  });

  test('renames asset and updates label reactively', async ({ assets, popup }) => {
    // Arrange: Upload target image asset
    await assets.upload('sample_image.png');

    const assetItem = assets.card('sample_image');
    await expect(assetItem).toBeVisible();

    // Act: Trigger Rename operation
    await popup.selectContextMenu(assetItem, 'Rename');
    await popup.fillPromptAndSubmit('Rename Asset', 'sample_image_renamed', 'Rename');

    // Assert: Verify pop alert and reactive DOM updates
    await popup.expectPopAlert('Success');
    await expect(assets.card('sample_image_renamed')).toBeVisible();
    await expect(assets.cardsByTitle('sample_image')).toHaveCount(0);
  });

  test('duplicates asset using clipboard operations', async ({ page, assets }) => {
    // Arrange: Upload font asset
    await assets.upload('sample_font.ttf');

    const assetItem = assets.card('sample_font');
    await expect(assetItem).toBeVisible();

    // Act: Klik item untuk memilihnya (aktifkan active/selected state di UI)
    await assetItem.click();

    // Tentukan modifier keyboard berdasarkan OS (Control untuk Win/Linux, Meta/Cmd untuk macOS)
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+c`);
    await page.keyboard.press(`${modifier}+v`);

    // Assert: Asset hasil duplikasi muncul dengan suffix "(Copy)"
    const duplicatedCard = assets.cardContaining('sample_font (Copy)');
    await expect(duplicatedCard).toBeVisible({ timeout: 10000 });
  });

  test('deletes asset from workspace following modal confirmation', async ({ assets, popup }) => {
    // Arrange: Upload audio asset
    await assets.upload('sample_audio.ogg');

    const assetItem = assets.card('sample_audio');
    await expect(assetItem).toBeVisible();

    // Act: Trigger Delete operation and confirm modal
    await popup.selectContextMenu(assetItem, 'Delete');
    await popup.confirmAction('Delete Asset?', { action: 'confirm', confirmText: 'Confirm' });

    // Assert: Asset removed from DOM
    await expect(assets.cardsByTitle('sample_audio')).toHaveCount(0);
  });

  test('[Bad Path] cancels asset deletion and verifies state remains unchanged', async ({ assets, popup }) => {
    // Arrange: Upload target image asset
    await assets.upload('sample_image.png');

    const assetItem = assets.card('sample_image');
    await expect(assetItem).toBeVisible();

    // Act: Trigger Delete action but cancel on modal dialog
    await popup.selectContextMenu(assetItem, 'Delete');
    await popup.confirmAction('Delete Asset?', { action: 'cancel', cancelText: 'Cancel' });

    // Assert: Asset remains visible in DOM
    await expect(assetItem).toBeVisible();
  });
});