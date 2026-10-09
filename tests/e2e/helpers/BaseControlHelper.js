import { expect } from '@playwright/test';

export class BaseControlHelper {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  // Helper internal untuk mengisolasi elemen editable jika terdeteksi div pembungkus
  _resolveEditableElement(targetLocator) {
    return targetLocator.locator('input, textarea').or(targetLocator).first();
  }

  // ==========================================
  // BASE BUTTON & ICON BUTTON
  // ==========================================
  async clickButton(labelOrTestId, container) {
    const scope = container || this.page;
    const button = scope
      .getByTestId(labelOrTestId)
      .or(scope.getByRole('button', { name: labelOrTestId }))
      .or(scope.locator('button', { hasText: labelOrTestId }))
      .first();

    await button.click();
  }

  async clickIconButtonByTooltip(tooltipText, container) {
    const scope = container || this.page;
    const button = scope
      .getByTestId(tooltipText)
      .or(scope.getByRole('button', { name: tooltipText }))
      .or(scope.locator('button', { hasText: tooltipText }))
      .first();

    await button.click();
  }

  // ==========================================
  // BASE INPUT & TEXTAREA
  // ==========================================
  // BaseControlHelper.js
  async fillInput(labelOrTestIdOrPlaceholder, value, container) {
    const scope = container || this.page;

    // Mencari input berdasarkan data-testid/placeholder/label
    const input = scope
      .locator('input, textarea')
      .filter({
        has: scope.getByTestId(labelOrTestIdOrPlaceholder)
          .or(scope.getByPlaceholder(labelOrTestIdOrPlaceholder))
          .or(scope.getByLabel(labelOrTestIdOrPlaceholder))
      })
      .or(scope.getByTestId(labelOrTestIdOrPlaceholder).locator('input, textarea'))
      .or(scope.getByPlaceholder(labelOrTestIdOrPlaceholder))
      .or(scope.getByLabel(labelOrTestIdOrPlaceholder))
      .first();

    await input.fill(value);
    await input.blur();
    await expect(input).toHaveValue(value);
  }

  async clearInput(labelOrTestIdOrPlaceholder, container) {
    const scope = container || this.page;
    const rawTarget = scope
      .getByTestId(labelOrTestIdOrPlaceholder)
      .or(scope.getByLabel(labelOrTestIdOrPlaceholder, { exact: false }))
      .or(scope.getByPlaceholder(labelOrTestIdOrPlaceholder))
      .first();

    const input = this._resolveEditableElement(rawTarget);

    await input.clear();
    await input.blur();
    await expect(input).toHaveValue('');
  }

  async fillTextarea(labelOrTestIdOrPlaceholder, value, container) {
    const scope = container || this.page;
    const rawTarget = scope
      .getByTestId(labelOrTestIdOrPlaceholder)
      .or(scope.getByLabel(labelOrTestIdOrPlaceholder, { exact: false }))
      .or(scope.getByPlaceholder(labelOrTestIdOrPlaceholder))
      .first();

    const textarea = this._resolveEditableElement(rawTarget);

    await textarea.fill(value);
    await textarea.blur();
    await expect(textarea).toHaveValue(value);
  }

  // ==========================================
  // BASE NUMBER
  // ==========================================
  async fillNumber(labelOrTestIdOrPlaceholder, value, container) {
    const scope = container || this.page;
    const rawTarget = scope
      .getByTestId(labelOrTestIdOrPlaceholder)
      .or(scope.getByLabel(labelOrTestIdOrPlaceholder, { exact: false }))
      .or(scope.getByPlaceholder(labelOrTestIdOrPlaceholder))
      .first();

    const input = this._resolveEditableElement(rawTarget);

    await input.fill(String(value));
    await input.press('Enter');
    await expect(input).toHaveValue(String(value));
  }

