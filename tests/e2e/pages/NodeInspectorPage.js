import { expect } from '@playwright/test';
import { BaseControlHelper } from '../helpers/BaseControlHelper.js';

export class NodeInspectorPage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.controls = new BaseControlHelper(page);
  }

  // =========================================================================
  // CONTAINER LOCATORS
  // =========================================================================
  get panel() {
    return this.page.getByTestId('node-inspector-panel');
  }

  get singleNodeContent() {
    return this.page.getByTestId('node-inspector-single-node-content');
  }

  get multiSelectedState() {
    return this.page.getByTestId('node-inspector-multi-selected-state');
  }

  get multiSelectedCount() {
    return this.page.getByTestId('node-inspector-multi-selected-count');
  }

  get edgeContent() {
    return this.page.getByTestId('node-inspector-edge-content');
  }

  get emptySelectionState() {
    return this.page.getByTestId('node-inspector-empty-selection-state');
  }

  // =========================================================================
  // 1. HEADER SECTION
  // =========================================================================
  get headerSection() {
    return this.page.getByTestId('node-inspector-header-section');
  }

  get titleInput() {
    const container = this.headerSection.getByTestId('node-inspector-header-title-input');
    return container.locator('input');
  }

  get colorPicker() {
    return this.headerSection.getByTestId('node-inspector-header-color-picker');
  }

  get colorIndicator() {
    return this.headerSection.getByTestId('node-inspector-header-color-indicator');
  }

  get descriptionTextarea() {
    const container = this.headerSection.getByTestId('node-inspector-header-description-textarea');
    return container.locator('textarea');
  }

  async setHeaderTitle(title) {
    await this.controls.fillInput('node-inspector-header-title-input', title, this.headerSection);
  }

  async setHeaderColor(hexColor) {
    const container = this.headerSection.getByTestId('node-inspector-header-color-picker');
    const input = container.locator('input').first();
    await input.fill(hexColor);
    await input.press('Enter');
    await expect(input).toHaveValue(hexColor.toLowerCase());
  }

  async setHeaderDescription(description) {
    const textarea = this.descriptionTextarea;
    await textarea.fill(description);
    await textarea.blur();
    await expect(textarea).toHaveValue(description);
  }

  async deleteSelectedNode() {
    // Tangani browser confirm dialog ('Delete this node?')
    this.page.once('dialog', (dialog) => dialog.accept());

    const menuTrigger = this.headerSection
      .getByTestId('node-inspector-header-section-menu-trigger')
      .or(this.headerSection.getByTestId('property-section-menu-trigger'))
      .or(this.headerSection.locator('[data-element="section-menu-trigger"]'))
      .first();

    await menuTrigger.click();

    const deleteBtn = this.page.getByTestId('node-inspector-header-delete-btn');
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();
  }

  // =========================================================================
  // 2. PORTS CONFIGURATION SECTION
  // =========================================================================
  get portsSection() {
    return this.page.getByTestId('node-inspector-ports-section');
  }

  inputPortRowById(portId) {
    return this.portsSection.locator(`[data-testid="node-inspector-input-port-row"][data-port-id="${portId}"]`);
  }

  outputPortRowById(portId) {
    return this.portsSection.locator(`[data-testid="node-inspector-output-port-row"][data-port-id="${portId}"]`);
  }

  async renameInputPort(portId, newLabel) {
    const row = this.inputPortRowById(portId);
    const input = row.getByTestId('node-inspector-input-port-label-input');
    await input.fill(newLabel);
    await input.dispatchEvent('change');
  }

  async renameOutputPort(portId, newLabel) {
    const row = this.outputPortRowById(portId);
    const input = row.getByTestId('node-inspector-output-port-label-input');
    await input.fill(newLabel);
    await input.dispatchEvent('change');
  }

  async removeInputPort(portId) {
    const row = this.inputPortRowById(portId);
    await row.getByTestId('node-inspector-input-port-remove-btn').click();
  }

  async removeOutputPort(portId) {
    const row = this.outputPortRowById(portId);
    await row.getByTestId('node-inspector-output-port-remove-btn').click();
  }

  async addDynamicInputPort(propertyName = null) {
    await this.portsSection.getByTestId('node-inspector-add-input-port-btn').click();
    if (propertyName) {
      const dropdownContainer = this.portsSection.getByTestId('node-inspector-add-input-port-dropdown-container');
      await expect(dropdownContainer).toBeVisible();
      await this.controls.selectOption('node-inspector-add-input-port-select', propertyName, dropdownContainer);
    }
  }

  async addDynamicOutputPort(propertyName = null) {
    await this.portsSection.getByTestId('node-inspector-add-output-port-btn').click();
    if (propertyName) {
      const dropdownContainer = this.portsSection.getByTestId('node-inspector-add-output-port-dropdown-container');
      await expect(dropdownContainer).toBeVisible();
      await this.controls.selectOption('node-inspector-add-output-port-select', propertyName, dropdownContainer);
    }
  }

  // =========================================================================
  // 3 & 4. PARAMETERS & NODE DATA SECTION
  // =========================================================================
  get parametersSection() {
    return this.page.getByTestId('node-inspector-parameters-section');
  }

  dataRowByKey(key) {
    return this.parametersSection.locator(`[data-testid="node-inspector-data-row"][data-field-key="${key}"]`);
  }

  portRowById(portId) {
    return this.parametersSection.locator(`[data-testid="node-inspector-port-row"][data-port-id="${portId}"]`);
  }

  async selectVariableForNode(varName) {
    const trigger = this.parametersSection.getByTestId('node-inspector-variable-select-trigger');
    await trigger.click();

    const dropdown = this.page.getByTestId('node-inspector-variable-select-dropdown');
    await expect(dropdown).toBeVisible();

    const search = dropdown.getByTestId('node-inspector-variable-select-search-input');
    await search.fill(varName);

    const option = dropdown
      .getByTestId('node-inspector-variable-select-option')
      .filter({ has: this.page.locator(`[data-variable-name="${varName}"]`) })
      .or(dropdown.getByTestId('node-inspector-variable-select-option').filter({ hasText: varName }))
      .first();

    await expect(option).toBeVisible();
    await option.click();
  }

  async setNumberDataField(key, value) {
    const row = this.dataRowByKey(key);
    const container = row.getByTestId('node-inspector-data-number-input');
    const input = container.locator('input').first();
    await input.fill(String(value));
    await input.press('Enter');
    await expect(input).toHaveValue(String(value));
  }

  async setTextDataField(key, value) {
    const row = this.dataRowByKey(key);
    await this.controls.fillInput('node-inspector-data-text-input', value, row);
  }

  async togglePortMode(portId) {
    const row = this.portRowById(portId);
    await row.getByTestId('node-inspector-port-mode-toggle').click();
  }

  async setPortDirectNumber(portId, value) {
    const row = this.portRowById(portId);
    const container = row.getByTestId('node-inspector-port-number-input');
    const input = container.locator('input').first();
    await input.fill(String(value));
    await input.press('Enter');
    await expect(input).toHaveValue(String(value));
  }

  async setPortDirectText(portId, value) {
    const row = this.portRowById(portId);
    await this.controls.fillInput('node-inspector-port-text-input', value, row);
  }

  async setPortDirectSelect(portId, optionLabel) {
    const row = this.portRowById(portId);
    await this.controls.selectOption('node-inspector-port-options-select', optionLabel, row);
  }

  // =========================================================================
  // 5. VARIABLE MODIFIER ADD-ON
  // =========================================================================
  async bindVariableToPort(portId, varName) {
    const row = this.portRowById(portId);
    const varGroup = row.getByTestId('node-inspector-port-variable-group');
    const trigger = varGroup.getByTestId('node-inspector-variable-select-trigger');
    await trigger.click();

    const dropdown = this.page.getByTestId('node-inspector-variable-select-dropdown');
    await expect(dropdown).toBeVisible();

    const search = dropdown.getByTestId('node-inspector-variable-select-search-input');
    await search.fill(varName);

    const option = dropdown
      .getByTestId('node-inspector-variable-select-option')
      .filter({ hasText: varName })
      .first();

    await expect(option).toBeVisible();
    await option.click();
  }

  async setPortVariableModifier(portId, modifierLabel, modifierValue = null) {
    const row = this.portRowById(portId);
    const varGroup = row.getByTestId('node-inspector-port-variable-group');
    await varGroup.getByTestId('node-inspector-var-group-modifier-trigger').click();

    const menu = this.page.getByTestId('node-inspector-var-group-modifier-menu');
    await expect(menu).toBeVisible();

    const option = menu.getByTestId('node-inspector-var-group-modifier-option').filter({ hasText: modifierLabel }).first();
    await option.click();

    if (modifierValue !== null) {
      const numInput = varGroup.getByTestId('node-inspector-var-group-modifier-number-input').locator('input');
      await numInput.fill(String(modifierValue));
      await numInput.press('Enter');
    }
  }

  async clearPortVariableModifier(portId) {
    const row = this.portRowById(portId);
    const varGroup = row.getByTestId('node-inspector-port-variable-group');
    await varGroup.getByTestId('node-inspector-var-group-modifier-trigger').click();

    const clearBtn = this.page.getByTestId('node-inspector-var-group-clear-modifier-btn');
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
  }

  // =========================================================================
  // 6. EDGE MODIFIER INSPECTOR
  // =========================================================================
  get edgeSection() {
    return this.page.getByTestId('node-inspector-edge-section');
  }

  async setEdgeOperation(operationLabel) {
    await this.controls.selectOption('node-inspector-edge-operation-select', operationLabel, this.edgeSection);
  }

  async setEdgeOperandNumber(value) {
    const container = this.edgeSection.getByTestId('node-inspector-edge-operand-number-input');
    const input = container.locator('input').first();
    await input.fill(String(value));
    await input.press('Enter');
    await expect(input).toHaveValue(String(value));
  }

  async setEdgeOperandText(value) {
    await this.controls.fillInput('node-inspector-edge-operand-text-input', value, this.edgeSection);
  }

  async deleteSelectedEdge() {
    await this.edgeSection.getByTestId('node-inspector-edge-delete-btn').click();
  }
}