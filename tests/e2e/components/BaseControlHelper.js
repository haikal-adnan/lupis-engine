import { expect } from '@playwright/test';

export class BaseControlHelper {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  // ==========================================
  // BASE BUTTON & ICON BUTTON
  // ==========================================
  async clickButton(labelOrText, container) {
    const scope = container || this.page;
    const button = scope
      .getByRole('button', { name: labelOrText })
      .or(scope.locator('button', { hasText: labelOrText }))
      .first();

    await button.click();
  }

  async clickIconButtonByTooltip(tooltipText, container) {
    const scope = container || this.page;
    const button = scope
      .getByRole('button', { name: tooltipText })
      .or(scope.locator('button', { hasText: tooltipText }))
      .first();

    await button.click();
  }

  // ==========================================
  // BASE INPUT
  // ==========================================
  async fillInput(labelOrPlaceholder, value, container) {
    const scope = container || this.page;
    const input = scope
      .getByLabel(labelOrPlaceholder, { exact: false })
      .or(scope.getByPlaceholder(labelOrPlaceholder))
      .first();

    await input.fill(value);
    await input.blur();
    await expect(input).toHaveValue(value);
  }

  // ==========================================
  // BASE NUMBER
  // ==========================================
  async fillNumber(labelOrPlaceholder, value, container) {
    const scope = container || this.page;
    const input = scope
      .getByLabel(labelOrPlaceholder, { exact: false })
      .or(scope.getByPlaceholder(labelOrPlaceholder))
      .first();

    await input.fill(String(value));
    await input.press('Enter');
    await expect(input).toHaveValue(String(value));
  }

  async scrubNumber(prefixText, dragDistanceX, container) {
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
  }

  // ==========================================
  // BASE CHECKBOX
  // ==========================================
  async setCheckbox(label, checked = true, container) {
    const scope = container || this.page;
    const checkbox = scope.getByLabel(label, { exact: false }).or(
      scope.locator('label', { hasText: label }).locator('input[type="checkbox"]')
    ).first();

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
  async fillHexColor(label, hexCode, container) {
    const scope = container || this.page;
    const inputByLabel = scope.getByLabel(label, { exact: false }).first();

    await inputByLabel.fill(hexCode);
    await inputByLabel.press('Enter');
    await expect(inputByLabel).toHaveValue(hexCode);
  }

  // ==========================================
  // BASE SEARCH INPUT
  // ==========================================
  async fillSearch(placeholder, query, container) {
    const scope = container || this.page;
    const searchInput = scope.getByPlaceholder(placeholder);

    await searchInput.fill(query);
    await expect(searchInput).toHaveValue(query);
  }

  async clearSearch(placeholder, container) {
    const scope = container || this.page;
    const containerEl = scope.locator('div', { has: scope.getByPlaceholder(placeholder) }).first();
    const clearButton = containerEl.getByRole('button').or(containerEl.locator('button')).first();

    await clearButton.click();
    await expect(scope.getByPlaceholder(placeholder)).toHaveValue('');
  }

  // ==========================================
  // BASE SELECT
  // ==========================================
  async selectOption(labelOrPlaceholder, optionLabel, container) {
    const scope = container || this.page;

    const trigger = scope
      .getByLabel(labelOrPlaceholder, { exact: false })
      .or(scope.getByRole('button', { name: labelOrPlaceholder }))
      .or(scope.locator('button', { hasText: labelOrPlaceholder }))
      .first();

    await trigger.click();

    // Teleported UI diletakkan pada page level
    const optionItem = this.page
      .getByRole('option', { name: optionLabel })
      .or(this.page.locator('li, div', { hasText: optionLabel }))
      .first();

    await optionItem.click();
  }

  async clickSelectAction(labelOrPlaceholder, actionText, container) {
    const scope = container || this.page;

    const trigger = scope
      .getByLabel(labelOrPlaceholder, { exact: false })
      .or(scope.getByRole('button', { name: labelOrPlaceholder }))
      .or(scope.locator('button', { hasText: labelOrPlaceholder }))
      .first();

    await trigger.click();

    const actionItem = this.page
      .getByRole('button', { name: actionText })
      .or(this.page.locator('li, div', { hasText: actionText }))
      .first();

    await actionItem.click();
  }

  async deleteSelectOption(labelOrPlaceholder, optionLabel, container) {
    const scope = container || this.page;

    const trigger = scope
      .getByLabel(labelOrPlaceholder, { exact: false })
      .or(scope.getByRole('button', { name: labelOrPlaceholder }))
      .or(scope.locator('button', { hasText: labelOrPlaceholder }))
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

  // ==========================================
  // BASE TEXTAREA
  // ==========================================
  async fillTextarea(labelOrPlaceholder, value, container) {
    const scope = container || this.page;

    const textarea = scope
      .getByLabel(labelOrPlaceholder, { exact: false })
      .or(scope.getByPlaceholder(labelOrPlaceholder))
      .first();

    await textarea.fill(value);
    await textarea.blur();
    await expect(textarea).toHaveValue(value);
  }
}