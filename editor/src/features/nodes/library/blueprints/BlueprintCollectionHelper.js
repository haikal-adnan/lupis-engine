import { 
  ListTree, 
  Network, 
  Copy, 
  BoxSelect 
} from 'lucide-vue-next';

export const BlueprintCollectionHelper = {
  id: 'helper_list_map',
  label: 'Collection Helpers',
  color: '#673AB7', 
  icon: Network,
  items: [
    { 
      type: 'get_from_path', 
      label: 'Get From Path', 
      description: 'Retrieves nested data using a path string (e.g., players[0].stats.hp).',
      icon: ListTree,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Get Path', headerColor: '#673AB7', category: 'Helper' },
        data: {
          values: { path: "" },
          code: `const collection = inputs['Collection (List/Map)'] ?? inputs.collection;
const pathString = inputs['Path 0'] ?? inputs.path_in;

if (!collection || !pathString) {
  outputs.result = collection ?? null;
  outputs.Value = outputs.result;
  return;
}

try {
  const parts = String(pathString).split(/[.\\[\\]]+/).filter(Boolean);
  let current = collection;

  for (const part of parts) {
    if (current === null || current === undefined) {
      current = null;
      break;
    }

    if (Array.isArray(current)) {
      const idx = parseInt(part, 10);
      if (isNaN(idx) || idx < 0 || idx >= current.length) {
        current = null;
        break;
      }
      current = current[idx];
    } else if (typeof current === 'object') {
      if (!(part in current)) {
        current = null;
        break;
      }
      current = current[part];
    } else {
      current = null;
      break;
    }
  }

  outputs.result = current !== undefined ? current : null;
  outputs.Value = outputs.result;
} catch (err) {
  outputs.result = null;
  outputs.Value = null;
}
return;`
        },
        inputs: [
          { id: 'collection', label: 'Collection (List/Map)', dataType: 'any', color: '#673AB7' },
          { id: 'path_in', label: 'Path 0', dataType: 'string', color: '#FFB74D' }
        ], 
        outputs: [
          { id: 'result', label: 'Value', dataType: 'any', color: '#FFFFFF' }
        ]
      } 
    },
    { 
      type: 'set_from_path', 
      label: 'Set From Path', 
      description: 'Updates nested data using a path. If the path does not exist, it will be automatically created.',
      icon: Network,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Set Path', headerColor: '#673AB7', category: 'Helper' },
        data: {
          values: { path: "", value: "" },
          code: `const collection = inputs['Collection (List/Map)'] ?? inputs.collection;
const pathString = inputs['Path String'] ?? inputs.path_in;
const newValue = inputs['New Value'] ?? inputs.value;

outputs.exec_out = true;
outputs.Out = true;

if (!collection || typeof collection !== 'object' || !pathString) {
  outputs.collection_out = collection ?? null;
  outputs.Collection = outputs.collection_out;
  outputs.value_out = null;
  outputs.Value = null;
  return;
}

try {
  const parts = String(pathString).split(/[.\\[\\]]+/).filter(Boolean);

  if (parts.length > 0) {
    let current = collection;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];

      if (current[part] === undefined || current[part] === null) {
        const nextPart = parts[i + 1];
        const isNextIndex = !isNaN(parseInt(nextPart, 10));
        current[part] = isNextIndex ? [] : {};
      }

      current = current[part];

      if (typeof current !== 'object') {
        throw new Error('Cannot traverse through primitive value');
      }
    }

    const lastPart = parts[parts.length - 1];

    if (Array.isArray(current)) {
      const idx = parseInt(lastPart, 10);
      if (!isNaN(idx) && idx >= 0) {
        current[idx] = newValue;
      }
    } else {
      current[lastPart] = newValue;
    }
  }

  outputs.collection_out = collection;
  outputs.Collection = collection;
  outputs.value_out = newValue;
  outputs.Value = newValue;
} catch (err) {
  outputs.collection_out = collection;
  outputs.Collection = collection;
  outputs.value_out = null;
  outputs.Value = null;
}
return;`
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'collection', label: 'Collection (List/Map)', dataType: 'any', color: '#673AB7' },
          { id: 'path_in', label: 'Path String', dataType: 'string', color: '#FFB74D' },
          { id: 'value', label: 'New Value', dataType: 'any', color: '#FFFFFF' }
        ], 
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { id: 'collection_out', label: 'Collection', dataType: 'any', color: '#673AB7' },
          { id: 'value_out', label: 'Value', dataType: 'any', color: '#FFFFFF' }
        ]
      } 
    },
    { 
      type: 'clone_collection', 
      label: 'Clone Collection', 
      description: 'Duplicates (Deep Copy) a List or Map so the original reference remains unchanged when modified.',
      icon: Copy,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Clone Data', headerColor: '#673AB7', category: 'Helper' },
        data: {
          code: `const collection = inputs['Input Collection'] ?? inputs.collection;

if (collection === undefined || collection === null) {
  outputs.cloned = collection;
  outputs['Cloned Collection'] = collection;
  return;
}

try {
  const clonedData = JSON.parse(JSON.stringify(collection));
  outputs.cloned = clonedData;
  outputs['Cloned Collection'] = clonedData;
} catch (err) {
  outputs.cloned = collection;
  outputs['Cloned Collection'] = collection;
}
return;`
        },
        inputs: [
          { id: 'collection', label: 'Input Collection', dataType: 'any', color: '#673AB7' }
        ], 
        outputs: [
          { id: 'cloned', label: 'Cloned Collection', dataType: 'any', color: '#673AB7' }
        ]
      } 
    },
    { 
      type: 'is_collection_empty', 
      label: 'Is Empty', 
      description: 'Checks whether a List is empty (length 0) or a Map is empty (has no keys).',
      icon: BoxSelect,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Is Empty', headerColor: '#673AB7', category: 'Helper' },
        data: {
          code: `const collection = inputs.Collection ?? inputs.collection;

if (!collection) {
  outputs.result = true;
  outputs['Is Empty'] = true;
  return;
}

if (Array.isArray(collection)) {
  const isEmpty = collection.length === 0;
  outputs.result = isEmpty;
  outputs['Is Empty'] = isEmpty;
  return;
}

if (typeof collection === 'object') {
  const isEmpty = Object.keys(collection).length === 0;
  outputs.result = isEmpty;
  outputs['Is Empty'] = isEmpty;
  return;
}

outputs.result = false;
outputs['Is Empty'] = false;
return;`
        },
        inputs: [
          { id: 'collection', label: 'Collection', dataType: 'any', color: '#673AB7' }
        ], 
        outputs: [
          { id: 'result', label: 'Is Empty', dataType: 'boolean', color: '#4CAF50' }
        ]
      } 
    }
  ]
};