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
    // Finds the "Prefabs" toggle tab in the editor bottom bar
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
   * Makes sure the prefab page/panel is open and fully rendered.
   * If the panel is not visible yet, clicks the bottom bar tab button to open it.
   */
  async ensureVisible() {
    // Settle: the bottom bar must be rendered before count() is used (Section 2)
    await expect(this.togglePanelBtn).toBeVisible();
    if ((await this.panel.count()) === 0) {
      await this.togglePanelBtn.click();
    }
    await expect(this.panel).toBeVisible();
  }

  itemByName(name) {
    const slug = name.replace(/[\s-]+/g, '_');
    return this.page.locator(`[data-testid="prefab-item"][data-node-name="${name}"], [data-testid="prefab-item"][data-node-name="${slug}"], [data-testid="prefab-item"][data-node-name^="${slug}_"]`).first();
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
