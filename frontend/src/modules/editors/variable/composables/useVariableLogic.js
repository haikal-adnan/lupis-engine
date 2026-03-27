import { computed } from 'vue';
import { useScriptStore } from '@/stores/useScriptStore';
import { useProjectStore } from '@/stores/useProjectStore';
import { GenerateUUID } from '@/commons/utils/generateUUID.js';
import { getVarColor } from '@editors/variable/parts/VariableConfig.js';
import { usePopAlert } from '@/composables/usePopAlert';

export function useVariableLogic(scopeProps) {
  const scriptStore = useScriptStore();
  const projectStore = useProjectStore();
  const { showPop } = usePopAlert();

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

  const syncNodesWithVariable = (updatedVar) => {
    if (!scriptStore.activeScript) return;

    const { _id, name, type } = updatedVar;
    const newColor = getVarColor(type);
    const newDataType = type.toLowerCase();

    const nodes = scriptStore.activeScript.nodes;
    const relatedNodes = nodes.filter(n => n.data?.variableId === _id);

    if (relatedNodes.length === 0) return;

    relatedNodes.forEach(node => {
      const isSetter = node.type === 'variable_set';
      const newTitle = isSetter ? `Set ${name}` : `Get ${name}`;

      node.label = newTitle;
      if (node.settings) {
        node.settings.headerTitle = newTitle;
        node.settings.headerColor = newColor;
      }

      if (node.inputs) {
        node.inputs.forEach(inp => {
          if (inp.dataType !== 'execution') {
            inp.dataType = newDataType;
            inp.color = newColor;
          }
        });
      }

      if (node.outputs) {
        node.outputs.forEach(out => {
          if (out.dataType !== 'execution') {
            out.dataType = newDataType;
            out.color = newColor;
          }
        });
      }
    });

    scriptStore.saveActiveScript();
  };

  const addVariable = () => {
    let baseName = 'NewVar';
    let counter = 1;
    let potentialName = baseName;
    
    while (variables.value.some(v => v.name === potentialName)) {
      potentialName = `${baseName}_${counter}`;
      counter++;
    }

    const newList = [
      ...variables.value,
      {
        _id: GenerateUUID(),
        name: potentialName, 
        type: 'String',
        defaultValue: ''
      }
    ];
    saveList(newList);
  };

  const updateVariable = (index, key, value) => {
    const newList = JSON.parse(JSON.stringify(variables.value));
    const targetVar = newList[index];

    if (key === 'name') {
      const validPattern = /^[a-zA-Z0-9_]+$/;
      
      if (!value || value.trim() === '') {
        showPop({ title: 'Invalid Name', message: 'Variable name cannot be empty.', type: 'warning', duration: 3000 });
        return; 
      }
      if (!validPattern.test(value)) {
        showPop({ title: 'Invalid Character', message: 'Use only letters (A-Z), numbers (0-9), and underscores (_). No spaces.', type: 'warning', duration: 3000 });
        return;
      }
      const isDuplicate = newList.some((v, i) => i !== index && v.name === value);
      if (isDuplicate) {
        showPop({ title: 'Duplicate Name', message: `Variable name "${value}" is already taken.`, type: 'error', duration: 3000 });
        return;
      }
    }

    if (key === 'type' && targetVar.type !== value) {
      if (value === 'Boolean') targetVar.defaultValue = false;
      else if (value === 'Number') targetVar.defaultValue = 0;
      else if (value === 'Vector') targetVar.defaultValue = { x: 0, y: 0 };
      else if (value === 'List') targetVar.defaultValue = []; 
      else if (value === 'Map') targetVar.defaultValue = {}; 
      else targetVar.defaultValue = '';
    }

    targetVar[key] = value;
    saveList(newList);

    if (key === 'name' || key === 'type') {
      syncNodesWithVariable(targetVar);
    }
  };

  const duplicateVariable = (index) => {
    const item = variables.value[index];
    const copy = JSON.parse(JSON.stringify(item));
    copy._id = GenerateUUID();
    
    let baseName = `${copy.name}_copy`;
    let potentialName = baseName;
    let counter = 1;

    while (variables.value.some(v => v.name === potentialName)) {
      potentialName = `${baseName}_${counter}`;
      counter++;
    }
    copy.name = potentialName;

    const newList = [...variables.value];
    newList.splice(index + 1, 0, copy);
    saveList(newList);
  };

  const deleteVariable = (index) => {
    const newList = [...variables.value];
    newList.splice(index, 1);
    saveList(newList);
  };

  const onDragStart = (event, variable) => {
    const payload = { ...variable, scope: scopeProps };
    event.dataTransfer.setData('application/script-variable', JSON.stringify(payload));
    event.dataTransfer.effectAllowed = 'copy';
  };

  const addNodeToCanvas = (variable, mode, centerPos = null) => {
    if (!scriptStore.activeScript) return;

    const isSetter = mode === 'Set';
    const varType = variable.type.toLowerCase();
    const varColor = getVarColor(variable.type);

    console.log(centerPos)

    const finalPosition = centerPos || { x: 0, y: 0 };

    const newNodePayload = {
      _id: GenerateUUID(),
      type: isSetter ? 'variable_set' : 'variable_get',
      label: isSetter ? `Set ${variable.name}` : `Get ${variable.name}`,
      position: finalPosition,
      data: { variableId: variable._id, scope: scopeProps },
      settings: {
        headerTitle: isSetter ? `Set ${variable.name}` : `Get ${variable.name}`,
        headerColor: varColor,
        category: 'Variable'
      },
      inputs: isSetter ? [
        { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#fff' },
        { _id: 'val_in', label: 'Value', dataType: varType, color: varColor }
      ] : [],
      outputs: isSetter ? [
        { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#fff' },
        { _id: 'val_out', label: 'Value', dataType: varType, color: varColor }
      ] : [
        { _id: 'val_out', label: 'Value', dataType: varType, color: varColor }
      ]
    };

    scriptStore.addNodeToActive(newNodePayload);
  };

  return {
    variables,
    addVariable,
    updateVariable,
    duplicateVariable,
    deleteVariable,
    onDragStart,
    addNodeToCanvas,
    getVarColor
  };
}