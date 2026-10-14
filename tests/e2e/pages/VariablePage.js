import { expect } from '@playwright/test';
import { BaseControlHelper } from '../helpers/BaseControlHelper.js';

export class VariablePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.controls = new BaseControlHelper(page);
    this.manageBtn = page.getByTestId('variable-panel-manage-btn');
    this.modal = page
      .getByTestId('variable-modal')
      .or(page.locator('.fixed.inset-0').filter({ hasText: 'Variables' }))
      .first();

    this.globalScopeBtn = page.getByTestId('variable-modal-scope-global-btn');
    this.localScopeBtn = page.getByTestId('variable-modal-scope-local-btn');
    this.searchInput = page.getByTestId('variable-modal-search-input').locator('input');
    this.addBtn = page.getByTestId('variable-modal-add-btn');
    this.closeBtn = page.getByTestId('variable-modal-close-btn');

    this.rawEditorBtn = page.getByTestId('variable-modal-raw-editor-btn');
    this.rawJsonTextarea = page.getByTestId('variable-modal-raw-json-textarea');
    this.rawJsonApplyBtn = page.getByTestId('variable-modal-raw-json-apply-btn');
  }

  async openManager() {
    await this.manageBtn.scrollIntoViewIfNeeded();
    await expect(this.manageBtn).toBeVisible();
    await this.manageBtn.click();
    await expect(this.modal).toBeVisible();
  }

  async closeManager() {
    await this.closeBtn.click();
    await expect(this.modal).toBeHidden();
  }

  async switchModalScope(scope = 'Local') {
    if (scope === 'Global') {
      await this.globalScopeBtn.click();
    } else {
      await this.localScopeBtn.click();
    }
  }

  itemRowByName(name) {
    return this.modal
      .getByTestId('variable-modal-item-row')
      .filter({
        has: this.page.locator(`[data-testid="variable-modal-name-input"][value="${name}"], input[value="${name}"]`),
      })
      .or(
        this.modal.locator(`[data-testid="variable-modal-item-row"][data-variable-name="${name}"]`)
      )
      .first();
  }

  panelItemRow(name, scope) {
    let selector = `[data-testid="variable-panel-item-row"][data-variable-name="${name}"]`;
    if (scope) {
      selector += `[data-scope="${scope}"]`;
    }
    return this.page.locator(selector).first();
  }

  async createVariable({ name = 'NewVar', type = 'string', isExposed = false, scope = 'Local' }) {
    await this.switchModalScope(scope);
    await this.addBtn.click();

    const lastRow = this.modal.getByTestId('variable-modal-item-row').last();
    await expect(lastRow).toBeVisible();

    const nameInput = lastRow.getByTestId('variable-modal-name-input');
    await expect(nameInput).toBeVisible();
    await nameInput.fill(name);
    await nameInput.blur();

    if (type !== 'string') {
      // The type control is either a native <select> or the custom BaseSelect dropdown.
      // The branch is decided deterministically from the element itself (no swallowed errors).
      const typeSelect = lastRow.getByTestId('variable-modal-type-select').first();
      const isNativeSelect = await typeSelect.evaluate((el) => el instanceof HTMLSelectElement);

      if (isNativeSelect) {
        // A string argument matches either the option value or its label.
        await typeSelect.selectOption(type);
      } else {
        await this.controls.selectOption('variable-modal-type-select', type, lastRow);
      }
    }

    if (isExposed) {
      // The test ID sits either on a native checkbox or on a custom wrapper element.
      const exposeCheckbox = lastRow.getByTestId('variable-modal-expose-checkbox');
      const isNativeCheckbox = await exposeCheckbox.evaluate(
        (el) => el instanceof HTMLInputElement && el.type === 'checkbox',
      );

      if (isNativeCheckbox) {
        await exposeCheckbox.setChecked(true);
      } else {
        await exposeCheckbox.click();
      }
    }

    return lastRow;
  }

  async openRowMenu(name) {
    const row = this.itemRowByName(name);
    await expect(row).toBeVisible();
    await row.getByTestId('variable-modal-row-menu-trigger').first().click();
  }

  /**
   * Chooses True/False in the boolean value select of a variable row.
   *
   * Scoped to the boolean select itself on purpose: a row also contains the type select,
   * and a row-wide `select-trigger` lookup would match the type select first (it comes
   * earlier in the DOM). The component root carries `variable-modal-value-bool-select`
   * (attribute fallthrough replaces BaseSelect's own `select-container` ID, Section 7.5b).
   * Postcondition: the trigger displays the chosen label.
   */
  async setBooleanValue(row, value) {
    const label = value ? 'True' : 'False';
    const trigger = row.getByTestId('variable-modal-value-bool-select').getByTestId('select-trigger');

    await trigger.click();
    // The dropdown is teleported to <body>, so the option is located from the page.
    const option = this.page.getByTestId('select-option').filter({ hasText: new RegExp(`^\\s*${label}\\s*$`) });
    await expect(option).toBeVisible();
    await option.click();

    await expect(trigger).toContainText(label);
  }

  async fillCollectionMapKey(index, key) {
    const keyInput = this.modal.locator('input[placeholder*="Key"]').nth(index);
    await expect(keyInput).toBeVisible();
    await keyInput.focus();
    await keyInput.fill(key);
    await keyInput.dispatchEvent('input');
    await keyInput.dispatchEvent('change');
    await keyInput.press('Enter');
    await keyInput.blur();
  }
}