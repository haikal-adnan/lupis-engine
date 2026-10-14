import { expect } from '@playwright/test';

export class ScriptPanelPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  // ==========================================
  // LOCATORS
  // ==========================================
  /** Toggle button of the "Scripts" tab in the editor bottom bar */
  get tabButton() {
    return this.page
      .getByRole('button', { name: /^scripts?$/i })
      .or(this.page.getByTestId('bottom-tab-scripts'))
      .or(this.page.locator('button', { hasText: /^scripts?$/i }))
      .first();
  }

  get panel() {
    return this.page.getByTestId('script-panel');
  }

  get container() {
    return this.page.getByTestId('script-container');
  }

  get createBtn() {
    return this.panel.getByTestId('create-script-btn');
  }

  get viewModeToggleBtn() {
    return this.panel.locator('button[title*="Switch to"]');
  }

  /**
   * Finds an item (script/folder) by its exact name
   */
  itemByName(name) {
    return this.container.locator(`[data-node-name="${name}"]`).first();
  }

  /**
   * Finds an item by its unique ID
   */
  itemById(id) {
    return this.container.locator(`[data-node-id="${id}"]`);
  }

  /**
   * Gets the breadcrumb element by folder name
   */
  breadcrumbFolder(name) {
    return this.panel.locator('button', { hasText: name }).first();
  }

  get breadcrumbRoot() {
    return this.panel.locator('button', { hasText: 'Scripts' }).first();
  }

  // ==========================================
  // ACTIONS
  // ==========================================
  /**
   * Makes sure the Script tab/panel is open and ready for interaction.
   * If the panel is not visible yet, click the bottom bar tab button first.
   */
  async ensureVisible() {
    // Settle: the bottom bar must be rendered before count() is used (Section 2)
    await expect(this.tabButton).toBeVisible();
    if ((await this.panel.count()) === 0) {
      await this.tabButton.click();
    }
    await expect(this.panel).toBeVisible();
  }

  async toggleViewMode() {
    await this.viewModeToggleBtn.click();
  }
}
