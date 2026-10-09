import { expect } from '@playwright/test';
import { BaseControlHelper } from '../helpers/BaseControlHelper.js';
import { PopupHelper } from '../helpers/PopupHelper.js';
import { HierarchyPage } from '../pages/HierarchyPage.js';

export class SceneCrud {
  constructor(page, controls, popup, hierarchy) {
    this.page = page;
    this.controls = controls;
    this.popup = popup;
    this.hierarchy = hierarchy;
  }

  async create(parentLayerNode, entityType = 'Sprite') {
    await expect(parentLayerNode).toBeVisible();

    // Deteksi apakah ini UI Context atau World Context
    const isUI = entityType.startsWith('ui_') || entityType.toLowerCase().includes('ui');
    const menuPath = isUI 
      ? ['Add UI Element', entityType === 'ui_empty' ? 'Empty UI' : entityType]
      : ['Add Entity', entityType];

    await this.popup.selectContextMenu(parentLayerNode, menuPath);

    const createdNode = this.hierarchy.nodesByText(/Empty|UI/i).first();
    await expect(createdNode).toBeVisible();
    return createdNode;
  }

  async switch(name) {
    await this.hierarchy.switchScene(name);
    await expect(this.hierarchy.sceneSelect).toContainText(name);
  }

  async rename(newName) {
    await this.controls.clickSelectAction('Scene Options', 'Rename Scene');
    await this.popup.fillPromptAndSubmit('Rename Scene', newName, 'OK');
    await expect(this.hierarchy.sceneSelect).toContainText(newName);
  }

  async duplicate(newName) {
    await expect(this.hierarchy.sceneSelect).not.toHaveText('Select Scene...');
    await this.controls.clickSelectAction('Scene Options', 'Duplicate Scene');

    const promptModal = this.page.getByRole('dialog').or(this.page.getByTestId('base-prompt-overlay')).first();
    if ((await promptModal.count()) > 0 && (await promptModal.isVisible())) {
      await this.popup.fillPromptAndSubmit('Duplicate Scene', newName, 'OK');
    }

    await expect(this.hierarchy.sceneSelect).toBeVisible();
  }

  async delete() {
    await this.hierarchy.deleteCurrentScene(this.controls, this.popup);
  }

  async deleteAndReject() {
    await expect(this.hierarchy.sceneSelect).not.toHaveText('Select Scene...');
    const initialSceneName = (await this.hierarchy.sceneSelect.textContent()).trim();

    await this.controls.clickSelectAction('Scene Options', 'Delete Scene');

    const modal = this.page.getByTestId('base-confirm').or(this.page.getByRole('alertdialog')).first();
    if ((await modal.count()) > 0 && (await modal.isVisible())) {
      const confirmBtn = modal.getByTestId('confirm-action-button').or(modal.getByRole('button')).first();
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }
    }

    await expect(this.hierarchy.sceneSelect).toContainText(initialSceneName);
  }
}

export class LayerCrud {
  constructor(page, popup, hierarchy) {
    this.page = page;
    this.popup = popup;
    this.hierarchy = hierarchy;
  }

  async create(sectionName, layerName) {
    await this.hierarchy.addLayerToSection(this.popup, sectionName, layerName);
    const section = this.hierarchy.section(sectionName);
    const targetLayer = section
      .locator(`[data-node-name="${layerName}"]`)
      .or(section.locator('.group\\/node', { hasText: layerName }))
      .first();

    await expect(targetLayer).toBeVisible();
  }

  async rename(targetNode, newName) {
    await expect(targetNode).toBeVisible();
    const nodeId = await targetNode.getAttribute('data-node-id');

    await this.popup.selectContextMenu(targetNode, 'Rename Layer');
    await this.popup.fillPromptAndSubmit('Rename Layer', newName, 'Rename');

    const renamedNode = nodeId ? this.hierarchy.nodeById(nodeId) : this.hierarchy.nodeByName(newName);
    await expect(renamedNode).toBeVisible();
    await expect(renamedNode).toHaveAttribute('data-node-name', newName);
    return renamedNode;
  }

  async changeZIndex(layerNode, newZIndex) {
    await expect(layerNode).toBeVisible();
    await this.popup.selectContextMenu(layerNode, 'Change Z-Index');
    await this.popup.fillPromptAndSubmit('Change Z-Index', String(newZIndex), 'Update');

    const zIndexBadge = layerNode
      .getByTitle('Z-Index Layer')
      .or(layerNode.locator('[data-z-index]'))
      .or(layerNode.locator('span[title*="Z-Index"]'))
      .first();

    await expect(zIndexBadge).toHaveText(String(newZIndex));
  }

