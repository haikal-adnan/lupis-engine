import { expect } from '@playwright/test';
import { BaseControlHelper } from '../helpers/BaseControlHelper.js';
import { PopupHelper } from '../helpers/PopupHelper.js';
import { HierarchyPage } from '../pages/HierarchyPage.js';

const SCENE_OPTIONS = 'hierarchy-scene-options-button';

// =========================================================================
// 1. SCENE OPERATIONS FLOW
// =========================================================================
export class SceneCrud {
  constructor(page, controls, popup, hierarchy) {
    this.page = page;
    this.controls = controls;
    this.popup = popup;
    this.hierarchy = hierarchy;
  }

  async create(sceneName) {
    await this.controls.clickSelectAction(SCENE_OPTIONS, 'New Scene');
    await this.popup.fillPromptAndSubmit('New Scene', sceneName, 'OK');
    await expect(this.hierarchy.sceneSelect).toContainText(sceneName);
  }

  async switch(sceneName) {
    await this.hierarchy.switchScene(sceneName);
    await expect(this.hierarchy.sceneSelect).toContainText(sceneName);
  }

  async rename(newName) {
    await this.controls.clickSelectAction(SCENE_OPTIONS, 'Rename Scene');
    await this.popup.fillPromptAndSubmit('Rename Scene', newName, 'OK');
    await expect(this.hierarchy.sceneSelect).toContainText(newName);
  }

  async duplicate() {
    await expect(this.hierarchy.sceneSelect).not.toHaveText('Select Scene...');
    await this.controls.clickSelectAction(SCENE_OPTIONS, 'Duplicate Scene');
    await expect(this.hierarchy.sceneSelect).toBeVisible();
  }

  async delete() {
    await this.hierarchy.deleteCurrentScene(this.controls, this.popup);
  }

  async deleteAndReject() {
    await expect(this.hierarchy.sceneSelect).not.toHaveText('Select Scene...');

    await this.controls.clickSelectAction(SCENE_OPTIONS, 'Delete Scene');

    const alertModal = this.page
      .getByRole('dialog')
      .or(this.page.getByRole('alertdialog'))
      .filter({ hasText: 'Cannot Delete' })
      .first();

    await expect(alertModal).toBeVisible();

    const okBtn = alertModal.getByRole('button', { name: /ok|close/i }).first();
    await okBtn.click();
    await expect(alertModal).not.toBeVisible();
  }
}

// =========================================================================
// 2. LAYER OPERATIONS FLOW
// =========================================================================
export class LayerCrud {
  constructor(page, popup, hierarchy) {
    this.page = page;
    this.popup = popup;
    this.hierarchy = hierarchy;
  }

  async create(sectionName, layerName) {
    await this.hierarchy.addLayerToSection(this.popup, sectionName, layerName);
    const targetLayer = this.hierarchy
      .section(sectionName)
      .locator(`[data-testid="hierarchy-node"][data-node-name="${layerName}"]`)
      .first();

    await expect(targetLayer).toBeVisible();
    return targetLayer;
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

    await expect(layerNode.locator('[data-z-index]').first()).toHaveText(String(newZIndex));
  }

  async toggleLock(layerNode, expectLocked = true) {
    await expect(layerNode).toBeVisible();
    await layerNode.hover();

    await layerNode.getByTestId('hierarchy-node-lock-button').click();
    await expect(layerNode).toHaveAttribute('data-locked', String(expectLocked));
  }

  async toggleVisibility(layerNode, expectVisible = true) {
    await expect(layerNode).toBeVisible();
    await layerNode.hover();

    await layerNode.getByTestId('hierarchy-node-visibility-button').click();
    await expect(layerNode).toHaveAttribute('data-visible', String(expectVisible));
  }

  async delete(layerName) {
    const targetLayer = this.hierarchy.nodeByName(layerName);
    await expect(targetLayer).toBeVisible();
    await this.popup.selectContextMenu(targetLayer, 'Delete Layer');
    await expect(this.hierarchy.nodeByName(layerName)).toHaveCount(0);
  }

  async deleteAndReject(layerName) {
    const targetLayer = this.hierarchy.nodeByName(layerName);
    await expect(targetLayer).toBeVisible();

    const beforeState = await this.hierarchy.snapshot();
    await this.popup.selectContextMenu(targetLayer, 'Delete Layer');

    await expect(targetLayer).toBeVisible();
    await expect.poll(() => this.hierarchy.snapshot()).toEqual(beforeState);
  }

  async reorder(sourceNode, targetNode) {
    await this.hierarchy.dragAndDropNodes(sourceNode, targetNode);
  }
}

// =========================================================================
// 3. ENTITY OPERATIONS FLOW
// =========================================================================
export class EntityCrud {
  constructor(page, popup, hierarchy) {
    this.page = page;
    this.popup = popup;
    this.hierarchy = hierarchy;
  }

