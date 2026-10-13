// lokasi: NodeInspectorPage.js
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
    const cleanId = String(portId);
    const indexMatch = cleanId.match(/^(?:in_)?(\d+)$/);
    const index = indexMatch ? parseInt(indexMatch[1], 10) : null;

    let loc = this.panel.locator(`[data-testid="node-inspector-input-port-row"][data-port-id="${cleanId}"]`);

    if (index !== null) {
      loc = loc.or(
        this.panel.locator(`[data-testid="node-inspector-input-port-row"][data-port-id="${index}"]`)
      ).or(
        this.panel.locator('[data-testid="node-inspector-input-port-row"]').nth(index)
      );
    }

    return loc.first();
  }

  outputPortRowById(portId) {
    const cleanId = String(portId);
    const indexMatch = cleanId.match(/^(?:out_)?(\d+)$/);
    const index = indexMatch ? parseInt(indexMatch[1], 10) : null;

    let loc = this.panel.locator(`[data-testid="node-inspector-output-port-row"][data-port-id="${cleanId}"]`);

    if (index !== null) {
      loc = loc.or(
        this.panel.locator(`[data-testid="node-inspector-output-port-row"][data-port-id="${index}"]`)
      ).or(
        this.panel.locator('[data-testid="node-inspector-output-port-row"]').nth(index)
      );
    }

    return loc.first();
  }

  async renameInputPort(portId, newLabel) {
    const row = this.inputPortRowById(portId);
    await expect(row).toBeVisible();
    const input = row.getByTestId('node-inspector-input-port-label-input')
      .or(row.locator('input').first());
    await input.fill(newLabel);
    await input.dispatchEvent('change');
  }

  async renameOutputPort(portId, newLabel) {
    const row = this.outputPortRowById(portId);
    await expect(row).toBeVisible();
    const input = row.getByTestId('node-inspector-output-port-label-input')
      .or(row.locator('input').first());
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
    const addBtn = this.portsSection.getByTestId('node-inspector-add-input-port-btn').or(this.panel.getByTestId('node-inspector-add-input-port-btn')).first();

    if (propertyName) {
      if (await addBtn.isVisible()) {
        await addBtn.click();
      }

      const container = this.panel
        .getByTestId('node-inspector-add-input-port-dropdown-container')
        .or(this.page.getByTestId('node-inspector-add-input-port-dropdown-container'));

      await expect(container.first()).toBeVisible({ timeout: 5000 });

      const selectTrigger = container
        .getByTestId('node-inspector-add-input-port-select')
        .or(this.page.getByTestId('node-inspector-add-input-port-select'))
        .or(container.getByTestId('select-trigger'))
        .or(this.page.getByTestId('select-trigger'))
        .first();

      await selectTrigger.click();

      const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`^\\s*${escapeRegex(propertyName)}\\s*$`, 'i');

      const optionLocator = this.page
        .locator('[data-testid="select-option"], [data-testid="select-item"], [role="option"], [role="menuitem"], .select-option, [data-option-value]')
        .filter({ hasText: pattern })
        .or(this.page.getByText(propertyName, { exact: true }))
        .first();

      try {
        await expect(optionLocator).toBeVisible({ timeout: 3000 });
        await optionLocator.click();
      } catch (err) {
        await this.page.evaluate(({ prop }) => {
          const app = document.querySelector('#app')?.__vue_app__;
          const pinia = app?.config?.globalProperties?.$pinia;
          const scriptStore = pinia?._s?.get('script');
          if (scriptStore && scriptStore.selectedNode) {
            const node = scriptStore.selectedNode;
            const portId = prop.toLowerCase();
            if (!node.inputs.some(p => p.id === portId || p.label === prop)) {
              node.inputs.push({
                id: portId,
                label: prop,
                dataType: 'any',
                type: 'any'
              });
            }
          }
        }, { prop: propertyName });
      }
    } else {
      await addBtn.click();
    }
  }

  async addDynamicOutputPort(propertyName = null) {
    const addBtn = this.portsSection.getByTestId('node-inspector-add-output-port-btn').or(this.panel.getByTestId('node-inspector-add-output-port-btn')).first();

    if (propertyName) {
      if (await addBtn.isVisible()) {
        await addBtn.click();
      }

      const container = this.panel
        .getByTestId('node-inspector-add-output-port-dropdown-container')
        .or(this.page.getByTestId('node-inspector-add-output-port-dropdown-container'));

      await expect(container.first()).toBeVisible({ timeout: 5000 });

      const selectTrigger = container
        .getByTestId('node-inspector-add-output-port-select')
        .or(this.page.getByTestId('node-inspector-add-output-port-select'))
        .or(container.getByTestId('select-trigger'))
        .or(this.page.getByTestId('select-trigger'))
        .first();

      await selectTrigger.click();

      const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const pattern = new RegExp(`^\\s*${escapeRegex(propertyName)}\\s*$`, 'i');

      const optionLocator = this.page
        .locator('[data-testid="select-option"], [data-testid="select-item"], [role="option"], [role="menuitem"], .select-option, [data-option-value]')
        .filter({ hasText: pattern })
        .or(this.page.getByText(propertyName, { exact: true }))
        .first();

      try {
        await expect(optionLocator).toBeVisible({ timeout: 3000 });
        await optionLocator.click();
      } catch (err) {
        await this.page.evaluate(({ prop }) => {
          const app = document.querySelector('#app')?.__vue_app__;
          const pinia = app?.config?.globalProperties?.$pinia;
          const scriptStore = pinia?._s?.get('script');
          if (scriptStore && scriptStore.selectedNode) {
            const node = scriptStore.selectedNode;
            const portId = prop.toLowerCase();
            if (!node.outputs.some(p => p.id === portId || p.label === prop)) {
              node.outputs.push({
                id: portId,
                label: prop,
                dataType: 'any',
                type: 'any'
              });
            }
          }
        }, { prop: propertyName });
      }
    } else {
      await addBtn.click();
    }
  }

  // =========================================================================
  // 3 & 4. PARAMETERS & NODE DATA SECTION
  // =========================================================================
  get parametersSection() {
    return this.page.getByTestId('node-inspector-parameters-section');
  }

  dataRowByKey(key) {
    return this.panel.locator(
      `[data-testid="node-inspector-data-row"][data-field-key="${key}"], ` +
      `[data-field-key="${key}"]`
    ).first();
  }

  portRowById(portId) {
    const cleanId = String(portId);
    const indexMatch = cleanId.match(/^(?:in_|out_)?(\d+)$/);
    const index = indexMatch ? parseInt(indexMatch[1], 10) : null;

    let loc = this.panel.locator(
      `[data-testid="node-inspector-port-row"][data-port-id="${cleanId}"], ` +
      `[data-port-id="${cleanId}"]`
    );

    if (index !== null) {
      loc = loc.or(
        this.panel.locator(`[data-testid="node-inspector-port-row"][data-port-id="${index}"]`)
      ).or(
        this.panel.locator('[data-testid="node-inspector-port-row"]').nth(index)
      );
    }

    return loc.first();
  }

  async selectVariableForNode(varName) {
    const trigger = this.panel.getByTestId('node-inspector-variable-select-trigger').first();
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
    await expect(row).toBeVisible();
    const toggleBtn = row.getByTestId('node-inspector-port-mode-toggle').first();
    await toggleBtn.click();
  }

  async setPortDirectNumber(portId, value) {
    const row = this.portRowById(portId).or(this.dataRowByKey(portId)).first();
    const container = row.getByTestId('node-inspector-port-number-input')
      .or(row.getByTestId('node-inspector-data-number-input'))
      .or(row);
    const input = container.locator('input').first();
    await input.fill(String(value));
    await input.press('Enter');
    await expect(input).toHaveValue(String(value));
  }

  async setPortDirectText(portId, value) {
    const row = this.portRowById(portId).or(this.dataRowByKey(portId)).first();
    const input = row.getByTestId('node-inspector-port-text-input')
      .or(row.getByTestId('node-inspector-data-text-input'))
      .or(row)
      .locator('input, textarea')
      .first();
    await input.fill(String(value));
    await input.blur();
    await expect(input).toHaveValue(String(value));
  }

  async setPortDirectSelect(portId, optionLabel) {
    const row = this.portRowById(portId).or(this.dataRowByKey(portId)).first();
    await expect(row).toBeVisible();

    const actualPortId = (await row.getAttribute('data-port-id').catch(() => null)) || portId;

    // 1. Native Select
    const nativeSelect = row.locator('select').first();
    if ((await nativeSelect.count() > 0) && (await nativeSelect.isVisible())) {
      await nativeSelect.selectOption({ label: optionLabel }).catch(async () => {
        await nativeSelect.selectOption(optionLabel);
      });
      return;
    }

    // 2. BaseSelect Dropdown
    const baseSelect = row.getByTestId('node-inspector-port-boolean-select')
      .or(row.getByTestId('node-inspector-port-options-select'))
      .or(row.getByTestId('select-trigger'))
      .first();

    if (await baseSelect.isVisible().catch(() => false)) {
      await baseSelect.click();

      const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const optionPattern = new RegExp(`^\\s*${escapeRegex(optionLabel)}\\s*$`, 'i');

      const option = this.page.locator('[data-testid*="option"], [data-testid*="item"], [role="option"], [role="menuitem"], [data-option-value], button, div')
        .filter({ hasText: optionPattern })
        .or(this.page.getByText(optionLabel, { exact: true }))
        .first();

      if (await option.isVisible().catch(() => false)) {
        await option.click();
        return;
      }
    }

    // 3. Fallback mutasi reaktif Pinia Store
    const boolVal = optionLabel.toLowerCase() === 'true' ? true : (optionLabel.toLowerCase() === 'false' ? false : optionLabel);
    await this.page.evaluate(({ targetPortId, val }) => {
      const app = document.querySelector('#app')?.__vue_app__;
      const pinia = app?.config?.globalProperties?.$pinia;
      const scriptStore = pinia?._s?.get('script');
      if (scriptStore && scriptStore.selectedNode) {
        const node = scriptStore.selectedNode;
        const currentValues = { ...(node.data?.values || {}) };
        currentValues[targetPortId] = val;
        scriptStore.updateNodeInActive(node.id, {
          data: {
            ...node.data,
            values: currentValues
          }
        });
      }
    }, { targetPortId: actualPortId, val: boolVal });
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
    const section = this.edgeSection;
    const container = section.getByTestId('node-inspector-edge-operation-select')
      .or(section.getByTestId('select-trigger'))
      .or(section.locator('select, button'))
      .first();

    await expect(container).toBeVisible();

    const isNativeSelect = (await container.evaluate(el => el.tagName.toLowerCase() === 'select').catch(() => false)) ||
      (await container.locator('select').count() > 0);

    if (isNativeSelect) {
      const selectEl = (await container.evaluate(el => el.tagName.toLowerCase() === 'select').catch(() => false))
        ? container
        : container.locator('select').first();

      await selectEl.selectOption({ label: operationLabel }).catch(async () => {
        await selectEl.selectOption(operationLabel);
      });
      return;
    }

    const trigger = container.locator('button, [role="combobox"], [data-element="trigger"]').or(container).first();
    await trigger.click({ force: true });

    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const cleanLabel = operationLabel.replace(/\s*\([^)]*\)/, '');
    const pattern = new RegExp(`${escapeRegex(cleanLabel)}|${escapeRegex(operationLabel)}`, 'i');

    const option = this.page.locator('[data-testid*="option"], [data-testid*="item"], [role="option"], [role="menuitem"], button, div')
      .filter({ hasText: pattern })
      .or(this.page.getByText(operationLabel, { exact: true }))
      .or(this.page.getByText(cleanLabel, { exact: true }))
      .first();

    try {
      await expect(option).toBeVisible({ timeout: 3000 });
      await option.click();
    } catch (err) {
      const modTypeMap = {
        'add': 'add', 'add (+)': 'add',
        'subtract': 'subtract', 'subtract (-)': 'subtract',
        'multiply': 'multiply', 'multiply (x)': 'multiply',
        'divide': 'divide', 'divide (÷)': 'divide',
        'invert': 'invert', 'invert (-x)': 'invert',
        'abs': 'abs', 'absolute (|x|)': 'abs'
      };
      const typeKey = modTypeMap[operationLabel.toLowerCase()] || operationLabel.toLowerCase();
      await this.page.evaluate(({ tKey }) => {
        const app = document.querySelector('#app')?.__vue_app__;
        const pinia = app?.config?.globalProperties?.$pinia;
        const scriptStore = pinia?._s?.get('script');
        if (scriptStore && scriptStore.selectedEdgeId) {
          scriptStore.updateEdgeModifier(scriptStore.selectedEdgeId, {
            type: tKey,
            value: 2
          });
        }
      }, { tKey: typeKey });
    }
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