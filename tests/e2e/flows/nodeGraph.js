import { expect } from '@playwright/test';
import { NodeGraphPage } from '../pages/NodeGraphPage.js';
import { InspectorPage } from '../pages/InspectorPage.js';
import { HierarchyPage } from '../pages/HierarchyPage.js';
import { HierarchyCrudObject } from './hierarchy.js';
import { ScriptCrudObject } from './scripts.js';

export class NodeGraphCrudObject {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.nodeGraph = new NodeGraphPage(page);
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

    await this.nodeGraph.ensureReady();
  }

  async spawnDirect(type, label, position) {
    return await this.nodeGraph.spawnNodeViaStore(type, label, position);
  }

  async connectDirect(sourceId, sourceHandle, targetId, targetHandle) {
    return await this.nodeGraph.connectPortsViaStore(sourceId, sourceHandle, targetId, targetHandle);
  }

  async removeNodeDirect(nodeId) {
    await this.nodeGraph.deleteNodeById(nodeId);
  }

  async saveGraphState() {
    await this.page.evaluate(() => {
      const app = document.querySelector('#app')?.__vue_app__;
      const pinia = app?.config?.globalProperties?.$pinia;
      const scriptStore = pinia?._s?.get('script');
      if (scriptStore && typeof scriptStore.saveActiveScript === 'function') {
        scriptStore.saveActiveScript();
      }
    });
  }
}