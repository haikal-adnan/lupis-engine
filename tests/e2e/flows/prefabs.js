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
   * Memastikan tab/panel prefab aktif dan terbuka
   */
  async ensureReady() {
    await this.prefabPage.ensureVisible();
  }

  /**
   * Helper facade untuk membuat Empty Prefab di tab tertentu
   * @param {string} name - Nama prefab yang ingin dibuat
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
   * Helper facade untuk membuat Folder Prefab baru
   * @param {string} folderName - Nama folder yang ingin dibuat
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
   * Helper facade untuk masuk ke dalam folder tertentu
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