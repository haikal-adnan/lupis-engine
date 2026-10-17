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
   * Makes sure the script tab/panel is active and ready for interaction
   */
  async ensureReady() {
    await this.scriptPage.ensureVisible();
  }

  /**
   * Facade helper that creates a new script via the top bar action button
   * @param {string} scriptName Name of the new script/component
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
   * Facade helper that attaches a script to the target entity through the "Add to {EntityName}" menu
   * @param {string} scriptName Name of the script to attach
   * @param {string} entityName Name of the target entity in the Hierarchy
   */
  async attachScriptToEntity(scriptName, entityName) {
    await this.ensureReady();

    // Make sure the target entity in the Hierarchy is active and explicitly selected
    const entityNode = this.hierarchy.nodeByName(entityName);
    await expect(entityNode).toBeVisible();
    await entityNode.click();

    const scriptItem = this.scriptPage.itemByName(scriptName);
    await expect(scriptItem).toBeVisible();

    const currentScriptId = (await entityNode.getAttribute('data-node-script-id')) || entityName;
    await this.popup.selectContextMenu(scriptItem, `Add to ${currentScriptId}`);
  }

  /**
   * Facade helper that renames a script via the context menu
   * @param {string} currentName Current script name
   * @param {string} newName New script name
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
   * Facade helper that duplicates a script via the context menu
   * @param {string} scriptName Name of the script to duplicate
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
   * Facade helper that deletes a script via the context menu and confirmation modal
   * @param {string} scriptName Name of the script to delete
   * @param {object} options Delete options
   * @param {boolean} [options.confirm=true] Whether to confirm the delete dialog
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
   * Facade helper that copies the script ID to the clipboard
   * @param {string} scriptName Script name
   */
  async copyScriptId(scriptName) {
    await this.ensureReady();

    // Grant clipboard permissions to the browser context so navigator.clipboard.writeText works in headless Chromium
    await this.page.context().grantPermissions(['clipboard-read', 'clipboard-write']);

    const scriptItem = this.scriptPage.itemByName(scriptName);
    await expect(scriptItem).toBeVisible();

    await this.popup.selectContextMenu(scriptItem, 'Copy ID');
  }

  /**
   * Facade helper that creates a new script folder via the context menu
   * @param {string} folderName Script folder name
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
   * Facade helper that navigates into a script folder
   * @param {string} folderName Target folder name
   */
  async enterFolder(folderName) {
    await this.ensureReady();
    const folderItem = this.scriptPage.itemByName(folderName);
    await expect(folderItem).toBeVisible();
    await folderItem.dblclick();

    await expect(this.scriptPage.breadcrumbFolder(folderName)).toBeVisible();
    await expect(folderItem).toBeHidden();
  }

  /**
   * Facade helper that returns to the root folder via breadcrumb
   */
  async navigateToRoot() {
    await this.ensureReady();
    await this.scriptPage.breadcrumbRoot.click();
  }
}