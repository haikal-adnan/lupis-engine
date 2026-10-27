import { expect } from '@playwright/test';
import { NodeInspectorPage } from '../pages/NodeInspectorPage.js';

export class NodeInspectorCrudObject {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.inspector = new NodeInspectorPage(page);
  }

  // Header Operations
  async updateHeader({ title, color, description }) {
    if (title) await this.inspector.setHeaderTitle(title);
    if (color) await this.inspector.setHeaderColor(color);
    if (description) await this.inspector.setHeaderDescription(description);
  }

  async deleteSelectedNodeViaHeader() {
    await this.inspector.deleteSelectedNode();
    await expect(this.inspector.emptySelectionState).toBeVisible();
  }

  // Ports Configuration Operations (NodePorts.vue)
  async renameInputPort(portId, newLabel) {
    await this.inspector.renameInputPort(portId, newLabel);
  }

  async renameOutputPort(portId, newLabel) {
    await this.inspector.renameOutputPort(portId, newLabel);
  }

  async addDynamicInputPort(propertyName = null) {
    await this.inspector.addDynamicInputPort(propertyName);
  }

  async addDynamicOutputPort(propertyName = null) {
    await this.inspector.addDynamicOutputPort(propertyName);
  }

  async removePort(kind = 'input', portId) {
    if (kind === 'input') {
      await this.inspector.removeInputPort(portId);
    } else {
      await this.inspector.removeOutputPort(portId);
    }
  }

  // Parameters & Top-level Node Data Operations (NodeData.vue)
  async setTopLevelData(key, value, type = 'text') {
    const lowerType = String(type).toLowerCase();
    if (lowerType === 'number') {
      await this.inspector.setNumberDataField(key, value);
    } else {
      await this.inspector.setTextDataField(key, value);
    }
  }

  async selectVariableForNode(varName) {
    await this.inspector.selectVariableForNode(varName);
  }

  async setDirectValue(portId, value, type = 'number') {
    const lowerType = String(type).toLowerCase();

    if (['select', 'option', 'dropdown'].includes(lowerType)) {
      await this.inspector.setPortDirectSelect(portId, value);
    } else if (['boolean', 'bool'].includes(lowerType)) {
      await this.inspector.setPortDirectSelect(portId, value ? 'True' : 'False');
    } else if (lowerType === 'number') {
      await this.inspector.setPortDirectNumber(portId, value);
    } else {
      await this.inspector.setPortDirectText(portId, value);
    }
  }

  async bindVariableToPort(portId, varName) {
    await this.inspector.togglePortMode(portId);
    await this.inspector.bindVariableToPort(portId, varName);
  }

  async applyVariableModifier(portId, modifierLabel, modifierValue = null) {
    await this.inspector.setPortVariableModifier(portId, modifierLabel, modifierValue);
  }

  async clearVariableModifier(portId) {
    await this.inspector.clearPortVariableModifier(portId);
  }

  async removeDynamicPortFromParameters(portId) {
    await this.inspector.removeDynamicPortFromParameters(portId);
  }

  // Edge Modifier Operations
  async configureEdgeModifier(operationLabel, operandValue = null, isNumber = true) {
    await this.inspector.setEdgeOperation(operationLabel);
    if (operandValue !== null) {
      if (isNumber) {
        await this.inspector.setEdgeOperandNumber(operandValue);
      } else {
        await this.inspector.setEdgeOperandText(operandValue);
      }
    }
  }

  async deleteSelectedEdge() {
    await this.inspector.deleteSelectedEdge();
    await expect(this.inspector.emptySelectionState).toBeVisible();
  }
}