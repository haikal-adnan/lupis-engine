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
   * Mengisi nilai variabel di dalam row modal sesuai tipe data
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
      const boolSelect = row.getByTestId('variable-modal-value-bool-select').first();
      await boolSelect.click();
      const boolOption = this.page.getByTestId('select-option').filter({
        hasText: value ? 'True' : 'False',
      }).first();
      await boolOption.click().catch(async () => {});
    }
  }

  /**
   * Membuat variabel baru lengkap dengan penentuan nilai awal dan scope
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
   * Menghapus variabel berdasarkan nama dan scope
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
   * Menduplikasi variabel dan memastikan hasil klon memiliki suffix _copy
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
   * Melakukan pencarian variabel di modal
   */
  async searchVariable(query) {
    await this.variablePage.openManager();
    await this.variablePage.searchInput.fill(query);
  }

  /**
   * Memperbarui variabel koleksi (List/Map) melalui Raw JSON Editor
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
   * Memasukkan key berulang pada variabel Map (digunakan untuk pengujian duplikasi key/bad path)
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
   * Memverifikasi variabel yang di-expose di Variable Panel utama
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
   * Memperbarui nilai variabel di Inspector Script Controller
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