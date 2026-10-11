import { expect } from '@playwright/test';

export class PrefabPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  get panel() {
    return this.page.getByTestId('prefab-panel');
  }

  get togglePanelBtn() {
    // Mencari tab toggle "Prefabs" di bottom bar editor
    return this.page
      .getByRole('button', { name: /^prefabs?$/i })
      .or(this.page.getByTestId('tab-prefab-toggle'))
      .or(this.page.locator('button', { hasText: /^prefabs?$/i }))
      .first();
  }

  get container() {
    return this.page.getByTestId('prefab-items-container');
  }

  get tabWorld() {
    return this.page.getByTestId('tab-world');
  }

  get tabUI() {
    return this.page.getByTestId('tab-ui');
  }

  get toggleViewBtn() {
    return this.page.getByTestId('toggle-view-mode-btn');
  }

  get searchInput() {
    return this.page.getByTestId('search-prefab-input');
  }

  get breadcrumbRoot() {
    return this.page.getByTestId('breadcrumb-root');
  }

  /**
   * Memastikan halaman/panel prefab terbuka dan dirender penuh.
   * Jika panel belum terlihat, mengklik tombol tab bottom bar untuk membukanya.
   */
  async ensureVisible() {
    if ((await this.panel.count()) === 0 || !(await this.panel.isVisible())) {
      const toggleBtn = this.togglePanelBtn;
      if ((await toggleBtn.count()) > 0) {
        await toggleBtn.click();
      }
    }
    await expect(this.panel).toBeVisible();
  }

  itemByName(name) {
    return this.page.locator(`[data-testid="prefab-item"][data-node-name="${name}"]`).first();
  }

  itemById(id) {
    return this.page.locator(`[data-testid="prefab-item"][data-node-id="${id}"]`);
  }

  breadcrumbFolder(id) {
    return this.page.locator(`[data-testid="breadcrumb-item"][data-folder-id="${id}"]`);
  }

  async switchTab(tab) {
    await this.ensureVisible();
    const targetBtn = tab === 'ui' ? this.tabUI : this.tabWorld;
    await targetBtn.click();
    await expect(targetBtn).toHaveAttribute('aria-selected', 'true');
  }

  async toggleViewMode() {
    await this.toggleViewBtn.click();
  }

  async snapshot() {
    return await this.page.evaluate(() => {
      const items = Array.from(document.querySelectorAll('[data-testid="prefab-item"]'));
      return items.map(el => ({
        id: el.getAttribute('data-node-id'),
        name: el.getAttribute('data-node-name'),
        type: el.getAttribute('data-node-type'),
        selected: el.getAttribute('aria-selected') === 'true',
        cut: el.getAttribute('data-cut') === 'true'
      }));
    });
  }
}
