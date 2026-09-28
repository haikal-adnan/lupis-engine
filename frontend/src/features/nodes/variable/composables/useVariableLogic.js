import { computed, unref } from 'vue';
import { useScriptStore } from '@scripts/scripts.js';
import { useProjectStore } from '@projects/projects.js';
import { GenerateUUID } from '@utils/utils.js';
import { useVariableConfig } from '@nodes/nodes.js';
import { usePopAlert } from '@composables/composables.js';
import { useScriptHistory } from '@historys/historys.js';

export function useVariableLogic(scopeProps) {
  const scriptStore = useScriptStore();
  const projectStore = useProjectStore();
  const { showPop } = usePopAlert();
  const { getVarColor, getDefaultValueForType, sanitizeVariableValue } = useVariableConfig();

  const { 
    recordLocalVariableChange, 
    startTransaction, 
    endTransactionWithDelay,
    recordAddNode
  } = useScriptHistory();

  const getScope = () => (typeof scopeProps === 'function' ? scopeProps() : unref(scopeProps));

  const variables = computed(() => {
    const scope = getScope();
    if (scope === 'Global') {
      return projectStore.activeProject?.globalVariables || [];
    }
    return scriptStore.activeScript?.localVariables || [];
  });

  const saveList = (newList) => {
    const scope = getScope();
    const oldList = JSON.parse(JSON.stringify(variables.value));

    if (scope === 'Global') {
      if (!projectStore.activeProject) return;
      projectStore.updateProject(projectStore.activeProject.id, { globalVariables: newList });
    } else {
      if (!scriptStore.activeScript) return;
      
      recordLocalVariableChange(oldList, newList);
      
      scriptStore.updateScriptInList(scriptStore.activeScript.id, { localVariables: newList });
    }
  };

  const beginEditVariable = () => {
    startTransaction();
  };

  const commitEditVariable = (delay = 150) => {
    endTransactionWithDelay(delay);
  };

  const addVariable = (customType = 'String') => {
    let baseName = 'NewVar';
    let counter = 1;
    let potentialName = baseName;
    const currentVars = variables.value;

    while (currentVars.some(v => v.name === potentialName)) {
      potentialName = `${baseName}_${counter}`;
      counter++;
    }

    const rawDefault = getDefaultValueForType(customType);

    const newVar = {
      id: GenerateUUID(),
      name: potentialName, 
      type: customType,
      defaultValue: sanitizeVariableValue(rawDefault, customType),
      isExposed: false
    };

    const newList = [...currentVars, newVar];
    saveList(newList);
    return newVar;
  };

  const updateVariable = (index, key, value) => {
    const newList = JSON.parse(JSON.stringify(variables.value));
    const targetVar = newList[index];
    if (!targetVar) return;

    if (targetVar[key] === value) return;

    if (key === 'type') {
      const cleanType = String(value).toLowerCase();
      targetVar.type = cleanType;
      targetVar.defaultValue = getDefaultValueForType(cleanType);
    } else if (key === 'defaultValue') {
      targetVar.defaultValue = sanitizeVariableValue(value, targetVar.type);
    } else {
      targetVar[key] = value;
    }

    saveList(newList);

    if (key === 'name' || key === 'type') {
      syncNodesWithVariable(targetVar);
    }
  };

  const addListItem = (varIndex, itemType = 'string') => {
    const newList = JSON.parse(JSON.stringify(variables.value));
    const targetVar = newList[varIndex];

    if (targetVar && Array.isArray(targetVar.defaultValue)) {
      const newItemValue = getDefaultValueForType(itemType);
      targetVar.defaultValue.push(newItemValue);
      saveList(newList);
    }
  };

  const updateListItem = (varIndex, itemIndex, newValue) => {
    const newList = JSON.parse(JSON.stringify(variables.value));
    const targetVar = newList[varIndex];

    if (targetVar && Array.isArray(targetVar.defaultValue) && itemIndex >= 0) {
      targetVar.defaultValue[itemIndex] = newValue;
      saveList(newList);
    }
  };

  const removeListItem = (varIndex, itemIndex) => {
    const newList = JSON.parse(JSON.stringify(variables.value));
    const targetVar = newList[varIndex];

    if (targetVar && Array.isArray(targetVar.defaultValue) && itemIndex >= 0) {
      targetVar.defaultValue.splice(itemIndex, 1);
      saveList(newList);
    }
  };

  const setMapEntry = (varIndex, mapKey, mapValue) => {
    if (!mapKey || mapKey.trim() === '') return;

    const newList = JSON.parse(JSON.stringify(variables.value));
    const targetVar = newList[varIndex];

    if (targetVar && targetVar.defaultValue && typeof targetVar.defaultValue === 'object') {
      targetVar.defaultValue[mapKey] = mapValue;
      saveList(newList);
    }
  };

  const removeMapEntry = (varIndex, mapKey) => {
    const newList = JSON.parse(JSON.stringify(variables.value));
    const targetVar = newList[varIndex];

    if (targetVar && targetVar.defaultValue && typeof targetVar.defaultValue === 'object') {
      delete targetVar.defaultValue[mapKey];
      saveList(newList);
    }
  };

  const syncNodesWithVariable = (updatedVar) => {
    if (!scriptStore.activeScript) return;

    const scope = getScope(); 
    const { id, name, type } = updatedVar;
    const newColor = getVarColor(type);
    const newDataType = type.toLowerCase();

    const nodes = scriptStore.activeScript.nodes || [];
    const relatedNodes = nodes.filter(n => n.data?.variableId === id);

    if (relatedNodes.length === 0) return;

    relatedNodes.forEach(node => {
      const isGet = node.type === 'variable_get';
      const newTitle = isGet ? `Get ${name}` : `Set ${name}`;
      
      node.data.scope = scope;

      const getMethod = scope === 'Global' ? 'getGlobal' : 'getLocal';
      const setMethod = scope === 'Global' ? 'setGlobal' : 'setLocal';

      node.label = newTitle;
      if (node.settings) {
        node.settings.headerTitle = newTitle;
        node.settings.headerColor = newColor;
      }

      if (node.data) {
        node.data.code = isGet
          ? `outputs['out_0'] = context.${getMethod}('${name}');\nreturn;`
          : `const val = inputs['val_0'];\ncontext.${setMethod}('${name}', val);\noutputs['out_0'] = val;\noutputs['exec_out'] = true;\nreturn;`;
      }

      if (node.inputs) {
        node.inputs.forEach(inp => {
          if (inp.dataType !== 'execution') {
            inp.dataType = newDataType;
            inp.color = newColor;
            inp.label = name;
          }
        });
      }

      if (node.outputs) {
        node.outputs.forEach(out => {
          if (out.dataType !== 'execution') {
            out.dataType = newDataType;
            out.color = newColor;
            out.label = name;
          }
        });
      }
    });

    scriptStore.saveActiveScript();
  };

  const duplicateVariable = (index) => {
    const item = variables.value[index];
    if (!item) return;

    const copy = JSON.parse(JSON.stringify(item));
    copy.id = GenerateUUID();
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

  const reorderVariables = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;
    const newList = [...variables.value];
    const [movedItem] = newList.splice(fromIndex, 1);
    newList.splice(toIndex, 0, movedItem);
    saveList(newList);
  };

  const onDragStart = (event, variable, actionType = 'variable_get') => {
    const payload = { 
      ...variable, 
      id: variable.id || variable._id,
      scope: getScope(),
      actionType: actionType
    };

    event.dataTransfer.setData('application/script-variable', JSON.stringify(payload));
    event.dataTransfer.effectAllowed = 'copy';
  };

  const addNodeToCanvas = (variable, pos = null, actionType = 'variable_get', isScreenPos = false) => {
    if (!scriptStore.activeScript) return;

    const isGet = actionType === 'variable_get';
    const varType = (variable.type || 'String').toLowerCase();
    const varColor = getVarColor(variable.type);
    const varId = variable.id || variable._id;
    const varName = variable.name || 'Variable';
    const scope = variable.scope || getScope() || 'Local';

    let finalPosition = { x: 0, y: 0 };

    if (pos) {
      if (isScreenPos && scriptStore.camera) {
        const cam = scriptStore.camera;
        finalPosition = {
          x: Math.round((pos.x - cam.x) / cam.scale),
          y: Math.round((pos.y - cam.y) / cam.scale)
        };
      } else {
        finalPosition = pos;
      }
    }

    const getMethod = scope === 'Global' ? 'getGlobal' : 'getLocal';
    const setMethod = scope === 'Global' ? 'setGlobal' : 'setLocal';

    const nodeCode = isGet
      ? `outputs['out_0'] = context.${getMethod}('${varName}');\nreturn;`
      : `const val = inputs['val_0'];\ncontext.${setMethod}('${varName}', val);\noutputs['out_0'] = val;\noutputs['exec_out'] = true;\nreturn;`;

    const cleanDefaultValue = sanitizeVariableValue(variable.defaultValue, variable.type);

    const newNodePayload = {
      id: GenerateUUID(),
      type: actionType,
      label: isGet ? `Get ${varName}` : `Set ${varName}`,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      position: finalPosition,
      data: { 
        scope: scope,
        variableId: varId,
        code: nodeCode,
        items: [
          {
            variableId: varId,
            value: cleanDefaultValue,
            dataType: varType
          }
        ]
      },
      settings: {
        headerTitle: isGet ? `Get ${varName}` : `Set ${varName}`,
        headerColor: varColor,
        category: 'Variable'
      },
      inputs: isGet ? [] : [
        { id: 'exec_in', label: 'In', dataType: 'execution', color: '#fff' },
        { id: 'val_0', label: varName, dataType: varType, color: varColor }
      ],
      outputs: isGet ? [
        { id: 'out_0', label: varName, dataType: varType, color: varColor }
      ] : [
        { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#fff' },
        { id: 'out_0', label: varName, dataType: varType, color: varColor }
      ]
    };

    scriptStore.addNodeToActive(newNodePayload);
    
    if (typeof recordAddNode === 'function') {
      recordAddNode(newNodePayload);
    }
  };

  return {
    variables,
    beginEditVariable,
    commitEditVariable,
    addVariable,
    updateVariable,
    duplicateVariable,
    deleteVariable,
    reorderVariables,
    addListItem,
    updateListItem,
    removeListItem,
    setMapEntry,
    removeMapEntry,
    onDragStart,
    addNodeToCanvas,
    getVarColor
  };
}