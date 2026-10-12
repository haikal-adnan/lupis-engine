import { expect } from '@playwright/test';
import { NodeCanvasPage } from '../pages/NodeCanvasPage.js';
import { NodeLibraryPage } from '../pages/NodeLibraryPage.js';
import { InspectorPage } from '../pages/InspectorPage.js';
import { HierarchyPage } from '../pages/HierarchyPage.js';
import { HierarchyCrudObject } from './hierarchy.js';
import { ScriptCrudObject } from './scripts.js';

export class NodeLibraryCrudObject {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
    this.nodeCanvas = new NodeCanvasPage(page);
    this.nodeLibrary = new NodeLibraryPage(page);
    this.inspector = new InspectorPage(page);
    this.hierarchy = new HierarchyPage(page);
    this.hierarchyCrud = new HierarchyCrudObject(page);
    this.scriptCrud = new ScriptCrudObject(page);
  }

  async openGraphForEntity({ entityName = 'GraphTestEntity', scriptName = 'GraphMainScript' } = {}) {
    let entityNode = this.hierarchy.nodeByName(entityName);

    if ((await entityNode.count()) === 0) {
      const worldLayer = this.hierarchy.nodeByName('World Layer');
      entityNode = await this.hierarchyCrud.entity.create(worldLayer, 'empty');
      await entityNode.click();
      await this.inspector.setEntityName(entityName);
    } else {
      await entityNode.click();
    }

    await this.inspector.ensureScriptControllerComponent();

    const dropdownTrigger = this.inspector.scriptControllerSection.getByTestId('script-controller-dropdown-trigger');
    const currentScriptText = await dropdownTrigger.innerText();

    if (!currentScriptText.includes(scriptName)) {
      await this.scriptCrud.createScript(scriptName);
      await this.scriptCrud.attachScriptToEntity(scriptName, entityName);
      await entityNode.click();
    }

    await this.inspector.selectAttachedScript(scriptName);

    const openGraphBtn = this.inspector.scriptControllerSection.getByTestId('script-controller-open-graph-btn');
    await openGraphBtn.click();

    await this.nodeCanvas.ensureReady();
  }

  async addNodeViaSidebar(query, index = 0) {
    await this.nodeLibrary.searchInSidebar(query);
    const searchItem = this.nodeLibrary.sidebarSearchItemsInGroup(query).nth(index);
    await expect(searchItem).toBeVisible();

    const type = await searchItem.getAttribute('data-node-type');
    const initialCount = await this.nodeCanvas.nodesByType(type).count();

    await searchItem.dblclick();

    await expect(this.nodeCanvas.nodesByType(type)).toHaveCount(initialCount + 1);
    return this.nodeCanvas.nodesByType(type).last();
  }

  async addNodeViaModal(categoryLabel, nodeType = null) {
    if (!nodeType) {
      const type = await this.nodeLibrary.addFirstFromModalCategory(categoryLabel);
      return this.nodeCanvas.nodesByType(type).last();
    }

    const initialCount = await this.nodeCanvas.nodesByType(nodeType).count();

    await this.nodeLibrary.openModal();
    await this.nodeLibrary.openCategory(categoryLabel);

    const item = this.nodeLibrary.modalItemByType(nodeType);
    await expect(item).toBeVisible();
    await item.dblclick();

    await expect(this.nodeLibrary.modal).toBeHidden();
    await expect(this.nodeCanvas.nodesByType(nodeType)).toHaveCount(initialCount + 1);

    return this.nodeCanvas.nodesByType(nodeType).last();
  }

  async dropNodeFromSidebar(query, position = { x: 400, y: 300 }) {
    await this.nodeLibrary.searchInSidebar(query);
    const item = this.nodeLibrary.sidebarSearchItems.first();
    await expect(item).toBeVisible();

    const type = await item.getAttribute('data-node-type');
    const initialCount = await this.nodeCanvas.nodesByType(type).count();

    await this.nodeCanvas.dropFromSidebarToCanvas(item, position);

    await expect(this.nodeCanvas.nodesByType(type)).toHaveCount(initialCount + 1);
    return this.nodeCanvas.nodesByType(type).last();
  }

  async connectNodes(sourceNode, targetNode, { compatible = true } = {}) {
    const { output, input } = await this.nodeCanvas.findPortPair(sourceNode, targetNode, { compatible });
    await this.nodeCanvas.spreadApart(targetNode, sourceNode);
    await this.nodeCanvas.connectPorts(sourceNode, output.id, targetNode, input.id);
  }

  async deleteNode(node) {
    await node.click();
    await this.nodeCanvas.expectNodeSelected(node);
    
    const initialTotal = await this.nodeCanvas.nodes.count();
    await this.nodeCanvas.deleteSelectedNodes();

    await expect(this.nodeCanvas.nodes).toHaveCount(initialTotal - 1);
  }
}