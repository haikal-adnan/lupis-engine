// lokasi: src/editor/nodes/composables/useNodeLogic.js

import { computed } from 'vue';
import { useScriptStore } from '@scripts/scripts.js';
import { useScriptHistory } from '@historys/historys.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { useDynamicPortManager } from '@nodes/nodes.js';

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

  // Delegasi dynamicMode & opsi properti ke useDynamicPortManager
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
    if (selectedNode.value && confirm('Delete this node?')) {
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
    const portsKey = type === 'input' ? 'inputs' : 'outputs';
    const updatedPorts = [...(node[portsKey] || [])];
    const portIndex = updatedPorts.findIndex(p => p.id === portId);

    if (portIndex > -1) {
      const oldLabel = updatedPorts[portIndex].label;
      if (oldLabel === newLabel) return;

      updatedPorts[portIndex] = { ...updatedPorts[portIndex], label: newLabel };
      scriptHistory.recordNodeDataChange(node.id, `${portsKey}.${portIndex}.label`, oldLabel, newLabel);
      scriptStore.updateNodeInActive(node.id, { [portsKey]: updatedPorts });
    }
  }

  // =========================================================================
  // OPERASI PORT DINAMIS (DELEGASI KE useDynamicPortManager)
  // =========================================================================
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
    startScriptTransaction,
    endScriptTransactionWithDelay,

    activeDropdownTarget: dynamicManager.activeDropdownTarget,
    availableOptions,
    effectiveDynamicMode,
    handleAddPort,
    addFromDropdown,
    removeDynamicInput
  };
}