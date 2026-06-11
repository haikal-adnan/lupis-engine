import { ref, computed } from 'vue';
import { useScriptStore } from '@/stores/useScriptStore.js';
import { usePrompt } from '@/composables/usePrompt.js';
import { usePopAlert } from '@/composables/usePopAlert';

export function useNodeLogic() {
  const scriptStore = useScriptStore();
  const { prompt } = usePrompt();
  const { showPop } = usePopAlert();

  const activeDropdownTarget = ref(null);

  const selectedNode = computed(() => {
    if (!scriptStore.activeScript || !scriptStore.selectedNodeId) return null;
    return scriptStore.activeScript.nodes.find(n => n._id === scriptStore.selectedNodeId);
  });

  function bindNodeProp(path) {
    return computed({
      get: () => {
        if (!selectedNode.value) return undefined;
        return path.split('.').reduce((o, i) => o?.[i], selectedNode.value);
      },
      set: (val) => {
        if (!selectedNode.value) return;
        const keys = path.split('.');
        const lastKey = keys.pop();
        const deepObj = keys.reduceRight((obj, key) => ({ [key]: obj }), { [lastKey]: val });
        scriptStore.updateNodeInActive(selectedNode.value._id, deepObj);
      }
    });
  }

  function deleteSelectedNode() {
    if (selectedNode.value && confirm('Delete this node?')) {
      scriptStore.removeNodeFromActive(selectedNode.value._id);
      scriptStore.selectedNodeId = null;
    }
  }

  function isInputConnected(inputKey) {
    if (!selectedNode.value || !scriptStore.activeScript) return false;
    return scriptStore.activeScript.edges.some(edge =>
      edge.target === selectedNode.value._id &&
      edge.targetHandle === inputKey
    );
  }

  const availableOptions = computed(() => {
    if (!selectedNode.value) return [];
    const options = selectedNode.value.data?.propertyOptions || [];
    const existingPorts = [
      ...(selectedNode.value.inputs || []),
      ...(selectedNode.value.outputs || [])
    ];
    return options.filter(opt => !existingPorts.some(p => p._id === opt.value));
  });

  const handleAddPort = async (type = 'input') => {
    if (!selectedNode.value) return;
    const node = selectedNode.value;

    const dynamicTypes = [
      'translate',
      'get_object', 'set_object',
      'get_layer', 'set_layer',
      'get_transform', 'set_transform', 
      'get_physics', 'set_physics',
      'get_sprite', 'set_sprite',
      'get_shape', 'set_shape',
      'get_tilemap', 'set_tilemap',
      'get_text', 'set_text',
      'get_animator', 'set_animator',
      'get_clip_prop', 'set_clip_prop'
    ];
    
    if (dynamicTypes.includes(node.type)) {
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
      scriptStore.addNodePort(node._id, 'output', {
        _id: `case_${res}`,
        label: `Case ${res}`,
        dataType: 'execution',
        color: '#ffffff'
      });
      return;
    }

    const currentPorts = type === 'input' ? node.inputs : node.outputs;
    const nextIndex = currentPorts.length;

    let newLabel = `{${nextIndex}}`;
    let newDataType = 'any';

    if (node.type.startsWith('math_')) {
      newLabel = String.fromCharCode(65 + nextIndex);
      newDataType = 'number';
    } else if (node.type === 'string_join') {
      newLabel = `Str ${nextIndex + 1}`;
      newDataType = 'string';
    } else if (node.type === 'logic_and' || node.type === 'logic_or') {
      newLabel = `In ${nextIndex + 1}`;
      newDataType = 'boolean';
    }

    scriptStore.addNodePort(node._id, type, {
      _id: String(nextIndex),
      label: newLabel,
      dataType: newDataType,
      color: '#fff'
    });

    if (type === 'input') {
      const currentValues = node.data?.values || {};
      const defaultVal = newDataType === 'number' ? 0 : newDataType === 'boolean' ? false : '';
      
      scriptStore.updateNodeInActive(node._id, {
        data: { 
          values: { 
            ...currentValues, 
            [String(nextIndex)]: defaultVal 
          } 
        }
      });
    }
  };

  const addFromDropdown = (optionValue) => {
    if (!selectedNode.value || !activeDropdownTarget.value) return;
    const type = activeDropdownTarget.value;
    const options = selectedNode.value.data?.propertyOptions || [];
    const selectedOpt = options.find(o => o.value === optionValue);

    if (selectedOpt) {
      scriptStore.addNodePort(selectedNode.value._id, type, {
        _id: selectedOpt.value,
        label: selectedOpt.label,
        dataType: selectedOpt.type || 'number',
        color: selectedOpt.color || '#fff'
      });

      if (type === 'input') {
        const currentValues = selectedNode.value.data?.values || {};
        
        scriptStore.updateNodeInActive(selectedNode.value._id, {
          data: { 
            values: { 
              ...currentValues, 
              [selectedOpt.value]: null 
            } 
          }
        });
      }
    }

    activeDropdownTarget.value = null;
  };

  const removeDynamicInput = (portId, type = 'input') => {
    if (!selectedNode.value) return;

    const permanentPorts = [
      'exec_in', 
      'exec_out', 
      'in_target', 
      'sk_main', 
      'ptr_click_main'
    ];

    if (permanentPorts.includes(portId)) {
      showPop({
        title: 'Protected Port',
        message: `The port "${portId}" is a core part of this node and cannot be removed.`,
        type: 'warning',
        duration: 3000
      });
      return;
    }

    scriptStore.removeNodePort(selectedNode.value._id, type, portId);
    
    if (type === 'input') {
       const currentValues = { ...(selectedNode.value.data?.values || {}) };
       delete currentValues[portId];
       scriptStore.updateNodeInActive(selectedNode.value._id, {
          data: { values: currentValues }
       });
    }
  };

  const updatePortLabel = (portId, type = 'input', newLabel) => {
    if (!selectedNode.value) return;
    
    const node = selectedNode.value;
    const portsKey = type === 'input' ? 'inputs' : 'outputs';
    
    const updatedPorts = [...(node[portsKey] || [])];
    const portIndex = updatedPorts.findIndex(p => p._id === portId);
    
    if (portIndex > -1) {
      updatedPorts[portIndex] = { ...updatedPorts[portIndex], label: newLabel };
      
      scriptStore.updateNodeInActive(node._id, {
        [portsKey]: updatedPorts
      });
    }
  };

  return {
    selectedNode,
    scriptStore,
    bindNodeProp,
    deleteSelectedNode,
    isInputConnected,
    activeDropdownTarget,
    availableOptions,
    handleAddPort,
    addFromDropdown,
    removeDynamicInput,
    updatePortLabel
  };
}