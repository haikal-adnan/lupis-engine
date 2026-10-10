import { expect } from '@playwright/test';

const MENU_OPEN_PROBE_MS = 2000;
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class PopupHelper {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  /** Mengambil seluruh context menu yang sedang aktif dan terlihat di viewport. */
  get activeMenus() {
    return this.page.locator('[role="menu"]:visible');
  }

  async selectContextMenu(targetLocator, itemLabelOrPath) {
    const menuPath = Array.isArray(itemLabelOrPath) ? itemLabelOrPath : [itemLabelOrPath];

    await targetLocator.scrollIntoViewIfNeeded();
    await expect(targetLocator).toBeVisible();

    // 1. Flush fokus input aktif & tunggu 1 frame agar siklus VDOM Vue benar-benar idle
    await this.page.evaluate(() => {
      if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur();
      }
    });
    await this.page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));

    // 2. Tutup menu menggantung jika ada
    if (await this.activeMenus.count() > 0) {
      await this.page.keyboard.press('Escape');
      await expect(this.activeMenus).toHaveCount(0);
    }

    // 3. Buka context menu
    await targetLocator.click({ button: 'right' });

    // 4. Pastikan root menu dirender
    const rootMenu = this.activeMenus.first();
    await expect(rootMenu).toBeVisible();

    for (let i = 0; i < menuPath.length; i++) {
      const label = menuPath[i];
      const currentMenu = this.activeMenus.nth(i);

      const menuItem = currentMenu
        .locator(`[data-menu-item="${label}"]`)
        .or(currentMenu.getByRole('menuitem', { name: label }))
        .or(currentMenu.locator('[role="menuitem"], button').filter({ hasText: new RegExp(`^\\s*${escapeRegex(label)}\\s*$`, 'i') }))
        .first();

      await expect(menuItem).toBeVisible();

      if (i < menuPath.length - 1) {
        await menuItem.hover();
        await expect(this.activeMenus).toHaveCount(i + 2);
      } else {
        // 5. Eksekusi event click secara langsung pada elemen yang sudah terverifikasi visible
        await menuItem.dispatchEvent('click');
        
        // Verifikasi menu tertutup sempurna setelah aksi diproses
        await expect(this.activeMenus).toHaveCount(0);
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
      .or(promptModal.locator('button', { hasText: new RegExp(`^\\s*${escapeRegex(confirmButtonText)}\\s*$`, 'i') }))
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
      .or(promptModal.locator('button', { hasText: new RegExp(`^\\s*${escapeRegex(cancelButtonText)}\\s*$`, 'i') }))
      .first();

    await cancelBtn.click();
    await expect(promptModal).toHaveCount(0);
  }

  // ==========================================
  // BASE CONFIRM HELPER
  // ==========================================
  async confirmAction(titleOrText, options = {}) {
    const action = options.action ?? 'confirm';

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
  // BASE POP ALERT HELPER
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