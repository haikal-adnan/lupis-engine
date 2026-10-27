import { expect } from '@playwright/test';

export class BaseControlHelper {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  // Internal helper: resolves the editable element when the test ID sits on a wrapper div
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
  async fillInput(labelOrTestIdOrPlaceholder, value, container) {
    const scope = container || this.page;

    // Find the input by data-testid / placeholder / label
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
    if (!box) throw new Error(`Prefix '${prefixText}' was not found for scrubbing`);

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

  /**
   * Test ID convention: input `X-input` is paired with button `X-clear-button`
   * (mis. `hierarchy-search-input` -> `hierarchy-search-clear-button`).
   */
  async clearSearch(placeholderOrTestId, container) {
    const scope = container || this.page;

    const rawTarget = scope
      .getByTestId(placeholderOrTestId)
      .or(scope.getByPlaceholder(placeholderOrTestId))
      .first();

    const searchInput = this._resolveEditableElement(rawTarget);

    const clearTestId = placeholderOrTestId.replace(/-input$/, '-clear-button');
    const clearButton = scope
      .getByTestId(clearTestId)
      .or(scope.getByRole('button', { name: /clear/i }))
      .first();

    // count() does not wait; the clear button uses v-if="modelValue", so it is optional
    if ((await clearButton.count()) > 0) {
      await clearButton.click();
    } else {
      await searchInput.fill('');
      await searchInput.blur();
    }

    await expect(searchInput).toHaveValue('');
  }

  // ==========================================
  // BASE SELECT
  // ==========================================
  async selectOption(labelOrTestId, optionLabel, container) {
    const scope = container || this.page;

    // 1. Trigger Dropdown
    const trigger = scope
      .getByTestId(labelOrTestId)
      .locator('button[data-testid="select-trigger"], button[role="combobox"]')
      .or(scope.getByTestId(labelOrTestId))
      .or(scope.getByTestId('select-trigger'))
      .or(scope.getByRole('combobox', { name: labelOrTestId }))
      .or(scope.locator('button', { hasText: labelOrTestId }))
      .first();

    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();

    // 2. Find the exact option inside the teleported dropdown (whitespace-tolerant exact match)
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const optionItem = this.page
      .getByTestId('select-option')
      .filter({ hasText: new RegExp(`^\\s*${escapeRegex(optionLabel)}\\s*$`, 'i') })
      .or(this.page.getByRole('option', { name: optionLabel }))
      .first();

    await expect(optionItem).toBeVisible();
    await optionItem.scrollIntoViewIfNeeded();
    await optionItem.click();
  }

  /**
   * Opens a "select action" trigger (e.g. an options button that shows a dropdown
   * menu with several actions) and clicks one item inside it.
   *
   * GENERIC: no fallback to the test ID of a specific widget. Pass the trigger test ID
   * explicitly, e.g. clickSelectAction('hierarchy-scene-options-button', 'New Scene'),
   * or its aria-label/title ('Scene Options').
   */
  async clickSelectAction(labelOrTestId, actionText, container) {
    const scope = container || this.page;

    const trigger = scope
      .getByTestId(labelOrTestId)
      .or(scope.getByLabel(labelOrTestId, { exact: false }))
      .or(scope.getByRole('button', { name: labelOrTestId }))
      .or(scope.locator(`button[title="${labelOrTestId}"], button[aria-label="${labelOrTestId}"]`))
      .or(scope.locator('button', { hasText: labelOrTestId }))
      .first();

    await expect(trigger).toBeVisible();
    await trigger.click();

    // The dropdown menu is usually teleported to the end of the DOM while open.
    const menu = this.page.getByRole('menu').last();
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
