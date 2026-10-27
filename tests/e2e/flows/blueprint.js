import { test } from '@playwright/test';

/**
 * Builds a Blueprint graph through the editor, boots the game preview and asserts the
 * runtime log produced by the engine.
 *
 * The run is split into three named steps so the HTML report and the thrown error both
 * show which stage failed: graph build, preview boot or logic evaluation.
 */
export class BlueprintTestRunner {
  /**
   * @param {Object} fixtures Playwright fixtures
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

  /**
   * @param {Object} scenario
   * @param {string} scenario.testName Label used in step titles and error messages
   * @param {string} [scenario.entityName]
   * @param {string} [scenario.scriptName]
   * @param {Array} [scenario.variables]         [{ name, type, value, isExposed, scope, rawJson }]
   * @param {Array} [scenario.nodes]             [{ id, type, label, pos, dynamicInputs, dynamicOutputs, topLevelData, inspectorValues }]
   * @param {Array} [scenario.variableBindings]  [{ nodeId, portId, varName, modifier: { label, value } }]
   * @param {Array} [scenario.connections]       [{ source, sourceHandle, target, targetHandle, modifier: { operation, value, isNumber } }]
   * @param {string} scenario.expectedLog        Expected engine log message
   * @param {string} [scenario.expectedSource]   Expected engine log source
   */
  async runTest({
    testName,
    entityName = 'TestEntity',
    scriptName = 'TestScript',
    variables = [],
    nodes = [],
    variableBindings = [],
    connections = [],
    action, // Optional action callback in preview popup
    expectedLog,
    expectedSource = 'Notification',
  }) {
    let previewPopup = null;

    try {
      await this.#stage('GRAPH CONFIG', `Build graph [${testName}]`, testName, async () => {
        await this.nodeGraphCrud.openGraphForEntity({ entityName, scriptName });
        await this.#createVariables(variables);
        const spawnedMap = await this.#spawnNodes(nodes);
        await this.#bindVariables(variableBindings, spawnedMap);
        await this.#connectEdges(connections, spawnedMap);
        await this.nodeGraphCrud.saveGraphState();
      });

      await this.#stage('PREVIEW BOOT', `Boot preview [${testName}]`, testName, async () => {
        await this.previewPage.startLogCapture();
        previewPopup = await this.previewPage.openPreview();
        await this.previewPage.expectEngineReady(previewPopup);
        // Execute Playwright interaction if provided
        if (typeof action === 'function') {
          await action(previewPopup);
        }
      });

      await this.#stage('LOGIC VALUE', `Evaluate logic [${testName}] -> "${expectedLog}"`, testName, async () => {
        await this.previewPage.expectLog(expectedLog, expectedSource);
      });
    } finally {
      if (previewPopup && !previewPopup.isClosed()) {
        await previewPopup.close();
      }
    }
  }

  /** Runs one stage as a report step and labels any failure with the stage name (original error kept as cause). */
  async #stage(label, title, testName, body) {
    await test.step(title, async () => {
      try {
        await body();
      } catch (error) {
        throw new Error(`[${label} ERROR] [${testName}]: ${error.message}`, { cause: error });
      }
    });
  }

  async #createVariables(variables) {
    for (const variable of variables) {
      const scope = variable.scope || 'Local';
      const isExposed = variable.isExposed || false;
      const isCollection = variable.type === 'list' || variable.type === 'map';

      if (isCollection) {
        await this.variableCrud.createVariable({ name: variable.name, type: variable.type, isExposed, scope });
        if (variable.rawJson) {
          await this.variableCrud.updateRawJson(variable.name, variable.rawJson, this.popup, scope);
        }
      } else {
        await this.variableCrud.createVariable({
          name: variable.name,
          type: variable.type,
          value: variable.value,
          isExposed,
          scope,
        });
      }
    }
  }

  /** Spawns nodes, applies inspector-level configuration and returns a map of scenario id -> real node id. */
  async #spawnNodes(nodes) {
    const spawnedMap = {};

    for (const node of nodes) {
      const nodeId = await this.nodeGraphCrud.spawnDirect(
        node.type,
        node.label || node.type,
        node.pos || { x: 100, y: 100 },
      );
      spawnedMap[node.id] = nodeId;

      const hasInspectorChanges = node.dynamicInputs || node.dynamicOutputs || node.topLevelData || node.inspectorValues;
      if (!hasInspectorChanges) continue;

      await this.nodeGraph.selectNodeById(nodeId);

      for (const prop of [].concat(node.dynamicInputs ?? [])) {
        await this.nodeInspectorCrud.addDynamicInputPort(typeof prop === 'string' ? prop : null);
      }

      for (const prop of [].concat(node.dynamicOutputs ?? [])) {
        await this.nodeInspectorCrud.addDynamicOutputPort(typeof prop === 'string' ? prop : null);
      }

      for (const [key, cfg] of Object.entries(node.topLevelData ?? {})) {
        await this.nodeInspectorCrud.setTopLevelData(key, cfg.value ?? cfg, cfg.type || 'text');
      }

      for (const [portId, cfg] of Object.entries(node.inspectorValues ?? {})) {
        await this.nodeInspectorCrud.setDirectValue(portId, cfg.value, cfg.type);
      }
    }

    return spawnedMap;
  }

  async #bindVariables(variableBindings, spawnedMap) {
    for (const binding of variableBindings) {
      await this.nodeGraph.selectNodeById(spawnedMap[binding.nodeId]);

      if (binding.portId) {
        // Bind directly to the input port of a regular node
        await this.nodeInspectorCrud.bindVariableToPort(binding.portId, binding.varName);
        if (binding.modifier) {
          await this.nodeInspectorCrud.applyVariableModifier(
            binding.portId,
            binding.modifier.label || binding.modifier.type,
            binding.modifier.value,
          );
        }
      } else {
        // Variable Get / Set node
        await this.nodeInspectorCrud.selectVariableForNode(binding.varName);
      }
    }
  }

  async #connectEdges(connections, spawnedMap) {
    for (const conn of connections) {
      const edgeId = await this.nodeGraphCrud.connectDirect(
        spawnedMap[conn.source],
        conn.sourceHandle,
        spawnedMap[conn.target],
        conn.targetHandle,
      );

      if (conn.modifier) {
        await this.nodeGraph.selectEdgeById(edgeId);
        await this.nodeInspectorCrud.configureEdgeModifier(
          conn.modifier.operation || conn.modifier.type,
          conn.modifier.value,
          conn.modifier.isNumber ?? typeof conn.modifier.value === 'number',
        );
      }
    }
  }
}
