import { ref, computed } from 'vue';
import { useScriptStore } from '@/stores/useScriptStore.js';
import { usePrompt } from '@/composables/usePrompt.js'; // Asumsi helper prompt ada

export function useNodeLogic() {
  const scriptStore = useScriptStore();
  const { prompt } = usePrompt();

  // State untuk melacak apakah Dropdown sedang aktif di sisi Input atau Output
  // Value: null | 'input' | 'output'
  const activeDropdownTarget = ref(null);

  const selectedNode = computed(() => {
    if (!scriptStore.activeScript || !scriptStore.selectedNodeId) return null;
    return scriptStore.activeScript.nodes.find(n => n._id === scriptStore.selectedNodeId);
  });

  // --- DATA BINDING HELPERS ---

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

  // --- DYNAMIC PORT LOGIC ---

  // 1. Computed Options untuk Dropdown (Transform Node)
  // Memfilter opsi yang sudah dipakai agar tidak muncul lagi di dropdown
  const availableOptions = computed(() => {
    if (!selectedNode.value) return [];
    
    // Ambil daftar opsi mentah dari data node
    const options = selectedNode.value.data?.propertyOptions || [];
    
    // Gabungkan semua port yang sudah ada (input & output)
    const existingPorts = [
       ...(selectedNode.value.inputs || []), 
       ...(selectedNode.value.outputs || [])
    ];
    
    // Return hanya opsi yang BELUM ada di port
    return options.filter(opt => !existingPorts.some(p => p._id === opt.value));
  });

  // 2. Handler Utama saat tombol "+" diklik
  const handleAddPort = async (type = 'input') => {
    if (!selectedNode.value) return;
    const node = selectedNode.value;

    // A. KASUS TRANSFORM: Buka Dropdown
    if (node.type === 'get_transform' || node.type === 'set_transform') {
       activeDropdownTarget.value = activeDropdownTarget.value === type ? null : type;
       return; 
    }

    // B. KASUS SWITCH: Prompt User Input
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

    // C. KASUS MATH / STRING / LOGIC: Auto-Generate Label
    const currentPorts = type === 'input' ? node.inputs : node.outputs;
    const nextIndex = currentPorts.length;
    
    let newLabel = `{${nextIndex}}`;
    let newDataType = 'any';

    if (node.type.startsWith('math_')) {
        // Generate A, B, C, D...
        newLabel = String.fromCharCode(65 + nextIndex); // 65 = 'A'
        newDataType = 'number';
    } else if (node.type === 'string_join') {
        newLabel = `Str ${nextIndex + 1}`;
        newDataType = 'string';
    } else if (node.type === 'logic_and' || node.type === 'logic_or') {
        newLabel = `In ${nextIndex + 1}`;
        newDataType = 'boolean';
    }

    scriptStore.addNodePort(node._id, type, {
      _id: String(nextIndex), // ID simpel 0, 1, 2...
      label: newLabel,
      dataType: newDataType,
      color: '#fff'
    });
  };

  // 3. Callback saat user memilih item dari Dropdown (Transform)
  const addFromDropdown = (optionValue) => {
     if (!selectedNode.value || !activeDropdownTarget.value) return;
     
     const type = activeDropdownTarget.value; // 'input' atau 'output'
     const options = selectedNode.value.data?.propertyOptions || [];
     const selectedOpt = options.find(o => o.value === optionValue);

     if (selectedOpt) {
        scriptStore.addNodePort(selectedNode.value._id, type, {
           _id: selectedOpt.value,
           label: selectedOpt.label,
           dataType: selectedOpt.type || 'number',
           color: selectedOpt.color || '#fff'
        });
     }
     
     // Reset dropdown state
     activeDropdownTarget.value = null;
  };

  const removeDynamicInput = (portId, type = 'input') => {
    if (!selectedNode.value) return;
    scriptStore.removeNodePort(selectedNode.value._id, type, portId);
  };

  return {
    selectedNode,
    scriptStore,
    bindNodeProp,
    deleteSelectedNode,
    isInputConnected,
    
    // Dynamic Port API
    activeDropdownTarget,
    availableOptions,
    handleAddPort,
    addFromDropdown,
    removeDynamicInput
  };
}