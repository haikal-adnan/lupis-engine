import { ref, computed } from 'vue';
import { useScriptStore } from '@scripts/scripts.js';
import { useScriptHistory } from '@historys/historys.js';
import { useWorkspaceStore } from '@workspaces/workspaces.js';
import { 
  usePopAlert,
  usePrompt
} from '@composables/composables.js';

export function useNodeLogic() {
  const scriptStore = useScriptStore();
  const scriptHistory = useScriptHistory();
  const workspaceStore = useWorkspaceStore();
  const { prompt } = usePrompt();
  const { showPop } = usePopAlert();

  const activeDropdownTarget = ref(null);

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

  const availableOptions = computed(() => {
    if (!selectedNode.value) return [];
    const options = selectedNode.value.data?.propertyOptions || [];
    const existingPorts = [
      ...(selectedNode.value.inputs || []),
      ...(selectedNode.value.outputs || [])
    ];
    return options.filter(opt => !existingPorts.some(p => p.id === opt.value));
  });

  const handleAddPort = async (type = 'input') => {
    if (!selectedNode.value) return;
    const node = selectedNode.value;

    const hasPropertyOptions = Array.isArray(node.data?.propertyOptions) && node.data.propertyOptions.length > 0;

    const dynamicTypes = [
      'translate', 'get_object', 'set_object', 'get_layer', 'set_layer',
      'get_transform', 'set_transform', 'get_physics', 'set_physics',
      'get_sprite', 'set_sprite', 'get_shape', 'set_shape',
      'get_tilemap', 'set_tilemap', 'get_text', 'set_text',
      'get_animator', 'set_animator', 'get_clip_prop', 'set_clip_prop'
    ];
    
    if (hasPropertyOptions || dynamicTypes.includes(node.type)) {
      activeDropdownTarget.value = activeDropdownTarget.value === type ? null : type;
      return;
    }

    if (node.type === 'compare_switch') {
      const res = await prompt({
        title: 'Add Case',
        message: 'Enter value to compare (string/number):',
        defaultValue: ''
      });
      if (res === null || res.trim() === '') return;
      const newPort = {
        id: `case_${res}`,
        label: `Case ${res}`,
        dataType: 'execution',
        color: '#ffffff'
      };
      scriptStore.addNodePort(node.id, 'output', newPort);
      scriptHistory.recordPortChange(node.id, 'ADD', newPort, 'output', []);
      return;
    }

    const currentPorts = type === 'input' ? (node.inputs || []) : (node.outputs || []);
    const nextIndex = currentPorts.length;

    let newLabel = `{${nextIndex}}`;
    let newDataType = 'any';
    let newColor = '#ffffff';

    if (node.type === 'event_advanced_key') {
      newLabel = `Key_${nextIndex + 1}`;
      newDataType = 'execution';
      newColor = '#FFEB3B';
    } else if (node.type.startsWith('math_')) {
      newLabel = String.fromCharCode(65 + nextIndex);
      newDataType = 'number';
      newColor = '#B2FF59';
    } else if (node.type === 'string_join') {
      newLabel = `Str ${nextIndex + 1}`;
      newDataType = 'string';
      newColor = '#FFEB3B';
    } else if (node.type === 'logic_and' || node.type === 'logic_or') {
      newLabel = `In ${nextIndex + 1}`;
      newDataType = 'boolean';
      newColor = '#f472b6';
    } else {
      const blueprintItem = scriptStore.blueprints
        ?.flatMap(group => group.items || [])
        .find(item => item.type === node.type || item.id === node.type);

      const bpPorts = type === 'input' 
        ? (blueprintItem?.defaultData?.inputs || [])
        : (blueprintItem?.defaultData?.outputs || []);

      if (bpPorts.length > 0) {
        const lastBpPort = bpPorts[bpPorts.length - 1];
        newDataType = lastBpPort.dataType || lastBpPort.type || 'any';
        newColor = lastBpPort.color || '#ffffff';
        newLabel = `Key_${nextIndex + 1}`;
      }
    }

    const newPort = {
      id: `port_${Date.now()}_${nextIndex}`,
      label: newLabel,
      dataType: newDataType,
      color: newColor
    };

    scriptStore.addNodePort(node.id, type, newPort);

    if (type === 'input') {
      const currentValues = node.data?.values || {};
      const defaultVal = newDataType === 'number' ? 0 : newDataType === 'boolean' ? false : '';
      updateNodeDataField('data.values', { ...currentValues, [newPort.id]: defaultVal });
    }

    scriptHistory.recordPortChange(node.id, 'ADD', newPort, type, []);
  };

  const addFromDropdown = (optionValue) => {
    if (!selectedNode.value || !activeDropdownTarget.value) return;
    const type = activeDropdownTarget.value;
    const options = selectedNode.value.data?.propertyOptions || [];
    const selectedOpt = options.find(o => o.value === optionValue);

    if (selectedOpt) {
      const newPort = {
        id: selectedOpt.value,
        label: selectedOpt.label,
        dataType: selectedOpt.type || 'number',
        color: selectedOpt.color || '#fff'
      };

      scriptStore.addNodePort(selectedNode.value.id, type, newPort);

      if (type === 'input') {
        const currentValues = selectedNode.value.data?.values || {};
        updateNodeDataField('data.values', { ...currentValues, [selectedOpt.value]: null });
      }

      scriptHistory.recordPortChange(selectedNode.value.id, 'ADD', newPort, type, []);
    }

    activeDropdownTarget.value = null;
  };

  const removeDynamicInput = (portId, type = 'input') => {
    if (!selectedNode.value) return;

    const permanentPorts = ['exec_in', 'exec_out', 'in_target', 'sk_main', 'ptr_click_main'];

    if (permanentPorts.includes(portId)) {
      showPop({
        title: 'Protected Port',
        message: `The port "${portId}" is a core part of this node and cannot be removed.`,
        type: 'warning',
        duration: 3000
      });
      return;
    }

    const portList = type === 'input' ? selectedNode.value.inputs : selectedNode.value.outputs;
    const portToRemove = portList.find(p => p.id === portId);

    const connectedEdges = scriptStore.activeScript.edges.filter(e => 
      (type === 'input' && e.target === selectedNode.value.id && e.targetHandle === portId) ||
      (type === 'output' && e.source === selectedNode.value.id && e.sourceHandle === portId)
    );

    scriptStore.removeNodePort(selectedNode.value.id, type, portId);
    
    if (type === 'input') {
       const currentValues = { ...(selectedNode.value.data?.values || {}) };
       delete currentValues[portId];
       updateNodeDataField('data.values', currentValues);
    }

    if (portToRemove) {
      scriptHistory.recordPortChange(selectedNode.value.id, 'REMOVE', portToRemove, type, connectedEdges);
    }
  };

  const updatePortLabel = (portId, type = 'input', newLabel) => {
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
    activeDropdownTarget,
    availableOptions,
    handleAddPort,
    addFromDropdown,
    removeDynamicInput,
    updatePortLabel,
    startScriptTransaction,
    endScriptTransactionWithDelay
  };
}