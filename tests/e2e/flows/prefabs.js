import { expect } from '@playwright/test';
import { PrefabPage } from '../pages/PrefabPage.js';

export class PrefabCrudObject {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.prefabPage = new PrefabPage(page);
  }

  async createEmptyPrefab(popup, name = 'New Prefab', tab = 'world') {
    await this.prefabPage.switchTab(tab);
    await popup.selectContextMenu(this.prefabPage.panel, 'Create Empty Prefab');
    
    const createdItem = this.prefabPage.itemByName(name);
    await expect(createdItem).toBeVisible();
    return createdItem;
  }

  async createFolder(popup, folderName = 'New Folder', tab = 'world') {
    await this.prefabPage.switchTab(tab);
    await popup.selectContextMenu(this.prefabPage.panel, 'New Folder');
    await popup.fillPromptAndSubmit('Create Folder', folderName, 'Create');

    const folderItem = this.prefabPage.itemByName(folderName);
    await expect(folderItem).toBeVisible();
    return folderItem;
  }
}