import { expect } from '@playwright/test';

export class PopupHelper {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Mengklik kanan target element lalu memilih item dari context menu
   * @param {import('@playwright/test').Locator} targetLocator 
   * @param {string | string[]} itemLabelOrPath 
   */
  async selectContextMenu(targetLocator, itemLabelOrPath) {
    await targetLocator.scrollIntoViewIfNeeded();

    // Trigger context menu via Playwright API
    await targetLocator.click({ button: 'right' });

    const menuPath = Array.isArray(itemLabelOrPath) ? itemLabelOrPath : [itemLabelOrPath];
    if (menuPath.length === 0) return;

    for (let i = 0; i < menuPath.length; i++) {
      const label = menuPath[i];
      if (!label) continue;

      // Prioritaskan role menu semantik, fallback ke CSS class
      const contextMenu = this.page
        .getByRole('menu')
        .or(this.page.locator('.base-context-menu-fixed'))
        .last();

      await expect(contextMenu).toBeVisible();

      const menuItem = contextMenu
        .getByRole('menuitem', { name: label })
        .or(
          contextMenu.locator('div, button, li, span').filter({
            hasText: new RegExp(`^\\s*${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i')
          })
        )
        .first();

      await expect(menuItem).toBeVisible();

      if (i < menuPath.length - 1) {
        await menuItem.hover();
      } else {
        await menuItem.click();
      }
    }
  }

  // ==========================================
  // BASE PROMPT HELPER
  // ==========================================
  async fillPromptAndSubmit(title, value, confirmButtonText = 'Save') {
    const promptModal = this.page
      .getByRole('dialog', { name: title })
      .or(this.page.locator('div[role="dialog"]'))
      .or(this.page.locator('div.fixed.inset-0').filter({ has: this.page.locator('input') }))
      .first();

    await expect(promptModal).toBeVisible();

    const input = promptModal.getByRole('textbox').or(promptModal.locator('input')).first();
    await input.fill(value);

    const submitBtn = promptModal
      .getByRole('button', { name: confirmButtonText })
      .or(promptModal.locator('button', { hasText: new RegExp(`^\\s*${confirmButtonText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i') }))
      .first();

    await submitBtn.click();
    await expect(promptModal).not.toBeVisible();
  }

  async fillPromptAndCancel(title, cancelButtonText = 'Cancel') {
    const promptModal = this.page
      .getByRole('dialog', { name: title })
      .or(this.page.locator('div[role="dialog"]'))
      .or(this.page.locator('div.fixed.inset-0').filter({ has: this.page.locator('input') }))
      .first();

    await expect(promptModal).toBeVisible();

    const cancelBtn = promptModal
      .getByRole('button', { name: cancelButtonText })
      .or(promptModal.locator('button', { hasText: new RegExp(`^\\s*${cancelButtonText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i') }))
      .first();

    await cancelBtn.click();
    await expect(promptModal).not.toBeVisible();
  }

  // ==========================================
  // BASE CONFIRM HELPER
  // ==========================================
  async confirmAction(title, options = {}) {
    const action = options.action ?? 'confirm';
    const modal = this.page
      .getByRole('dialog', { name: title })
      .or(this.page.locator('div[role="dialog"]', { hasText: title }))
      .or(this.page.locator('div.fixed.inset-0', { hasText: title }))
      .first();

    await expect(modal).toBeVisible();

    const buttonText = action === 'confirm' ? (options.confirmText || 'Confirm') : (options.cancelText || 'Cancel');
    const targetBtn = modal
      .getByRole('button', { name: buttonText })
      .or(modal.locator('button', { hasText: new RegExp(buttonText, 'i') }))
      .first();

    await targetBtn.click();
    await expect(modal).not.toBeVisible();
  }

  // ==========================================
  // BASE POP ALERT HELPER
  // ==========================================
  async expectPopAlert(title, options = {}) {
    const alertBox = this.page
      .getByRole('alert')
      .or(this.page.locator('div.fixed.top-6, .pop-alert', { hasText: title }))
      .filter({ hasText: title })
      .first();

    await expect(alertBox).toBeVisible();

    if (options.message) {
      await expect(alertBox).toContainText(options.message);
    }
  }

  async closePopAlert(title) {
    const alertBox = this.page
      .getByRole('alert')
      .or(this.page.locator('div.fixed.top-6, .pop-alert', { hasText: title }))
      .filter({ hasText: title })
      .first();

    const closeBtn = alertBox
      .getByRole('button', { name: /close/i })
      .or(alertBox.locator('button'))
      .first();

    await closeBtn.click();
    await expect(alertBox).not.toBeVisible();
  }
}