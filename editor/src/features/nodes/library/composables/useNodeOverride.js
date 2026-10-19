import { findBlueprintByType } from '../blueprints/index.js';
import { createScriptNode, createScriptPort } from '@scripts/scripts.js';
import { useScriptStore } from '@scripts/scripts.js';
import { useConfirm, usePopAlert } from '@composables/composables.js';
import { useScriptHistory } from '@historys/historys.js';
import { useProjectStore } from '@projects/projects.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { getPortColor } from '../../contract/portTypes.js';

export function normalizeDataType(dataType) {
  const t = String(dataType || 'any').trim().toLowerCase();
  if (t === 'int' || t === 'float') return 'number';
  if (t === 'bool') return 'boolean';
  return t;
}

export function arePortTypesCompatible(typeA, typeB) {
  const a = normalizeDataType(typeA);
  const b = normalizeDataType(typeB);
  if (a === 'execution' || b === 'execution') {
    return a === 'execution' && b === 'execution';
  }
  if (a === 'any' || b === 'any') return true;
  return a === b;
}

export function getDefaultValueByDataType(dataType) {
  const type = normalizeDataType(dataType);
  if (type === 'number') return 0;
  if (type === 'boolean') return false;
  return '';
}

export function findVariableDefinition(varId, script) {
  if (!varId) return null;

  // 1. Check local variables of the script being overridden
  if (script && Array.isArray(script.localVariables)) {
    const found = script.localVariables.find(v => v.id === varId);
    if (found) return { ...found, scope: 'Local' };
  }

  // 2. Check scriptStore activeScript or scripts
  try {
    const scriptStore = useScriptStore();
    if (scriptStore?.activeScript?.localVariables) {
      const found = scriptStore.activeScript.localVariables.find(v => v.id === varId);
      if (found) return { ...found, scope: 'Local' };
    }
    if (Array.isArray(scriptStore?.scripts)) {
      for (const s of scriptStore.scripts) {
        if (Array.isArray(s.localVariables)) {
          const found = s.localVariables.find(v => v.id === varId);
          if (found) return { ...found, scope: 'Local' };
        }
      }
    }
  } catch {
    // Non-fatal if store is outside pinia context
  }

  // 3. Check global variables in projectStore
  try {
    const projectStore = useProjectStore();
    const globals = projectStore?.project?.globalVariables || projectStore?.activeProject?.globalVariables || [];
    const found = globals.find(v => v.id === varId);
    if (found) return { ...found, scope: 'Global' };
  } catch {
    // Non-fatal
  }

  return null;
}

