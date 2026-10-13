import { expect } from '@playwright/test';
import { VariablePage } from '../pages/VariablePage.js';

export class VariableCrudObject {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.variablePage = new VariablePage(page);
  }

  async ensureReady() {
    const manageBtn = this.page.getByTestId('variable-panel-manage-btn');
    await manageBtn.scrollIntoViewIfNeeded();
    await expect(manageBtn).toBeVisible();
  }

  async createVariable({
    name = 'NewVar',
    type = 'string',
    value = null,
    isExposed = false,
    scope = 'Local',
  }) {
    await this.variablePage.openManager();
    await this.variablePage.createVariable({ name, type, isExposed, scope });

    const row = this.variablePage.itemRowByName(name);
    await expect(row).toBeVisible();

    if (value !== null) {
      const lowerType = type.toLowerCase();
      if (lowerType === 'string') {
        const input = row.getByTestId('variable-modal-value-string-input').locator('input');
        await input.fill(String(value));
        await input.blur();
      } else if (lowerType === 'number') {
        const input = row.getByTestId('variable-modal-value-number-input').locator('input');
        await input.fill(String(value));
        await input.press('Enter');
      } else if (lowerType === 'boolean') {
        const boolSelect = row.getByTestId('variable-modal-value-bool-select');
        await boolSelect.click();
        const boolOption = this.page.getByTestId('select-option').filter({
          hasText: value ? 'True' : 'False',
        });
        await boolOption.click();
      }
    }

    await this.variablePage.closeManager();
    return row;
  }

  async deleteVariable(name, scope = 'Local') {
    await this.variablePage.openManager();
    await this.variablePage.switchModalScope(scope);

    const row = this.variablePage.itemRowByName(name);
    await expect(row).toBeVisible();

    await row.getByTestId('variable-modal-row-menu-trigger').click();
    await this.page.getByTestId('variable-modal-delete-btn').click();

    await expect(this.variablePage.itemRowByName(name)).toHaveCount(0);
    await this.variablePage.closeManager();
  }

  async duplicateVariable(name, scope = 'Local') {
    await this.variablePage.openManager();
    await this.variablePage.switchModalScope(scope);

    const row = this.variablePage.itemRowByName(name);
    await expect(row).toBeVisible();

    await row.getByTestId('variable-modal-row-menu-trigger').click();
    await this.page.getByTestId('variable-modal-duplicate-btn').click();

    const duplicatedRow = this.variablePage.itemRowByName(`${name}_copy`);
    await expect(duplicatedRow).toBeVisible();
    await this.variablePage.closeManager();
    return duplicatedRow;
  }

  async searchVariable(query) {
    await this.variablePage.openManager();
    await this.variablePage.searchInput.fill(query);
  }

  async updateRawJson(variableName, jsonPayload, popupHelper) {
    await this.variablePage.openManager();

    const row = this.variablePage.itemRowByName(variableName);
    await row.getByTestId('variable-modal-configure-collection-btn').click();

    await this.variablePage.rawEditorBtn.click();
    await expect(this.variablePage.rawJsonTextarea).toBeVisible();

    const payloadString = typeof jsonPayload === 'string' ? jsonPayload : JSON.stringify(jsonPayload);
    await this.variablePage.rawJsonTextarea.fill(payloadString);
    await this.variablePage.rawJsonApplyBtn.click();

    if (popupHelper) {
      await popupHelper.expectPopAlert('Success');
    }

    await expect(this.variablePage.rawJsonTextarea).toBeHidden();
    await this.variablePage.closeManager();
  }

  async verifyExposedValue(name, scope, expectedValue) {
    const row = this.variablePage.panelItemRow(name, scope);
    await expect(row).toBeVisible();

    if (expectedValue !== undefined) {
      const input = row.locator('input').locator('nth=0');
      await expect(input).toHaveValue(String(expectedValue));
    }
  }
}