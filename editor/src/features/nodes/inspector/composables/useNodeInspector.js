import { computed } from 'vue';
import { useScriptStore } from '@scripts/scripts.js';
import { useScriptHistory } from '@historys/historys.js';
import { usePopAlert } from '@composables/composables.js';
import { useVariableConfig, useNodeLogic, useDynamicPortManager } from '@nodes/nodes.js';
import { GenerateUUID } from '@utils/utils.js';

// Manages inspector state, field binding, value mode toggling, and edge pruning
export function useNodeInspector(props = {}) {
  const scriptStore = useScriptStore();
  const scriptHistory = useScriptHistory();
  const { showPop } = usePopAlert();
  const { getVarColor } = useVariableConfig();

  const { handleNodeValueSync } = useDynamicPortManager();

  const { 
    handleAddPort,
    addFromDropdown, 
    removeDynamicInput, 
    updatePortLabel,
    availableOptions,
    activeDropdownTarget,
    effectiveDynamicMode,
    canDeleteInputPort,
    canDeleteOutputPort
  } = useNodeLogic();

  const startScriptTransaction = scriptHistory.startTransaction;
  const endScriptTransactionWithDelay = scriptHistory.endTransactionWithDelay;

  // Resolves the currently inspected node from props or active script selection
  const node = computed(() => {
    if (props.node) return props.node;
    if (!scriptStore.activeScript || !scriptStore.selectedNodeId) return null;
    return scriptStore.activeScript.nodes.find(n => n.id === scriptStore.selectedNodeId);
  });

  const isInputConnected = (inputId) => {
    if (!node.value || !scriptStore.activeScript) return false;
    return scriptStore.activeScript.edges.some(edge =>
      edge.target === node.value.id && edge.targetHandle === inputId
    );
  };

  const isNotSet = (value) => value === undefined || value === null || value === '';

  // Tests whether a port value is missing while not wired
  const isErrorNotSet = (key, value = null) => {
    if (String(key).startsWith('targetEntity') || String(key).startsWith('targetLayer')) return false;
    const mode = getMode(key);
    if (mode === 'variable') {
      const binding = getVariableBinding(key);
      return isNotSet(binding);
    }
    const val = value !== null && value !== undefined ? value : getValue(key);
    return isNotSet(val);
  };

  // Severs connected edges if the new data type is incompatible
  const disconnectInvalidEdges = (portId, newDataType = null) => {
    if (!node.value || !scriptStore.activeScript?.edges) return;

    const edgesToRemove = scriptStore.activeScript.edges.filter(edge => {
      const isTarget = edge.target === node.value.id && edge.targetHandle === portId;
      const isSource = edge.source === node.value.id && edge.sourceHandle === portId;

      if (!isTarget && !isSource) return false;
      if (!newDataType) return true;

      const otherNodeId = isTarget ? edge.source : edge.target;
      const otherPortId = isTarget ? edge.sourceHandle : edge.targetHandle;
      const otherNode = scriptStore.activeScript.nodes.find(n => n.id === otherNodeId);

      if (!otherNode) return true;

      const otherPortList = isTarget ? otherNode.outputs : otherNode.inputs;
      const otherPort = otherPortList?.find(p => p.id === otherPortId);
      const otherDataType = (otherPort?.dataType || 'any').toLowerCase();
      const currentDataType = (newDataType || 'any').toLowerCase();

      return (
        otherDataType !== 'any' &&
        otherDataType !== 'execution' &&
        currentDataType !== 'any' &&
        otherDataType !== currentDataType
      );
    });

    edgesToRemove.forEach(edge => {
      scriptStore.removeEdgeFromActive(edge.id);
      scriptHistory.recordRemoveEdge(edge); 
    });
  };

  function getValue(key) {
    return node.value?.data?.values?.[key] ?? null;
  }

  function getMode(key) {
    const modes = node.value?.data?.valueModes || {};
    if (modes[key]) return modes[key];

    const allPorts = [...(node.value?.inputs || []), ...(node.value?.outputs || [])];
    const matchingPort = allPorts.find(p => p.id === key || p.label === key);
    if (matchingPort) {
      if (matchingPort.id && modes[matchingPort.id]) return modes[matchingPort.id];
      if (matchingPort.label && modes[matchingPort.label]) return modes[matchingPort.label];
    }

    if (getVariableBinding(key)) return 'variable';
    return 'input';
  }

  function getVariableBinding(key) {
    const bindings = node.value?.data?.variableBindings;
    if (!bindings) return null;
    if (bindings[key] !== undefined && bindings[key] !== null && bindings[key] !== '') return bindings[key];

    const allPorts = [...(node.value?.inputs || []), ...(node.value?.outputs || [])];
    const matchingPort = allPorts.find(p => p.id === key || p.label === key);
    if (matchingPort) {
      if (matchingPort.id && bindings[matchingPort.id]) return bindings[matchingPort.id];
      if (matchingPort.label && bindings[matchingPort.label]) return bindings[matchingPort.label];
    }
    return null;
  }

  function getVariableModifier(key) {
    const mods = node.value?.data?.variableModifiers;
    if (mods?.[key]) return mods[key];

    const allPorts = [...(node.value?.inputs || []), ...(node.value?.outputs || [])];
    const matchingPort = allPorts.find(p => p.id === key || p.label === key);
    if (matchingPort) {
      if (matchingPort.id && mods?.[matchingPort.id]) return mods[matchingPort.id];
      if (matchingPort.label && mods?.[matchingPort.label]) return mods[matchingPort.label];
    }
    return { type: 'none', value: 0 };
  }

  // Updates nested path on node and records history
  function updateNodeDataField(path, newValue) {
    if (!node.value) return;
    const oldValue = path.split('.').reduce((o, i) => o?.[i], node.value);
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return;

    scriptHistory.recordNodeDataChange(node.value.id, path, oldValue, newValue);

    const keys = path.split('.');
    const lastKey = keys.pop();
    const deepObj = keys.reduceRight((obj, key) => ({ [key]: obj }), { [lastKey]: newValue });
    scriptStore.updateNodeInActive(node.value.id, deepObj);
  }

  function updateNodeValue(key, value) {
    if (isInputConnected(key)) return;
    const currentValues = node.value?.data?.values || {};
    updateNodeDataField('data.values', { ...currentValues, [key]: value });

    handleNodeValueSync(node.value, key, value, disconnectInvalidEdges);
  }

  function toggleMode(key) {
    const currentMode = getMode(key);
    const nextMode = currentMode === 'variable' ? 'input' : 'variable';
    const currentModes = node.value?.data?.valueModes || {};

    updateNodeDataField('data.valueModes', { ...currentModes, [key]: nextMode });
  }

  function setVariableBinding(key, varId) {
    const currentBindings = node.value?.data?.variableBindings || {};
    updateNodeDataField('data.variableBindings', { ...currentBindings, [key]: varId });
  }

  function setVariableModifier(key, modifierData) {
    const currentMods = node.value?.data?.variableModifiers || {};
    updateNodeDataField('data.variableModifiers', { ...currentMods, [key]: modifierData });
  }

  function clearVariableModifier(key) {
    const currentMods = node.value?.data?.variableModifiers || {};
    const updatedMods = { ...currentMods };
    delete updatedMods[key];

    updateNodeDataField('data.variableModifiers', updatedMods);
  }

  // Creates two-way reactive computed binding to nested node property
  function bindNodeProp(path) {
    return computed({
      get: () => {
        if (!node.value) return undefined;
        return path.split('.').reduce((o, i) => o?.[i], node.value);
      },
      set: (val) => {
        if (!node.value) return;
        const oldValue = path.split('.').reduce((o, i) => o?.[i], node.value);
        if (JSON.stringify(oldValue) === JSON.stringify(val)) return;

        scriptHistory.recordNodeDataChange(node.value.id, path, oldValue, val);

        const keys = path.split('.');
        const lastKey = keys.pop();
        const deepObj = keys.reduceRight((obj, key) => ({ [key]: obj }), { [lastKey]: val });
        scriptStore.updateNodeInActive(node.value.id, deepObj);
      }
    });
  }

  function updateNodeStructure(payload) {
    if (!node.value) return;
    
    Object.keys(payload).forEach(key => {
      const oldValue = node.value[key];
      const newValue = payload[key];
      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        scriptHistory.recordNodeDataChange(node.value.id, key, oldValue, newValue);
      }
    });

    scriptStore.updateNodeInActive(node.value.id, payload);
  }

  function deleteSelectedNode() {
    if (node.value && confirm('Delete this node?')) {
      const nodeToDelete = node.value;
      const connectedEdges = scriptStore.activeScript.edges.filter(
        e => e.source === nodeToDelete.id || e.target === nodeToDelete.id
      );

      scriptStore.removeNodeFromActive(nodeToDelete.id);
      scriptStore.selectedNodeId = null;
      scriptHistory.recordRemoveNodes([nodeToDelete], connectedEdges);
    }
  }

  return {
    node,
    scriptStore,
    scriptHistory,
    showPop,
    getVarColor,
    GenerateUUID,
    startScriptTransaction,
    endScriptTransactionWithDelay,
    isInputConnected,
    isNotSet,
    isErrorNotSet,
    getValue,
    getMode,
    getVariableBinding,
    getVariableModifier,
    updateNodeDataField,
    updateNodeValue,
    updateNodeStructure,
    toggleMode,
    setVariableBinding,
    setVariableModifier,
    clearVariableModifier,
    bindNodeProp,
    disconnectInvalidEdges,
    deleteSelectedNode,

    activeDropdownTarget,
    availableOptions,
    effectiveDynamicMode,
    handleAddPort,
    addFromDropdown,
    removeDynamicInput,
    updatePortLabel,
    canDeleteInputPort,
    canDeleteOutputPort
  };
}
