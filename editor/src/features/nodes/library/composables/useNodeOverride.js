import { findBlueprintByType } from '../blueprints/index.js';
import { createScriptNode, createScriptPort } from '@scripts/scripts.js';
import { useScriptStore } from '@scripts/scripts.js';
import { useConfirm, usePopAlert } from '@composables/composables.js';
import { useScriptHistory } from '@historys/historys.js';

export function getDefaultValueByDataType(dataType) {
  const type = String(dataType || '').toLowerCase();
  if (type === 'number' || type === 'float' || type === 'int') return 0;
  if (type === 'boolean' || type === 'bool') return false;
  return '';
}

/**
 * Reconciles and overrides a single node based on its latest blueprint definition.
 * - Preserves existing values for ports that exist in the new blueprint with the same data type.
 * - Adds new ports with template default values.
 * - Resets code to blueprint default code.
 * - Preserves edge connections for ports where ID and dataType still match.
 * - Disconnects edges for ports whose dataType changed or are no longer in the blueprint.
 */
export function overrideNodeFromBlueprint(node, script) {
  if (!node || !node.type) return { success: false, reason: 'invalid_node' };

  const blueprint = findBlueprintByType(node.type);
  if (!blueprint) return { success: false, reason: 'blueprint_not_found' };

  const defaultData = blueprint.defaultData || {};

  // 1. Prepare new template inputs and outputs
  const rawInputs = Array.isArray(defaultData.inputs) ? defaultData.inputs : [];
  const rawOutputs = Array.isArray(defaultData.outputs) ? defaultData.outputs : [];

  const templateInputs = rawInputs.map(portDef => ({
    ...portDef,
    ...createScriptPort(portDef)
  }));

  const templateOutputs = rawOutputs.map(portDef => ({
    ...portDef,
    ...createScriptPort(portDef)
  }));

  // 2. Identify ports with matching ID AND dataType
  const preservedInputPortIds = new Set();
  const oldInputs = Array.isArray(node.inputs) ? node.inputs : [];
  templateInputs.forEach(newPort => {
    const oldPort = oldInputs.find(p => p.id === newPort.id);
    if (oldPort && oldPort.dataType === newPort.dataType) {
      preservedInputPortIds.add(newPort.id);
    }
  });

  const preservedOutputPortIds = new Set();
  const oldOutputs = Array.isArray(node.outputs) ? node.outputs : [];
  templateOutputs.forEach(newPort => {
    const oldPort = oldOutputs.find(p => p.id === newPort.id);
    if (oldPort && oldPort.dataType === newPort.dataType) {
      preservedOutputPortIds.add(newPort.id);
    }
  });

  // 3. Sever edges for disconnected / changed / removed ports
  if (script && Array.isArray(script.edges)) {
    script.edges = script.edges.filter(edge => {
      if (edge.target === node.id) {
        return preservedInputPortIds.has(edge.targetHandle);
      }
      if (edge.source === node.id) {
        return preservedOutputPortIds.has(edge.sourceHandle);
      }
      return true;
    });
  }

  // 4. Update inputs and outputs
  node.inputs = templateInputs;
  node.outputs = templateOutputs;

  // 5. Reconcile node values
  const oldValues = (node.data && node.data.values) ? { ...node.data.values } : {};
  const blueprintDefaultValues = (defaultData.data && defaultData.data.values) ? defaultData.data.values : {};
  const newValues = {};

  templateInputs.forEach(port => {
    const dType = String(port.dataType || '').toLowerCase();
    if (dType !== 'execution') {
      const oldPort = oldInputs.find(p => p.id === port.id);
      // If port existed and has the same dataType, keep old value
      if (oldPort && oldPort.dataType === port.dataType && oldValues[port.id] !== undefined) {
        newValues[port.id] = oldValues[port.id];
      } else if (oldValues[port.id] !== undefined && !oldPort) {
        // Value existed under this key
        newValues[port.id] = oldValues[port.id];
      } else {
        // Fall back to blueprint template default value
        newValues[port.id] = port.defaultValue !== undefined
          ? port.defaultValue
          : (blueprintDefaultValues[port.id] !== undefined
              ? blueprintDefaultValues[port.id]
              : getDefaultValueByDataType(port.dataType));
      }
    }
  });

  // Also retain any extra keys in blueprintDefaultValues that are not explicit input ports
  Object.keys(blueprintDefaultValues).forEach(key => {
    if (newValues[key] === undefined) {
      newValues[key] = oldValues[key] !== undefined ? oldValues[key] : blueprintDefaultValues[key];
    }
  });

  // 6. Reset code to blueprint and sync template data
  const templateData = defaultData.data ? JSON.parse(JSON.stringify(defaultData.data)) : {};
  node.data = {
    ...templateData,
    ...(node.data || {}),
    values: newValues,
    code: templateData.code || 'return;'
  };
  if (templateData.options) {
    node.data.options = JSON.parse(JSON.stringify(templateData.options));
  }

  // 7. Sync settings, dynamicMode, role
  if (!node.settings) node.settings = {};
  node.settings.headerColor = defaultData.settings?.headerColor || node.settings.headerColor || '#3B82F6';
  node.settings.category = defaultData.settings?.category || node.settings.category || 'General';
  if (defaultData.settings?.visibleDataFields) {
    node.settings.visibleDataFields = [...defaultData.settings.visibleDataFields];
  }
  node.dynamicMode = blueprint.dynamicMode || 'none';
  node.role = defaultData.role || blueprint.role || node.role;

  return { success: true, node };
}

