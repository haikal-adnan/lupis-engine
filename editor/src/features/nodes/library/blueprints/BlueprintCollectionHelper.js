import { Network } from 'lucide-vue-next';

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
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Get Path',
          headerColor: '#673AB7',
          category: 'Collection Helpers'
        },
        inputs: [
          { id: 'collection', label: 'Collection (List/Map)', dataType: 'any', color: '#B0BEC5' },
          { id: 'path_in', label: 'Path', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'result', label: 'Value', dataType: 'any', color: '#B0BEC5' }
        ],
        data: {
          values: { path_in: '' },
          code: 
`const collection = inputs['Collection (List/Map)'] ?? inputs['collection'];
const pathString = inputs['Path'] ?? inputs['path_in'];

if (!collection || !pathString) {
  const fallbackVal = collection ?? null;
  outputs['Value'] = fallbackVal;
  outputs['result'] = fallbackVal;
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

  const finalVal = current !== undefined ? current : null;
  outputs['Value'] = finalVal;
  outputs['result'] = finalVal;
} catch (err) {
  outputs['Value'] = null;
  outputs['result'] = null;
}
return;`
        }
      }
    },
    {
      type: 'set_from_path',
      label: 'Set From Path',
      description: 'Updates nested data using a path. If the path does not exist, it will be automatically created.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Set Path',
          headerColor: '#673AB7',
          category: 'Collection Helpers'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'collection', label: 'Collection (List/Map)', dataType: 'any', color: '#B0BEC5' },
          { id: 'path_in', label: 'Path String', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'value', label: 'New Value', dataType: 'any', color: '#B0BEC5' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { id: 'collection_out', label: 'Collection', dataType: 'any', color: '#B0BEC5' },
          { id: 'value_out', label: 'Value', dataType: 'any', color: '#B0BEC5' }
        ],
        data: {
          values: { path_in: '', value: '' },
          code: 
`const collection = inputs['Collection (List/Map)'] ?? inputs['collection'];
const pathString = inputs['Path String'] ?? inputs['path_in'];
const newValue = inputs['New Value'] ?? inputs['value'];

outputs['Out'] = true;
outputs['exec_out'] = true;

if (!collection || typeof collection !== 'object' || !pathString) {
  const fallbackCol = collection ?? null;
  outputs['Collection'] = fallbackCol;
  outputs['collection_out'] = fallbackCol;
  outputs['Value'] = null;
  outputs['value_out'] = null;
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

  outputs['Collection'] = collection;
  outputs['collection_out'] = collection;
  outputs['Value'] = newValue;
  outputs['value_out'] = newValue;
} catch (err) {
  outputs['Collection'] = collection;
  outputs['collection_out'] = collection;
  outputs['Value'] = null;
  outputs['value_out'] = null;
}
return;`
        }
      }
    },
    {
      type: 'clone_collection',
      label: 'Clone Collection',
      description: 'Duplicates (Deep Copy) a List or Map so the original reference remains unchanged when modified.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Clone Data',
          headerColor: '#673AB7',
          category: 'Collection Helpers'
        },
        inputs: [
          { id: 'collection', label: 'Input Collection', dataType: 'any', color: '#B0BEC5' }
        ],
        outputs: [
          { id: 'cloned', label: 'Cloned Collection', dataType: 'any', color: '#B0BEC5' }
        ],
        data: {
          code: 
`const collection = inputs['Input Collection'] ?? inputs['collection'];

if (collection === undefined || collection === null) {
  outputs['Cloned Collection'] = collection;
  outputs['cloned'] = collection;
  return;
}

try {
  const clonedData = JSON.parse(JSON.stringify(collection));
  outputs['Cloned Collection'] = clonedData;
  outputs['cloned'] = clonedData;
} catch (err) {
  outputs['Cloned Collection'] = collection;
  outputs['cloned'] = collection;
}
return;`
        }
      }
    },
    {
      type: 'is_collection_empty',
      label: 'Is Empty',
      description: 'Checks whether a List is empty (length 0) or a Map is empty (has no keys).',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Is Empty',
          headerColor: '#673AB7',
          category: 'Collection Helpers'
        },
        inputs: [
          { id: 'collection', label: 'Collection', dataType: 'any', color: '#B0BEC5' }
        ],
        outputs: [
          { id: 'result', label: 'Is Empty', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          code: 
`const collection = inputs['Collection'] ?? inputs['collection'];

if (!collection) {
  outputs['Is Empty'] = true;
  outputs['result'] = true;
  return;
}

if (Array.isArray(collection)) {
  const isEmpty = collection.length === 0;
  outputs['Is Empty'] = isEmpty;
  outputs['result'] = isEmpty;
  return;
}

if (typeof collection === 'object') {
  const isEmpty = Object.keys(collection).length === 0;
  outputs['Is Empty'] = isEmpty;
  outputs['result'] = isEmpty;
  return;
}

outputs['Is Empty'] = false;
outputs['result'] = false;
return;`
        }
      }
    }
  ]
};