  async scrubNumber(prefixText, dragDistanceX, targetInputLocator, container) {
    const scope = container || this.page;
    const prefixElement = scope
      .locator('div, span, label')
      .filter({ hasText: new RegExp(`^${prefixText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) })
      .first();

    await prefixElement.scrollIntoViewIfNeeded();
    const box = await prefixElement.boundingBox();
    if (!box) throw new Error(`Prefix '${prefixText}' tidak ditemukan untuk di-scrub`);

    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(startX + dragDistanceX, startY);
    await this.page.mouse.up();

    if (targetInputLocator) {
      await expect(targetInputLocator).not.toHaveValue('');
    }
  }

  // ==========================================
  // BASE CHECKBOX
  // ==========================================
  async setCheckbox(labelOrTestId, checked = true, container) {
    const scope = container || this.page;
    const checkbox = scope
      .getByTestId(labelOrTestId)
      .or(scope.getByLabel(labelOrTestId, { exact: false }))
      .or(scope.locator('label', { hasText: labelOrTestId }).locator('input[type="checkbox"]'))
      .first();

    if (checked) {
      await checkbox.check();
      await expect(checkbox).toBeChecked();
    } else {
      await checkbox.uncheck();
      await expect(checkbox).not.toBeChecked();
    }
  }

  // ==========================================
  // BASE COLOR
  // ==========================================
  async fillHexColor(labelOrTestId, hexCode, container) {
    const scope = container || this.page;
    const rawTarget = scope
      .getByTestId(labelOrTestId)
      .or(scope.getByLabel(labelOrTestId, { exact: false }))
      .first();

    const input = this._resolveEditableElement(rawTarget);

    await input.fill(hexCode);
    await input.press('Enter');
    await expect(input).toHaveValue(hexCode);
  }

  // ==========================================
  // BASE SEARCH INPUT
  // ==========================================
  async fillSearch(placeholderOrTestId, query, container) {
    const scope = container || this.page;
    const rawTarget = scope
      .getByTestId(placeholderOrTestId)
      .or(scope.getByPlaceholder(placeholderOrTestId))
      .first();

    const searchInput = this._resolveEditableElement(rawTarget);

    await searchInput.fill(query);
    await expect(searchInput).toHaveValue(query);
  }

  // BaseControlHelper.js

  async clearSearch(placeholderOrTestId, container) {
    const scope = container || this.page;

    // 1. Cari target input
    const rawTarget = scope
      .getByTestId(placeholderOrTestId)
      .or(scope.getByPlaceholder(placeholderOrTestId))
      .first();

    const searchInput = this._resolveEditableElement(rawTarget);

    // 2. Cari tombol clear (prioritaskan data-testid="search-clear-button")
    const clearButton = scope
      .getByTestId('search-clear-button')
      .or(scope.getByRole('button', { name: /clear/i }))
      .first();

    if (await clearButton.isVisible()) {
      await clearButton.click();
    } else {
      // Fallback jika tombol clear tidak muncul atau terhalang
      await searchInput.fill('');
      await searchInput.blur();
    }

    // 3. Pastikan input sudah kosong
    await expect(searchInput).toHaveValue('');
  }

  // ==========================================
  // BASE SELECT
  // ==========================================
  // BaseControlHelper.js
  async selectOption(labelOrTestId, optionLabel, container) {
    const scope = container || this.page;

    // 1. Trigger Dropdown
    const trigger = scope
      .getByTestId(labelOrTestId)
      .or(scope.getByTestId('select-trigger'))
      .or(scope.getByRole('combobox', { name: labelOrTestId }))
      .or(scope.locator('button', { hasText: labelOrTestId }))
      .first();

    await trigger.click();

    // 2. Cari Opsi spesifik di dalam Teleport Dropdown menggunakan regex fleksibel untuk whitespace
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const optionItem = this.page
      .getByTestId('select-option')
      .filter({ hasText: new RegExp(`^\\s*${escapeRegex(optionLabel)}\\s*$`, 'i') })
      .or(this.page.getByRole('option', { name: optionLabel }))
      .first();

    await expect(optionItem).toBeVisible();
    await optionItem.click();
  }

  // tests/e2e/components/BaseControlHelper.js

  // tests/e2e/components/BaseControlHelper.js
  async clickSelectAction(labelOrTestId, actionText, container) {
    const scope = container || this.page;

    const trigger = scope
      .getByTestId(labelOrTestId)
      .or(scope.getByTestId('scene-options-button'))
      .or(scope.getByLabel(labelOrTestId, { exact: false }))
      .or(scope.getByRole('button', { name: labelOrTestId }))
      .or(scope.locator(`button[title="${labelOrTestId}"], button[aria-label="${labelOrTestId}"]`))
      .or(scope.locator('button', { hasText: labelOrTestId }))
      .first();

    await expect(trigger).toBeVisible();
    await trigger.click();

    // Cari item aksi dari menu dropdown yang terbuka
    const menu = this.page.getByTestId('scene-options-menu').or(this.page.getByRole('menu')).last();
    await expect(menu).toBeVisible();

    const actionItem = menu
      .getByRole('menuitem', { name: actionText })
      .or(menu.locator('button, li, div', { hasText: actionText }))
      .first();

    await expect(actionItem).toBeVisible();
    await actionItem.click();
  }

  async deleteSelectOption(labelOrTestId, optionLabel, container) {
    const scope = container || this.page;

    const trigger = scope
      .getByTestId(labelOrTestId)
      .or(scope.getByLabel(labelOrTestId, { exact: false }))
      .or(scope.getByRole('button', { name: labelOrTestId }))
      .or(scope.locator('button', { hasText: labelOrTestId }))
      .first();

    await trigger.click();

    const optionItem = this.page
      .getByRole('option', { name: optionLabel })
      .or(this.page.locator('li, div', { hasText: optionLabel }))
      .first();

    await optionItem.hover();

    const deleteBtn = optionItem
      .getByRole('button', { name: /delete/i })
      .or(optionItem.locator('button[title*="Delete"], button[aria-label*="Delete"]'))
      .first();

    await deleteBtn.click();
  }
}

