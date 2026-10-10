import { expect } from '@playwright/test';
import { AssetPanelPage } from '../pages/AssetPanelPage.js';
import { PopupHelper } from '../helpers/PopupHelper.js';

export class AssetCrudObject {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.assetPage = new AssetPanelPage(page);
    this.popup = new PopupHelper(page);
  }

  /**
   * Memastikan panel Asset aktif
   */
  async ensureReady() {
    await this.assetPage.ensureOpen();
  }

  /**
   * Helper facade untuk mengunggah file asset dari fixture directory
   * @param {string} fileName Nama file asset di test-data/assets
   */
  async uploadAsset(fileName) {
    await this.ensureReady();
    await this.assetPage.upload(fileName);
    
    // Extract nama dasar tanpa ekstensi untuk verifikasi card
    const baseTitle = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    const assetCard = this.assetPage.card(baseTitle);
    await expect(assetCard).toBeVisible();
    return assetCard;
  }

  /**
   * Helper facade untuk menerapkan asset yang dipilih ke entity aktif via context menu
   * @param {import('@playwright/test').Locator|string} assetCardElement Elemen card asset atau nama asset
   * @param {string} actionLabel Menu item (e.g., 'Apply to SpriteRenderer', 'Apply to TextRenderer', 'Apply to Audio Component')
   */
  async applyToActiveEntity(assetCardElement, actionLabel) {
    await this.ensureReady();
    const assetCard = typeof assetCardElement === 'string' 
      ? this.assetPage.card(assetCardElement) 
      : assetCardElement;

    await expect(assetCard).toBeVisible();
    await this.popup.selectContextMenu(assetCard, actionLabel);
    await this.popup.expectPopAlert('Success');
  }

  /**
   * Helper facade untuk membuat folder asset baru
   * @param {string} folderName 
   */
  async createFolder(folderName = 'New Folder') {
    await this.ensureReady();
    await this.popup.selectContextMenu(this.assetPage.grid, 'New Folder');
    await this.popup.fillPromptAndSubmit('New Folder', folderName, 'Create');

    const folderItem = this.assetPage.card(folderName);
    await expect(folderItem).toBeVisible();
    return folderItem;
  }

  // =========================================================================
  // PENAMBAHAN FLOW FACADE UNTUK UNCOVERAGE TEST SCENARIOS
  // =========================================================================

  /**
   * Helper facade untuk navigasi masuk ke dalam folder
   * @param {string} folderName 
   */
  async openFolder(folderName) {
    await this.ensureReady();
    const folderCard = this.assetPage.card(folderName);
    await expect(folderCard).toBeVisible();
    await folderCard.dblclick();
    await expect(this.assetPage.breadcrumb(folderName)).toBeVisible();
  }

  /**
   * Helper facade untuk navigasi kembali ke Root Asset folder via Breadcrumbs
   */
  async navigateToRoot() {
    await this.ensureReady();
    await this.assetPage.breadcrumbRoot.click();
    await expect(this.assetPage.breadcrumbRoot).toBeVisible();
  }

  /**
   * Helper facade untuk mengganti nama asset atau folder
   * @param {import('@playwright/test').Locator|string} itemTarget Card elemen atau nama item saat ini
   * @param {string} newName Nama baru
   */
  async rename(itemTarget, newName) {
    await this.ensureReady();
    const card = typeof itemTarget === 'string' ? this.assetPage.card(itemTarget) : itemTarget;
    await expect(card).toBeVisible();

    await this.popup.selectContextMenu(card, 'Rename');
    await this.popup.fillPromptAndSubmit(/Rename/i, newName, 'Rename');
    await this.popup.expectPopAlert('Success');

    const renamedCard = this.assetPage.card(newName);
    await expect(renamedCard).toBeVisible();
    return renamedCard;
  }

  /**
   * Helper facade untuk menghapus asset atau folder
   * @param {import('@playwright/test').Locator|string} itemTarget 
   */
  async delete(itemTarget) {
    await this.ensureReady();
    const card = typeof itemTarget === 'string' ? this.assetPage.card(itemTarget) : itemTarget;
    await expect(card).toBeVisible();

    const title = await card.getAttribute('title');
    await this.popup.selectContextMenu(card, 'Delete');
    await this.popup.confirmAction(/Delete/i, { action: 'confirm', confirmText: 'Confirm' });

    if (title) {
      await expect(this.assetPage.cardsByTitle(title)).toHaveCount(0);
    }
  }

  /**
   * Helper facade untuk melakukan pencarian asset
   * @param {string} query 
   */
  async search(query) {
    await this.ensureReady();
    await this.assetPage.searchInput.fill(query);
  }
}

