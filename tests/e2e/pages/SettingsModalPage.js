import { expect } from '@playwright/test';

/**
 * Page object for Project Settings Modal and Header Project Menu dropdown.
 * Strictly adheres to E2E Testing Standards (index-free spec calls, resilient locators).
 */
export class SettingsModalPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  get modal() {
    return this.page
      .getByRole('dialog', { name: 'Project Settings' })
      .or(this.page.getByTestId('editor-settings-modal'));
  }

  get projectMenuButton() {
    return this.page.getByTestId('header-project-menu-button');
  }

  get headerProjectName() {
    return this.page.getByTestId('header-project-name');
  }

  get syncStatusIndicator() {
    return this.page.getByTestId('project-sync-status-indicator');
  }

  get syncStatusBadge() {
    return this.page.getByTestId('project-sync-status-badge');
  }

  // The 4 dropdown menu items
  get projectMenuSave() {
    return this.page.getByTestId('project-menu-save');
  }

  get projectMenuExport() {
    return this.page.getByTestId('project-menu-export');
  }

  get projectMenuSettings() {
    return this.page.getByTestId('project-menu-settings');
  }

  get projectMenuDashboard() {
    return this.page.getByTestId('project-menu-dashboard');
  }

  get closeButton() {
    return this.page.getByTestId('close-settings-modal-btn');
  }

  get contentHeaderTitle() {
    return this.modal.locator('h3');
  }

  get projectTabContent() {
    return this.modal.getByTestId('settings-tab-project-content');
  }

  get preferencesTabContent() {
    return this.modal.getByTestId('settings-tab-preferences-content');
  }

  get projectNameError() {
    return this.modal.locator('text=Project name cannot be empty');
  }

  get projectNameInput() {
    return this.modal.getByTestId('project-name-input').locator('input');
  }

  get projectDescInput() {
    return this.modal.getByTestId('project-desc-input').locator('textarea');
  }

  get projectVersionInput() {
    return this.modal.getByTestId('project-version-input').locator('input');
  }

  get coverPreviewImg() {
    return this.modal.getByTestId('project-thumbnail-preview');
  }

  get thumbnailBadgeCustom() {
    return this.modal.getByTestId('thumbnail-badge-custom');
  }

  get thumbnailBadgeSnapshot() {
    return this.modal.getByTestId('thumbnail-badge-snapshot');
  }

  get thumbnailBadgeDefault() {
    return this.modal.getByTestId('thumbnail-badge-default');
  }

  get thumbnailFileInput() {
    return this.modal.getByTestId('thumbnail-file-input');
  }

  get uploadThumbnailBtn() {
    return this.modal.getByTestId('upload-thumbnail-btn');
  }

  get deleteThumbnailBtn() {
    return this.modal.getByTestId('delete-thumbnail-btn');
  }

  get captureSnapshotBtn() {
    return this.modal.getByTestId('capture-snapshot-btn');
  }

  get autoSaveCheckbox() {
    return this.modal.getByTestId('project-autosave-checkbox').locator('input[type="checkbox"]');
  }

  get autoSaveIntervalInput() {
    return this.modal.getByTestId('project-autosave-interval-input').locator('input');
  }

  get saveNowButton() {
    return this.modal.getByTestId('project-save-now-button');
  }

  get revertButton() {
    return this.modal.getByTestId('project-revert-button');
  }

  get syncIndicatorText() {
    return this.modal.getByTestId('project-sync-indicator-text');
  }

  // Preferences section locators
  get themeOptionDark() {
    return this.modal.getByTestId('theme-option-dark');
  }

  get themeOptionLight() {
    return this.modal.getByTestId('theme-option-light');
  }

  get themeToggleBtn() {
    return this.modal.getByTestId('theme-toggle-btn');
  }

  tab(tabId) {
    return this.modal.getByTestId(`settings-tab-${tabId}`);
  }

  async openProjectMenu() {
    await expect(this.projectMenuButton).toBeVisible();
    await this.projectMenuButton.click();
  }

  async openFromMenu() {
    await this.openProjectMenu();
    await expect(this.projectMenuSettings).toBeVisible();
    await this.projectMenuSettings.click();
    await expect(this.modal).toBeVisible();
  }

  async saveFromMenu() {
    await this.openProjectMenu();
    await expect(this.projectMenuSave).toBeVisible();
    await this.projectMenuSave.click();
  }

  async exportFromMenu() {
    await this.openProjectMenu();
    await expect(this.projectMenuExport).toBeVisible();
    await this.projectMenuExport.click();
  }

  async backToDashboardFromMenu() {
    await this.openProjectMenu();
    await expect(this.projectMenuDashboard).toBeVisible();
    await this.projectMenuDashboard.click();
  }

  async close() {
    await expect(this.closeButton).toBeVisible();
    await this.closeButton.click();
    await expect(this.modal).toBeHidden();
  }

  async closeByEscape() {
    await this.page.keyboard.press('Escape');
    await expect(this.modal).toBeHidden();
  }

  async switchTab(tabId) {
    const tabBtn = this.tab(tabId);
    await expect(tabBtn).toBeVisible();
    await tabBtn.click();
  }

  async setProjectName(name) {
    await this.projectNameInput.fill(name);
    await this.projectNameInput.press('Enter');
  }

  async setProjectDescription(desc) {
    await this.projectDescInput.fill(desc);
    await this.projectDescInput.blur();
  }

  async setProjectVersion(version) {
    await this.projectVersionInput.fill(version);
    await this.projectVersionInput.press('Enter');
  }

  async uploadThumbnail(bufferOrPath) {
    await this.thumbnailFileInput.setInputFiles(bufferOrPath);
  }

  async deleteThumbnail() {
    await expect(this.deleteThumbnailBtn).toBeVisible();
    await this.deleteThumbnailBtn.click();
  }

  async captureSnapshot() {
    await expect(this.captureSnapshotBtn).toBeVisible();
    await this.captureSnapshotBtn.click();
  }

  async toggleAutoSave() {
    await this.autoSaveCheckbox.click();
  }

  async setAutoSaveInterval(interval) {
    await this.autoSaveIntervalInput.fill(String(interval));
    await this.autoSaveIntervalInput.press('Enter');
  }

  async saveNow() {
    await this.saveNowButton.click();
  }

  async revertChanges() {
    await this.revertButton.click();
  }
}
