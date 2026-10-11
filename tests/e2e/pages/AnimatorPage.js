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
    return this.page.getByTestId('animator-tree-section').first();
  }

  get treeContent() {
    return this.page.getByTestId('animator-tree-content').first();
  }

  get treeSearchInput() {
    return this.page
      .getByTestId('animator-tree-search-input')
      .locator('input, textarea')
      .or(this.page.getByTestId('animator-tree-search-input'))
      .first();
  }

  get treeMoreMenuTrigger() {
    return this.page.getByTestId('animator-tree-more-menu').first();
  }

  get treeNewCategoryBtn() {
    return this.page.getByTestId('animator-tree-new-category-btn').first();
  }

  get treeNewClipBtn() {
    return this.page.getByTestId('animator-tree-new-clip-btn').first();
  }

  get treeDeleteSelectedBtn() {
    return this.page.getByTestId('animator-tree-delete-selected-btn').first();
  }

  get treeEmptyState() {
    return this.page.getByTestId('animator-tree-empty-state').first();
  }

  treeNodeByName(name) {
    return this.page.locator(`[data-testid="animator-tree-node"][data-node-name="${name}"]`).first();
  }

  treeNodesByName(name) {
    return this.page.locator(`[data-testid="animator-tree-node"][data-node-name="${name}"]`);
  }

  treeNodeById(id) {
    return this.page.locator(`[data-testid="animator-tree-node"][data-node-id="${id}"]`).first();
  }

  // ==========================================
  // 2. CLIP PROPERTY INSPECTOR (AnimatorProperty.vue)
  // ==========================================
  get propertySection() {
    return this.page.getByTestId('animator-property-section').first();
  }

  get scriptIdInput() {
    return this.page.getByTestId('animator-property-script-id').locator('input').first();
  }

  get clipNameInput() {
    return this.page.getByTestId('animator-property-clip-name').locator('input').first();
  }

  get textureButton() {
    return this.page.getByTestId('animator-property-texture-btn').first();
  }

  get textureThumbnail() {
    return this.page.getByTestId('animator-property-texture-thumbnail').first();
  }

  get filterSelect() {
    return this.page.getByTestId('animator-property-filter-select').first();
  }

  get sdfToggleButton() {
    return this.page.getByTestId('animator-property-sdf-toggle').first();
  }

  get baseWidthInput() {
    return this.page.getByTestId('animator-property-base-w').locator('input').first();
  }

  get baseHeightInput() {
    return this.page.getByTestId('animator-property-base-h').locator('input').first();
  }

  get pivotControl() {
    return this.page.getByTestId('animator-property-pivot').first();
  }

  get fpsInput() {
    return this.page.getByTestId('animator-property-fps').locator('input').first();
  }

  get loopSelect() {
    return this.page.getByTestId('animator-property-loop-select').first();
  }

  get flipXButton() {
    return this.page.getByTestId('animator-property-flipx-btn').first();
  }

  // ==========================================
  // 3. TIMELINE & SOURCE INSPECTOR (AnimatorTimeline.vue)
  // ==========================================
  get timelineSection() {
    return this.page.getByTestId('animator-timeline-section').first();
  }

  get timelinePlayToggle() {
    return this.page
      .getByTestId('animator-timeline-play-toggle')
      .or(this.page.locator('button:has(.lucide-play), button:has(.lucide-pause)'))
      .first();
  }

  get timelineStepBackBtn() {
    return this.page.getByTestId('animator-timeline-step-back-btn').first();
  }

  get timelineStepForwardBtn() {
    return this.page.getByTestId('animator-timeline-step-forward-btn').first();
  }

  get timelineFrameCounter() {
    return this.page.getByTestId('animator-timeline-frame-counter').first();
  }

  get timelineAddFrameBtn() {
    return this.page
      .getByTestId('animator-timeline-add-frame-btn')
      .or(this.page.locator('button:has-text("Add Frame")'))
      .first();
  }

  get timelineAutoFillBtn() {
    return this.page
      .getByTestId('animator-timeline-autofill-btn')
      .or(this.page.locator('button:has-text("Auto Fill")'))
      .first();
  }

  get timelineClearBtn() {
    return this.page
      .getByTestId('animator-timeline-clear-btn')
      .or(this.page.locator('button:has-text("Clear")'))
      .first();
  }

  get timelineFrameItems() {
    return this.page.getByTestId('animator-timeline-frame-item');
  }

  timelineFrameByIndex(index) {
    return this.page.locator(`[data-testid="animator-timeline-frame-item"][data-frame-index="${index}"]`).first();
  }

  timelineRemoveFrameBtnByIndex(index) {
    return this.timelineFrameByIndex(index).getByTestId('animator-timeline-remove-frame-btn').first();
  }

  get sourceSelect() {
    return this.page.getByTestId('animator-timeline-source-select').first();
  }

  get sourceMoreMenuTrigger() {
    return this.page.getByTestId('animator-timeline-source-more-menu').first();
  }

  get timelineRenameClipBtn() {
    return this.page.getByTestId('animator-timeline-rename-clip-btn').first();
  }

  get timelineDeleteAllSourcesBtn() {
    return this.page.getByTestId('animator-timeline-delete-all-sources-btn').first();
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
    return this.page.getByTestId('animator-panel-viewport').first();
  }

  get panelZoomText() {
    return this.page.getByTestId('animator-panel-zoom-text').first();
  }

  get panelEntityText() {
    return this.page.getByTestId('animator-panel-entity-text').first();
  }

  // ==========================================
  // 5. EDITOR SETTINGS (AnimatorSetting.vue)
  // ==========================================
  get settingSection() {
    return this.page.getByTestId('animator-setting-section').first();
  }

  get settingShadowCheckbox() {
    return this.page.getByTestId('animator-setting-shadow-checkbox').first();
  }

  get settingShadowCountInput() {
    return this.page.getByTestId('animator-setting-shadow-count').locator('input').first();
  }

  get settingShadowOpacityInput() {
    return this.page.getByTestId('animator-setting-shadow-opacity').locator('input').first();
  }

  get settingGridCheckbox() {
    return this.page.getByTestId('animator-setting-grid-checkbox').first();
  }

  get settingGridSizeInput() {
    return this.page.getByTestId('animator-setting-grid-size').locator('input').first();
  }

  async openSettingSection() {
    if (!(await this.settingShadowCheckbox.isVisible().catch(() => false))) {
      await this.settingSection.getByText('Editor Settings', { exact: true }).click();
    }
    await expect(this.settingShadowCheckbox).toBeVisible();
  }

  // ==========================================
  // 6. HELPER CONTAINER & EMPTY STATES (AnimatorHelper.vue)
  // ==========================================
  get helperContainer() {
    return this.page.getByTestId('animator-helper-container').first();
  }

  get helperNoComponentState() {
    return this.page.getByTestId('animator-helper-no-component').first();
  }

  get helperNoClipSettings() {
    return this.page.getByTestId('animator-helper-no-clip-settings').first();
  }

  get helperContent() {
    return this.page.getByTestId('animator-helper-content').first();
  }
}