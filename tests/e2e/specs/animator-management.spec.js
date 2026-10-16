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
    // 1. Arrange: create a Layer and a new Sprite entity
    const worldLayer = await hierarchyCrud.layer.create('World', 'Character Layer');
    const spriteEntity = await hierarchyCrud.entity.create(worldLayer, 'sprite');
    const entityId = await spriteEntity.getAttribute('data-node-id');

    await spriteEntity.click();
    await expect(spriteEntity).toHaveAttribute('aria-selected', 'true');

    // 2. Act: configure SpriteAnimator and open the workspace tab
    await inspectorCrud.configureSpriteAnimator({
      sampleImageName: 'sample_image.png',
      openEditor: true,
    });

    // The workspace tab is locked by a stable identity (entityId), not by any [aria-selected].
    const activeTab = page.locator(`[data-tab-id="${entityId}"]`);
    await expect(activeTab).toBeVisible();

    // 3. Act: create the category hierarchy and a clip
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
    // State is read through ARIA, not Tailwind classes (Section 7.1/7.2). Component contract: aria-pressed.
    await expect(animatorPage.flipXButton).toHaveAttribute('aria-pressed', 'true');

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
    await expect(animatorPage.timelinePlayToggle).toHaveAttribute('aria-pressed', 'true');

    await animatorPage.timelinePlayToggle.click();
    await expect(animatorPage.timelinePlayToggle).toHaveAttribute('aria-pressed', 'false');
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

    // Act: create a clip through the header menu dropdown
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
    // Both duplicates must still match the 'Idle' filter
    await expect(animatorPage.treeNodesByName('Idle_Anim')).toHaveCount(2);

    await animatorPage.treeSearchInput.fill('NonExistentAnim');
    await expect(animatorPage.treeEmptyState).toBeVisible();

    await animatorPage.treeSearchInput.fill('');
    await expect(animatorPage.treeNodesByName('Idle_Anim')).toHaveCount(2);

    // Keyboard Shortcut (Copy & Paste)
    await animatorPage.treeSearchInput.blur();
    await animatorCrud.ensureClipSelected(idleClip);
    await page.keyboard.press('Control+c');
    await page.keyboard.press('Control+v');
    await expect(animatorPage.treeNodesByName('Idle_Anim')).toHaveCount(3);

    // Deselect the clip by clicking the empty tree content area
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
      .or(animatorPage.sourceSelect.getByRole('combobox'));
    await expect(sourceTrigger).toBeVisible();
    await sourceTrigger.click();

    // The action is chosen by exact text, not by whichever "select-action" happens to come first
    const createSourceAction = page.getByText('Create New Source...', { exact: true });
    await expect(createSourceAction).toBeVisible();
    await createSourceAction.click();

    await popup.fillPromptAndSubmit('New Source', 'run_01', 'Create');

    // Source More Menu: Reset to Native Size
    await animatorPage.sourceMoreMenuTrigger.click();
    await expect(animatorPage.timelineResetSizeBtn).toBeVisible();
    await animatorPage.timelineResetSizeBtn.click();

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
    test('[Bad Path] enforces safeguards for empty timeline playback and cancels destructive actions', async ({
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

      // Verify playback fails when timeline is empty
      await expect(animatorPage.timelineFrameItems).toHaveCount(0);
      await expect(animatorPage.timelinePlayToggle).toBeVisible();
      await animatorPage.timelinePlayToggle.click();
      await expect(animatorPage.timelinePlayToggle).toHaveAttribute('aria-pressed', 'false');

      // Add frame, then cancel clear timeline
      await animatorCrud.addFrameToTimeline();
      await expect(animatorPage.timelineFrameItems).toHaveCount(1);

      await animatorCrud.clearTimeline({ confirm: false });
      await expect(animatorPage.timelineFrameItems).toHaveCount(1);
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