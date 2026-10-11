import { test, expect } from '../fixtures.js';

test.use({
  projectOptions: {
    prefix: 'Animator E2E Complete',
    description: 'Comprehensive E2E coverage for Animator Panel, Tree, Property Inspector, Timeline, and Viewport Settings',
  },
});

test.describe('Animator Panel System E2E Workflow Tests', () => {

  // =========================================================================
  // 1. ALUR UTAMA: ENTITY SETUP, CLIP CREATION, INSPECTOR & TIMELINE PLAYBACK
  // =========================================================================
  test('executes complete end-to-end setup, clip property edits, and timeline controls', async ({
    page,
    hierarchyCrud,
    inspectorCrud,
    animatorCrud,
    animatorPage,
  }) => {
    // 1. Arrange: Buat Layer & Entity Sprite Baru
    const worldLayer = await hierarchyCrud.layer.create('World', 'Character Layer');
    const spriteEntity = await hierarchyCrud.entity.create(worldLayer, 'sprite');
    const entityId = await spriteEntity.getAttribute('data-node-id');

    await spriteEntity.click();
    await expect(spriteEntity).toHaveAttribute('aria-selected', 'true');

    // 2. Act: Konfigurasi SpriteAnimator & Buka Workspace Tab
    await inspectorCrud.configureSpriteAnimator({
      sampleImageName: 'sample_image.png',
      openEditor: true,
    });

    const activeTab = page
      .locator(`[data-tab-id="${entityId}"], [aria-selected="true"]:not([data-testid="hierarchy-node"])`)
      .first();
    await expect(activeTab).toBeVisible();

    // 3. Act: Buat Hirarki Kategori & Clip
    await animatorCrud.createCategoryViaContextMenu();
    const categoryNode = animatorPage.treeNodeByName('New Category');
    await expect(categoryNode).toBeVisible();

    await animatorCrud.renameClipOrCategory(categoryNode, 'Locomotion');
    const renamedCategory = animatorPage.treeNodeByName('Locomotion');
    await expect(renamedCategory).toBeVisible();

    await animatorCrud.createClipViaContextMenu(renamedCategory);
    const clipNode = animatorPage.treeNodeByName('New Clip');
    await animatorCrud.selectClipNode(clipNode);

    // 4. Act & Assert: Pengaturan Properti Klip Komprehensif
    await animatorCrud.configureClipProperties({
      scriptId: 'walk_01',
      name: 'Hero_Walk',
      fps: 24,
      loop: 'True (Loop)',
      flipX: true,
      filterMode: 'Smooth',
    });

    await expect(animatorPage.scriptIdInput).toHaveValue('walk_01');
    await expect(animatorPage.clipNameInput).toHaveValue('Hero_Walk');
    await expect(animatorPage.fpsInput).toHaveValue('24');
    await expect(animatorPage.flipXButton).toHaveClass(/bg-primary\/20/);

    // 5. Act & Assert: Manipulasi Timeline Frame & Control Playback
    await animatorCrud.addFrameToTimeline();
    await expect(animatorPage.timelineFrameItems).toHaveCount(1);

    await animatorCrud.addFrameToTimeline();
    await expect(animatorPage.timelineFrameItems).toHaveCount(2);
    await expect(animatorPage.timelineFrameCounter).toHaveText('2 / 2');

    await animatorCrud.setSourceRect(0, 0, 64, 64);
    await expect(animatorPage.sourceRectW).toHaveValue('64');
    await expect(animatorPage.sourceRectH).toHaveValue('64');

    // Step Backward / Forward
    await animatorPage.timelineStepBackBtn.click();
    await expect(animatorPage.timelineFrameCounter).toHaveText('1 / 2');

    await animatorPage.timelineStepForwardBtn.click();
    await expect(animatorPage.timelineFrameCounter).toHaveText('2 / 2');

    // Toggle Playback
    await expect(animatorPage.timelinePlayToggle).toBeVisible();
    await animatorPage.timelinePlayToggle.click();
    await expect(animatorPage.timelinePlayToggle).toHaveClass(/bg-amber-500/);

    await animatorPage.timelinePlayToggle.click();
    await expect(animatorPage.timelinePlayToggle).not.toHaveClass(/bg-amber-500/);
  });

  // =========================================================================
  // 2. TREE HEADER MENU, SEARCH, COPY-PASTE, SHORTCUTS & DESELECTION
  // =========================================================================
  test('manages clip searching, header actions, node duplication, and keyboard shortcuts', async ({
    page,
    hierarchyCrud,
    inspectorCrud,
    animatorCrud,
    animatorPage,
    popup,
  }) => {
    // Arrange
    const worldLayer = await hierarchyCrud.layer.create('World', 'Actors Layer');
    const spriteEntity = await hierarchyCrud.entity.create(worldLayer, 'sprite');

    await spriteEntity.click();
    await inspectorCrud.configureSpriteAnimator({
      sampleImageName: 'sample_image.png',
      openEditor: true,
    });

    // Act: Buat Clip melalui Header Menu Dropdown
    await animatorPage.treeMoreMenuTrigger.click();
    await expect(animatorPage.treeNewClipBtn).toBeVisible();
    await animatorPage.treeNewClipBtn.click();

    const clipNode = animatorPage.treeNodeByName('New Clip');
    await animatorCrud.selectClipNode(clipNode);

    await animatorCrud.renameClipOrCategory(clipNode, 'Idle_Anim');
    const idleClip = animatorPage.treeNodeByName('Idle_Anim');
    await expect(idleClip).toBeVisible();

    // Context Menu Duplicate
    await popup.selectContextMenu(idleClip, 'Duplicate');
    await expect(animatorPage.treeNodesByName('Idle_Anim')).toHaveCount(2);

    // Search Filter
    await animatorPage.treeSearchInput.fill('Idle');
    await expect(animatorPage.treeNodesByName('Idle_Anim').first()).toBeVisible();

    await animatorPage.treeSearchInput.fill('NonExistentAnim');
    await expect(animatorPage.treeEmptyState).toBeVisible();

    await animatorPage.treeSearchInput.fill('');
    await expect(animatorPage.treeNodesByName('Idle_Anim').first()).toBeVisible();

    // Keyboard Shortcut (Copy & Paste)
    await animatorPage.treeSearchInput.blur();
    await animatorCrud.ensureClipSelected(idleClip);
    await page.keyboard.press('Control+c');
    await page.keyboard.press('Control+v');
    await expect(animatorPage.treeNodesByName('Idle_Anim')).toHaveCount(3);

    // Deselect Clip dengan mengklik area kosong tree content
    await animatorPage.treeContent.click({ position: { x: 5, y: 5 } });
    await expect(animatorPage.clipNameInput).toHaveCount(0);
    await expect(animatorPage.helperNoClipSettings).toBeVisible();
  });

  // =========================================================================
  // 3. TIMELINE AUTOFILL, REMOVE FRAME, SOURCE CREATION & MORE MENU
  // =========================================================================
  test('manages timeline autofill, frame removal, source creation, and source options', async ({
    page,
    hierarchyCrud,
    inspectorCrud,
    animatorCrud,
    animatorPage,
    popup,
  }) => {
    // Arrange
    const worldLayer = await hierarchyCrud.layer.create('World', 'Timeline Layer');
    const spriteEntity = await hierarchyCrud.entity.create(worldLayer, 'sprite');

    await spriteEntity.click();
    await inspectorCrud.configureSpriteAnimator({
      sampleImageName: 'sample_image.png',
      openEditor: true,
    });

    await animatorCrud.createClipViaContextMenu();
    const clipNode = animatorPage.treeNodeByName('New Clip');
    await animatorCrud.selectClipNode(clipNode);

    // AutoFill Timeline
    await animatorCrud.ensureTimelineFocused();
    await animatorPage.timelineAutoFillBtn.click();
    await popup.fillPromptAndSubmit('Auto Fill Frames', '128', 'Auto Fill');
    await expect(animatorPage.timelineFrameItems).toHaveCount(4);

    // Remove Single Frame
    await animatorPage.timelineRemoveFrameBtnByIndex(0).click();
    await expect(animatorPage.timelineFrameItems).toHaveCount(3);

    // Create New Source via Select Action
    const sourceTrigger = animatorPage.sourceSelect
      .getByTestId('select-trigger')
      .or(animatorPage.sourceSelect.locator('button, [role="combobox"]'))
      .or(animatorPage.sourceSelect)
      .first();
    await expect(sourceTrigger).toBeVisible();
    await sourceTrigger.click();

    const createSourceAction = page
      .getByTestId('select-action')
      .or(page.getByTestId('select-option').filter({ hasText: /Create New Source/i }))
      .or(page.locator('button', { hasText: /Create New Source/i }))
      .or(page.getByRole('option', { name: /Create New Source/i }))
      .first();

    await expect(createSourceAction).toBeVisible();
    await createSourceAction.click();

    await popup.fillPromptAndSubmit('New Source', 'run_01', 'Create');

    // Source More Menu: Rename Clip
    await animatorPage.sourceMoreMenuTrigger.click();
    await expect(animatorPage.timelineRenameClipBtn).toBeVisible();
    await animatorPage.timelineRenameClipBtn.click();
    await popup.fillPromptAndSubmit('Rename Clip', 'Renamed_Run', 'Rename');
    await expect(animatorPage.clipNameInput).toHaveValue('Renamed_Run');

    // Source More Menu: Delete All Sources
    await animatorPage.sourceMoreMenuTrigger.click();
    await expect(animatorPage.timelineDeleteAllSourcesBtn).toBeVisible();
    await animatorPage.timelineDeleteAllSourcesBtn.click();
    await popup.confirmAction('Delete All Sources?', { action: 'confirm', confirmText: 'Delete All' });
  });

  // =========================================================================
  // 4. EDITOR PANEL VIEWPORT HUD & VIEWPORT SETTINGS
  // =========================================================================
  test('configures viewport overlays and displays zoom and entity info on panel', async ({
    hierarchyCrud,
    inspectorCrud,
    animatorCrud,
    animatorPage,
  }) => {
    // Arrange
    const worldLayer = await hierarchyCrud.layer.create('World', 'Viewport Layer');
    const spriteEntity = await hierarchyCrud.entity.create(worldLayer, 'sprite');
    const entityId = await spriteEntity.getAttribute('data-node-id');

    await spriteEntity.click();
    await inspectorCrud.configureSpriteAnimator({
      sampleImageName: 'sample_image.png',
      openEditor: true,
    });

    await animatorCrud.createClipViaContextMenu();
    const clipNode = animatorPage.treeNodeByName('New Clip');
    await animatorCrud.selectClipNode(clipNode);

    // Assert Viewport Panel HUD
    await expect(animatorPage.panelViewport).toBeVisible();
    await expect(animatorPage.panelZoomText).toContainText('Zoom:');
    await expect(animatorPage.panelEntityText).toContainText(`Entity ID: ${entityId}`);

    // Adjust Editor Settings (Onion Skin & Grid)
    await animatorPage.openSettingSection();
    await animatorPage.settingShadowCheckbox.check();
    await expect(animatorPage.settingShadowCheckbox).toBeChecked();

    await animatorPage.settingShadowCountInput.fill('4');
    await animatorPage.settingShadowCountInput.press('Enter');
    await expect(animatorPage.settingShadowCountInput).toHaveValue('4');

    await animatorPage.settingGridSizeInput.fill('16');
    await animatorPage.settingGridSizeInput.press('Enter');
    await expect(animatorPage.settingGridSizeInput).toHaveValue('16');
  });

  // =========================================================================
  // 5. [BAD PATH] SCENARIOS
  // =========================================================================
  test.describe('[Bad Path] Animator Operations Safeguards', () => {
    test('[Bad Path] cancels timeline clear action and preserves existing frames', async ({
      hierarchyCrud,
      inspectorCrud,
      animatorCrud,
      animatorPage,
    }) => {
      const worldLayer = await hierarchyCrud.layer.create('World', 'Test Layer');
      const spriteEntity = await hierarchyCrud.entity.create(worldLayer, 'sprite');

      await spriteEntity.click();
      await inspectorCrud.configureSpriteAnimator({
        sampleImageName: 'sample_image.png',
        openEditor: true,
      });

      await animatorCrud.createClipViaContextMenu();
      const clipNode = animatorPage.treeNodeByName('New Clip');
      await animatorCrud.selectClipNode(clipNode);

      await animatorCrud.addFrameToTimeline();
      await expect(animatorPage.timelineFrameItems).toHaveCount(1);

      await animatorCrud.clearTimeline({ confirm: false });
      await expect(animatorPage.timelineFrameItems).toHaveCount(1);
    });

    test('[Bad Path] prevents playback execution when no frames exist in timeline', async ({
      hierarchyCrud,
      inspectorCrud,
      animatorCrud,
      animatorPage,
    }) => {
      const worldLayer = await hierarchyCrud.layer.create('World', 'Empty Layer');
      const spriteEntity = await hierarchyCrud.entity.create(worldLayer, 'sprite');

      await spriteEntity.click();
      await inspectorCrud.configureSpriteAnimator({
        sampleImageName: 'sample_image.png',
        openEditor: true,
      });

      await animatorCrud.createClipViaContextMenu();
      const clipNode = animatorPage.treeNodeByName('New Clip');
      await animatorCrud.selectClipNode(clipNode);

      await expect(animatorPage.timelineFrameItems).toHaveCount(0);

      await expect(animatorPage.timelinePlayToggle).toBeVisible();
      await animatorPage.timelinePlayToggle.click();
      await expect(animatorPage.timelinePlayToggle).not.toHaveClass(/bg-amber-500/);
    });

    test('[Bad Path] cancels delete all sources action and preserves active sources', async ({
      hierarchyCrud,
      inspectorCrud,
      animatorCrud,
      animatorPage,
      popup,
    }) => {
      const worldLayer = await hierarchyCrud.layer.create('World', 'Cancel Layer');
      const spriteEntity = await hierarchyCrud.entity.create(worldLayer, 'sprite');

      await spriteEntity.click();
      await inspectorCrud.configureSpriteAnimator({
        sampleImageName: 'sample_image.png',
        openEditor: true,
      });

      await animatorCrud.createClipViaContextMenu();
      const clipNode = animatorPage.treeNodeByName('New Clip');
      await animatorCrud.selectClipNode(clipNode);

      await animatorCrud.addFrameToTimeline();
      await expect(animatorPage.sourceSelect).toBeVisible();

      await animatorPage.sourceMoreMenuTrigger.click();
      await animatorPage.timelineDeleteAllSourcesBtn.click();
      await popup.confirmAction('Delete All Sources?', { action: 'cancel', cancelText: 'Cancel' });

      await expect(animatorPage.sourceSelect).toBeVisible();
    });

    test('[Bad Path] does not expose animator editor when entity lacks SpriteAnimator', async ({
      hierarchyCrud,
      animatorPage,
    }) => {
      const worldLayer = await hierarchyCrud.layer.create('World', 'No Component Layer');
      const emptyEntity = await hierarchyCrud.entity.create(worldLayer, 'empty');

      await emptyEntity.click();
      await expect(emptyEntity).toHaveAttribute('aria-selected', 'true');

      await expect(animatorPage.helperContainer).toHaveCount(0);
      await expect(animatorPage.panelViewport).toHaveCount(0);
    });
  });
});