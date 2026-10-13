import { Braces } from 'lucide-vue-next';

export const BlueprintMap = {
  id: 'map_manipulation',
  label: 'Map Operations',
  color: '#FF8A65',
  icon: Braces,
  items: [
    {
      type: 'map_get',
      label: 'Map Get',
      description: 'Retrieves a value from the Map based on its key.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Get',
          headerColor: '#FF8A65',
          category: 'Map Operations'
        },
        inputs: [
          { id: 'map', label: 'Map', dataType: 'map', color: '#FF8A65' },
          { id: 'key', label: 'Key', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'value', label: 'Value', dataType: 'any', color: '#B0BEC5' }
        ],
        data: {
          values: { key: '' },
          code: 
`const mapData = inputs['Map'] ?? inputs['map'];
const key = inputs['Key'] ?? inputs['key'];

let result = null;
if (mapData && typeof mapData === 'object' && key != null && key !== '') {
  result = mapData[key] !== undefined ? mapData[key] : null;
}

outputs['Value'] = result;
outputs['value'] = result;
return;`
        }
      }
    },
    {
      type: 'map_set',
      label: 'Map Set',
      description: 'Adds or updates a value for a specific key within the Map.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Set',
          headerColor: '#FF8A65',
          category: 'Map Operations'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'map', label: 'Map', dataType: 'map', color: '#FF8A65' },
          { id: 'key', label: 'Key', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'value', label: 'Value', dataType: 'any', color: '#B0BEC5' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { id: 'map_out', label: 'Map', dataType: 'map', color: '#FF8A65' }
        ],
        data: {
          values: { key: '', value: '' },
          code: 
`const mapData = inputs['Map'] ?? inputs['map'];
const key = inputs['Key'] ?? inputs['key'];
const value = inputs['Value'] ?? inputs['value'];

if (mapData && typeof mapData === 'object' && key != null && key !== '') {
  mapData[key] = value;
}

outputs['Map'] = mapData;
outputs['map_out'] = mapData;
outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    },
    {
      type: 'map_remove',
      label: 'Map Remove',
      description: 'Removes the specified key and its associated value from the Map.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Remove',
          headerColor: '#FF8A65',
          category: 'Map Operations'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'map', label: 'Map', dataType: 'map', color: '#FF8A65' },
          { id: 'key', label: 'Key', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { id: 'map_out', label: 'Map', dataType: 'map', color: '#FF8A65' }
        ],
        data: {
          values: { key: '' },
          code: 
`const mapData = inputs['Map'] ?? inputs['map'];
const key = inputs['Key'] ?? inputs['key'];

if (mapData && typeof mapData === 'object' && key != null && key !== '') {
  delete mapData[key];
}

outputs['Map'] = mapData;
outputs['map_out'] = mapData;
outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    },
    {
      type: 'map_has',
      label: 'Map Has',
      description: 'Checks whether a specified key exists inside the Map.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Has Key',
          headerColor: '#FF8A65',
          category: 'Map Operations'
        },
        inputs: [
          { id: 'map', label: 'Map', dataType: 'map', color: '#FF8A65' },
          { id: 'key', label: 'Key', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'result', label: 'Exists', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: { key: '' },
          code: 
`const mapData = inputs['Map'] ?? inputs['map'];
const key = inputs['Key'] ?? inputs['key'];

let exists = false;
if (mapData && typeof mapData === 'object' && key != null && key !== '') {
  exists = Object.prototype.hasOwnProperty.call(mapData, key);
}

outputs['Exists'] = exists;
outputs['result'] = exists;
return;`
        }
      }
    },
    {
      type: 'map_merge',
      label: 'Map Merge',
      description: 'Merges two Maps into a new single Map (keys in Map B overwrite matching keys in Map A).',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Merge',
          headerColor: '#FF8A65',
          category: 'Map Operations'
        },
        inputs: [
          { id: 'map_a', label: 'Map A', dataType: 'map', color: '#FF8A65' },
          { id: 'map_b', label: 'Map B', dataType: 'map', color: '#FF8A65' }
        ],
        outputs: [
          { id: 'result_map', label: 'New Map', dataType: 'map', color: '#FF8A65' }
        ],
        data: {
          code: 
`const mapA = inputs['Map A'] ?? inputs['map_a'] ?? {};
const mapB = inputs['Map B'] ?? inputs['map_b'] ?? {};

let result = null;
if (typeof mapA === 'object' && typeof mapB === 'object' && mapA !== null && mapB !== null) {
  result = { ...mapA, ...mapB };
}

outputs['New Map'] = result;
outputs['result_map'] = result;
return;`
        }
      }
    },
    {
      type: 'map_keys',
      label: 'Map Keys',
      description: 'Returns a List containing all the keys found inside the Map.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Keys',
          headerColor: '#FF8A65',
          category: 'Map Operations'
        },
        inputs: [
          { id: 'map', label: 'Map', dataType: 'map', color: '#FF8A65' }
        ],
        outputs: [
          { id: 'keys_list', label: 'Keys Array', dataType: 'list', color: '#4DD0E1' }
        ],
        data: {
          code: 
`const mapData = inputs['Map'] ?? inputs['map'];
const keys = (mapData && typeof mapData === 'object') ? Object.keys(mapData) : [];

outputs['Keys Array'] = keys;
outputs['keys_list'] = keys;
return;`
        }
      }
    },
    {
      type: 'map_values',
      label: 'Map Values',
      description: 'Returns a List containing all the values found inside the Map.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Values',
          headerColor: '#FF8A65',
          category: 'Map Operations'
        },
        inputs: [
          { id: 'map', label: 'Map', dataType: 'map', color: '#FF8A65' }
        ],
        outputs: [
          { id: 'values_list', label: 'Values Array', dataType: 'list', color: '#4DD0E1' }
        ],
        data: {
          code: 
`const mapData = inputs['Map'] ?? inputs['map'];
const vals = (mapData && typeof mapData === 'object') ? Object.values(mapData) : [];

outputs['Values Array'] = vals;
outputs['values_list'] = vals;
return;`
        }
      }
    },
    {
      type: 'map_size',
      label: 'Map Size',
      description: 'Counts the total number of key-value pairs stored in the Map.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Size',
          headerColor: '#FF8A65',
          category: 'Map Operations'
        },
        inputs: [
          { id: 'map', label: 'Map', dataType: 'map', color: '#FF8A65' }
        ],
        outputs: [
          { id: 'size', label: 'Size', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          code: 
`const mapData = inputs['Map'] ?? inputs['map'];
const count = (mapData && typeof mapData === 'object') ? Object.keys(mapData).length : 0;

outputs['Size'] = count;
outputs['size'] = count;
return;`
        }
      }
    }
  ]
};