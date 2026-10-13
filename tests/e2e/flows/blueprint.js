import { expect } from '@playwright/test';

export class BlueprintTestRunner {
  /**
   * @param {Object} fixtures - Fixture dari Playwright
   */
  constructor({ page, nodeGraphCrud, nodeGraph, variableCrud, nodeInspectorCrud, previewPage, popup }) {
    this.page = page;
    this.nodeGraphCrud = nodeGraphCrud;
    this.nodeGraph = nodeGraph;
    this.variableCrud = variableCrud;
    this.nodeInspectorCrud = nodeInspectorCrud;
    this.previewPage = previewPage;
    this.popup = popup;
  }

  async runTest({
    testName,
    entityName = 'TestEntity',
    scriptName = 'TestScript',
    variables = [],         // [{ name, type, value, scope, rawJson }]
    nodes = [],             // [{ id, type, label, pos, inspectorValues }]
    variableBindings = [],  // [{ nodeId, varName }]
    connections = [],       // [{ source, sourceHandle, target, targetHandle }]
    expectedLog,            // Log pesan yang diharapkan
    expectedSource = 'Notification',
  }) {
    let stage = 'GRAPH_BUILD';

    try {
      // ---------------------------------------------------------------------
      // TAHAP 1: PREPARASI GRAPH & VARIABEL
      // ---------------------------------------------------------------------
      stage = 'GRAPH_BUILD';
      await this.nodeGraphCrud.openGraphForEntity({ entityName, scriptName });

      // Inisialisasi Variabel
      for (const v of variables) {
        if (v.type === 'list' || v.type === 'map') {
          await this.variableCrud.createVariable({ name: v.name, type: v.type, scope: v.scope || 'Local' });
          if (v.rawJson) {
            await this.variableCrud.updateRawJson(v.name, v.rawJson, this.popup, v.scope || 'Local');
          }
        } else {
          await this.variableCrud.createVariable({
            name: v.name,
            type: v.type,
            value: v.value,
            scope: v.scope || 'Local',
          });
        }
      }

      // Spawn Node & Set Inspector
      const spawnedMap = {};
      for (const n of nodes) {
        const nodeId = await this.nodeGraphCrud.spawnDirect(n.type, n.label || n.type, n.pos || { x: 100, y: 100 });
        spawnedMap[n.id] = nodeId;

        if (n.inspectorValues) {
          await this.nodeGraph.nodeById(nodeId).click();
          for (const [portId, cfg] of Object.entries(n.inspectorValues)) {
            await this.nodeInspectorCrud.setDirectValue(portId, cfg.value, cfg.type);
          }
        }
      }

      // Bind Variabel ke Get Nodes
      for (const binding of variableBindings) {
        const nodeId = spawnedMap[binding.nodeId];
        await this.nodeGraph.nodeById(nodeId).click();
        const trigger = this.page.getByTestId('node-inspector-variable-select-trigger');
        await expect(trigger).toBeVisible();
        await trigger.click();

        const option = this.page
          .getByTestId('node-inspector-variable-select-option')
          .filter({ hasText: binding.varName });
        await expect(option).toBeVisible();
        await option.click();
      }

      // Hubungkan Edge
      for (const conn of connections) {
        const sourceId = spawnedMap[conn.source];
        const targetId = spawnedMap[conn.target];
        await this.nodeGraphCrud.connectDirect(sourceId, conn.sourceHandle, targetId, conn.targetHandle);
      }

      await this.nodeGraphCrud.saveGraphState();

      // ---------------------------------------------------------------------
      // TAHAP 2: BOOT ENGINE PREVIEW
      // ---------------------------------------------------------------------
      stage = 'PREVIEW_BOOT';
      await this.previewPage.startLogCapture();
      const previewPopup = await this.previewPage.openPreview();
      await this.previewPage.expectEngineReady(previewPopup);

      // ---------------------------------------------------------------------
      // TAHAP 3: EVALUASI LOGIKA RUNTIME (UNIT ASSERTION)
      // ---------------------------------------------------------------------
      stage = 'LOGIC_EVALUATION';
      await this.previewPage.expectLog(expectedLog, expectedSource);
      await previewPopup.close();

    } catch (error) {
      // Pemetaan Lokasi Kegagalan Secara Eksplisit
      if (stage === 'GRAPH_BUILD') {
        throw new Error(`[LAYOUT / GRAPH CONFIG ERROR] Gagal menyusun Canvas/Node/Edge/Variable pada [${testName}]: ${error.message}`);
      } else if (stage === 'PREVIEW_BOOT') {
        throw new Error(`[ENGINE / PREVIEW BOOT ERROR] Preview Popup atau Canvas WebGL gagal memuat pada [${testName}]: ${error.message}`);
      } else if (stage === 'LOGIC_EVALUATION') {
        throw new Error(`[BLUEPRINT LOGIC VALUE ERROR] Output evaluasi logika Blueprint tidak sesuai pada [${testName}]: Ekspektasi "${expectedLog}". Detail: ${error.message}`);
      }
      throw error;
    }
  }
}