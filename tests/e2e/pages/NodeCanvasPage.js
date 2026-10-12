import { expect } from '@playwright/test';

const GRID_SIZE = 24;

export class NodeCanvasPage {
  /** @param {import('@playwright/test').Page} page */
  constructor(page) {
    this.page = page;
    this.canvas = page.getByTestId('graph-canvas-panel');
    this.edges = page.getByTestId('graph-canvas-edge');
    this.nodes = page.getByTestId('graph-node');

    // Inspector Edge Locators
    this.edgeInspectorSection = page.getByTestId('node-inspector-edge-section');
    this.edgeOperationSelect = page.getByTestId('node-inspector-edge-operation-select');
    this.edgeOperandNumberInput = page.getByTestId('node-inspector-edge-operand-number-input').locator('input');
    this.edgeOperandTextInput = page.getByTestId('node-inspector-edge-operand-text-input').locator('input');
    this.edgeDeleteBtn = page.getByTestId('node-inspector-edge-delete-btn');
    this.edgeSourceTitle = page.getByTestId('node-inspector-edge-source-title');
    this.edgeTargetTitle = page.getByTestId('node-inspector-edge-target-title');
  }

  async ensureReady() {
    await expect(this.canvas).toBeVisible();
  }

  /**
   * Merekam seluruh uncaught JavaScript page error pada browser page
   * @returns {Error[]} Array penampung error
   */
  collectPageErrors() {
    const errors = [];
    this.page.on('pageerror', (exception) => errors.push(exception));
    return errors;
  }

  nodesByType(type) {
    return this.page.locator(`[data-testid="graph-node"][data-node-type="${type}"]`);
  }

  nodeByType(type) {
    return this.nodesByType(type).locator('nth=0');
  }

  outputPort(node, portId) {
    const idFilter = portId ? `[data-port-id="${portId}"]` : '';
    return node.locator(`[data-testid="graph-node-output-port"]${idFilter}`).locator('nth=0');
  }

  inputPort(node, portId) {
    const idFilter = portId ? `[data-port-id="${portId}"]` : '';
    return node.locator(`[data-testid="graph-node-input-port"]${idFilter}`).locator('nth=0');
  }

  async _centerOf(locator, label) {
    const box = await locator.boundingBox();
    if (!box) throw new Error(`Bounding box ${label} tidak ditemukan`);
    return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  }

  async dragNodeBy(node, dx, dy = 0) {
    const header = node.getByTestId('graph-node-header');
    await expect(header).toBeVisible();

    const before = await node.boundingBox();
    const start = await this._centerOf(header, 'header node');

    await this.page.mouse.move(start.x, start.y);
    await this.page.mouse.down({ button: 'left' });
    await this.page.mouse.move(start.x + dx, start.y + dy, { steps: 10 });
    await this.page.mouse.up({ button: 'left' });

    await expect
      .poll(async () => {
        const after = await node.boundingBox();
        return Math.abs(after.x - before.x) >= Math.abs(dx) - (GRID_SIZE * 2);
      })
      .toBe(true);
  }

  async spreadApart(lastAdded, firstAdded, distance = 220) {
    await this.dragNodeBy(lastAdded, distance);
    await this.dragNodeBy(firstAdded, -distance);
  }

  async portsOf(node, kind) {
    return node
      .locator(`[data-testid="graph-node-${kind}-port"]`)
      .evaluateAll((els) => els.map((el) => ({ id: el.dataset.portId, type: el.dataset.portType })));
  }

  async connectPorts(sourceNode, sourcePortId, targetNode, targetPortId) {
    const sourcePort = this.outputPort(sourceNode, sourcePortId);
    const targetPort = this.inputPort(targetNode, targetPortId);

    await expect(sourcePort).toBeVisible();
    await expect(targetPort).toBeVisible();

    await sourcePort.scrollIntoViewIfNeeded();
    await targetPort.scrollIntoViewIfNeeded();

    const from = await this._centerOf(sourcePort, 'port output');
    const to = await this._centerOf(targetPort, 'port input');

    await this.page.mouse.move(from.x, from.y);
    await this.page.mouse.down({ button: 'left' });
    await this.page.mouse.move(to.x, to.y, { steps: 20 });
    await this.page.mouse.up({ button: 'left' });
  }

