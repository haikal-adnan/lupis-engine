import { expect } from '@playwright/test';
import { AnimatorPage } from '../pages/AnimatorPage.js';
import { PopupHelper } from '../helpers/PopupHelper.js';
import { BaseControlHelper } from '../helpers/BaseControlHelper.js';

export class AnimatorCrudObject {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.animatorPage = new AnimatorPage(page);
    this.popup = new PopupHelper(page);
    this.controls = new BaseControlHelper(page);
  }

  async ensureTimelineFocused() {
    if ((await this.animatorPage.timelineSection.count()) === 0) {
      await this.page.getByTestId('bottom-tab-timeline').click();
    }
    await expect(this.animatorPage.timelineSection).toBeVisible();
  }

  async ensureClipSelected(clipNode) {
    await expect(clipNode).toBeVisible();
    // selectClip() toggles (clicking the active clip deselects it), so only click if the properties are not shown yet.
    // TODO contract: give animator-tree-node an aria-selected attribute so switching between clips is reliable.
    if ((await this.animatorPage.clipNameInput.count()) === 0) {
      await clipNode.click();
    }
    await expect(this.animatorPage.clipNameInput).toBeVisible();
  }

  async createCategoryViaContextMenu(targetNode = null) {
    if (targetNode) {
      await this.popup.selectContextMenu(targetNode, 'New Category');
    } else {
      await this.popup.selectContextMenu(this.animatorPage.treeContent, 'New Category');
    }
  }

  async createClipViaContextMenu(targetNode = null) {
    if (targetNode) {
      const nodeType = await targetNode.getAttribute('data-node-type');
      const actionLabel = nodeType === 'category' ? 'Add Clip' : 'New Clip';
      await this.popup.selectContextMenu(targetNode, actionLabel);
    } else {
      await this.popup.selectContextMenu(this.animatorPage.treeContent, 'New Clip');
    }
  }

  async selectClipNode(clipNode) {
    await this.ensureClipSelected(clipNode);
    await this.ensureTimelineFocused();
  }

  async renameClipOrCategory(targetNode, newName) {
    await expect(targetNode).toBeVisible();
    await this.popup.selectContextMenu(targetNode, 'Rename');
    await this.popup.fillPromptAndSubmit(/Ganti Nama|Rename/i, newName, 'Simpan');
  }

  async configureClipProperties({ scriptId, name, fps, loop, flipX = false, filterMode } = {}) {
    if (scriptId) {
      await this.animatorPage.scriptIdInput.fill(scriptId);
      await this.animatorPage.scriptIdInput.blur();
    }
    if (name) {
      await this.animatorPage.clipNameInput.fill(name);
      await this.animatorPage.clipNameInput.blur();
    }
    if (fps !== undefined) {
      await this.animatorPage.fpsInput.fill(String(fps));
      await this.animatorPage.fpsInput.press('Enter');
    }
    if (filterMode) {
      // Pass the container so the trigger scope stays isolated for filterSelect
      await this.controls.selectOption(
        'animator-property-filter-select',
        filterMode,
        this.animatorPage.filterSelect
      );
    }
    if (loop !== undefined) {
      const targetText = typeof loop === 'string' ? loop : (loop ? 'True (Loop)' : 'False (Once)');
      // Pass the container so the trigger scope stays isolated for loopSelect
      await this.controls.selectOption(
        'animator-property-loop-select',
        targetText,
        this.animatorPage.loopSelect
      );
    }
    if (flipX) {
      await this.animatorPage.flipXButton.click();
    }
  }

  async setSourceRect(x, y, w, h) {
    await this.ensureTimelineFocused();
    await this.animatorPage.sourceRectX.fill(String(x));
    await this.animatorPage.sourceRectX.press('Enter');
    await this.animatorPage.sourceRectY.fill(String(y));
    await this.animatorPage.sourceRectY.press('Enter');
    await this.animatorPage.sourceRectW.fill(String(w));
    await this.animatorPage.sourceRectW.press('Enter');
    await this.animatorPage.sourceRectH.fill(String(h));
    await this.animatorPage.sourceRectH.press('Enter');
  }

  async addFrameToTimeline() {
    await this.ensureTimelineFocused();
    const btn = this.animatorPage.timelineAddFrameBtn;
    await expect(btn).toBeVisible();
    await btn.click();
  }

  async clearTimeline({ confirm = true } = {}) {
    await this.ensureTimelineFocused();
    const btn = this.animatorPage.timelineClearBtn;
    await expect(btn).toBeVisible();
    await btn.click();
    if (confirm) {
      await this.popup.confirmAction('Clear Timeline', { action: 'confirm', confirmText: 'Clear' });
    } else {
      await this.popup.confirmAction('Clear Timeline', { action: 'cancel', cancelText: 'Cancel' });
    }
  }
}