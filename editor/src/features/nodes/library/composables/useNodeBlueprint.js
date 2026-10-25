import { ref, computed } from 'vue';
import { Cpu } from 'lucide-vue-next';
import { ALL_BLUEPRINTS, findBlueprintByType, BlueprintCustom, CUSTOM_NODE_TEMPLATE } from '../blueprints/index.js';
import { useProjectStore } from '@projects/projects.js';
import { GenerateUUID } from '@utils/utils.js';

// Factory creating a custom script node instance with default ports and boilerplate code
export function createCustomNodeInstance(position = { x: 100, y: 100 }) {
  return {
    id: GenerateUUID(),
    type: 'customScript',
    name: 'Custom Node',
    label: 'Custom Node',
    role: 'action',
    isCustomScript: true,
    position: { ...position },
    inputs: [
      { id: 'execIn', dataType: 'execution', color: '#FFFFFF' }
    ],
    outputs: [
      { id: 'execOut', dataType: 'execution', color: '#FFFFFF' }
    ],
    settings: {
      headerTitle: 'Custom Node',
      headerColor: '#8B5CF6',
      category: 'Custom',
      description: 'Custom script node with user-defined ports, parameters, and executable logic.'
    },
    data: {
      values: {},
      code: 'return;'
    }
  };
}

// Manages blueprint library categories, custom blueprints, search filtering, and node dragging
export function useNodeBlueprint() {
  const searchQuery = ref('');
  const projectStore = useProjectStore();

  const nodeGroups = [...ALL_BLUEPRINTS].sort((a, b) => a.label.localeCompare(b.label));

  const customGroup = computed(() => {
    let customList = [];
    try {
      customList = projectStore.activeProject?.customBlueprints || [];
    } catch {
      customList = [];
    }
    return {
      id: 'custom',
      label: 'Custom',
      color: '#8B5CF6',
      icon: Cpu,
      items: customList
    };
  });

  const libraryGroups = computed(() => {
    return [customGroup.value, ...nodeGroups];
  });

  const filteredGroups = computed(() => {
    const groups = libraryGroups.value;
    if (!searchQuery.value) return groups;
    
    const q = searchQuery.value.toLowerCase();
    
    return groups.map(g => ({
      ...g,
      items: g.items.filter(i => i.label.toLowerCase().includes(q))
    })).filter(g => g.items.length > 0);
  });

  const onDragNode = (event, item) => {
    event.dataTransfer.setData('application/node-template', JSON.stringify(item));
    event.dataTransfer.effectAllowed = 'copy';
  };

  const getNodeBlueprint = (type) => {
    if (type === 'customScript') {
      return CUSTOM_NODE_TEMPLATE;
    }
    try {
      const custom = projectStore.activeProject?.customBlueprints?.find(b => b.type === type);
      if (custom) return custom;
    } catch {
      // Safe fallback if store is not in Pinia context
    }
    return findBlueprintByType(type);
  };

  const getDefaultValueByDataType = (dataType) => {
    const type = String(dataType || '').toLowerCase();
    if (type === 'number' || type === 'float' || type === 'int') return 0;
    if (type === 'boolean' || type === 'bool') return false;
    return '';
  };

  // Re-indexes data input ports and regenerates the collection array in generated code
  const syncDynamicInputsAndCode = (node) => {
    if (!node || !Array.isArray(node.inputs)) return;
    if (['stringFormat', 'batchSet', 'mathChain', 'eventOnKey', 'eventAdvancedKey', 'logicSwitch'].includes(node.type)) return;

    if (!node.data) node.data = {};
    if (!node.data.values) node.data.values = {};

    const execInputs = node.inputs.filter(p => {
      const dType = String(p.dataType || '').toLowerCase();
      return dType === 'execution';
    });

    const dataInputs = node.inputs.filter(p => {
      const dType = String(p.dataType || '').toLowerCase();
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
    libraryGroups,
    customGroup,
    searchQuery,
    filteredGroups,
    onDragNode,
    getNodeBlueprint,
    syncDynamicInputsAndCode
  };
}
