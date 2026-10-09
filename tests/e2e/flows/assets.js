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
   * @param {string} actionLabel Menu item (e.g., 'Apply to SpriteRenderer', 'Apply to TextRenderer', 'Apply to Active Audio Clip')
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
}