  async selectEdge(edgeLocator) {
    await expect(edgeLocator).toBeAttached();
    const edgeId = await edgeLocator.getAttribute('data-edge-id');

    const box = await edgeLocator.boundingBox();
    if (box) {
      await this.page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    }

    if (edgeId) {
      await this.page.evaluate((id) => {
        const app = document.querySelector('#app')?.__vue_app__;
        const pinia = app?.config?.globalProperties?.$pinia;
        if (pinia) {
          const scriptStore = pinia._s.get('script');
          if (scriptStore) {
            scriptStore.selectedEdgeId = id;
          }
        }
      }, edgeId);
    }

    await expect(this.edgeInspectorSection).toBeVisible();
  }

  async selectMultipleNodes(nodes) {
    const nodeIds = [];
    for (const node of nodes) {
      const id = await node.getAttribute('data-node-id');
      if (id) nodeIds.push(id);
    }

    await this.page.evaluate((ids) => {
      const app = document.querySelector('#app')?.__vue_app__;
      const pinia = app?.config?.globalProperties?.$pinia;
      if (pinia) {
        const scriptStore = pinia._s.get('script');
        if (scriptStore) {
          if (typeof scriptStore.setSelectedNodes === 'function') {
            scriptStore.setSelectedNodes(ids);
          } else {
            scriptStore.selectedNodeIds = ids;
          }
        }
      }
    }, nodeIds);
  }

  async setEdgeOperation(operationValue) {
    await expect(this.edgeOperationSelect).toBeVisible();
    await this.edgeOperationSelect.click();
    
    const escapedVal = operationValue.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    const option = this.page.getByTestId('select-option').filter({
      hasText: new RegExp(`^\\s*${escapedVal}\\s*$`, 'i')
    }).locator('nth=0');
    await option.click();
  }

  async setEdgeOperandValue(value, isNumber = true) {
    if (isNumber) {
      await expect(this.edgeOperandNumberInput).toBeVisible();
      await this.edgeOperandNumberInput.fill(String(value));
      await this.edgeOperandNumberInput.press('Enter');
    } else {
      await expect(this.edgeOperandTextInput).toBeVisible();
      await this.edgeOperandTextInput.fill(String(value));
      await this.edgeOperandTextInput.blur();
    }
  }

  async deleteSelectedEdgeViaInspector() {
    await expect(this.edgeDeleteBtn).toBeVisible();
    await this.edgeDeleteBtn.click();
    await expect(this.edgeInspectorSection).toBeHidden();
  }

  async expectNodeSelected(node) {
    await expect(node).toHaveClass(/border-blue-500/);
  }

  async dropFromSidebarToCanvas(sourceLocator, { x = 400, y = 300 } = {}) {
    await sourceLocator.scrollIntoViewIfNeeded();
    await expect(sourceLocator).toBeVisible();

    const canvasBox = await this.canvas.boundingBox();
    if (!canvasBox) throw new Error('Canvas bounding box tidak ditemukan');

    const dataTransfer = await this.page.evaluateHandle(() => new DataTransfer());
    const position = { clientX: canvasBox.x + x, clientY: canvasBox.y + y };

    await sourceLocator.dispatchEvent('dragstart', { dataTransfer });
    await this.canvas.dispatchEvent('dragenter', { dataTransfer, ...position });
    await this.canvas.dispatchEvent('dragover', { dataTransfer, ...position });
    await this.canvas.dispatchEvent('drop', { dataTransfer, ...position });
    await sourceLocator.dispatchEvent('dragend', { dataTransfer });
  }

  async deleteSelectedNodes() {
    await this.page.evaluate(() => document.activeElement?.blur());
    await this.page.keyboard.press('Delete');
  }

  async findPortPair(sourceNode, targetNode, { compatible }) {
    const isValid = (s, t) => {
      const sNorm = (s || '').toLowerCase();
      const tNorm = (t || '').toLowerCase();
      if (sNorm === 'execution' || tNorm === 'execution') return sNorm === 'execution' && tNorm === 'execution';
      return sNorm === 'any' || tNorm === 'any' || sNorm === tNorm;
    };
    const outputs = (await this.portsOf(sourceNode, 'output')).filter((p) => (p.type || '').toLowerCase() !== 'execution');
    const inputs = await this.portsOf(targetNode, 'input');
    for (const output of outputs) {
      const input = inputs.find((i) => isValid(output.type, i.type) === compatible);
      if (input) return { output, input };
    }
    throw new Error(
      `Tidak ada pasangan port ${compatible ? 'kompatibel' : 'tidak kompatibel'}.`
    );
  }
}