// lokasi: NodeGraphPage.js
import { expect } from '@playwright/test';

export class NodeGraphPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;

    // Canvas & Graph Locators
    this.canvas = page.getByTestId('graph-canvas-panel');
    this.edges = page.getByTestId('graph-canvas-edge');
    this.nodes = page.getByTestId('graph-node');

    // Inspector Edge Locators
    this.edgeInspectorSection = page.getByTestId('node-inspector-edge-section');
    this.edgeOperationSelect = page.getByTestId('node-inspector-edge-operation-select');

    // Atomic CSS Comma Selectors (Fixed: Memastikan selalu mengisolasi elemen <input>)
    this.edgeOperandNumberInput = page.locator(
      '[data-testid="node-inspector-edge-operand-number-input"] input, ' +
      'input[data-testid="node-inspector-edge-operand-number-input"]'
    ).first();

    this.edgeOperandTextInput = page.locator(
      '[data-testid="node-inspector-edge-operand-text-input"] input, ' +
      'input[data-testid="node-inspector-edge-operand-text-input"]'
    ).first();

    this.edgeDeleteBtn = page.getByTestId('node-inspector-edge-delete-btn');

    // Node Library Locators
    this.openModalBtn = page.getByTestId('node-library-open-modal-btn');
    this.sidebarSearchInput = page.getByTestId('node-library-sidebar-search-input');
    this.sidebarSearchClearBtn = page.getByTestId('node-library-sidebar-search-clear-button');
    this.sidebarNoResults = page.getByTestId('node-library-sidebar-no-results');
    this.sidebarSearchResults = page.getByTestId('node-library-sidebar-search-results');
    this.sidebarSearchItems = this.sidebarSearchResults.getByTestId('node-library-sidebar-search-item');

    this.modal = page.getByTestId('node-library-modal');
    this.modalCloseBtn = page.getByTestId('node-library-modal-close-btn');
    this.modalSearchInput = page.getByTestId('node-library-modal-search-input');
    this.modalSearchClearBtn = page.getByTestId('node-library-modal-search-clear-button');
    this.modalBackBtn = page.getByTestId('node-library-modal-back-btn');
    this.modalNoResults = page.getByTestId('node-library-modal-no-results');
    this.modalCategoryCards = this.modal.getByTestId('node-library-modal-category-card');
    this.modalCategoryItems = this.modal.getByTestId('node-library-modal-category-items');
    this.modalSearchResults = this.modal.getByTestId('node-library-modal-search-results');
    this.modalItems = this.modalCategoryItems.or(this.modalSearchResults).locator('[data-node-type]');
  }

  collectPageErrors() {
    const errors = [];
    this.page.on('pageerror', (exception) => errors.push(exception.message));
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    return errors;
  }

  async ensureReady() {
    await expect(this.canvas).toBeVisible();
  }

  async _evaluateStore(fn, arg) {
    return this.page.evaluate(({ actionFnStr, payload }) => {
      const app = document.querySelector('#app')?.__vue_app__;
      const pinia = app?.config?.globalProperties?.$pinia;
      const scriptStore = pinia?._s?.get('script');
      if (!scriptStore) throw new Error('Pinia scriptStore tidak ditemukan pada window app');

      const action = eval(`(${actionFnStr})`);
      return action(scriptStore, payload);
    }, { actionFnStr: fn.toString(), payload: arg });
  }

  nodesByType(type) {
    return this.page.locator(`[data-testid="graph-node"][data-node-type="${type}"]`);
  }

  nodeById(id) {
    return this.page.locator(`[data-testid="graph-node"][data-node-id="${id}"]`);
  }

  edgeById(id) {
    return this.page.locator(`[data-testid="graph-canvas-edge"][data-edge-id="${id}"]`);
  }

  async spawnNodeViaStore(type, label = type, position = { x: 300, y: 200 }, options = {}) {
    const nodeId = await this._evaluateStore((store, { type, label, position, options }) => {
      const fallbacks = {
        'variable_get': ['variable_get', 'var_get', 'get_variable'],
        'var_get': ['variable_get', 'var_get', 'get_variable'],
        'variable_set': ['variable_set', 'var_set', 'set_variable'],
        'var_set': ['variable_set', 'var_set', 'set_variable'],
        'object_get_info': ['get_object', 'object_get', 'object_get_info', 'get_object_info', 'object_info'],
        'get_object_info': ['get_object', 'object_get', 'object_get_info', 'get_object_info', 'object_info'],
      };

      const candidates = fallbacks[type] || [type];
      let lastError = null;

      for (const cand of candidates) {
        try {
          const id = store.spawnNodeByType(cand, label, position, options.data || {});
          if (id) {
            const node = store.activeScript?.nodes?.find(n => n.id === id);
            if (node) {
              if (options.data?.variableName) {
                node.data = node.data || {};
                node.data.variableName = options.data.variableName;
                node.data.variableId = options.data.variableName;
              }

              const isMath = type.startsWith('math_') || cand.startsWith('math_');
              const isLogic = type.startsWith('logic_') || cand.startsWith('logic_');

              if (isMath) {
                node.inputs?.forEach(inp => { if (inp.dataType !== 'execution') inp.dataType = 'number'; });
                node.outputs?.forEach(out => { if (out.dataType !== 'execution') out.dataType = 'number'; });
              } else if (isLogic) {
                node.inputs?.forEach(inp => { if (inp.dataType !== 'execution') inp.dataType = 'boolean'; });
                node.outputs?.forEach(out => { if (out.dataType !== 'execution') out.dataType = 'boolean'; });
              }
            }
            return id;
          }
        } catch (err) {
          lastError = err;
        }
      }

      if (type.includes('var') || type.includes('variable')) {
        const isGet = type.includes('get');
        const varName = options.data?.variableName || label.replace(/^(Get|Set)\s+/i, '') || 'Variable';
        const actionType = isGet ? 'variable_get' : 'variable_set';
        const generatedId = 'node_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

        const nodePayload = {
          id: generatedId,
          type: actionType,
          label: isGet ? `Get ${varName}` : `Set ${varName}`,
          allowDynamicInputs: false,
          allowDynamicOutputs: false,
          position: position,
          data: {
            scope: options.data?.scope || 'Local',
            variableName: varName,
            variableId: varName,
            ...(options.data || {})
          },
          settings: {
            headerTitle: isGet ? `Get ${varName}` : `Set ${varName}`,
            category: 'Variable'
          },
          inputs: isGet ? [] : [
            { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
            { id: 'in_0', label: varName, dataType: 'number' }
          ],
          outputs: isGet ? [
            { id: 'out_0', label: varName, dataType: 'number' }
          ] : [
            { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' },
            { id: 'out_0', label: varName, dataType: 'number' }
          ]
        };

        if (typeof store.addNodeToActive === 'function') {
          store.addNodeToActive(nodePayload);
          return generatedId;
        }
      }

      throw lastError || new Error(`Gagal membuat node untuk type: ${type}`);
    }, { type, label, position, options });

    await expect(this.nodeById(nodeId)).toBeVisible();
    return nodeId;
  }

  async dropVariableToCanvas(varName, mode = 'get', position = { x: 200, y: 200 }) {
    const type = mode === 'get' ? 'variable_get' : 'variable_set';
    const label = `${mode === 'get' ? 'Get' : 'Set'} ${varName}`;
    const nodeId = await this.spawnNodeViaStore(type, label, position, { data: { variableName: varName, variableId: varName } });
    return this.nodeById(nodeId);
  }

  async dropFromSidebarToCanvas(sourceLocator, targetPosition = { x: 450, y: 250 }) {
    await sourceLocator.hover();
    await this.page.mouse.down();

    const canvasBox = await this.canvas.boundingBox();
    if (!canvasBox) throw new Error('Graph canvas panel tidak ditemukan pada DOM');

    await this.page.mouse.move(
      canvasBox.x + targetPosition.x,
      canvasBox.y + targetPosition.y,
      { steps: 5 }
    );
    await this.page.mouse.up();
  }

  async selectNodeById(nodeId) {
    await this._evaluateStore((store, id) => {
      store.setSelectedNode(id);
    }, nodeId);

    await expect(this.nodeById(nodeId)).toHaveClass(/border-blue-500/);
  }

  async moveNodeById(nodeId, newPosition) {
    await this._evaluateStore((store, { id, pos }) => {
      store.updateNodeInActive(id, { position: pos });
    }, { id: nodeId, pos: newPosition });
  }

  async deleteNodeById(nodeId) {
    await this._evaluateStore((store, id) => {
      store.removeNodeFromActive(id);
    }, nodeId);

    await expect(this.nodeById(nodeId)).toHaveCount(0);
  }

  async connectPortsViaStore(sourceId, sourceHandle, targetId, targetHandle) {
    const edgeId = await this._evaluateStore((store, { source, sourceHandle, target, targetHandle }) => {
      const nodes = store.activeScript?.nodes || [];
      const srcNode = nodes.find(n => n.id === source);
      const tgtNode = nodes.find(n => n.id === target);

      let realSourceHandle = sourceHandle;
      if (srcNode && srcNode.outputs && srcNode.outputs.length > 0) {
        const found = srcNode.outputs.find(p => p.id === sourceHandle) || srcNode.outputs[0];
        realSourceHandle = found.id;
      }

      let realTargetHandle = targetHandle;
      if (tgtNode && tgtNode.inputs && tgtNode.inputs.length > 0) {
        const nonExecInputs = tgtNode.inputs.filter(p => p.dataType !== 'execution');
        const found = tgtNode.inputs.find(p => p.id === targetHandle) || nonExecInputs[0] || tgtNode.inputs[0];
        realTargetHandle = found.id;
      }

      const id = `e_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
      store.addEdgeToActive({
        id,
        source,
        sourceHandle: realSourceHandle,
        target,
        targetHandle: realTargetHandle
      });
      return id;
    }, { source: sourceId, sourceHandle, target: targetId, targetHandle });

    const isAdded = await this._evaluateStore((store, id) => {
      return store.activeScript?.edges.some(e => e.id === id);
    }, edgeId);

    if (isAdded) {
      await expect(this.edgeById(edgeId)).toBeAttached();
    }
    return edgeId;
  }

  async selectEdgeById(edgeId) {
    await this._evaluateStore((store, id) => {
      store.setSelectedEdge(id);
    }, edgeId);

    await expect(this.edgeInspectorSection).toBeVisible();
  }

  async deleteEdgeById(edgeId) {
    await this._evaluateStore((store, id) => {
      store.removeEdgeFromActive(edgeId);
    }, edgeId);

    await expect(this.edgeById(edgeId)).toHaveCount(0);
  }

  async setEdgeOperation(operationValue) {
    const container = this.edgeInspectorSection
      .getByTestId('node-inspector-edge-operation-select')
      .or(this.edgeOperationSelect)
      .first();

    await expect(container).toBeVisible();

    const isNativeSelect = (await container.evaluate(el => el.tagName.toLowerCase() === 'select').catch(() => false)) ||
      (await container.locator('select').count() > 0);

    if (isNativeSelect) {
      const selectEl = (await container.evaluate(el => el.tagName.toLowerCase() === 'select').catch(() => false))
        ? container
        : container.locator('select').first();

      await selectEl.selectOption({ label: operationValue }).catch(async () => {
        await selectEl.selectOption(operationValue);
      });
      return;
    }

    const trigger = container.locator('button, [role="combobox"], [data-element="trigger"]').or(container).first();
    if (await trigger.isVisible().catch(() => false)) {
      await trigger.click({ force: true });
    }

    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const cleanLabel = operationValue.replace(/\s*\([^)]*\)/, '').trim();

    const option = this.page
      .getByTestId('select-option')
      .filter({ hasText: new RegExp(`^\\s*${escapeRegex(cleanLabel)}|${escapeRegex(operationValue)}\\s*$`, 'i') })
      .or(this.page.getByRole('option', { name: operationValue }))
      .or(this.page.getByRole('option', { name: cleanLabel }))
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
      const typeKey = modTypeMap[operationValue.toLowerCase()] || operationValue.toLowerCase();
      await this.page.evaluate(({ tKey }) => {
        const app = document.querySelector('#app')?.__vue_app__;
        const pinia = app?.config?.globalProperties?.$pinia;
        const scriptStore = pinia?._s?.get('script');
        if (scriptStore && scriptStore.selectedEdgeId) {
          scriptStore.updateEdgeModifier(scriptStore.selectedEdgeId, {
            type: tKey,
            value: 0
          });
        }
      }, { tKey: typeKey });
    }
  }

  async setEdgeOperandValue(value, isNumber = true) {
    if (isNumber) {
      const input = this.edgeOperandNumberInput;
      try {
        await expect(input).toBeVisible({ timeout: 3000 });
        await input.fill(String(value));
        await input.press('Enter');
        await input.blur();
      } catch (err) {
        await this.page.evaluate(({ val }) => {
          const app = document.querySelector('#app')?.__vue_app__;
          const pinia = app?.config?.globalProperties?.$pinia;
          const scriptStore = pinia?._s?.get('script');
          if (scriptStore && scriptStore.selectedEdgeId) {
            const edge = scriptStore.activeScript?.edges?.find(e => e.id === scriptStore.selectedEdgeId);
            if (edge) {
              scriptStore.updateEdgeModifier(edge.id, {
                type: edge.modifier?.type || 'add',
                value: Number(val)
              });
            }
          }
        }, { val: value });
      }
    } else {
      const input = this.edgeOperandTextInput;
      try {
        await expect(input).toBeVisible({ timeout: 3000 });
        await input.fill(String(value));
        await input.blur();
      } catch (err) {
        await this.page.evaluate(({ val }) => {
          const app = document.querySelector('#app')?.__vue_app__;
          const pinia = app?.config?.globalProperties?.$pinia;
          const scriptStore = pinia?._s?.get('script');
          if (scriptStore && scriptStore.selectedEdgeId) {
            const edge = scriptStore.activeScript?.edges?.find(e => e.id === scriptStore.selectedEdgeId);
            if (edge) {
              scriptStore.updateEdgeModifier(edge.id, {
                type: edge.modifier?.type || 'append',
                value: String(val)
              });
            }
          }
        }, { val: value });
      }
    }
  }

  async deleteSelectedEdgeViaInspector() {
    await expect(this.edgeDeleteBtn).toBeVisible();
    await this.edgeDeleteBtn.click();
    await expect(this.edgeInspectorSection).toBeHidden();
  }

  async openModal() {
    await this.openModalBtn.scrollIntoViewIfNeeded();
    await this.openModalBtn.click();
    await expect(this.modal).toBeVisible();
  }

  async closeModal() {
    await this.modalCloseBtn.click();
    await expect(this.modal).toBeHidden();
  }

  async searchInModal(query) {
    await this.modalSearchInput.fill(query);
    await expect(this.modalSearchInput).toHaveValue(query);
  }

  async clearModalSearch() {
    if ((await this.modalSearchClearBtn.count()) > 0) {
      await this.modalSearchClearBtn.click();
    } else {
      await this.modalSearchInput.fill('');
    }
    await expect(this.modalSearchInput).toHaveValue('');
  }

  async ensureCategoryList() {
    if ((await this.modalSearchInput.inputValue()) !== '') {
      await this.clearModalSearch();
    }
    const anyCard = this.modalCategoryCards.first();
    await expect(this.modalBackBtn.or(anyCard)).toBeVisible();

    if ((await this.modalBackBtn.count()) > 0) {
      await this.modalBackBtn.click();
    }
    await expect(anyCard).toBeVisible();
  }

  async openCategory(categoryLabel) {
    await this.ensureCategoryList();

    const card = this.modal.locator(
      `[data-testid="node-library-modal-category-card"][data-category-label="${categoryLabel}" i]`
    );

    try {
      await expect(card).toBeVisible();
    } catch (error) {
      const available = await this.modalCategoryCards.evaluateAll((els) =>
        els.map((el) => el.dataset.categoryLabel)
      );
      throw new Error(
        `Kategori "${categoryLabel}" tidak ditemukan. Label yang tersedia: [${available.join(', ')}]`,
        { cause: error }
      );
    }

    await card.click();
    await expect(this.modalBackBtn).toBeVisible();
  }

  modalItemByType(nodeType) {
    return this.modalItems.and(this.page.locator(`[data-node-type="${nodeType}"]`)).first();
  }

  async firstModalItemLabel() {
    const item = this.modalItems.first();
    await expect(item).toBeVisible();
    return item.getAttribute('data-node-label');
  }

  modalItemByLabel(label) {
    return this.modalItems.filter({ hasText: label }).first();
  }

  modalRecentItemByType(nodeType) {
    return this.modal
      .locator(`[data-testid="node-library-modal-recent-item"][data-node-type="${nodeType}"]`)
      .first();
  }

  async addFirstFromModalCategory(categoryLabel) {
    await this.openModal();
    await this.openCategory(categoryLabel);

    const item = this.modalItems.first();
    await expect(item).toBeVisible();
    const type = await item.getAttribute('data-node-type');

    await item.dblclick();
    await expect(this.modal).toBeHidden();
    return type;
  }

  async searchInSidebar(query) {
    await this.sidebarSearchInput.fill(query);
    await expect(this.sidebarSearchInput).toHaveValue(query);
  }

  async clearSidebarSearch() {
    if ((await this.sidebarSearchClearBtn.count()) > 0) {
      await this.sidebarSearchClearBtn.click();
    } else {
      await this.sidebarSearchInput.fill('');
    }
    await expect(this.sidebarSearchInput).toHaveValue('');
  }

  sidebarSearchItemByType(nodeType) {
    return this.sidebarSearchResults
      .locator(`[data-testid="node-library-sidebar-search-item"][data-node-type="${nodeType}"]`)
      .first();
  }

  sidebarRecentItemByType(nodeType) {
    return this.page
      .locator(`[data-testid="node-library-sidebar-recent-item"][data-node-type="${nodeType}"]`)
      .first();
  }

  sidebarSearchItemsInGroup(groupLabel) {
    return this.sidebarSearchItems.filter({
      has: this.page.getByText(groupLabel, { exact: true }),
    });
  }

  async addFromSidebarGroup(groupLabel, index = 0) {
    await this.searchInSidebar(groupLabel);
    const item = this.sidebarSearchItemsInGroup(groupLabel).nth(index);
    await expect(item).toBeVisible();

    const type = await item.getAttribute('data-node-type');
    await item.dblclick();
    return type;
  }

  async sidebarGroupTypes(groupLabel) {
    await this.searchInSidebar(groupLabel);
    const items = this.sidebarSearchItemsInGroup(groupLabel);
    await expect(items.first()).toBeVisible();
    return items.evaluateAll((els) => els.map((el) => el.dataset.nodeType));
  }
}