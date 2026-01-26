import { computed } from 'vue';
import { useScriptStore } from '@/stores/useScriptStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { GenerateUUID } from '@/commons/utils/generateUUID.js';

export function useVariableLogic(scopeProps) {
  const scriptStore = useScriptStore();
  const projectStore = useProjectStore();

  const getTypeColor = (type) => {
    switch (type) {
      case 'String': return '#9c27b0';
      case 'Number': return '#00e676';
      case 'Boolean': return '#f44336';
      case 'Vector': return '#FFC107';
      default: return '#777';
    }
  };

  const variables = computed(() => {
    if (scopeProps === 'Global') {
      return projectStore.activeProject?.globalVariables || [];
    }
    return scriptStore.activeScript?.exposedVariables || [];
  });

  const saveList = (newList) => {
    if (scopeProps === 'Global') {
      projectStore.updateProject(projectStore.activeProject._id, { globalVariables: newList });
    } else {
      scriptStore.updateScriptInList(scriptStore.activeScript._id, { exposedVariables: newList });
    }
  };

  const addVariable = () => {
    const newList = [
      ...variables.value, 
      { 
        _id: GenerateUUID(), 
        name: 'NewVar', 
        type: 'String', 
        defaultValue: '' 
      }
    ];
    saveList(newList);
  };

  const updateVariable = (index, key, value) => {
    const newList = JSON.parse(JSON.stringify(variables.value));
    
    if (key === 'type' && newList[index].type !== value) {
        if (value === 'Boolean') newList[index].defaultValue = false;
        else if (value === 'Number') newList[index].defaultValue = 0;
        else if (value === 'Vector') newList[index].defaultValue = { x:0, y:0 };
        else newList[index].defaultValue = "";
    }
    
    newList[index][key] = value;
    saveList(newList);
  };

  const duplicateVariable = (index) => {
    const item = variables.value[index];
    const copy = JSON.parse(JSON.stringify(item));
    copy._id = GenerateUUID();
    copy.name = `${copy.name}_copy`;
    const newList = [...variables.value];
    newList.splice(index + 1, 0, copy);
    saveList(newList);
  };

  const deleteVariable = (index) => {
    if(!confirm('Delete variable?')) return;
    const newList = [...variables.value];
    newList.splice(index, 1);
    saveList(newList);
  };

  // --- LOGIC BARU: DRAG & CLICK ADD ---

  const onDragStart = (event, variable) => {
    const payload = { ...variable, scope: scopeProps };
    // Set ghost image effect agar terlihat seperti menarik kotak
    // (Opsional: Browser modern biasanya otomatis membuat snapshot elemen)
    event.dataTransfer.setData('application/script-variable', JSON.stringify(payload));
    event.dataTransfer.effectAllowed = 'copy';
  };

  // Fungsi untuk menambahkan node langsung lewat tombol menu (tanpa drag)
  const addNodeToCanvas = (variable, mode) => {
    if (!scriptStore.activeScript) return;

    const isSetter = mode === 'Set';
    // Posisi Default (bisa diatur agar di tengah layar jika punya akses camera info)
    // Untuk sekarang kita taruh di offset statis agar terlihat
    const defaultPos = { x: 100 + (Math.random() * 50), y: 100 + (Math.random() * 50) };
    
    const newNodePayload = {
        _id: GenerateUUID(),
        type: isSetter ? 'variable_set' : 'variable_get',
        label: isSetter ? `Set ${variable.name}` : `Get ${variable.name}`,
        position: defaultPos,
        data: {
            variableId: variable._id,
            scope: scopeProps // Gunakan scope dari props
        },
        settings: {
            headerTitle: isSetter ? `Set ${variable.name}` : `Get ${variable.name}`,
            headerColor: getTypeColor(variable.type),
            category: 'Variable'
        }
    };

    if (isSetter) {
        newNodePayload.inputs = [
            { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#fff' },
            { _id: 'val_in', label: 'Value', dataType: variable.type.toLowerCase(), color: getTypeColor(variable.type) }
        ];
        newNodePayload.outputs = [
            { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#fff' },
            { _id: 'val_out', label: 'Value', dataType: variable.type.toLowerCase(), color: getTypeColor(variable.type) }
        ];
    } else {
        newNodePayload.inputs = [];
        newNodePayload.outputs = [
            { _id: 'val_out', label: 'Value', dataType: variable.type.toLowerCase(), color: getTypeColor(variable.type) }
        ];
    }

    scriptStore.addNodeToActive(newNodePayload);
  };

  return {
    variables,
    addVariable,
    updateVariable,
    duplicateVariable,
    deleteVariable,
    onDragStart,
    getTypeColor,
    addNodeToCanvas // Export fungsi baru
  };
}