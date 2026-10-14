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
   * Makes sure the Asset panel is active
   */
  async ensureReady() {
    await this.assetPage.ensureOpen();
  }

  /**
   * Facade helper that uploads an asset file from the fixture directory
   * @param {string} fileName Asset file name in test-data/assets
   */
  async uploadAsset(fileName) {
    await this.ensureReady();
    await this.assetPage.upload(fileName);

    // Extract the base name without extension to verify the card
    const baseTitle = fileName.substring(0, fileName.lastIndexOf('.')) || fileName;
    const assetCard = this.assetPage.card(baseTitle);
    await expect(assetCard).toBeVisible();
    return assetCard;
  }

  /**
   * Facade helper that applies the selected asset to the active entity via the context menu
   * @param {import('@playwright/test').Locator|string} assetCardElement Asset card element or asset name
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
   * Facade helper that creates a new asset folder
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
  // ADDITIONAL FLOW FACADES FOR PREVIOUSLY UNCOVERED SCENARIOS
  // =========================================================================

  /**
   * Facade helper that navigates into a folder
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
   * Facade helper that navigates back to the Asset root folder via breadcrumbs
   */
  async navigateToRoot() {
    await this.ensureReady();
    await this.assetPage.breadcrumbRoot.click();
    await expect(this.assetPage.breadcrumbRoot).toBeVisible();
  }

  /**
   * Facade helper that renames an asset or folder
   * @param {import('@playwright/test').Locator|string} itemTarget Card element or current item name
   * @param {string} newName New name
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
   * Facade helper that deletes an asset or folder
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
   * Facade helper that searches assets
   * @param {string} query
   */
  async search(query) {
    await this.ensureReady();
    await this.assetPage.searchInput.fill(query);
  }
}