  async create(parentLayerNode, entityType) {
    await expect(parentLayerNode).toBeVisible();

    // Pemetaan label context menu berdasarkan tipe entitas
    const typeMap = {
      empty: { path: ['Add Entity', 'Empty Entity'], match: /Empty/i },
      sprite: { path: ['Add Entity', 'Sprite'], match: /Sprite/i },
      shape: { path: ['Add Entity', 'Shape'], match: /Shape/i },
      text: { path: ['Add Entity', 'Text'], match: /Text/i },
      tilemap: { path: ['Add Entity', 'Tilemap'], match: /Tilemap/i },
      ui_empty: { path: ['Add UI Element', 'Empty UI'], match: /Empty/i },
      ui_shape: { path: ['Add UI Element', 'UI Shape'], match: /Shape/i },
      ui_text: { path: ['Add UI Element', 'UI Text'], match: /Text/i },
      ui_image: { path: ['Add UI Element', 'UI Image'], match: /Image/i },
    };

    const targetConfig = typeMap[entityType.toLowerCase()] || {
      path: ['Add Entity', entityType],
      match: new RegExp(entityType, 'i'),
    };

    await this.popup.selectContextMenu(parentLayerNode, targetConfig.path);

    const createdNode = this.hierarchy.nodesByText(targetConfig.match).first();
    await expect(createdNode).toBeVisible();
    return createdNode;
  }

  async rename(entityNode, newName) {
    await expect(entityNode).toBeVisible();
    const nodeId = await entityNode.getAttribute('data-node-id');

    await this.popup.selectContextMenu(entityNode, 'Rename Entity');
    await this.popup.fillPromptAndSubmit('Rename Entity', newName, 'Rename');

    const renamedNode = nodeId ? this.hierarchy.nodeById(nodeId) : this.hierarchy.nodeByName(newName);
    await expect(renamedNode).toBeVisible();
    return renamedNode;
  }

  async reparent(childNode, parentNode) {
    await expect(parentNode).toBeVisible();
    await expect(childNode).toBeVisible();

    const parentId = await parentNode.getAttribute('data-node-id');
    const childId = await childNode.getAttribute('data-node-id');

    await this.hierarchy.dragAndDropNodes(childNode, parentNode);

    if (childId && parentId) {
      await expect(this.hierarchy.nodeById(childId)).toHaveAttribute('data-parent-id', parentId);
    }
  }

  async extractToRoot(childNode, targetLayerNode) {
    await expect(childNode).toBeVisible();
    await expect(targetLayerNode).toBeVisible();

    const childId = await childNode.getAttribute('data-node-id');
    await this.hierarchy.dragAndDropNodes(childNode, targetLayerNode);

    const stableChild = childId ? this.hierarchy.nodeById(childId) : childNode;
    await expect(stableChild).not.toHaveAttribute('data-parent-id');
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
  }

  async copyAndPaste(sourceNode, targetDestinationNode) {
    await expect(sourceNode).toBeVisible();
    await this.popup.selectContextMenu(sourceNode, 'Copy');
    await this.popup.selectContextMenu(targetDestinationNode, 'Paste');
  }

  async cutAndPaste(sourceNode, targetDestinationNode) {
    await expect(sourceNode).toBeVisible();
    await this.popup.selectContextMenu(sourceNode, 'Cut');
    await this.popup.selectContextMenu(targetDestinationNode, 'Paste');
  }

  async delete(entityNode) {
    await expect(entityNode).toBeVisible();
    await this.popup.selectContextMenu(entityNode, 'Delete Entity');
  }

  async toggleLock(entityNode, expectLocked = true) {
    await expect(entityNode).toBeVisible();
    await entityNode.hover();

    await entityNode.getByTestId('hierarchy-node-lock-button').click();
    await expect(entityNode).toHaveAttribute('data-locked', String(expectLocked));
  }

  async toggleVisibility(entityNode, expectVisible = true) {
    await expect(entityNode).toBeVisible();
    await entityNode.hover();

    await entityNode.getByTestId('hierarchy-node-visibility-button').click();
    await expect(entityNode).toHaveAttribute('data-visible', String(expectVisible));
  }
}

// =========================================================================
// 4. WORKSPACE & SEARCH TOOLS FLOW
// =========================================================================
export class WorkspaceToolsCrud {
  constructor(page, controls, hierarchy) {
    this.page = page;
    this.controls = controls;
    this.hierarchy = hierarchy;
  }

  async openUIEditor() {
    const menu = await this.hierarchy.openSectionMenu('User Interface');
    const openBtn = menu.getByTestId('hierarchy-ui-open-editor-button');
    // Tombol disabled kalau tab aktif sudah bertipe 'ui'
    await expect(openBtn).toBeEnabled();
    await openBtn.click();

    const activeTab = this.page
      .locator('[aria-selected="true"]')
      .or(this.page.locator('.bg-accent, .border-b-2'))
      .filter({ hasText: /UI Editor/i })
      .first();
    await expect(activeTab).toBeVisible();
  }

  async search(query) {
    await this.controls.fillSearch('hierarchy-search-input', query);
  }

  async clearSearch() {
    await this.controls.clearSearch('hierarchy-search-input');
  }
}

// =========================================================================
// MAIN HIERARCHY CRUD OBJECT FACADE
// =========================================================================
export class HierarchyCrudObject {
  constructor(page) {
    this.page = page;
    this.controls = new BaseControlHelper(page);
    this.popup = new PopupHelper(page);
    this.hierarchy = new HierarchyPage(page);

    this.scene = new SceneCrud(page, this.controls, this.popup, this.hierarchy);
    this.layer = new LayerCrud(page, this.popup, this.hierarchy);
    this.entity = new EntityCrud(page, this.popup, this.hierarchy);
    this.tools = new WorkspaceToolsCrud(page, this.controls, this.hierarchy);
  }
}
