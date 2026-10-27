import { computed } from 'vue';
import { useScriptStore } from '@scripts/scripts.js';
import { useScriptHistory } from '@historys/historys.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useDynamicPortManager } from '@nodes/nodes.js';
import { PORT_ID_REGEX, PORT_COLORS, NODE_ROLES } from '../../nodeConstants.js';
import { isUserCustomNode } from '../layouts/custom/index.js';

export {
  stripComments,
  stripStringsAndComments,
  extractUsedInputs,
  extractUsedOutputs,
  extractUsedLocalVariables,
  extractUsedGlobalVariables,
  extractContextAccesses,
  validateCodePanelContract,
  generateDefaultNodeCode
} from '@core/Script/contract/codePanelContract.js';

import { validateCodePanelContract } from '@core/Script/contract/codePanelContract.js';

export function getPortColor(dataType) {
  const norm = String(dataType || 'any').toLowerCase();
  return PORT_COLORS[norm] || PORT_COLORS.any;
}

export function getNodeRole(nodeDef) {
  if (nodeDef && nodeDef.role) {
    return nodeDef.role;
  }

  const inputs = Array.isArray(nodeDef?.inputs) ? nodeDef.inputs : [];
  const outputs = Array.isArray(nodeDef?.outputs) ? nodeDef.outputs : [];

  const hasExecIn = inputs.some(p => String(p.dataType || '').toLowerCase() === 'execution');
  const hasExecOut = outputs.some(p => String(p.dataType || '').toLowerCase() === 'execution');

  if (hasExecIn) {
    return NODE_ROLES.ACTION;
  }
  if (hasExecOut) {
    return NODE_ROLES.EVENT;
  }
  return NODE_ROLES.PURE;
}

