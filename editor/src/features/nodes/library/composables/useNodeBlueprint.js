import { ref, computed } from 'vue';
import { ALL_BLUEPRINTS, findBlueprintByType } from '../blueprints/index.js';

export function useNodeBlueprint() {
  const searchQuery = ref('');

  const nodeGroups = [...ALL_BLUEPRINTS].sort((a, b) => a.label.localeCompare(b.label));

  const filteredGroups = computed(() => {
    if (!searchQuery.value) return nodeGroups;
    
    const q = searchQuery.value.toLowerCase();
    
    return nodeGroups.map(g => ({
      ...g,
      items: g.items.filter(i => i.label.toLowerCase().includes(q))
    })).filter(g => g.items.length > 0);
  });

  const onDragNode = (event, item) => {
    event.dataTransfer.setData('application/node-template', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'copy';
  };

  const getNodeBlueprint = (type) => {
    return findBlueprintByType(type);
  };

  const getDefaultValueByDataType = (dataType) => {
    const type = String(dataType || '').toLowerCase();
    if (type === 'number' || type === 'float' || type === 'int') return 0;
    if (type === 'boolean' || type === 'bool') return false;
    return '';
  };

  const syncDynamicInputsAndCode = (node) => {
    if (!node || !Array.isArray(node.inputs)) return;

    if (!node.data) node.data = {};
    if (!node.data.values) node.data.values = {};

    const execInputs = node.inputs.filter(p => {
      const dType = String(p.dataType || '').toLowerCase();
      const pId = String(p.id || '').toLowerCase();
      return dType === 'execution';
    });

    const dataInputs = node.inputs.filter(p => {
      const dType = String(p.dataType || '').toLowerCase();
      const pId = String(p.id || '').toLowerCase();
      return dType !== 'execution';
    });

    const newValues = {};

    const cleanedExecInputs = execInputs.map((port) => {
      const { label, ...rest } = port;
      return rest;
    });

    const reindexedDataInputs = dataInputs.map((port, index) => {
      const portId = `v${index}`;
      
      const existingValue = node.data.values[port.id] ?? node.data.values[portId];
      newValues[portId] = existingValue !== undefined ? existingValue : getDefaultValueByDataType(port.dataType);

      const { label, ...rest } = port;
      return {
        ...rest,
        id: portId
      };
    });

    node.inputs = [...cleanedExecInputs, ...reindexedDataInputs];
    node.data.values = newValues;

    const constDeclarations = reindexedDataInputs.map((port, index) => {
      const varName = `val${index + 1}`;
      return `const ${varName} = inputs.${port.id};`;
    });

    const varNames = reindexedDataInputs.map((_, index) => `val${index + 1}`);
    const collectionLine = `const collection = [${varNames.join(', ')}];`;

    const blueprintItem = getNodeBlueprint(node.type);
    const baseCode = blueprintItem?.defaultData?.data?.code || node.data?.code || '';

    let bodyLogic = '';
    const collectionIndex = baseCode.indexOf('const collection =');
    if (collectionIndex !== -1) {
      const afterCollection = baseCode.substring(collectionIndex);
      bodyLogic = afterCollection.substring(afterCollection.indexOf('\n') + 1);
    } else {
      bodyLogic = baseCode;
    }

    node.data.code = `${constDeclarations.join('\n')}

${collectionLine}

${bodyLogic.trim()}`;
  };

  return {
    nodeGroups,
    searchQuery,
    filteredGroups,
    onDragNode,
    getNodeBlueprint,
    syncDynamicInputsAndCode
  };
}