  async delete(layerName) {
    const targetLayer = this.hierarchy.nodeByName(layerName);
    await expect(targetLayer).toBeVisible();
    await this.popup.selectContextMenu(targetLayer, 'Delete Layer');
    await expect(this.hierarchy.nodeByName(layerName)).toHaveCount(0);
  }

  async reorder(sourceNode, targetNode) {
    await this.hierarchy.dragAndDropNodes(sourceNode, targetNode);
  }
}

export class EntityCrud {
  constructor(page, popup, hierarchy) {
    this.page = page;
    this.popup = popup;
    this.hierarchy = hierarchy;
  }

  async create(parentLayerNode, entityType) {
    await expect(parentLayerNode).toBeVisible();
    
    // Penanganan otomatis untuk konteks UI atau World
    const isUI = entityType.startsWith('ui_') || entityType.toLowerCase().includes('ui');
    const menuPath = isUI
      ? ['Add UI Element', entityType === 'ui_empty' ? 'Empty UI' : entityType]
      : ['Add Entity', entityType];

    await this.popup.selectContextMenu(parentLayerNode, menuPath);

    const createdNode = this.hierarchy.nodesByText(new RegExp(entityType.replace('ui_', ''), 'i')).first();
    await expect(createdNode).toBeVisible();
    return createdNode;
  }

  async reparent(childNode, parentNode) {
    await expect(parentNode).toBeVisible();
    await expect(childNode).toBeVisible();

    const parentId = await parentNode.getAttribute('data-node-id');
    const childId = await childNode.getAttribute('data-node-id');

    await this.hierarchy.dragAndDropNodes(childNode, parentNode);

    if (childId && parentId) {
      await expect(this.hierarchy.nodeById(childId)).toHaveAttribute('data-parent-id', parentId);
    } else {
      const parentContainer = parentNode.locator('xpath=ancestor::*[contains(@class, "relative") or self::li][1]');
      await expect(parentContainer.locator('.group\\/node').first()).toBeVisible();
    }
  }

  async createPrefab(entityNode, prefabName) {
    await expect(entityNode).toBeVisible();
    const nodeId = await entityNode.getAttribute('data-node-id');

    await this.popup.selectContextMenu(entityNode, 'Use as Prefab');
    await this.popup.fillPromptAndSubmit('Create Prefab', prefabName, 'Create');

    const stableNode = nodeId ? this.hierarchy.nodeById(nodeId) : entityNode;
    await expect(stableNode).toHaveAttribute('data-prefab', 'true');
    return stableNode;
  }

  async duplicate(entityNode) {
    await expect(entityNode).toBeVisible();
    await this.popup.selectContextMenu(entityNode, 'Duplicate');

    const duplicatedNode = this.hierarchy.nodesByText(/Sprite|UI|Empty/i).nth(1);
    await expect(duplicatedNode).toBeVisible();
    await expect(duplicatedNode).toHaveAttribute('aria-selected', 'true');
    return duplicatedNode;
  }

  async toggleLock(entityNode, expectLocked = true) {
    await expect(entityNode).toBeVisible();
    await entityNode.hover();

    const lockBtn = entityNode
      .getByRole('button', { name: /lock/i })
      .or(entityNode.getByTitle('Toggle Lock'))
      .or(entityNode.locator('div[title*="Lock"]'))
      .first();

    await lockBtn.click();
    await expect(entityNode).toHaveAttribute('data-locked', String(expectLocked));
  }

  async toggleVisibility(entityNode, expectVisible = true) {
    await expect(entityNode).toBeVisible();
    await entityNode.hover();

    const eyeBtn = entityNode
      .getByRole('button', { name: /visibility/i })
      .or(entityNode.getByTitle('Toggle Visibility'))
      .or(entityNode.locator('div[title*="Visibility"]'))
      .first();

    await eyeBtn.click();
    await expect(entityNode).toHaveAttribute('data-visible', String(expectVisible));
  }
}

export class HierarchyCrudObject {
  constructor(page) {
    this.page = page;
    this.controls = new BaseControlHelper(page);
    this.popup = new PopupHelper(page);
    this.hierarchy = new HierarchyPage(page);

    this.scene = new SceneCrud(page, this.controls, this.popup, this.hierarchy);
    this.layer = new LayerCrud(page, this.popup, this.hierarchy);
    this.entity = new EntityCrud(page, this.popup, this.hierarchy);
  }
}