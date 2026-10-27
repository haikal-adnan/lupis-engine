import { expect } from '@playwright/test';
import { PrefabPage } from '../pages/PrefabPage.js';
import { PopupHelper } from '../helpers/PopupHelper.js';

export class PrefabCrudObject {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.prefabPage = new PrefabPage(page);
    this.popup = new PopupHelper(page);
  }

  /**
   * Makes sure the prefab tab/panel is active and open
   */
  async ensureReady() {
    await this.prefabPage.ensureVisible();
  }

  /**
   * Facade helper that creates an Empty Prefab in a given tab
   * @param {string} name - Name of the prefab to create
   * @param {'world' | 'ui'} tab - Target tab section
   */
  async createEmptyPrefab(name = 'New_Prefab', tab = 'world') {
    await this.prefabPage.switchTab(tab);
    await this.popup.selectContextMenu(this.prefabPage.panel, 'Create Empty Prefab');

    const createdItem = this.prefabPage.itemByName(name);
    await expect(createdItem).toBeVisible();
    return createdItem;
  }

  /**
   * Facade helper that creates a new Prefab folder
   * @param {string} folderName - Name of the folder to create
   * @param {'world' | 'ui'} tab - Target tab section
   */
  async createFolder(folderName = 'New Folder', tab = 'world') {
    await this.prefabPage.switchTab(tab);
    await this.popup.selectContextMenu(this.prefabPage.panel, 'New Folder');
    await this.popup.fillPromptAndSubmit(/Folder/i, folderName, 'Create');

    const folderItem = this.prefabPage.itemByName(folderName);
    await expect(folderItem).toBeVisible();
    return folderItem;
  }

  /**
   * Facade helper that enters a given folder
   * @param {string} folderName
   */
  async enterFolder(folderName) {
    const folderItem = this.prefabPage.itemByName(folderName);
    await expect(folderItem).toBeVisible();

    const folderId = await folderItem.getAttribute('data-node-id');
    await folderItem.dblclick();

    if (folderId) {
      await expect(this.prefabPage.breadcrumbFolder(folderId)).toBeVisible();
    }
  }
}
