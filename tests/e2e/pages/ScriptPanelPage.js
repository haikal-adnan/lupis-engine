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
  /** Tombol toggle tab "Scripts" pada bottom bar editor */
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
   * Mencari item (script/folder) berdasarkan nama persis
   */
  itemByName(name) {
    return this.container.locator(`[data-node-name="${name}"]`).first();
  }

  /**
   * Mencari item berdasarkan ID unik
   */
  itemById(id) {
    return this.container.locator(`[data-node-id="${id}"]`);
  }

  /**
   * Mengambil elemen breadcrumb berdasarkan nama folder
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
   * Memastikan tab/panel Script terbuka dan siap diinteraksi.
   * Jika panel belum terlihat, klik tombol tab di bottom bar terlebih dahulu.
   */
  async ensureVisible() {
    if ((await this.panel.count()) === 0 || !(await this.panel.isVisible())) {
      const btn = this.tabButton;
      if ((await btn.count()) > 0) {
        await btn.click();
      }
    }
    await expect(this.panel).toBeVisible();
  }

  async toggleViewMode() {
    await this.viewModeToggleBtn.click();
  }
}
