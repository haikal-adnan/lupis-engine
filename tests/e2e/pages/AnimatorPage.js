import { expect } from '@playwright/test';

export class AnimatorPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  // ==========================================
  // 1. TREE HIERARCHY (AnimatorTree.vue)
  // ==========================================
  get treeSection() {
    return this.page.getByTestId('animator-tree-section');
  }

  get treeContent() {
    return this.page.getByTestId('animator-tree-content');
  }

  get treeSearchInput() {
    return this.page
      .getByTestId('animator-tree-search-input')
      .locator('input, textarea')
      .or(this.page.getByTestId('animator-tree-search-input'))
      .first();
  }

  get treeMoreMenuTrigger() {
    return this.page.getByTestId('animator-tree-more-menu');
  }

  get treeNewCategoryBtn() {
    return this.page.getByTestId('animator-tree-new-category-btn');
  }

  get treeNewClipBtn() {
    return this.page.getByTestId('animator-tree-new-clip-btn');
  }

  get treeDeleteSelectedBtn() {
    return this.page.getByTestId('animator-tree-delete-selected-btn');
  }

  get treeEmptyState() {
    return this.page.getByTestId('animator-tree-empty-state');
  }

  treeNodeByName(name) {
    const slug = name.replace(/\s+/g, '_');
    return this.page.locator(`[data-testid="animator-tree-node"][data-node-name="${name}"], [data-testid="animator-tree-node"][data-node-name="${slug}"], [data-testid="animator-tree-node"][data-node-script-id="${slug}"]`).first();
  }

  treeNodesByName(name) {
    const slug = name.replace(/\s+/g, '_');
    return this.page.locator(`[data-testid="animator-tree-node"][data-node-name="${name}"], [data-testid="animator-tree-node"][data-node-name="${slug}"], [data-testid="animator-tree-node"][data-node-script-id="${slug}"]`);
  }

  treeNodeById(id) {
    return this.page.locator(`[data-testid="animator-tree-node"][data-node-id="${id}"]`);
  }

  // ==========================================
  // 2. CLIP PROPERTY INSPECTOR (AnimatorProperty.vue)
  // ==========================================
  get propertySection() {
    return this.page.getByTestId('animator-property-section');
  }

  get scriptIdInput() {
    return this.page.getByTestId('animator-property-script-id').locator('input').first();
  }

  get clipNameInput() {
    return this.scriptIdInput;
  }

  get textureButton() {
    return this.page.getByTestId('animator-property-texture-btn');
  }

  get textureThumbnail() {
    return this.page.getByTestId('animator-property-texture-thumbnail');
  }

  get filterSelect() {
    return this.page.getByTestId('animator-property-filter-select');
  }

  get sdfToggleButton() {
    return this.page.getByTestId('animator-property-sdf-toggle');
  }

  get baseWidthInput() {
    return this.page.getByTestId('animator-property-base-w').locator('input').first();
  }

  get baseHeightInput() {
    return this.page.getByTestId('animator-property-base-h').locator('input').first();
  }

  get pivotControl() {
    return this.page.getByTestId('animator-property-pivot');
  }

  get fpsInput() {
    return this.page.getByTestId('animator-property-fps').locator('input').first();
  }

  get loopSelect() {
    return this.page.getByTestId('animator-property-loop-select');
  }

  get flipXButton() {
    return this.page.getByTestId('animator-property-flipx-btn');
  }

  // ==========================================
  // 3. TIMELINE & SOURCE INSPECTOR (AnimatorTimeline.vue)
  // ==========================================
  get timelineSection() {
    return this.page.getByTestId('animator-timeline-section');
  }

  get timelinePlayToggle() {
    return this.page.getByTestId('animator-timeline-play-toggle');
  }

  get timelineStepBackBtn() {
    return this.page.getByTestId('animator-timeline-step-back-btn');
  }

  get timelineStepForwardBtn() {
    return this.page.getByTestId('animator-timeline-step-forward-btn');
  }

  get timelineFrameCounter() {
    return this.page.getByTestId('animator-timeline-frame-counter');
  }

  get timelineAddFrameBtn() {
    return this.page.getByTestId('animator-timeline-add-frame-btn');
  }

  get timelineAutoFillBtn() {
    return this.page.getByTestId('animator-timeline-autofill-btn');
  }

  get timelineClearBtn() {
    return this.page.getByTestId('animator-timeline-clear-btn');
  }

  get timelineFrameItems() {
    return this.page.getByTestId('animator-timeline-frame-item');
  }

  timelineFrameByIndex(index) {
    return this.page.locator(`[data-testid="animator-timeline-frame-item"][data-frame-index="${index}"]`);
  }

  timelineRemoveFrameBtnByIndex(index) {
    return this.timelineFrameByIndex(index).getByTestId('animator-timeline-remove-frame-btn');
  }

  get sourceSelect() {
    return this.page.getByTestId('animator-timeline-source-select');
  }

  get sourceMoreMenuTrigger() {
    return this.page.getByTestId('animator-timeline-source-more-menu');
  }

  get timelineRenameClipBtn() {
    return this.page.getByTestId('animator-timeline-rename-clip-btn');
  }

  get timelineResetSizeBtn() {
    return this.page.getByTestId('animator-timeline-reset-size-btn');
  }

  get timelineDeleteAllSourcesBtn() {
    return this.page.getByTestId('animator-timeline-delete-all-sources-btn');
  }

  get sourceRectX() {
    return this.page.getByTestId('animator-timeline-rect-x').locator('input').first();
  }

  get sourceRectY() {
    return this.page.getByTestId('animator-timeline-rect-y').locator('input').first();
  }

  get sourceRectW() {
    return this.page.getByTestId('animator-timeline-rect-w').locator('input').first();
  }

  get sourceRectH() {
    return this.page.getByTestId('animator-timeline-rect-h').locator('input').first();
  }

  // ==========================================
  // 4. EDITOR PANEL VIEWPORT (AnimatorPanel.vue)
  // ==========================================
  get panelViewport() {
    return this.page.getByTestId('animator-panel-viewport');
  }

  get panelZoomText() {
    return this.page.getByTestId('animator-panel-zoom-text');
  }

  get panelEntityText() {
    return this.page.getByTestId('animator-panel-entity-text');
  }

  // ==========================================
  // 5. EDITOR SETTINGS (AnimatorSetting.vue)
  // ==========================================
  get settingSection() {
    return this.page.getByTestId('animator-setting-section');
  }

  get settingShadowCheckbox() {
    return this.page.getByTestId('animator-setting-shadow-checkbox');
  }

  get settingShadowCountInput() {
    return this.page.getByTestId('animator-setting-shadow-count').locator('input').first();
  }

  get settingShadowOpacityInput() {
    return this.page.getByTestId('animator-setting-shadow-opacity').locator('input').first();
  }

  get settingGridCheckbox() {
    return this.page.getByTestId('animator-setting-grid-checkbox');
  }

  get settingGridSizeInput() {
    return this.page.getByTestId('animator-setting-grid-size').locator('input').first();
  }

  async openSettingSection() {
    await expect(this.settingSection).toBeVisible();
    // Collapsed sections are only hidden (still in the DOM), so count the VISIBLE ones
    const visibleCheckbox = this.settingShadowCheckbox.and(this.page.locator(':visible'));
    if ((await visibleCheckbox.count()) === 0) {
      await this.settingSection.getByText('Editor Settings', { exact: true }).click();
    }
    await expect(this.settingShadowCheckbox).toBeVisible();
  }

  // ==========================================
  // 6. HELPER CONTAINER & EMPTY STATES (AnimatorHelper.vue)
  // ==========================================
  get helperContainer() {
    return this.page.getByTestId('animator-helper-container');
  }

  get helperNoComponentState() {
    return this.page.getByTestId('animator-helper-no-component');
  }

  get helperNoClipSettings() {
    return this.page.getByTestId('animator-helper-no-clip-settings');
  }

  get helperContent() {
    return this.page.getByTestId('animator-helper-content');
  }
}