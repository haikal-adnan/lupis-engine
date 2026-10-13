import { expect } from '@playwright/test';

export class BlueprintTestRunner {
  /**
   * @param {Object} fixtures Fixture dari Playwright
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
    variables = [],          // [{ name, type, value, isExposed, scope, rawJson }]
    nodes = [],              // [{ id, type, label, pos, dynamicInputs, dynamicOutputs, topLevelData, inspectorValues }]
    variableBindings = [],   // [{ nodeId, portId, varName, modifier: { label, value } }]
    connections = [],        // [{ source, sourceHandle, target, targetHandle, modifier: { operation, value, isNumber } }]
    expectedLog,             // Log pesan yang diharapkan
    expectedSource = 'Notification',
  }) {
    let stage = 'GRAPH_BUILD';
    let previewPopup = null;

    try {
      // ---------------------------------------------------------------------
      // TAHAP 1: PREPARASI GRAPH & VARIABEL
      // ---------------------------------------------------------------------
      stage = 'GRAPH_BUILD';
      await this.nodeGraphCrud.openGraphForEntity({ entityName, scriptName });

      // 1.1 Inisialisasi Variabel
      for (const v of variables) {
        if (v.type === 'list' || v.type === 'map') {
          await this.variableCrud.createVariable({
            name: v.name,
            type: v.type,
            isExposed: v.isExposed || false,
            scope: v.scope || 'Local'
          });
          if (v.rawJson) {
            await this.variableCrud.updateRawJson(v.name, v.rawJson, this.popup, v.scope || 'Local');
          }
        } else {
          await this.variableCrud.createVariable({
            name: v.name,
            type: v.type,
            value: v.value,
            isExposed: v.isExposed || false,
            scope: v.scope || 'Local',
          });
        }
      }

      // 1.2 Spawn Nodes & Konfigurasi Parameters
      const spawnedMap = {};
      for (const n of nodes) {
        const nodeId = await this.nodeGraphCrud.spawnDirect(
          n.type,
          n.label || n.type,
          n.pos || { x: 100, y: 100 }
        );
        spawnedMap[n.id] = nodeId;

        const hasInspectorChanges = n.dynamicInputs || n.dynamicOutputs || n.topLevelData || n.inspectorValues;
        if (hasInspectorChanges) {
          await this.nodeGraph.selectNodeById(nodeId);

          // Tambah Port Dinamis jika didefinisikan
          if (n.dynamicInputs) {
            const inputs = Array.isArray(n.dynamicInputs) ? n.dynamicInputs : [n.dynamicInputs];
            for (const prop of inputs) {
              await this.nodeInspectorCrud.addDynamicInputPort(typeof prop === 'string' ? prop : null);
            }
          }

          if (n.dynamicOutputs) {
            const outputs = Array.isArray(n.dynamicOutputs) ? n.dynamicOutputs : [n.dynamicOutputs];
            for (const prop of outputs) {
              await this.nodeInspectorCrud.addDynamicOutputPort(typeof prop === 'string' ? prop : null);
            }
          }

          // Top-level Node Data
          if (n.topLevelData) {
            for (const [key, cfg] of Object.entries(n.topLevelData)) {
              await this.nodeInspectorCrud.setTopLevelData(key, cfg.value ?? cfg, cfg.type || 'text');
            }
          }

          // Nilai Parameter Port
          if (n.inspectorValues) {
            for (const [portId, cfg] of Object.entries(n.inspectorValues)) {
              await this.nodeInspectorCrud.setDirectValue(portId, cfg.value, cfg.type);
            }
          }
        }
      }

      // 1.3 Binding Variabel (Node-level maupun Port-level)
      for (const binding of variableBindings) {
        const nodeId = spawnedMap[binding.nodeId];
        await this.nodeGraph.selectNodeById(nodeId);

        if (binding.portId) {
          // Binding langsung ke Port input node reguler
          await this.nodeInspectorCrud.bindVariableToPort(binding.portId, binding.varName);
          if (binding.modifier) {
            await this.nodeInspectorCrud.applyVariableModifier(
              binding.portId,
              binding.modifier.label || binding.modifier.type,
              binding.modifier.value
            );
          }
        } else {
          // Node Variable Get / Set
          await this.nodeInspectorCrud.selectVariableForNode(binding.varName);
        }
      }

      // 1.4 Hubungkan Edge & Terapkan Modifier Edge (Jika Ada)
      for (const conn of connections) {
        const sourceId = spawnedMap[conn.source];
        const targetId = spawnedMap[conn.target];
        const edgeId = await this.nodeGraphCrud.connectDirect(
          sourceId,
          conn.sourceHandle,
          targetId,
          conn.targetHandle
        );

        if (conn.modifier) {
          await this.nodeGraph.selectEdgeById(edgeId);
          await this.nodeInspectorCrud.configureEdgeModifier(
            conn.modifier.operation || conn.modifier.type,
            conn.modifier.value,
            conn.modifier.isNumber ?? (typeof conn.modifier.value === 'number')
          );
        }
      }

      await this.nodeGraphCrud.saveGraphState();

      // ---------------------------------------------------------------------
      // TAHAP 2: BOOT ENGINE PREVIEW
      // ---------------------------------------------------------------------
      stage = 'PREVIEW_BOOT';
      await this.previewPage.startLogCapture();
      previewPopup = await this.previewPage.openPreview();
      await this.previewPage.expectEngineReady(previewPopup);

      // ---------------------------------------------------------------------
      // TAHAP 3: EVALUASI LOGIKA RUNTIME (UNIT ASSERTION)
      // ---------------------------------------------------------------------
      stage = 'LOGIC_EVALUATION';
      await this.previewPage.expectLog(expectedLog, expectedSource);

    } catch (error) {
      if (stage === 'GRAPH_BUILD') {
        throw new Error(`[LAYOUT / GRAPH CONFIG ERROR] Gagal menyusun Canvas/Node/Edge/Variable pada [${testName}]: ${error.message}`);
      } else if (stage === 'PREVIEW_BOOT') {
        throw new Error(`[ENGINE / PREVIEW BOOT ERROR] Preview Popup atau Canvas WebGL gagal memuat pada [${testName}]: ${error.message}`);
      } else if (stage === 'LOGIC_EVALUATION') {
        throw new Error(`[BLUEPRINT LOGIC VALUE ERROR] Output evaluasi logika Blueprint tidak sesuai pada [${testName}]: Ekspektasi "${expectedLog}". Detail: ${error.message}`);
      }
      throw error;
    } finally {
      // Menjamin popup preview selalu ditutup meskipun assertion gagal
      if (previewPopup && !previewPopup.isClosed()) {
        await previewPopup.close();
      }
    }
  }
}