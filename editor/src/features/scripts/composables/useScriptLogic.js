import { ref, computed } from 'vue';
import { useScriptStore, useScriptActions } from '@scripts/scripts.js';
import { useFolderStore, useFolderActions } from '@folders/folders.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { getNodeRole } from '@nodes/inspector/composables/useNodeLogic.js';
import { isValidPortId } from '@nodes/inspector/composables/useDynamicPortManager.js';
import { isTypeCompatible } from '@nodes/graph/composables/useGraphEditor.js';

export function useScriptLogic() {
  let scriptStore = null;
  let folderStore = null;
  let workspaceStore = null;
  let createScript = () => {}, renameScript = () => {}, duplicateScript = () => {}, deleteScript = () => {};
  let duplicateFolder = () => {};

  try {
    scriptStore = useScriptStore();
    folderStore = useFolderStore();
    workspaceStore = useWorkspaceStore();
    const scriptActions = useScriptActions();
    createScript = scriptActions.createScript;
    renameScript = scriptActions.renameScript;
    duplicateScript = scriptActions.duplicateScript;
    deleteScript = scriptActions.deleteScript;
    duplicateFolder = useFolderActions().duplicateFolder;
  } catch (_) {
    // Allows useScriptLogic to be called in isolated contexts without Pinia active
  }

  // --- Type coercion utilities ---
  const coerceValueByDataType = (val, dataType) => {
    const type = String(dataType || 'any').toLowerCase();

    switch (type) {
      case 'number': {
        if (val === null || val === undefined || val === '') return 0;
        const num = Number(val);
        return isNaN(num) ? 0 : num;
      }
      case 'boolean': {
        if (typeof val === 'boolean') return val;
        if (val === 'true' || val === 1 || val === '1') return true;
        if (val === 'false' || val === 0 || val === '0') return false;
        return Boolean(val);
      }
      case 'string': {
        if (val === null || val === undefined) return '';
        return String(val);
      }
      case 'list': {
        if (Array.isArray(val)) return [...val];
        if (typeof val === 'string' && val.trim().startsWith('[') && val.trim().endsWith(']')) {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed;
          } catch (_) {}
        }
        return val !== null && val !== undefined && val !== '' ? [val] : [];
      }
      case 'map': {
        if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
          return { ...val };
        }
        if (typeof val === 'string' && val.trim().startsWith('{') && val.trim().endsWith('}')) {
          try {
            const parsed = JSON.parse(val);
            if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
              return parsed;
            }
          } catch (_) {}
        }
        return {};
      }
      case 'any':
      default:
        return val;
    }
  };

  const coercePortValue = (port, val) => {
    return coerceValueByDataType(val, port?.dataType);
  };

  // --- Script normalization utilities ---
  const LEGACY_PORT_MAP = {
    exec_in: 'execIn',
    execin: 'execIn',
    exec_out: 'execOut',
    execout: 'execOut',
    target_in: 'targetEntity',
    in_target: 'targetEntity',
    ptr_click_main: 'onClick',
    sk_main: 'execOut',
    out: 'completed',
    cond_0: 'condition',
    dt: 'deltaTime'
  };

  const normalizePort = (port) => {
    const normId = LEGACY_PORT_MAP[port.id] || port.id;
    const normalized = {
      id: normId,
      dataType: port.dataType || 'any',
      color: port.color || '#555',
      enabled: port.enabled ?? true
    };
    if (port.defaultValue !== undefined) {
      normalized.defaultValue = coercePortValue(normalized, port.defaultValue);
    }
    return normalized;
  };

  const normalizeScript = (script) => {
    if (!script || typeof script !== 'object') {
      return { id: 'empty', variables: [], nodes: [], edges: [] };
    }

    const normalized = {
      id: script.id || 'script_' + Date.now(),
      scriptId: script.scriptId || 'script_' + Date.now(),
      variables: Array.isArray(script.variables || script.localVariables) 
        ? (script.variables || script.localVariables).map(v => ({
            id: v.id,
            name: v.name,
            type: v.type || 'number',
            isExposed: Boolean(v.isExposed),
            defaultValue: v.defaultValue ?? 0
          }))
        : [],
      nodes: [],
      edges: []
    };

    const rawNodes = Array.isArray(script.nodes) ? script.nodes : [];
    normalized.nodes = rawNodes.map(node => {
      const rawInputs = Array.isArray(node.inputs) ? node.inputs : [];
      const rawOutputs = Array.isArray(node.outputs) ? node.outputs : [];

      const inputs = rawInputs.map(normalizePort);
      const outputs = rawOutputs.map(normalizePort);

      const safeData = node.data ? JSON.parse(JSON.stringify(node.data)) : {};
      const values = {};

      inputs.forEach(port => {
        if (port.dataType === 'execution') return;
        const portId = port.id;
        let rawVal = safeData.values?.[portId];
        if (rawVal === undefined && port.defaultValue !== undefined) {
          rawVal = port.defaultValue;
        }
        values[portId] = coercePortValue(port, rawVal);
      });

      safeData.values = values;

      return {
        id: node.id,
        type: node.type || 'unknownNode',
        role: getNodeRole({ inputs, outputs, role: node.role }),
        dynamicMode: node.dynamicMode || 'none',
        position: {
          x: node.position?.x ?? 0,
          y: node.position?.y ?? 0
        },
        settings: { ...(node.settings || {}) },
        inputs,
        outputs,
        data: safeData
      };
    });

    const rawEdges = Array.isArray(script.edges) ? script.edges : [];
    normalized.edges = rawEdges.map(edge => ({
      id: edge.id,
      source: edge.source,
      sourceHandle: LEGACY_PORT_MAP[edge.sourceHandle] || edge.sourceHandle,
      target: edge.target,
      targetHandle: LEGACY_PORT_MAP[edge.targetHandle] || edge.targetHandle,
      modifier: edge.modifier ? { ...edge.modifier } : (edge.modifier || null)
    }));

    return normalized;
  };

  // --- Script validation utilities ---
  const validateScript = (script, options = {}) => {
    const errors = [];
    if (!script || typeof script !== 'object') {
      return {
        isValid: false,
        errors: [{ message: 'Script is not a valid object' }]
      };
    }

    const nodes = Array.isArray(script.nodes) ? script.nodes : [];
    const edges = Array.isArray(script.edges) ? script.edges : [];
    const variables = Array.isArray(script.variables || script.localVariables) ? (script.variables || script.localVariables) : [];
    const globals = Array.isArray(options.globalVariables) ? options.globalVariables : [];

    const nodeMap = new Map();
    const variableIdSet = new Set(variables.map(v => v.id));
    const variableNameSet = new Set(variables.map(v => v.name));
    const globalIdSet = new Set(globals.map(g => g.id));
    const globalNameSet = new Set(globals.map(g => g.name));

    nodes.forEach(node => {
      if (!node.id) {
        errors.push({ message: 'Found node without ID' });
        return;
      }
      nodeMap.set(node.id, node);

      const portIdsSeen = new Set();
      const allPorts = [...(node.inputs || []), ...(node.outputs || [])];

      allPorts.forEach(port => {
        if (!port.id) {
          errors.push({
            nodeId: node.id,
            message: `Node '${node.id}' has a port without ID`
          });
          return;
        }

        if (!isValidPortId(port.id)) {
          errors.push({
            nodeId: node.id,
            portId: port.id,
            message: `Port ID '${port.id}' does not match regex ^[A-Za-z][A-Za-z0-9]*$`
          });
        }

        if (portIdsSeen.has(port.id)) {
          errors.push({
            nodeId: node.id,
            portId: port.id,
            message: `Duplicate port ID '${port.id}' in node '${node.id}'`
          });
        }
        portIdsSeen.add(port.id);
      });

      if (node.role === 'pure') {
        const hasExec = allPorts.some(p => String(p.dataType || '').toLowerCase() === 'execution');
        if (hasExec) {
          errors.push({
            nodeId: node.id,
            message: `Pure node '${node.id}' cannot have execution ports`
          });
        }
      }

      const varBindings = node.data?.variableBindings || {};
      Object.entries(varBindings).forEach(([portId, varKey]) => {
        if (varKey) {
          const isKnownLocal = variableIdSet.has(varKey) || variableNameSet.has(varKey);
          const isKnownGlobal = globalIdSet.has(varKey) || globalNameSet.has(varKey);
          if (!isKnownLocal && !isKnownGlobal) {
            errors.push({
              nodeId: node.id,
              portId: portId,
              message: `Variable '${varKey}' bound to port '${portId}' is not found in schema`
            });
          }
        }
      });
    });

    edges.forEach(edge => {
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);

      if (!sourceNode) {
        errors.push({
          message: `Edge '${edge.id}' references non-existent source node '${edge.source}'`
        });
        return;
      }
      if (!targetNode) {
        errors.push({
          message: `Edge '${edge.id}' references non-existent target node '${edge.target}'`
        });
        return;
      }

      const sourcePort = (sourceNode.outputs || []).find(p => p.id === edge.sourceHandle);
      const targetPort = (targetNode.inputs || []).find(p => p.id === edge.targetHandle);

      if (!sourcePort) {
        errors.push({
          nodeId: edge.source,
          portId: edge.sourceHandle,
          message: `Edge '${edge.id}' references missing output port '${edge.sourceHandle}' on node '${edge.source}'`
        });
        return;
      }

      if (!targetPort) {
        errors.push({
          nodeId: edge.target,
          portId: edge.targetHandle,
          message: `Edge '${edge.id}' references missing input port '${edge.targetHandle}' on node '${edge.target}'`
        });
        return;
      }

      if (!isTypeCompatible(sourcePort.dataType, targetPort.dataType)) {
        errors.push({
          nodeId: edge.target,
          portId: edge.targetHandle,
          message: `Type mismatch on connection: '${sourcePort.dataType}' to '${targetPort.dataType}' (edge: ${edge.id})`
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // --- Script compilation utilities ---
  const compileScript = (rawScript, options = {}) => {
    const normalized = normalizeScript(rawScript);
    const validation = validateScript(normalized, options);

    if (!validation.isValid && !options.force) {
      const errDetails = validation.errors.map(e => e.message).join('; ');
      throw new Error(`[compileScript] Validation failed: ${errDetails}`);
    }

    const incomingEdgeMap = new Map();
    const outgoingFlowMap = new Map();

    normalized.edges.forEach(edge => {
      incomingEdgeMap.set(`${edge.target}:${edge.targetHandle}`, {
        sourceNodeId: edge.source,
        sourcePortId: edge.sourceHandle,
        modifier: edge.modifier || null
      });

      const flowKey = `${edge.source}:${edge.sourceHandle}`;
      if (!outgoingFlowMap.has(flowKey)) {
        outgoingFlowMap.set(flowKey, []);
      }
      outgoingFlowMap.get(flowKey).push({
        targetNodeId: edge.target,
        targetPortId: edge.targetHandle
      });
    });

    const compiledNodes = normalized.nodes.map(node => {
      const rawData = node.data || {};
      const valueModes = rawData.valueModes || {};
      const varBindings = rawData.variableBindings || {};
      const varModifiers = rawData.variableModifiers || {};
      const values = rawData.values || {};

      const compiledInputs = (node.inputs || []).map(port => {
        if (port.dataType === 'execution') {
          return {
            id: port.id,
            dataType: 'execution'
          };
        }

        const portId = port.id;
        const connectedEdge = incomingEdgeMap.get(`${node.id}:${portId}`);

        let source;
        if (connectedEdge) {
          source = {
            kind: 'edge',
            modifier: connectedEdge.modifier || null
          };
        } else {
          const mode = valueModes[portId] || 'input';
          if (mode === 'variable' && varBindings[portId]) {
            source = {
              kind: 'variable',
              scope: varBindings[portId].startsWith('global:') ? 'global' : 'local',
              variableId: varBindings[portId].replace(/^global:/, ''),
              modifiers: varModifiers[portId] || null
            };
          } else {
            const literalVal = values[portId] !== undefined ? values[portId] : port.defaultValue;
            source = {
              kind: 'literal',
              value: coercePortValue(port, literalVal)
            };
          }
        }

        return {
          id: portId,
          dataType: port.dataType,
          source
        };
      });

      const compiledOutputs = (node.outputs || []).map(port => ({
        id: port.id,
        dataType: port.dataType
      }));

      return {
        id: node.id,
        type: node.type,
        role: node.role || getNodeRole(node),
        code: rawData.code || 'return;',
        config: {
          ...(rawData.options || {}),
          ...(node.settings || {})
        },
        inputs: compiledInputs,
        outputs: compiledOutputs,
        data: {
          values: values,
          code: rawData.code || 'return;'
        }
      };
    });

    return {
      id: normalized.id,
      scriptId: normalized.scriptId,
      variables: normalized.variables,
      nodes: compiledNodes,
      edges: normalized.edges
    };
  };

  // --- UI and Explorer State ---
  const viewMode = ref('grid');
  const searchQuery = ref('');
  const selectedId = ref(null);
  const clipboard = ref(null);

  const currentFolderId = computed(() => folderStore ? folderStore.activeFolderId : null);
  const currentFolder = computed(() => folderStore ? folderStore.getFolderById(currentFolderId.value) : null);

  const folderBreadcrumbs = computed(() => {
    if (!folderStore) return [];
    const path = [];
    let currentId = currentFolderId.value;

    while (currentId) {
      const folder = folderStore.getFolderById(currentId);
      if (folder) {
        path.unshift(folder);
        currentId = folder.parentId;
      } else {
        break;
      }
    }
    return path;
  });

  const visibleFolders = computed(() => {
    if (!folderStore) return [];
    let folders = folderStore.folders.filter(f => 
      f.parentId === currentFolderId.value && f.section === 'scripts'
    );

    if (searchQuery.value) {
      folders = folders.filter(f => f.name.toLowerCase().includes(searchQuery.value.toLowerCase()));
    }

    return folders.sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    );
  });

  const visibleScripts = computed(() => {
    if (!scriptStore) return [];
    let list = scriptStore.scripts.filter(s => (s.folderId || null) === currentFolderId.value);

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      list = list.filter(s => (s.scriptId || '').toLowerCase().includes(query));
    }

    return list.sort((a, b) => 
      (a.scriptId || '').localeCompare(b.scriptId || '', undefined, { numeric: true, sensitivity: 'base' })
    );
  });

  const toggleViewMode = () => {
    viewMode.value = viewMode.value === 'grid' ? 'list' : 'grid';
  };

  const navigateTo = (folder) => {
    if (folderStore) folderStore.setActiveFolder(folder ? folder.id : null);
    selectedId.value = null;
    searchQuery.value = '';
  };

  const handleSelect = (id) => {
    selectedId.value = id;
  };

  const moveItem = async (id, type, targetFolderId) => {
    if (type === 'script' && scriptStore) {
      await scriptStore.moveScript(id, targetFolderId);
    } else if (type === 'folder' && folderStore) {
      await folderStore.moveFolder(id, targetFolderId);
    }
  };

  const handleDrop = async (e, customTargetFolderId = null) => {
    const targetFolder = customTargetFolderId !== null ? customTargetFolderId : currentFolderId.value;
    const internalData = e.dataTransfer.getData('application/json');

    if (internalData) {
      try {
        const { id, type } = JSON.parse(internalData);
        await moveItem(id, type, targetFolder);
      } catch (err) {
        console.warn('[ScriptLogic] Failed to parse drag-and-drop payload:', err);
      }
    }
  };

  const handlePaste = async () => {
    if (!clipboard.value) return;
    const { action, item } = clipboard.value;

    if (action === 'cut') {
      await moveItem(item.id, item.type, currentFolderId.value);
      clipboard.value = null;
    } else if (action === 'copy') {
      if (item.type === 'script') {
        await duplicateScript(item.id);
      } else if (item.type === 'folder') {
        await duplicateFolder(item.id);
      }
    }
  };

  const handleOpenGraph = (script) => {
    if (!script) return;
    const scriptData = script.originalData || script;
    if (scriptStore) scriptStore.setActiveScript(scriptData);
    if (workspaceStore) {
      workspaceStore.openTab({
        id: scriptData.id,
        name: scriptData.scriptId,
        type: 'diagram'
      });
    }
  };

  const handleDelete = async (item) => {
    const id = item.id;
    const isDeleted = await deleteScript(id);

    if (isDeleted && selectedId.value === id) {
      selectedId.value = null;
    }
  };

  const handleDuplicate = async (item) => {
    await duplicateScript(item.id);
  };

  const handleRename = async (item) => {
    await renameScript(item.id);
  };

  return {
    viewMode,
    searchQuery,
    selectedId,
    currentFolder,
    folderBreadcrumbs,
    visibleFolders,
    visibleScripts,
    clipboard,
    toggleViewMode,
    navigateTo,
    handleSelect,
    moveItem,
    handleDrop,
    handlePaste,
    handleOpenGraph,
    createScript: () => createScript ? createScript('component', currentFolderId.value) : null,
    handleDelete,
    handleDuplicate,
    handleRename,

    // Compile, Normalize, Validate, Coerce methods
    coerceValueByDataType,
    coercePortValue,
    normalizePort,
    normalizeScript,
    validateScript,
    compileScript,
    LEGACY_PORT_MAP
  };
}

export default useScriptLogic;
