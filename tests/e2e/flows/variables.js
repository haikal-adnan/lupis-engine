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
    await expect(this.variablePage.manageBtn).toBeVisible();
  }

  /**
   * Fills the variable value inside a modal row according to its data type
   */
  async setVariableValueInRow(row, type, value) {
    if (value === null || value === undefined) return;

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
      await this.variablePage.setBooleanValue(row, Boolean(value));
    }
  }

  /**
   * Creates a new variable, including its initial value and scope
   */
  async createVariable({
    name = 'NewVar',
    type = 'string',
    value = null,
    isExposed = false,
    scope = 'Local',
    autoClose = true,
  }) {
    await this.variablePage.openManager();
    const row = await this.variablePage.createVariable({ name, type, isExposed, scope });

    await this.setVariableValueInRow(row, type, value);

    if (autoClose) {
      await this.variablePage.closeManager();
    }
    return row;
  }

  /**
   * Deletes a variable by name and scope
   */
  async deleteVariable(name, scope = 'Local', autoClose = true) {
    await this.variablePage.openManager();
    await this.variablePage.switchModalScope(scope);

    await this.variablePage.openRowMenu(name);
    await this.page.getByTestId('variable-modal-delete-btn').click();

    await expect(this.variablePage.itemRowByName(name)).toHaveCount(0);

    if (autoClose) {
      await this.variablePage.closeManager();
    }
  }

  /**
   * Duplicates a variable and verifies the clone has the _copy suffix
   */
  async duplicateVariable(name, scope = 'Local', autoClose = true) {
    await this.variablePage.openManager();
    await this.variablePage.switchModalScope(scope);

    await this.variablePage.openRowMenu(name);
    await this.page.getByTestId('variable-modal-duplicate-btn').click();

    const duplicatedRow = this.variablePage.itemRowByName(`${name}_copy`);
    await expect(duplicatedRow).toBeVisible();

    if (autoClose) {
      await this.variablePage.closeManager();
    }
    return duplicatedRow;
  }

  /**
   * Searches variables in the modal
   */
  async searchVariable(query) {
    await this.variablePage.openManager();
    await this.variablePage.searchInput.fill(query);
  }

  /**
   * Updates a collection variable (List/Map) through the Raw JSON Editor
   */
  async updateRawJson(variableName, jsonPayload, popupHelper = null, scope = 'Local', autoClose = true) {
    await this.variablePage.openManager();
    await this.variablePage.switchModalScope(scope);

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

    if (autoClose) {
      await this.variablePage.closeManager();
    }
  }

  /**
   * Enters repeated keys on a Map variable (used for duplicate-key / bad-path tests)
   */
  async configureMapKeys(variableName, keys = [], popupHelper = null, scope = 'Local') {
    await this.variablePage.openManager();
    await this.variablePage.switchModalScope(scope);

    const row = this.variablePage.itemRowByName(variableName);
    await row.getByTestId('variable-modal-configure-collection-btn').click();

    for (let i = 0; i < keys.length; i++) {
      await this.variablePage.addBtn.click();
      await this.variablePage.fillCollectionMapKey(i, keys[i]);
    }

    if (popupHelper) {
      await popupHelper.expectPopAlert();
    }

    await this.variablePage.closeManager();
    await expect(this.variablePage.modal).toBeHidden();
  }

  /**
   * Verifies the variables exposed in the main Variable Panel
   */
  async verifyExposedValue(name, scope, expectedValue) {
    const row = this.variablePage.panelItemRow(name, scope);
    await expect(row).toBeVisible();

    if (expectedValue !== undefined) {
      const input = row.locator('input').locator('nth=0');
      await expect(input).toHaveValue(String(expectedValue));
    }
  }

  /**
   * Updates a variable value in the Script Controller Inspector
   */
  async setInspectorVariableValue(inspectorCrud, variableName, value, type = 'number') {
    const variableRow = inspectorCrud.inspector.scriptControllerSection.locator(
      `[data-testid="script-variable-row"][data-variable-name="${variableName}"]`
    );
    await expect(variableRow).toBeVisible();

    if (type === 'number') {
      const input = variableRow.getByTestId('script-variable-number').locator('input');
      await input.fill(String(value));
      await input.press('Enter');
    } else if (type === 'string') {
      const input = variableRow.getByTestId('script-variable-string').locator('input');
      await input.fill(String(value));
      await input.blur();
    }
  }
}