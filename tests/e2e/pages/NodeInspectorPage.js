// lokasi: tests/e2e/pages/NodeInspectorPage.js
import { expect } from '@playwright/test';
import { BaseControlHelper } from '../helpers/BaseControlHelper.js';

export class NodeInspectorPage {
  /** @param {import('@playwright/test').Page} page */
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
    return this.headerSection
      .getByTestId('node-inspector-header-title-input')
      .locator('input')
      .first();
  }

  get colorPicker() {
    return this.headerSection.getByTestId('node-inspector-header-color-picker');
  }

  get colorIndicator() {
    return this.headerSection.getByTestId('node-inspector-header-color-indicator');
  }

  get descriptionTextarea() {
    return this.headerSection
      .getByTestId('node-inspector-header-description-textarea')
      .locator('textarea')
      .first();
  }

  async setHeaderTitle(title) {
    const input = this.titleInput;
    await input.fill(title);
    await input.blur();
    await expect(input).toHaveValue(title);
  }

  async setHeaderColor(hexColor) {
    const input = this.headerSection
      .getByTestId('node-inspector-header-color-picker')
      .locator('input')
      .first();
    await input.fill(hexColor);
    await input.press('Enter');
    await expect(input).toHaveValue(new RegExp(`^${hexColor}$`, 'i'));
  }

  async setHeaderDescription(description) {
    const textarea = this.descriptionTextarea;
    await textarea.fill(description);
    await textarea.blur();
    await expect(textarea).toHaveValue(description);
  }

  async deleteSelectedNode() {
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
  // 2. PORTS CONFIGURATION SECTION (NodePorts.vue)
  // =========================================================================
  get portsSection() {
    return this.page.getByTestId('node-inspector-ports-section');
  }

  /** All input port rows of the ports section (collection locator, no index applied). */
  get inputPortRows() {
    return this.portsSection.getByTestId('node-inspector-input-port-row');
  }

  /** All output port rows of the ports section (collection locator, no index applied). */
  get outputPortRows() {
    return this.portsSection.getByTestId('node-inspector-output-port-row');
  }

  /** All parameter port rows of the inspector panel (collection locator, no index applied). */
  get portRows() {
    return this.panel.getByTestId('node-inspector-port-row');
  }

  /**
   * Resolves the stable data-port-id of the row at `index` (-1 = the last row).
   * Index handling lives here so specs never need .first() / .nth() / .last() (Section 7.3).
   * Postcondition: the row is visible before its identity is read.
   */
  async _portIdAt(rows, index) {
    const row = index < 0 ? rows.last() : rows.nth(index);
    await expect(row).toBeVisible();
    return await row.getAttribute('data-port-id');
  }

  inputPortIdAt(index) {
    return this._portIdAt(this.inputPortRows, index);
  }

  outputPortIdAt(index) {
    return this._portIdAt(this.outputPortRows, index);
  }

  portIdAt(index) {
    return this._portIdAt(this.portRows, index);
  }

  /** The editable field (input or textarea) inside a parameter port row. */
  portField(portId) {
    return this.portRowById(portId).locator('input, textarea').first();
  }

  inputPortRowById(portId) {
    const cleanId = String(portId).toLowerCase();
    return this.portsSection.locator(
      `[data-testid="node-inspector-input-port-row"][data-port-id="${portId}"], ` +
      `[data-testid="node-inspector-input-port-row"][data-port-id="${cleanId}"]`
    ).or(
      this.panel.locator(`[data-testid="node-inspector-input-port-row"][data-port-id="${portId}"]`)
    ).first();
  }

  outputPortRowById(portId) {
    const cleanId = String(portId).toLowerCase();
    return this.portsSection.locator(
      `[data-testid="node-inspector-output-port-row"][data-port-id="${portId}"], ` +
      `[data-testid="node-inspector-output-port-row"][data-port-id="${cleanId}"]`
    ).or(
      this.panel.locator(`[data-testid="node-inspector-output-port-row"][data-port-id="${portId}"]`)
    ).first();
  }

  async renameInputPort(portId, newLabel) {
    const row = this.inputPortRowById(portId);
    await expect(row).toBeVisible();
    const input = row.getByTestId('node-inspector-input-port-label-input');
    await input.fill(newLabel);
    await input.press('Enter');
    await input.blur();
  }

  async renameOutputPort(portId, newLabel) {
    const row = this.outputPortRowById(portId);
    await expect(row).toBeVisible();
    const input = row.getByTestId('node-inspector-output-port-label-input');
    await input.fill(newLabel);
    await input.press('Enter');
    await input.blur();
  }

  async removeInputPort(portId) {
    const row = this.inputPortRowById(portId);
    await expect(row).toBeVisible();
    await row.hover();
    await row.getByTestId('node-inspector-input-port-remove-btn').click();
  }

  async removeOutputPort(portId) {
    const row = this.outputPortRowById(portId);
    await expect(row).toBeVisible();
    await row.hover();
    await row.getByTestId('node-inspector-output-port-remove-btn').click();
  }

  async addDynamicInputPort(propertyName = null) {
    const addBtn = this.portsSection.getByTestId('node-inspector-add-input-port-btn')
      .or(this.panel.getByTestId('node-inspector-add-input-port-btn'))
      .first();

    await expect(addBtn).toBeVisible();
    await addBtn.click();

    if (propertyName) {
      const dropdownContainer = this.panel
        .getByTestId('node-inspector-add-input-port-dropdown-container')
        .or(this.portsSection.getByTestId('node-inspector-add-input-port-dropdown-container'))
        .first();

      await expect(dropdownContainer).toBeVisible();
      await this.controls.selectOption(
        'node-inspector-add-input-port-select',
        propertyName,
        dropdownContainer
      );
    }
  }

  async addDynamicOutputPort(propertyName = null) {
    const addBtn = this.portsSection.getByTestId('node-inspector-add-output-port-btn')
      .or(this.panel.getByTestId('node-inspector-add-output-port-btn'))
      .first();

    await expect(addBtn).toBeVisible();
    await addBtn.click();

    if (propertyName) {
      const dropdownContainer = this.panel
        .getByTestId('node-inspector-add-output-port-dropdown-container')
        .or(this.portsSection.getByTestId('node-inspector-add-output-port-dropdown-container'))
        .first();

      await expect(dropdownContainer).toBeVisible();
      await this.controls.selectOption(
        'node-inspector-add-output-port-select',
        propertyName,
        dropdownContainer
      );
    }
  }

  // =========================================================================
  // 3 & 4. PARAMETERS & NODE DATA SECTION (NodeData.vue)
  // =========================================================================
  get parametersSection() {
    return this.panel
      .locator('[data-testid="property-section"], section, div')
      .filter({ hasText: /^Parameters/i })
      .first();
  }

  dataRowByKey(key) {
    return this.panel.locator(
      `[data-testid="node-inspector-data-row"][data-field-key="${key}"]`
    );
  }

  portRowById(portId) {
    return this.panel.locator(
      `[data-testid="node-inspector-port-row"][data-port-id="${portId}"]`
    );
  }

  async selectVariableForNode(varName) {
    const trigger = this.panel.getByTestId('node-inspector-variable-select-trigger').first();
    await expect(trigger).toBeVisible();
    await trigger.click();

    const dropdown = this.page.getByTestId('node-inspector-variable-select-dropdown');
    await expect(dropdown).toBeVisible();

    const searchInput = dropdown
      .locator('input[data-testid="node-inspector-variable-select-search-input"], [data-testid="node-inspector-variable-select-search-input"] input, [data-testid="node-inspector-variable-select-search-input"]')
      .first();

    await searchInput.fill(varName);

    const option = dropdown
      .getByTestId('node-inspector-variable-select-option')
      .filter({ hasText: varName })
      .first();

    await expect(option).toBeVisible();
    await option.click();
    await expect(dropdown).toBeHidden();
  }

  async setNumberDataField(key, value) {
    const row = this.dataRowByKey(key);
    await expect(row).toBeVisible();
    const input = row.locator('input').first();
    await input.fill(String(value));
    await input.press('Enter');
    await expect(input).toHaveValue(String(value));
  }

  async setTextDataField(key, value) {
    const row = this.dataRowByKey(key);
    await expect(row).toBeVisible();
    const input = row.locator('input').first();
    await input.fill(String(value));
    await input.blur();
    await expect(input).toHaveValue(String(value));
  }

  async togglePortMode(portId) {
    const row = this.portRowById(portId);
    await expect(row).toBeVisible();
    await row.getByTestId('node-inspector-port-mode-toggle').click();
  }

  async setPortDirectNumber(portId, value) {
    const row = this.portRowById(portId);
    await expect(row).toBeVisible();
    const input = row
      .getByTestId('node-inspector-port-number-input')
      .or(row.getByTestId('node-inspector-port-text-input'))
      .locator('input')
      .first();
    await input.fill(String(value));
    await input.press('Enter');
    await expect(input).toHaveValue(String(value));
  }

  async setPortDirectText(portId, value) {
    const row = this.portRowById(portId);
    await expect(row).toBeVisible();
    const input = row
      .getByTestId('node-inspector-port-text-input')
      .or(row.getByTestId('node-inspector-port-number-input'))
      .locator('input')
      .first();
    await input.fill(String(value));
    await input.blur();
    await expect(input).toHaveValue(String(value));
  }

  async setPortDirectSelect(portId, optionLabel) {
    const row = this.portRowById(portId);
    await expect(row).toBeVisible();

    const selectTrigger = row
      .getByTestId('node-inspector-port-boolean-select')
      .or(row.getByTestId('node-inspector-port-options-select'))
      .or(row.getByTestId('select-trigger'))
      .first();

    await expect(selectTrigger).toBeVisible();
    await selectTrigger.click();

    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`^\\s*${escapeRegex(optionLabel)}\\s*$`, 'i');
    const option = this.page
      .getByTestId('select-option')
      .filter({ hasText: pattern })
      .first();

    await expect(option).toBeVisible();
    await option.click();
  }

  // =========================================================================
  // 5. VARIABLE BINDINGS & MODIFIERS (NodeData.vue)
  // =========================================================================
  async bindVariableToPort(portId, varName) {
    const row = this.portRowById(portId);
    await expect(row).toBeVisible();
    const varGroup = row.getByTestId('node-inspector-port-variable-group');
    await expect(varGroup).toBeVisible();

    const trigger = varGroup.getByTestId('node-inspector-variable-select-trigger').first();
    await expect(trigger).toBeVisible();
    await trigger.click();

    const dropdown = this.page.getByTestId('node-inspector-variable-select-dropdown');
    await expect(dropdown).toBeVisible();

    const searchInput = dropdown
      .locator('input[data-testid="node-inspector-variable-select-search-input"], [data-testid="node-inspector-variable-select-search-input"] input, [data-testid="node-inspector-variable-select-search-input"]')
      .first();

    await searchInput.fill(varName);

    const option = dropdown
      .getByTestId('node-inspector-variable-select-option')
      .filter({ hasText: varName })
      .first();

    await expect(option).toBeVisible();
    await option.click();
    await expect(dropdown).toBeHidden();
  }

  async setPortVariableModifier(portId, modifierLabel, modifierValue = null) {
    const row = this.portRowById(portId);
    await expect(row).toBeVisible();
    const varGroup = row.getByTestId('node-inspector-port-variable-group');
    await varGroup.getByTestId('node-inspector-var-group-modifier-trigger').click();

    const menu = this.page.getByTestId('node-inspector-var-group-modifier-menu');
    await expect(menu).toBeVisible();

    const option = menu.getByTestId('node-inspector-var-group-modifier-option').filter({ hasText: modifierLabel }).first();
    await expect(option).toBeVisible();
    await option.click();

    if (modifierValue !== null) {
      const numInput = varGroup
        .getByTestId('node-inspector-var-group-modifier-number-input')
        .locator('input')
        .first();
      await numInput.fill(String(modifierValue));
      await numInput.press('Enter');
    }
  }

  async clearPortVariableModifier(portId) {
    const row = this.portRowById(portId);
    await expect(row).toBeVisible();
    const varGroup = row.getByTestId('node-inspector-port-variable-group');
    await varGroup.getByTestId('node-inspector-var-group-modifier-trigger').click();

    const clearBtn = this.page.getByTestId('node-inspector-var-group-clear-modifier-btn');
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
  }

  async removeDynamicPortFromParameters(portId) {
    const row = this.portRowById(portId);
    await expect(row).toBeVisible();
    const removeBtn = row.locator('button[title="Remove Port"]');
    await expect(removeBtn).toBeVisible();
    await removeBtn.click();
    await expect(row).toHaveCount(0);
  }

  // =========================================================================
  // 6. EDGE MODIFIERS (NodeGraph / Edge Inspector)
  // =========================================================================
  get edgeSection() {
    return this.page.getByTestId('node-inspector-edge-section');
  }

  async setEdgeOperation(operationLabel) {
    await expect(this.edgeSection).toBeVisible();
    await this.controls.selectOption(
      'node-inspector-edge-operation-select',
      operationLabel,
      this.edgeSection
    );
  }

  async setEdgeOperandNumber(value) {
    await expect(this.edgeSection).toBeVisible();
    const input = this.edgeSection
      .locator('[data-testid="node-inspector-edge-operand-number-input"] input, input[data-testid="node-inspector-edge-operand-number-input"]')
      .first();
    await input.fill(String(value));
    await input.press('Enter');
    await expect(input).toHaveValue(String(value));
  }

  async setEdgeOperandText(value) {
    await expect(this.edgeSection).toBeVisible();
    const input = this.edgeSection
      .locator('[data-testid="node-inspector-edge-operand-text-input"] input, input[data-testid="node-inspector-edge-operand-text-input"]')
      .first();
    await input.fill(String(value));
    await input.blur();
    await expect(input).toHaveValue(String(value));
  }

  async deleteSelectedEdge() {
    await this.edgeSection.getByTestId('node-inspector-edge-delete-btn').click();
  }
}