// Manages node inspector state, port reconfiguration, and structural edits
export function useNodeLogic() {
  const scriptStore = useScriptStore();
  const scriptHistory = useScriptHistory();
  const workspaceStore = useWorkspaceStore();
  const dynamicManager = useDynamicPortManager();

  const startScriptTransaction = scriptHistory.startTransaction;
  const endScriptTransactionWithDelay = scriptHistory.endTransactionWithDelay;

  const selectedNode = computed(() => {
    if (!scriptStore.activeScript) return null;

    const activeTab = workspaceStore.activeTab;
    if (activeTab?.type === 'code_editor') {
      const tabNodeId = activeTab.nodeId || activeTab.id?.replace('code_', '');
      return scriptStore.activeScript.nodes.find(n => n.id === tabNodeId) || null;
    }

    if (!scriptStore.selectedNodeId) return null;
    return scriptStore.activeScript.nodes.find(n => n.id === scriptStore.selectedNodeId) || null;
  });

  const availableOptions = computed(() => {
    return dynamicManager.getAvailableProperties(selectedNode.value);
  });

  const effectiveDynamicMode = computed(() => {
    return dynamicManager.getDynamicMode(selectedNode.value);
  });

  function updateNodeDataField(path, newValue) {
    if (!selectedNode.value) return;
    const oldValue = path.split('.').reduce((o, i) => o?.[i], selectedNode.value);
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return;

    scriptHistory.recordNodeDataChange(selectedNode.value.id, path, oldValue, newValue);

    const keys = path.split('.');
    const lastKey = keys.pop();
    const deepObj = keys.reduceRight((obj, key) => ({ [key]: obj }), { [lastKey]: newValue });
    scriptStore.updateNodeInActive(selectedNode.value.id, deepObj);
  }

  function updateNodeStructure({ data, inputs, outputs }) {
    if (!selectedNode.value) return;
    const nodeId = selectedNode.value.id;

    if (data !== undefined) {
      updateNodeDataField('data', data);
    }

    const payload = {};
    if (data !== undefined) payload.data = data;
    if (inputs !== undefined) payload.inputs = inputs;
    if (outputs !== undefined) payload.outputs = outputs;

    scriptStore.updateNodeInActive(nodeId, payload);
  }

  function bindNodeProp(path) {
    return computed({
      get: () => {
        if (!selectedNode.value) return undefined;
        return path.split('.').reduce((o, i) => o?.[i], selectedNode.value);
      },
      set: (val) => {
        updateNodeDataField(path, val);
      }
    });
  }

  function deleteSelectedNode() {
    if (selectedNode.value) {
      const nodeToDelete = selectedNode.value;
      const connectedEdges = scriptStore.activeScript.edges.filter(
        e => e.source === nodeToDelete.id || e.target === nodeToDelete.id
      );

      scriptStore.removeNodeFromActive(nodeToDelete.id);
      scriptStore.selectedNodeId = null;

      scriptHistory.recordRemoveNodes([nodeToDelete], connectedEdges);
    }
  }

  function isInputConnected(inputKey) {
    if (!selectedNode.value || !scriptStore.activeScript) return false;
    return scriptStore.activeScript.edges.some(edge =>
      edge.target === selectedNode.value.id &&
      edge.targetHandle === inputKey
    );
  }

  function disconnectInvalidEdges(portId) {
    if (!scriptStore.activeScript?.edges || !selectedNode.value) return;

    const edgesToRemove = scriptStore.activeScript.edges.filter(edge => {
      return (edge.target === selectedNode.value.id && edge.targetHandle === portId) ||
             (edge.source === selectedNode.value.id && edge.sourceHandle === portId);
    });

    edgesToRemove.forEach(edge => scriptStore.removeEdgeFromActive(edge.id));
  }

  function updatePortLabel(portId, type = 'input', newLabel) {
    if (!selectedNode.value) return;

    const node = selectedNode.value;
    if (!isUserCustomNode(node)) {
      // System nodes have immutable port identifiers
      return;
    }

    const cleanLabel = String(newLabel || '').trim();
    if (!cleanLabel) return;

    const portsKey = type === 'input' ? 'inputs' : 'outputs';
    const updatedPorts = [...(node[portsKey] || [])];
    const portIndex = updatedPorts.findIndex(p => p.id === portId);

    if (portIndex > -1) {
      const oldPort = updatedPorts[portIndex];
      if (oldPort.label === cleanLabel && oldPort.id === cleanLabel) return;

      const canUpdateId = PORT_ID_REGEX.test(cleanLabel);
      const targetId = canUpdateId ? cleanLabel : oldPort.id;

      updatedPorts[portIndex] = {
        ...oldPort,
        id: targetId,
        label: cleanLabel
      };

      if (canUpdateId && targetId !== oldPort.id) {
        if (scriptStore.activeScript?.edges) {
          scriptStore.activeScript.edges.forEach(edge => {
            if (type === 'input' && edge.target === node.id && edge.targetHandle === portId) {
              edge.targetHandle = targetId;
            } else if (type === 'output' && edge.source === node.id && edge.sourceHandle === portId) {
              edge.sourceHandle = targetId;
            }
          });
        }

        const values = { ...(node.data?.values || {}) };
        if (type === 'input' && values[portId] !== undefined) {
          values[targetId] = values[portId];
          delete values[portId];
        }
        if (node.data) {
          node.data.values = values;
        }
      }

      scriptHistory.recordNodeDataChange(node.id, `${portsKey}.${portIndex}.label`, oldPort.label, cleanLabel);
      scriptStore.updateNodeInActive(node.id, {
        [portsKey]: updatedPorts,
        ...(node.data ? { data: node.data } : {})
      });
    }
  }

  function updatePortDataType(portId, type = 'input', newDataType) {
    if (!selectedNode.value) return;

    const node = selectedNode.value;
    if (!isUserCustomNode(node)) return;

    const portsKey = type === 'input' ? 'inputs' : 'outputs';
    const updatedPorts = [...(node[portsKey] || [])];
    const portIndex = updatedPorts.findIndex(p => p.id === portId);
    if (portIndex === -1) return;

    const color = getPortColor(newDataType);
    const oldType = updatedPorts[portIndex].dataType;
    if (oldType === newDataType) return;

    updatedPorts[portIndex] = {
      ...updatedPorts[portIndex],
      dataType: newDataType,
      color
    };

    const values = { ...(node.data?.values || {}) };
    if (type === 'input') {
      if (newDataType === 'number') values[portId] = 0;
      else if (newDataType === 'boolean') values[portId] = false;
      else if (newDataType === 'string') values[portId] = '';
    }

    scriptStore.updateNodeInActive(node.id, {
      [portsKey]: updatedPorts,
      ...(node.data ? { data: { ...node.data, values } } : {})
    });
  }

  function movePort(portId, type = 'input', direction = 'up') {
    if (!selectedNode.value) return;

    const node = selectedNode.value;
    if (!isUserCustomNode(node)) return;

    const portsKey = type === 'input' ? 'inputs' : 'outputs';
    const ports = [...(node[portsKey] || [])];
    const idx = ports.findIndex(p => p.id === portId);
    if (idx === -1) return;

    if (direction === 'up') {
      if (idx === 0) return;
      if (ports[idx - 1]?.dataType === 'execution') return;
      const temp = ports[idx];
      ports[idx] = ports[idx - 1];
      ports[idx - 1] = temp;
    } else if (direction === 'down') {
      if (idx >= ports.length - 1) return;
      const temp = ports[idx];
      ports[idx] = ports[idx + 1];
      ports[idx + 1] = temp;
    }

    scriptStore.updateNodeInActive(node.id, { [portsKey]: ports });
  }

  // Dynamic port handlers delegated to useDynamicPortManager
  const handleAddPort = async (type = 'input') => {
    await dynamicManager.addDynamicPort(selectedNode.value, type);
  };

  const addFromDropdown = async (optionValue) => {
    const targetType = dynamicManager.activeDropdownTarget.value || 
      (effectiveDynamicMode.value === 'outputProperty' ? 'output' : 'input');
    await dynamicManager.addDynamicPort(selectedNode.value, targetType, optionValue);
  };

  const removeDynamicInput = (portId, type = 'input') => {
    dynamicManager.removeDynamicPort(selectedNode.value, portId, type);
  };

  const canDeleteInputPort = (node, portId) => {
    return dynamicManager.canDeleteInputPort(node || selectedNode.value, portId);
  };

  const canDeleteOutputPort = (node, portId) => {
    return dynamicManager.canDeleteOutputPort(node || selectedNode.value, portId);
  };

  return {
    selectedNode,
    scriptStore,
    bindNodeProp,
    updateNodeDataField,
    updateNodeStructure,
    deleteSelectedNode,
    isInputConnected,
    disconnectInvalidEdges,
    updatePortLabel,
    updatePortDataType,
    movePort,
    startScriptTransaction,
    endScriptTransactionWithDelay,

    activeDropdownTarget: dynamicManager.activeDropdownTarget,
    availableOptions,
    effectiveDynamicMode,
    handleAddPort,
    addFromDropdown,
    removeDynamicInput,
    canDeleteInputPort,
    canDeleteOutputPort,
    getPortColor,
    getNodeRole,
    validateCodePanelContract
  };
}
