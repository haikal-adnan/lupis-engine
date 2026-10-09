import { expect } from '@playwright/test';
import { ScriptPanelPage } from '../pages/ScriptPanelPage.js';
import { PopupHelper } from '../helpers/PopupHelper.js';

export class ScriptCrudObject {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.scriptPage = new ScriptPanelPage(page);
    this.popup = new PopupHelper(page);
  }

  /**
   * Memastikan tab/panel script aktif
   */
  async ensureReady() {
    await this.scriptPage.ensureVisible();
  }

  /**
   * Helper facade untuk membuat script baru via tombol action
   * @param {string} scriptName Nama script/komponen
   */
  async createScript(scriptName = 'NewScript') {
    await this.ensureReady();
    await this.scriptPage.createBtn.click();
    await this.popup.fillPromptAndSubmit('Create New Component', scriptName, 'Create');
    
    await this.popup.expectPopAlert('Script Created');
    const scriptItem = this.scriptPage.itemByName(scriptName);
    await expect(scriptItem).toBeVisible();
    return scriptItem;
  }

  /**
   * Helper facade untuk menempelkan script ke entity aktif menggunakan menu "Add to {EntityName}"
   * @param {string} scriptName Nama script yang ingin ditempelkan
   * @param {string} entityName Nama entity target
   */
  async attachScriptToEntity(scriptName, entityName) {
    await this.ensureReady();
    const scriptItem = this.scriptPage.itemByName(scriptName);
    await expect(scriptItem).toBeVisible();

    // Pilih menu context dynamic "Add to <EntityName>"
    await this.popup.selectContextMenu(scriptItem, `Add to ${entityName}`);
  }

  /**
   * Helper facade untuk membuat folder script baru via context menu
   * @param {string} folderName Nama folder script
   */
  async createFolder(folderName = 'NewFolder') {
    await this.ensureReady();
    await this.popup.selectContextMenu(this.scriptPage.container, 'New Folder');
    await this.popup.fillPromptAndSubmit('New Folder', folderName, 'Create');

    const folderItem = this.scriptPage.itemByName(folderName);
    await expect(folderItem).toBeVisible();
    return folderItem;
  }

  /**
   * Helper facade untuk navigasi masuk ke dalam folder script
   * @param {string} folderName 
   */
  async enterFolder(folderName) {
    const folderItem = this.scriptPage.itemByName(folderName);
    await expect(folderItem).toBeVisible();
    await folderItem.dblclick();

    await expect(this.scriptPage.breadcrumbFolder(folderName)).toBeVisible();
    await expect(folderItem).not.toBeVisible();
  }
}