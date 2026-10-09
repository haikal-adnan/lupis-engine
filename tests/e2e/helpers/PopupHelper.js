import { expect } from '@playwright/test';

/**
 * Satu-satunya pengecualian aturan "tanpa hardcoded timeout":
 * waktu singkat untuk memeriksa apakah klik kanan biasa sudah membuka menu,
 * sebelum beralih ke fallback dispatchEvent. Bukan untuk menunggu UI settle.
 */
const MENU_OPEN_PROBE_MS = 2000;

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export class PopupHelper {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  /** Semua level context menu yang sedang terbuka (menu utama + submenu). */
  get menus() {
    return this.page.getByRole('menu');
  }

  // ==========================================
  // CONTEXT MENU
  // Kontrak:
  //  - Precondition : tidak ada menu terbuka dari aksi sebelumnya
  //  - Postcondition: semua level menu tertutup setelah item terakhir diklik
  //                   (kecuali path kosong [], menu sengaja dibiarkan terbuka)
  // ==========================================
  /**
   * Klik kanan target lalu pilih item context menu (bisa bertingkat).
   * @param {import('@playwright/test').Locator} targetLocator
   * @param {string | string[]} itemLabelOrPath
   */
  async selectContextMenu(targetLocator, itemLabelOrPath) {
    const menuPath = Array.isArray(itemLabelOrPath) ? itemLabelOrPath : [itemLabelOrPath];
    const menus = this.menus;

    await targetLocator.scrollIntoViewIfNeeded();
    await expect(targetLocator).toBeVisible();

    // Gagal lebih awal dan jelas jika ada menu sisa dari aksi sebelumnya
    await expect(menus).toHaveCount(0);

    await targetLocator.click({ button: 'right' });

    try {
      await expect(menus.first()).toBeVisible({ timeout: MENU_OPEN_PROBE_MS });
    } catch (e) {
      // Fallback dengan koordinat, agar menu muncul di posisi node, bukan (0,0)
      const box = await targetLocator.boundingBox();
      await targetLocator.dispatchEvent('contextmenu', {
        bubbles: true,
        cancelable: true,
        button: 2,
        clientX: box.x + box.width / 2,
        clientY: box.y + box.height / 2,
      });
      await expect(menus.first()).toBeVisible();
    }

    if (menuPath.length === 0) return;

    for (let i = 0; i < menuPath.length; i++) {
      const label = menuPath[i];

      // Cocokkan persis lewat data-menu-item; fallback ke nama accessible
      const menuItem = this.page
        .getByRole('menuitem')
        .and(this.page.locator(`[data-menu-item="${label}"]`))
        .or(menus.getByRole('menuitem', { name: label }))
        .last();

      await expect(menuItem).toBeVisible();

      if (i < menuPath.length - 1) {
        await menuItem.hover();
        await expect(menus).toHaveCount(i + 2); // submenu level berikutnya terbuka
      } else {
        await menuItem.click();
        await expect(menus).toHaveCount(0); // menu tertutup sebelum aksi berikutnya
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