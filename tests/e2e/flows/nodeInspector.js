import { expect } from '@playwright/test';
import { NodeInspectorPage } from '../pages/NodeInspectorPage.js';

export class NodeInspectorCrudObject {
  /**
   * @param {import('@playwright/test').Page} page
   */
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

  // Ports Configuration Operations
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

  // Parameters & Variable Binding Operations
  async setDirectValue(portId, value, type = 'number') {
    const lowerType = String(type).toLowerCase();

    if (lowerType === 'select' || lowerType === 'option' || lowerType === 'dropdown') {
      await this.inspector.setPortDirectSelect(portId, value);
    } else if (lowerType === 'boolean' || lowerType === 'bool') {
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