/**
 * Resets a single node to default template:
 * - Keeps id and position
 * - Resets all ports, values, data, code, settings to defaults
 * - Automatically disconnects all connected edges
 */
export function resetNodeToDefault(node, script) {
  if (!node || !node.type) return { success: false, reason: 'invalid_node' };

  const blueprint = findBlueprintByType(node.type);
  if (!blueprint) return { success: false, reason: 'blueprint_not_found' };

  const defaultData = blueprint.defaultData || {};
  const freshNode = createScriptNode({
    id: node.id,
    type: blueprint.type,
    role: defaultData.role || blueprint.role,
    dynamicMode: blueprint.dynamicMode || 'none',
    position: { x: node.position?.x ?? 0, y: node.position?.y ?? 0 },
    settings: {
      headerTitle: blueprint.label || 'Node',
      headerColor: defaultData.settings?.headerColor || '#3b82f6',
      ...defaultData.settings
    },
    inputs: defaultData.inputs,
    outputs: defaultData.outputs,
    data: defaultData.data ? JSON.parse(JSON.stringify(defaultData.data)) : {}
  });

  // Mutate node in place
  Object.keys(node).forEach(key => {
    if (key !== 'id' && key !== 'position') {
      delete node[key];
    }
  });
  Object.assign(node, freshNode);

  // Automatically disconnect all edges connected to this node
  if (script && Array.isArray(script.edges)) {
    script.edges = script.edges.filter(e => e.source !== node.id && e.target !== node.id);
  }

  return { success: true, node };
}

/**
 * Overrides all nodes in the given script graph.
 */
export function overrideAllScriptNodes(script) {
  if (!script || !Array.isArray(script.nodes)) return { success: false, count: 0 };

  let count = 0;
  script.nodes.forEach(node => {
    const res = overrideNodeFromBlueprint(node, script);
    if (res.success) {
      count++;
    }
  });

  return { success: true, count };
}

/**
 * Composable for UI interactions (dialog confirmation, toast, store syncing).
 */
export function useNodeOverride() {
  const scriptStore = useScriptStore();
  const scriptHistory = useScriptHistory();
  const { confirm } = useConfirm();
  const { showPop } = usePopAlert();

  const triggerOverrideAllNodes = async () => {
    const activeScript = scriptStore.activeScript;
    if (!activeScript) {
      showPop({
        title: 'Override Nodes',
        message: 'Tidak ada script yang sedang aktif di canvas.',
        type: 'info'
      });
      return false;
    }

    if (!activeScript.nodes || activeScript.nodes.length === 0) {
      showPop({
        title: 'Override Nodes',
        message: 'Tidak ada node di script yang sedang aktif.',
        type: 'info'
      });
      return false;
    }

    const isConfirmed = await confirm({
      title: 'Override Graph Nodes',
      message: 'Tindakan ini akan mengoverride seluruh node script di graph saat ini berdasarkan template blueprint terbaru. Nilai lama yang cocok tetap dipertahankan, port yang tidak cocok akan diputus, dan kode akan direset. Hal ini dapat mengakibatkan sistem tidak sesuai jika terdapat perubahan struktur blueprint. Lanjutkan?',
      confirmText: 'Override',
      cancelText: 'Batal',
      type: 'warning'
    });

    if (!isConfirmed) return false;

    const oldNodes = JSON.parse(JSON.stringify(activeScript.nodes));
    const oldEdges = JSON.parse(JSON.stringify(activeScript.edges));

    const { count } = overrideAllScriptNodes(activeScript);

    const newNodes = JSON.parse(JSON.stringify(activeScript.nodes));
    const newEdges = JSON.parse(JSON.stringify(activeScript.edges));

    if (scriptHistory?.recordOverrideNodes) {
      scriptHistory.recordOverrideNodes(oldNodes, oldEdges, newNodes, newEdges, `Override ${count} node(s)`);
    }

    scriptStore.saveActiveScript();

    showPop({
      title: 'Nodes Overridden',
      message: `Berhasil mengoverride ${count} node berdasarkan blueprint template terbaru.`,
      type: 'success'
    });

    return true;
  };

  return {
    overrideNodeFromBlueprint,
    resetNodeToDefault,
    overrideAllScriptNodes,
    triggerOverrideAllNodes
  };
}
