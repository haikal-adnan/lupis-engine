import { expect } from '@playwright/test';
import { ScriptPanelPage } from '../pages/ScriptPanelPage.js';
import { HierarchyPage } from '../pages/HierarchyPage.js';
import { PopupHelper } from '../helpers/PopupHelper.js';

export class ScriptCrudObject {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.scriptPage = new ScriptPanelPage(page);
    this.hierarchy = new HierarchyPage(page);
    this.popup = new PopupHelper(page);
  }

  /**
   * Memastikan tab/panel script aktif dan siap diinteraksi
   */
  async ensureReady() {
    await this.scriptPage.ensureVisible();
  }

  /**
   * Helper facade untuk membuat script baru via tombol action top bar
   * @param {string} scriptName Nama script/komponen baru
   * @returns {Promise<import('@playwright/test').Locator>}
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
   * Helper facade untuk menempelkan script ke entity target menggunakan menu "Add to {EntityName}"
   * @param {string} scriptName Nama script yang ingin ditempelkan
   * @param {string} entityName Nama entity target di Hierarchy
   */
  async attachScriptToEntity(scriptName, entityName) {
    await this.ensureReady();

    // Pastikan entity target di Hierarchy aktif & terpilih secara eksplisit
    const entityNode = this.hierarchy.nodeByName(entityName);
    if (await entityNode.isVisible()) {
      await entityNode.click();
    }

    const scriptItem = this.scriptPage.itemByName(scriptName);
    await expect(scriptItem).toBeVisible();

    await this.popup.selectContextMenu(scriptItem, `Add to ${entityName}`);
  }

  /**
   * Helper facade untuk merename script via context menu
   * @param {string} currentName Nama script saat ini
   * @param {string} newName Nama script baru
   * @returns {Promise<import('@playwright/test').Locator>}
   */
  async renameScript(currentName, newName) {
    await this.ensureReady();
    const scriptItem = this.scriptPage.itemByName(currentName);
    await expect(scriptItem).toBeVisible();

    await this.popup.selectContextMenu(scriptItem, 'Rename');
    await this.popup.fillPromptAndSubmit('Rename Script', newName, 'Rename');
    await this.popup.expectPopAlert('Renamed');

    const renamedItem = this.scriptPage.itemByName(newName);
    await expect(renamedItem).toBeVisible();
    return renamedItem;
  }

  /**
   * Helper facade untuk menduplikasi script via context menu
   * @param {string} scriptName Nama script yang akan diduplikasi
   * @returns {Promise<import('@playwright/test').Locator>}
   */
  async duplicateScript(scriptName) {
    await this.ensureReady();
    const scriptItem = this.scriptPage.itemByName(scriptName);
    await expect(scriptItem).toBeVisible();

    await this.popup.selectContextMenu(scriptItem, 'Duplicate');
    await this.popup.expectPopAlert('Duplicated');

    const duplicatedItem = this.scriptPage.itemByName(`${scriptName}_Copy`);
    await expect(duplicatedItem).toBeVisible();
    return duplicatedItem;
  }

  /**
   * Helper facade untuk menghapus script via context menu dan konfirmasi modal
   * @param {string} scriptName Nama script yang akan dihapus
   * @param {object} options Options hapus
   * @param {boolean} [options.confirm=true] Apakah mengkonfirmasi modal dialog hapus
   */
  async deleteScript(scriptName, { confirm = true } = {}) {
    await this.ensureReady();
    const scriptItem = this.scriptPage.itemByName(scriptName);
    await expect(scriptItem).toBeVisible();

    await this.popup.selectContextMenu(scriptItem, 'Delete');
    if (confirm) {
      await this.popup.confirmAction('Delete Script', { action: 'confirm', confirmText: 'Delete' });
      await expect(scriptItem).toHaveCount(0);
    } else {
      await this.popup.confirmAction('Delete Script', { action: 'cancel', cancelText: 'Cancel' });
      await expect(scriptItem).toBeVisible();
    }
  }

  /**
   * Helper facade untuk menyalin ID script ke clipboard
   * @param {string} scriptName Nama script
   */
  async copyScriptId(scriptName) {
    await this.ensureReady();

    // Berikan izin clipboard pada browser context agar navigator.clipboard.writeText berjalan di Chromium headless
    await this.page.context().grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});

    const scriptItem = this.scriptPage.itemByName(scriptName);
    await expect(scriptItem).toBeVisible();

    await this.popup.selectContextMenu(scriptItem, 'Copy ID');
    await this.popup.expectPopAlert('Success');
  }

  /**
   * Helper facade untuk membuat folder script baru via context menu
   * @param {string} folderName Nama folder script
   * @returns {Promise<import('@playwright/test').Locator>}
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
   * @param {string} folderName Nama folder target
   */
  async enterFolder(folderName) {
    await this.ensureReady();
    const folderItem = this.scriptPage.itemByName(folderName);
    await expect(folderItem).toBeVisible();
    await folderItem.dblclick();

    await expect(this.scriptPage.breadcrumbFolder(folderName)).toBeVisible();
    await expect(folderItem).not.toBeVisible();
  }

  /**
   * Helper facade untuk kembali ke folder root via breadcrumb
   */
  async navigateToRoot() {
    await this.ensureReady();
    await this.scriptPage.breadcrumbRoot.click();
  }
}