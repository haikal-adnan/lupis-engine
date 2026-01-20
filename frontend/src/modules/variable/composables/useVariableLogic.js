// src/modules/script/composables/useVariableLogic.js
import { computed } from 'vue';
import { useScriptStore } from '@/stores/useScriptStore';
import { useProjectStore } from '@/stores/useProjectStore';

export function useVariableLogic(scopeProps) {
  const scriptStore = useScriptStore();
  const projectStore = useProjectStore();

  const getTypeColor = (type) => {
    switch (type) {
      case 'String': return '#9c27b0';
      case 'Number': return '#00e676';
      case 'Boolean': return '#f44336';
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
    const newList = [...variables.value, { name: 'NewVar', type: 'String', defaultValue: '' }];
    saveList(newList);
  };

  const updateVariable = (index, key, value) => {
    const newList = JSON.parse(JSON.stringify(variables.value));
    
    // Reset defaultValue sederhana
    if (key === 'type' && newList[index].type !== value) {
        if (value === 'Boolean') newList[index].defaultValue = false;
        else if (value === 'Number') newList[index].defaultValue = 0;
        else newList[index].defaultValue = "";
    }
    
    newList[index][key] = value;
    saveList(newList);
  };

  const duplicateVariable = (index) => {
    const item = variables.value[index];
    const copy = JSON.parse(JSON.stringify(item));
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

  const onDragStart = (event, variable) => {
    const payload = { ...variable, scope: scopeProps };
    event.dataTransfer.setData('application/script-variable', JSON.stringify(payload));
    event.dataTransfer.effectAllowed = 'copy';
  };

  return {
    variables,
    addVariable,
    updateVariable,
    duplicateVariable,
    deleteVariable,
    onDragStart,
    getTypeColor
  };
}