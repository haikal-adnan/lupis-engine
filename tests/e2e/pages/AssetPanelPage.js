import { expect } from '@playwright/test';
import path from 'path';

/**
 * Page object for the Asset Panel (bottom "Assets" tab).
 */
export class AssetPanelPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  // ==========================================
  // LOCATORS
  // ==========================================
  get tabButton() {
    return this.page
      .getByRole('button', { name: /^Assets$/i })
      .or(this.page.getByTestId('bottom-tab-assets'))
      .first();
  }

  get panel() {
    return this.page.locator('div.relative.h-full.flex.flex-col').filter({ hasText: 'Assets' }).first();
  }

  /** Loading overlay shown while an upload is in progress */
  get uploadOverlay() {
    return this.panel.getByText('Processing Asset...');
  }

  /** Asset grid area (right-click target for "New Folder", "Import Assets", "Paste"). */
  get grid() {
    return this.page.locator('[data-testid="asset-grid"]').or(this.panel).first();
  }

  /** Input pencarian asset. */
  get searchInput() {
    return this.panel.getByPlaceholder('Search assets...').or(this.panel.getByTestId('search-input')).first();
  }

  /** Root breadcrumb ("Assets") inside the panel. */
  get breadcrumbRoot() {
    return this.panel.getByRole('button', { name: 'Assets' }).first();
  }

  breadcrumb(name) {
    return this.panel.getByRole('button', { name }).first();
  }

  /**
   * Precise locator that matches the exact title (with or without file extension).
   * @param {string} title File name or display name (e.g. 'sample_font' or 'sample_font.ttf')
   */
  card(title) {
    const baseName = title.replace(/\.[^/.]+$/, '');
    const slug = title.trim().replace(/[\s-]+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    const baseSlug = baseName.trim().replace(/[\s-]+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    return this.panel
      .locator(`[title="${title}"], [title="${baseName}"], [title^="${baseName}."], [title="${slug}"], [title="${baseSlug}"]`)
      .first();
  }

  /** All elements matching the title (for toHaveCount assertions). */
  cardsByTitle(title) {
    const baseName = title.replace(/\.[^/.]+$/, '');
    const slug = title.trim().replace(/[\s-]+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    const baseSlug = baseName.trim().replace(/[\s-]+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
    return this.panel.locator(`[title="${title}"], [title="${baseName}"], [title^="${baseName}."], [title="${slug}"], [title="${baseSlug}"]`);
  }

  /** First card whose title contains the given text. */
  cardContaining(text) {
    const slug = text.trim().replace(/[\s()-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    return this.panel.locator(`[title*="${text}"], [title*="${slug}"]`).first();
  }

  // ==========================================
  // ACTIONS
  // ==========================================
  async ensureOpen() {
    await expect(this.tabButton).toBeVisible();
    if ((await this.panel.count()) === 0) {
      await this.tabButton.click();
    }
    await expect(this.panel).toBeVisible();
  }

  /**
   * Uploads a real file and waits until the async upload finishes and the card appears in the DOM.
   * @param {string} fileName File name in the test-data/assets folder
   */
  async upload(fileName) {
    const fileInput = this.page.locator('input[type="file"]').first();
    const filePath = path.resolve(process.cwd(), 'test-data/assets', fileName);

    // 1. Trigger upload file
    await fileInput.setInputFiles(filePath);

    // 2. Wait for the asset card to appear in the DOM (main signal that the file was processed).
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    await expect(this.card(fileName).or(this.cardContaining(baseName))).toBeVisible();

    // 3. Make sure the loading overlay is gone
    await expect(this.uploadOverlay).toBeHidden();
  }

  /**
   * Creates a nested folder structure down to the given depth.
   * @param {string[]} folderPath Folder names from the outermost to the innermost
   * @param {import('../helpers/PopupHelper.js').PopupHelper} popup
   */
  async createNestedFolders(folderPath, popup) {
    for (const folderName of folderPath) {
      await popup.selectContextMenu(this.grid, 'New Folder');
      await popup.fillPromptAndSubmit('New Folder', folderName, 'Create');
      const folderCard = this.card(folderName);
      await expect(folderCard).toBeVisible();
      await folderCard.dblclick();
      await expect(this.breadcrumb(folderName)).toBeVisible();
    }
  }
}
