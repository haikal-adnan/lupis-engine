import { computed, unref } from 'vue';
import { useScriptStore } from '@scripts/scripts.js';
import { useProjectStore } from '@projects/projects.js';
import { GenerateUUID, sanitizeScriptId, getValidUniqueScriptId, isScriptIdDuplicate } from '@utils/utils.js';
import { useVariableConfig } from '@nodes/nodes.js';
import { usePopAlert } from '@composables/composables.js';
import { useScriptHistory } from '@historys/historys.js';

// Manages variable definitions, collections, drag-and-drop, and variable node instantiation
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
      projectStore.updateProject({ globalVariables: newList });
    } else {
      if (!scriptStore.activeScript) return;
      
      recordLocalVariableChange(oldList, newList);
      
      scriptStore.updateScriptInList(scriptStore.activeScript.id, { localVariables: newList });
      projectStore.markAsDirty();
    }
  };

  const beginEditVariable = () => {
    startTransaction();
  };

  const commitEditVariable = (delay = 150) => {
    endTransactionWithDelay(delay);
  };

  const addVariable = (customType = 'String') => {
    const currentVars = variables.value;
    const potentialName = getValidUniqueScriptId('NewVar', currentVars, v => v.name);

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

  // Updates variable property and syncs referencing canvas nodes
  const updateVariable = (indexOrId, key, value) => {
    const newList = JSON.parse(JSON.stringify(variables.value));
    let targetIndex = typeof indexOrId === 'number' ? indexOrId : newList.findIndex(v => v.id === indexOrId);
    if (targetIndex < 0 || targetIndex >= newList.length) {
      targetIndex = newList.findIndex(v => v.id === indexOrId);
    }
    const targetVar = newList[targetIndex];
    if (!targetVar) return;

    if (targetVar[key] === value) return;

    if (key === 'name') {
      const sanitized = sanitizeScriptId(value, targetVar.name);
      if (isScriptIdDuplicate(sanitized, variables.value, v => v.name, targetVar.id)) {
        showPop({ 
          title: 'Duplicate Variable', 
          message: `Variable "${sanitized}" already exists in ${getScope()} scope.`, 
          type: 'warning' 
        });
        return;
      }
      targetVar.name = sanitized;
    } else if (key === 'type') {
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

  // Syncs all canvas getter/setter nodes bound to the updated variable
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
      const isGet = node.type === 'variableGet' || node.type === 'variable_get';
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
          ? `outputs.value = context.${getMethod}('${name}');\nreturn;`
          : `const val = inputs.value;
context.${setMethod}('${name}', val);
outputs.valueOut = val;
outputs.execOut = true;
return;`;
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

  const duplicateVariable = (indexOrId) => {
    let idx = typeof indexOrId === 'number' ? indexOrId : variables.value.findIndex(v => v.id === indexOrId);
    if (idx < 0 || idx >= variables.value.length) {
      idx = variables.value.findIndex(v => v.id === indexOrId);
    }
    const item = variables.value[idx];
    if (!item) return;

    const copy = JSON.parse(JSON.stringify(item));
    copy.id = GenerateUUID();
    copy.name = getValidUniqueScriptId(`${copy.name}_copy`, variables.value, v => v.name, copy.id);

    const newList = [...variables.value];
    newList.splice(idx + 1, 0, copy);
    saveList(newList);
    return copy;
  };

  const deleteVariable = (indexOrId) => {
    let idx = typeof indexOrId === 'number' ? indexOrId : variables.value.findIndex(v => v.id === indexOrId);
    if (idx < 0 || idx >= variables.value.length) {
      idx = variables.value.findIndex(v => v.id === indexOrId);
    }
    if (idx === -1) return;
    const newList = [...variables.value];
    newList.splice(idx, 1);
    saveList(newList);
  };

  const reorderVariables = (fromIndex, toIndex) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    const newList = [...variables.value];
    if (fromIndex >= newList.length || toIndex >= newList.length) return;
    const [movedItem] = newList.splice(fromIndex, 1);
    newList.splice(toIndex, 0, movedItem);
    saveList(newList);
  };

  const onDragStart = (event, variable, actionType = 'variableGet') => {
    const payload = { 
      ...variable, 
      id: variable.id || variable._id,
      scope: getScope(),
      actionType: actionType
    };

    event.dataTransfer.setData('application/script-variable', JSON.stringify(payload));
    event.dataTransfer.effectAllowed = 'copy';
  };

  // Spawns a variable getter or setter node directly onto the canvas
  const addNodeToCanvas = (variable, pos = null, actionType = 'variableGet', isScreenPos = false) => {
    if (!scriptStore.activeScript) {
      showPop({
        title: 'No Active Script',
        message: 'Open a visual script in the editor first to add variable nodes.',
        type: 'warning'
      });
      return null;
    }

    const isGet = actionType === 'variableGet' || actionType === 'variable_get';
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
    } else if (scriptStore.camera) {
      const cam = scriptStore.camera;
      const baseX = Math.round((400 - cam.x) / cam.scale) - 100;
      const baseY = Math.round((300 - cam.y) / cam.scale) - 50;
      let targetPos = { x: baseX, y: baseY };
      const nodes = scriptStore.activeScript.nodes || [];
      let offset = 0;
      while (nodes.some(n => Math.abs(n.position.x - targetPos.x) < 25 && Math.abs(n.position.y - targetPos.y) < 25) && offset < 10) {
        offset++;
        targetPos.x += 30;
        targetPos.y += 30;
      }
      finalPosition = targetPos;
    }

    const getMethod = scope === 'Global' ? 'getGlobal' : 'getLocal';
    const setMethod = scope === 'Global' ? 'setGlobal' : 'setLocal';

    const nodeCode = isGet
      ? `outputs.value = context.${getMethod}('${varName}');\nreturn;`
      : `const val = inputs.value;\ncontext.${setMethod}('${varName}', val);\noutputs.valueOut = val;\noutputs.execOut = true;\nreturn;`;

    const cleanDefaultValue = sanitizeVariableValue(variable.defaultValue, variable.type);

    const newNodePayload = {
      id: GenerateUUID(),
      type: actionType,
      label: isGet ? `Get ${varName}` : `Set ${varName}`,
      dynamicData: null,
      position: finalPosition,
      data: { 
        scope: scope,
        variableId: varId,
        variableName: varName,
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
        { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
        { id: 'value', label: varName, dataType: varType, color: varColor }
      ],
      outputs: isGet ? [
        { id: 'value', label: varName, dataType: varType, color: varColor }
      ] : [
        { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
        { id: 'valueOut', label: varName, dataType: varType, color: varColor }
      ]
    };

    scriptStore.addNodeToActive(newNodePayload);
    
    if (typeof recordAddNode === 'function') {
      recordAddNode(newNodePayload);
    }

    return newNodePayload;
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
