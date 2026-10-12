import { expect } from '@playwright/test';
import { NodeCanvasPage } from '../pages/NodeCanvasPage.js';
import { NodeLibraryPage } from '../pages/NodeLibraryPage.js';
import { InspectorPage } from '../pages/InspectorPage.js';
import { HierarchyPage } from '../pages/HierarchyPage.js';
import { HierarchyCrudObject } from './hierarchy.js';
import { ScriptCrudObject } from './scripts.js';

export class NodeCanvasCrudObject {
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
    await this.nodeLibrary.clearSidebarSearch();
    await this.nodeLibrary.searchInSidebar(query);
    const searchItem = this.nodeLibrary.sidebarSearchItemsInGroup(query).nth(index);
    await expect(searchItem).toBeVisible();

    const type = await searchItem.getAttribute('data-node-type');
    const initialCount = await this.nodeCanvas.nodesByType(type).count();

    await searchItem.dblclick();

    await expect(this.nodeCanvas.nodesByType(type)).toHaveCount(initialCount + 1);
    return this.nodeCanvas.nodesByType(type).last();
  }

  async dropNodeFromSidebar(query, position = { x: 400, y: 300 }) {
    await this.nodeLibrary.clearSidebarSearch();
    await this.nodeLibrary.searchInSidebar(query);
    const item = this.nodeLibrary.sidebarSearchItems.first();
    await expect(item).toBeVisible();

    const type = await item.getAttribute('data-node-type');
    const initialCount = await this.nodeCanvas.nodesByType(type).count();

    await this.nodeCanvas.dropFromSidebarToCanvas(item, position);

    await expect(this.nodeCanvas.nodesByType(type)).toHaveCount(initialCount + 1);
    return this.nodeCanvas.nodesByType(type).last();
  }

  /**
   * Seret variabel langsung dari Variable Panel utama ke canvas
   */
  async dropVariableToCanvas(varName, mode = 'get', position = { x: 350, y: 250 }) {
    const row = this.page.locator(`[data-testid="variable-panel-item-row"][data-variable-name="${varName}"]`).first();
    await expect(row).toBeVisible();

    const canvasBox = await this.nodeCanvas.canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas bounding box tidak ditemukan');

    const dataTransfer = await this.page.evaluateHandle(() => new DataTransfer());
    const clientPos = { clientX: canvasBox.x + position.x, clientY: canvasBox.y + position.y };

    await row.dispatchEvent('dragstart', { dataTransfer });

    await this.page.evaluate(({ dt, actionType }) => {
      const raw = dt.getData('application/script-variable');
      if (raw) {
        const parsed = JSON.parse(raw);
        parsed.actionType = actionType;
        dt.setData('application/script-variable', JSON.stringify(parsed));
      }
    }, { dt: dataTransfer, actionType: mode === 'get' ? 'variable_get' : 'variable_set' });

    const targetType = mode === 'get' ? 'variable_get' : 'variable_set';
    const initialCount = await this.nodeCanvas.nodesByType(targetType).count();

    await this.nodeCanvas.canvas.dispatchEvent('dragenter', { dataTransfer, ...clientPos });
    await this.nodeCanvas.canvas.dispatchEvent('dragover', { dataTransfer, ...clientPos });
    await this.nodeCanvas.canvas.dispatchEvent('drop', { dataTransfer, ...clientPos });
    await row.dispatchEvent('dragend', { dataTransfer });

    await expect(this.nodeCanvas.nodesByType(targetType)).toHaveCount(initialCount + 1);
    return this.nodeCanvas.nodesByType(targetType).last();
  }

  async connectNodes(sourceNode, targetNode, { compatible = true, autoSpread = true } = {}) {
    await this.page.evaluate(() => {
      const app = document.querySelector('#app')?.__vue_app__;
      const pinia = app?.config?.globalProperties?.$pinia;
      if (pinia) {
        const scriptStore = pinia._s.get('script');
        if (scriptStore) {
          scriptStore.setSelectedNodes([]);
          scriptStore.setSelectedNode(null);
          scriptStore.setSelectedEdge(null);
        }
      }
    });

    const initialEdgesCount = await this.nodeCanvas.edges.count();

    const { output, input } = await this.nodeCanvas.findPortPair(sourceNode, targetNode, { compatible });

    if (autoSpread) {
      const box1 = await sourceNode.boundingBox();
      const box2 = await targetNode.boundingBox();
      if (box1 && box2) {
        const dx = Math.abs(box1.x - box2.x);
        const dy = Math.abs(box1.y - box2.y);
        if (dx < 100 && dy < 100) {
          await this.nodeCanvas.spreadApart(targetNode, sourceNode);
        }
      }
    }

    await this.nodeCanvas.connectPorts(sourceNode, output.id, targetNode, input.id);

    if (compatible) {
      await expect(this.nodeCanvas.edges).toHaveCount(initialEdgesCount + 1);
    }
  }

  async deleteNode(node) {
    await node.click();
    await this.nodeCanvas.expectNodeSelected(node);
    
    const initialTotal = await this.nodeCanvas.nodes.count();
    await this.nodeCanvas.deleteSelectedNodes();

    await expect(this.nodeCanvas.nodes).toHaveCount(initialTotal - 1);
  }
}