export function overrideVariableNode(node, script, defaultData) {
  const isGet = node.type === 'variableGet' || node.type === 'variable_get';
  const varId = node.data?.variableId;
  const foundVar = findVariableDefinition(varId, script);

  const varName = foundVar?.name || node.data?.variableName || (node.outputs?.[0]?.label) || (node.inputs?.find(p => p.id === 'value')?.label) || 'Variable';
  const scope = foundVar?.scope || node.data?.scope || 'Local';
  const rawType = foundVar?.type || node.outputs?.[0]?.dataType || node.inputs?.find(p => p.id === 'value')?.dataType || 'any';
  const varType = normalizeDataType(rawType);
  const varColor = getPortColor(varType);

  const getMethod = scope === 'Global' ? 'getGlobal' : 'getLocal';
  const setMethod = scope === 'Global' ? 'setGlobal' : 'setLocal';

  const title = isGet ? `Get ${varName}` : `Set ${varName}`;
  if (!node.settings) node.settings = {};
  node.settings.headerTitle = title;
  node.settings.headerColor = varColor;
  node.settings.category = 'Variable';
  node.label = title;

  // Preserve node values, modifiers, bindings, modes
  const oldValues = (node.data && node.data.values) ? { ...node.data.values } : {};
  const preservedModifiers = node.data?.variableModifiers ? { ...node.data.variableModifiers } : {};
  const preservedBindings = node.data?.variableBindings ? { ...node.data.variableBindings } : {};
  const preservedModes = node.data?.valueModes ? { ...node.data.valueModes } : {};

  // Preserve existing inputs/outputs structure
  if (isGet) {
    node.inputs = [];
    node.outputs = [
      { id: 'value', label: varName, dataType: varType, color: varColor, enabled: true, defaultValue: null }
    ];
    node.data = {
      ...(defaultData.data || {}),
      ...(node.data || {}),
      scope,
      variableId: varId || node.data?.variableId || null,
      variableName: varName,
      values: oldValues,
      variableModifiers: preservedModifiers,
      variableBindings: preservedBindings,
      valueModes: preservedModes,
      code: `outputs.value = context.${getMethod}('${varName}');\nreturn;`
    };
  } else {
    node.inputs = [
      { id: 'execIn', dataType: 'execution', color: '#FFFFFF', enabled: true },
      { id: 'value', label: varName, dataType: varType, color: varColor, enabled: true, defaultValue: oldValues.value ?? null }
    ];
    node.outputs = [
      { id: 'execOut', dataType: 'execution', color: '#FFFFFF', enabled: true },
      { id: 'valueOut', label: varName, dataType: varType, color: varColor, enabled: true }
    ];
    node.data = {
      ...(defaultData.data || {}),
      ...(node.data || {}),
      scope,
      variableId: varId || node.data?.variableId || null,
      variableName: varName,
      values: oldValues,
      variableModifiers: preservedModifiers,
      variableBindings: preservedBindings,
      valueModes: preservedModes,
      code: `const val = inputs.value;\ncontext.${setMethod}('${varName}', val);\noutputs.valueOut = val;\noutputs.execOut = true;\nreturn;`
    };
  }

  // Preserve valid port IDs for edge pruning
  const validInIds = new Set(node.inputs.map(p => p.id));
  const validOutIds = new Set(node.outputs.map(p => p.id));

  if (script && Array.isArray(script.edges)) {
    script.edges = script.edges.filter(edge => {
      if (edge.target === node.id) {
        return validInIds.has(edge.targetHandle);
      }
      if (edge.source === node.id) {
        return validOutIds.has(edge.sourceHandle);
      }
      return true;
    });
  }

  return { success: true, node };
}

/**
 * Reconciles and overrides a single node based on its latest blueprint definition.
 * - Preserves existing values for ports that exist in the new blueprint with compatible data type.
 * - Preserves dynamic ports (sequential, switch cases, dynamic properties, etc.) and their connections.
 * - Preserves variable nodes (variableGet, variableSet) with their bound variables, types, codes, and connections.
 * - Preserves variableModifiers, variableBindings, and valueModes on node inputs.
 * - Preserves edge connections (and edge modifiers) for compatible ports.
 * - Adds new ports with template default values.
 * - Resets code to blueprint default code (except variable nodes).
 * - Disconnects edges for ports whose dataType is genuinely incompatible or was removed.
 */
