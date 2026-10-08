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
    await targetLocator.click({ button: 'right' });

    const menuPath = Array.isArray(itemLabelOrPath) ? itemLabelOrPath : [itemLabelOrPath];
    if (menuPath.length === 0) return;

    for (let i = 0; i < menuPath.length; i++) {
      const label = menuPath[i];
      if (!label) continue;

      const contextMenu = this.page
        .getByRole('menu')
        .or(this.page.getByTestId('project-context-menu'))
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
      .or(this.page.getByRole('dialog'))
      .or(this.page.getByRole('alertdialog'))
      .first();

    await expect(promptModal).toBeVisible();

    const input = promptModal
      .getByRole('textbox')
      .or(promptModal.getByTestId('prompt-input'))
      .or(promptModal.locator('input'))
      .first();

    await input.fill(value);

    const submitBtn = promptModal
      .getByRole('button', { name: confirmButtonText })
      .or(promptModal.getByTestId('submit-prompt-btn'))
      .or(promptModal.locator('button', { hasText: new RegExp(`^\\s*${confirmButtonText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i') }))
      .first();

    await submitBtn.click();
    await expect(promptModal).toHaveCount(0);
  }

  async fillPromptAndCancel(title, cancelButtonText = 'Cancel') {
    const promptModal = this.page
      .getByRole('dialog', { name: title })
      .or(this.page.getByRole('dialog'))
      .or(this.page.getByRole('alertdialog'))
      .first();

    await expect(promptModal).toBeVisible();

    const cancelBtn = promptModal
      .getByRole('button', { name: cancelButtonText })
      .or(promptModal.getByTestId('cancel-prompt-btn'))
      .or(promptModal.locator('button', { hasText: new RegExp(`^\\s*${cancelButtonText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i') }))
      .first();

    await cancelBtn.click();
    await expect(promptModal).toHaveCount(0);
  }

  // ==========================================
  // BASE CONFIRM HELPER (Diperbarui untuk BaseConfirm)
  // ==========================================
  async confirmAction(titleOrText, options = {}) {
    const action = options.action ?? 'confirm';

    // Mendukung role="alertdialog" dan role="dialog" serta data-testid="base-confirm"
    const modal = this.page
      .getByRole('alertdialog')
      .or(this.page.getByRole('dialog'))
      .or(this.page.getByTestId('base-confirm'))
      .filter({ hasText: titleOrText })
      .first();

    await expect(modal).toBeVisible();

    const buttonText = action === 'confirm' ? (options.confirmText || 'Confirm') : (options.cancelText || 'Cancel');

    const targetBtn = action === 'confirm'
      ? modal.getByTestId('confirm-action-button').or(modal.getByRole('button', { name: buttonText })).or(modal.locator('button', { hasText: new RegExp(buttonText, 'i') })).first()
      : modal.getByTestId('confirm-cancel-button').or(modal.getByRole('button', { name: buttonText })).or(modal.locator('button', { hasText: new RegExp(buttonText, 'i') })).first();

    await targetBtn.click();
    await expect(modal).toHaveCount(0);
  }

  // ==========================================
  // BASE POP ALERT HELPER (Diperbarui untuk BasePopAlert)
  // ==========================================
  async expectPopAlert(title, options = {}) {
    const alertBox = this.page
      .getByRole('alert')
      .or(this.page.getByTestId('pop-alert'))
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
      .or(this.page.getByTestId('pop-alert'))
      .filter({ hasText: title })
      .first();

    const closeBtn = alertBox
      .getByTestId('pop-alert-close-btn')
      .or(alertBox.getByRole('button', { name: /close/i }))
      .or(alertBox.locator('button'))
      .first();

    await closeBtn.click();
    await expect(alertBox).toHaveCount(0);
  }
}