export function overrideNodeFromBlueprint(node, script) {
  if (!node || !node.type) return { success: false, reason: 'invalid_node' };

  const blueprint = findBlueprintByType(node.type);
  if (!blueprint) return { success: false, reason: 'blueprint_not_found' };

  const defaultData = blueprint.defaultData || {};

  const isVarNode = ['variableGet', 'variable_get', 'variableSet', 'variable_set'].includes(node.type);
  if (isVarNode) {
    return overrideVariableNode(node, script, defaultData);
  }

  // 1. Prepare raw inputs/outputs from blueprint
  const rawInputs = Array.isArray(defaultData.inputs) ? defaultData.inputs : [];
  const rawOutputs = Array.isArray(defaultData.outputs) ? defaultData.outputs : [];

  const templateInputIds = new Set(rawInputs.map(p => p.id));
  const templateOutputIds = new Set(rawOutputs.map(p => p.id));

  const oldInputs = Array.isArray(node.inputs) ? node.inputs : [];
  const oldOutputs = Array.isArray(node.outputs) ? node.outputs : [];

  const supportsDynamic = (node.dynamicMode && node.dynamicMode !== 'none') ||
    (blueprint.dynamicMode && blueprint.dynamicMode !== 'none') ||
    Boolean(node.data?.cases) ||
    Boolean(node.data?.propertyOptions);

  // Template inputs with updated blueprint defaults, preserving compatible custom labels/types
  const templateInputs = rawInputs.map(portDef => {
    const oldPort = oldInputs.find(p => p.id === portDef.id);
    const basePort = createScriptPort(portDef);
    return {
      ...portDef,
      ...basePort,
      label: oldPort?.label || portDef.label,
      dataType: portDef.dataType || (oldPort ? oldPort.dataType : basePort.dataType)
    };
  });

  // Preserve dynamic inputs that were added to the node
  const preservedDynamicInputs = supportsDynamic
    ? oldInputs.filter(p => !templateInputIds.has(p.id))
    : [];

  const newInputs = [...templateInputs, ...preservedDynamicInputs];

  // Template outputs
  const templateOutputs = rawOutputs.map(portDef => {
    const oldPort = oldOutputs.find(p => p.id === portDef.id);
    const basePort = createScriptPort(portDef);
    return {
      ...portDef,
      ...basePort,
      label: oldPort?.label || portDef.label,
      dataType: portDef.dataType || (oldPort ? oldPort.dataType : basePort.dataType)
    };
  });

  // Preserve dynamic outputs
  const preservedDynamicOutputs = supportsDynamic
    ? oldOutputs.filter(p => !templateOutputIds.has(p.id))
    : [];

  const newOutputs = [...templateOutputs, ...preservedDynamicOutputs];

  // 2. Identify ports with matching ID AND compatible dataType
  const preservedInputPortIds = new Set();
  newInputs.forEach(newPort => {
    const oldPort = oldInputs.find(p => p.id === newPort.id);
    if (!templateInputIds.has(newPort.id)) {
      // Dynamic port that was preserved
      preservedInputPortIds.add(newPort.id);
    } else if (oldPort && arePortTypesCompatible(oldPort.dataType, newPort.dataType)) {
      preservedInputPortIds.add(newPort.id);
    }
  });

  const preservedOutputPortIds = new Set();
  newOutputs.forEach(newPort => {
    const oldPort = oldOutputs.find(p => p.id === newPort.id);
    if (!templateOutputIds.has(newPort.id)) {
      // Dynamic port that was preserved
      preservedOutputPortIds.add(newPort.id);
    } else if (oldPort && arePortTypesCompatible(oldPort.dataType, newPort.dataType)) {
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
  node.inputs = newInputs;
  node.outputs = newOutputs;

  // 5. Reconcile node values
  const oldValues = (node.data && node.data.values) ? { ...node.data.values } : {};
  const blueprintDefaultValues = (defaultData.data && defaultData.data.values) ? defaultData.data.values : {};
  const newValues = {};

  newInputs.forEach(port => {
    const dType = normalizeDataType(port.dataType);
    if (dType !== 'execution') {
      const oldPort = oldInputs.find(p => p.id === port.id);
      const isCompatible = oldPort ? arePortTypesCompatible(oldPort.dataType, port.dataType) : true;

      if (oldValues[port.id] !== undefined && isCompatible) {
        newValues[port.id] = oldValues[port.id];
      } else {
        newValues[port.id] = port.defaultValue !== undefined
          ? port.defaultValue
          : (blueprintDefaultValues[port.id] !== undefined
              ? blueprintDefaultValues[port.id]
              : getDefaultValueByDataType(port.dataType));
      }
    }
  });

  // Retain extra keys from oldValues and blueprintDefaultValues
  Object.keys(oldValues).forEach(key => {
    if (newValues[key] === undefined) {
      newValues[key] = oldValues[key];
    }
  });
  Object.keys(blueprintDefaultValues).forEach(key => {
    if (newValues[key] === undefined) {
      newValues[key] = blueprintDefaultValues[key];
    }
  });

  // 6. Preserve and clean up variableModifiers, variableBindings, valueModes
  const preservedModifiers = node.data?.variableModifiers ? { ...node.data.variableModifiers } : {};
  const preservedBindings = node.data?.variableBindings ? { ...node.data.variableBindings } : {};
  const preservedModes = node.data?.valueModes ? { ...node.data.valueModes } : {};
  const preservedCases = node.data?.cases ? [...node.data.cases] : undefined;
  const preservedBranches = node.data?.branches ? JSON.parse(JSON.stringify(node.data.branches)) : undefined;
  const preservedPropertyOptions = node.data?.propertyOptions ? [...node.data.propertyOptions] : undefined;

  const validPortIdSet = new Set(newInputs.map(p => p.id));
  Object.keys(preservedModifiers).forEach(pId => {
    if (!validPortIdSet.has(pId)) delete preservedModifiers[pId];
  });
  Object.keys(preservedBindings).forEach(pId => {
    if (!validPortIdSet.has(pId)) delete preservedBindings[pId];
  });
  Object.keys(preservedModes).forEach(pId => {
    if (!validPortIdSet.has(pId)) delete preservedModes[pId];
  });

  // 7. Reset code to blueprint and sync template data
  const templateData = defaultData.data ? JSON.parse(JSON.stringify(defaultData.data)) : {};
  node.data = {
    ...templateData,
    ...(node.data || {}),
    values: newValues,
    variableModifiers: preservedModifiers,
    variableBindings: preservedBindings,
    valueModes: preservedModes,
    code: templateData.code || 'return;'
  };

  if (preservedCases !== undefined) node.data.cases = preservedCases;
  if (preservedBranches !== undefined) node.data.branches = preservedBranches;
  if (preservedPropertyOptions !== undefined) node.data.propertyOptions = preservedPropertyOptions;
  if (templateData.options) {
    node.data.options = JSON.parse(JSON.stringify(templateData.options));
  }

  // 8. Sync settings, dynamicMode, role
  if (!node.settings) node.settings = {};
  node.settings.headerColor = defaultData.settings?.headerColor || node.settings.headerColor || '#3B82F6';
  node.settings.category = defaultData.settings?.category || node.settings.category || 'General';
  if (defaultData.settings?.visibleDataFields) {
    node.settings.visibleDataFields = [...defaultData.settings.visibleDataFields];
  }
  node.dynamicMode = blueprint.dynamicMode || node.dynamicMode || 'none';
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
 * Overrides all nodes across an array of scripts.
 * @param {Array} scripts - Array of script objects.
 * @returns {{ success: boolean, totalOverriddenNodes: number, affectedScriptsCount: number }}
 */
export function overrideAllProjectNodes(scripts) {
  if (!Array.isArray(scripts) || scripts.length === 0) {
    return { success: false, totalOverriddenNodes: 0, affectedScriptsCount: 0 };
  }

  let totalOverriddenNodes = 0;
  let affectedScriptsCount = 0;

  scripts.forEach(script => {
    if (script && Array.isArray(script.nodes) && script.nodes.length > 0) {
      const { success, count } = overrideAllScriptNodes(script);
      if (success && count > 0) {
        totalOverriddenNodes += count;
        affectedScriptsCount++;
      }
    }
  });

  return { success: true, totalOverriddenNodes, affectedScriptsCount };
}

/**
 * Composable for UI interactions (dialog confirmation, toast, store syncing).
 */
export function useNodeOverride() {
  const scriptStore = useScriptStore();
  const scriptHistory = useScriptHistory();
  const projectStore = useProjectStore();
  const { confirm } = useConfirm();
  const { showPop } = usePopAlert();

  const triggerOverrideAllNodes = async () => {
    const scripts = Array.isArray(scriptStore.scripts) && scriptStore.scripts.length > 0
      ? scriptStore.scripts
      : (scriptStore.activeScript ? [scriptStore.activeScript] : []);

    if (!scripts || scripts.length === 0) {
      showPop({
        title: 'Override Nodes',
        message: 'No scripts found in the current project.',
        type: 'info'
      });
      return false;
    }

    const totalNodesInProject = scripts.reduce((acc, s) => {
      return acc + (Array.isArray(s.nodes) ? s.nodes.length : 0);
    }, 0);

    if (totalNodesInProject === 0) {
      showPop({
        title: 'Override Nodes',
        message: 'No nodes found in any script of the current project.',
        type: 'info'
      });
      return false;
    }

    const isConfirmed = await confirm({
      title: 'Override Project Nodes',
      message: `This action will override all nodes across all scripts (${scripts.length} script(s)) in the current project based on the latest blueprint definitions.\n\nMatching input values will be preserved, incompatible port connections will be severed, and node codes will be reset. Proceed?`,
      confirmText: 'Override',
      cancelText: 'Cancel',
      type: 'warning'
    });

    if (!isConfirmed) return false;

    // If an active script is currently open in canvas, flush its current state first
    if (scriptStore.activeScript && typeof scriptStore.saveActiveScript === 'function') {
      scriptStore.saveActiveScript();
    }

    let totalOverridden = 0;
    let affectedScriptsCount = 0;
    let activeOldNodes = null;
    let activeOldEdges = null;
    let activeNewNodes = null;
    let activeNewEdges = null;
    let activeCount = 0;

    scripts.forEach(script => {
      if (!script || !Array.isArray(script.nodes) || script.nodes.length === 0) return;

      const isActiveScript = scriptStore.activeScript && scriptStore.activeScript.id === script.id;
      if (isActiveScript) {
        activeOldNodes = JSON.parse(JSON.stringify(scriptStore.activeScript.nodes));
        activeOldEdges = JSON.parse(JSON.stringify(scriptStore.activeScript.edges));
      }

      const { success, count } = overrideAllScriptNodes(script);
      if (success && count > 0) {
        totalOverridden += count;
        affectedScriptsCount++;
      }

      if (isActiveScript) {
        scriptStore.activeScript.nodes = JSON.parse(JSON.stringify(script.nodes));
        scriptStore.activeScript.edges = JSON.parse(JSON.stringify(script.edges));
        activeNewNodes = JSON.parse(JSON.stringify(scriptStore.activeScript.nodes));
        activeNewEdges = JSON.parse(JSON.stringify(scriptStore.activeScript.edges));
        activeCount = count;
      }
    });

    if (scriptStore.activeScript && activeOldNodes && scriptHistory?.recordOverrideNodes) {
      scriptHistory.recordOverrideNodes(
        activeOldNodes,
        activeOldEdges,
        activeNewNodes,
        activeNewEdges,
        `Override ${activeCount} node(s)`
      );
    }

    if (scriptStore.activeScript && typeof scriptStore.saveActiveScript === 'function') {
      scriptStore.saveActiveScript();
    }

    projectStore.markAsDirty();

    try {
      const workspaceStore = useWorkspaceStore();
      if (workspaceStore.activeProjectId && typeof scriptStore.syncAllScriptsToOPFS === 'function') {
        await scriptStore.syncAllScriptsToOPFS();
      }
    } catch {
      // Non-fatal if OPFS sync is not directly available; projectStore is marked dirty
    }

    showPop({
      title: 'Nodes Overridden',
      message: `Successfully overridden ${totalOverridden} node(s) across ${affectedScriptsCount} script(s) based on the latest blueprint definitions.`,
      type: 'success'
    });

    return true;
  };

  return {
    overrideNodeFromBlueprint,
    resetNodeToDefault,
    overrideAllScriptNodes,
    overrideAllProjectNodes,
    triggerOverrideAllNodes
  };
}
