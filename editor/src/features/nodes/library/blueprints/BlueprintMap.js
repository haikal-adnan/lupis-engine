import { 
  List, 
  Search, 
  Hash, 
  CheckSquare,
  Braces, 
  PlusSquare, 
  Combine, 
  Trash2, 
  Key
} from 'lucide-vue-next';

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
      icon: Search,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Get', headerColor: '#FF8A65', category: 'Map' },
        data: { 
          values: { key: "" },
          code: `const mapData = inputs['map'];
const key = inputs['key'];

if (mapData && typeof mapData === 'object' && key != null && key !== "") {
    outputs['value'] = mapData[key] !== undefined ? mapData[key] : null;
} else {
    outputs['value'] = null;
}
return;`
        },
        inputs: [
          { id: 'map', label: 'Map', dataType: 'map', color: '#FF8A65' },
          { id: 'key', label: 'Key', dataType: 'string', color: '#F48FB1' }
        ], 
        outputs: [
          { id: 'value', label: 'Value', dataType: 'any', color: '#E0E0E0' }
        ]
      } 
    },
    { 
      type: 'map_set', 
      label: 'Map Set', 
      description: 'Adds or updates a value for a specific key within the Map.',
      icon: PlusSquare,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Set', headerColor: '#FF8A65', category: 'Map' },
        data: { 
          values: { key: "", value: "" },
          code: `const mapData = inputs['map'];
const key = inputs['key'];
const value = inputs['value'];

if (mapData && typeof mapData === 'object' && key != null && key !== "") {
    mapData[key] = value;
}

outputs['map_out'] = mapData;
outputs['exec_out'] = true;
return;`
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'map', label: 'Map', dataType: 'map', color: '#FF8A65' },
          { id: 'key', label: 'Key', dataType: 'string', color: '#F48FB1' },
          { id: 'value', label: 'Value', dataType: 'any', color: '#E0E0E0' }
        ], 
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { id: 'map_out', label: 'Map', dataType: 'map', color: '#FF8A65' }
        ]
      } 
    },
    { 
      type: 'map_remove', 
      label: 'Map Remove', 
      description: 'Removes the specified key and its associated value from the Map.',
      icon: Trash2,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Remove', headerColor: '#FF8A65', category: 'Map' },
        data: { 
          values: { key: "" },
          code: `const mapData = inputs['map'];
const key = inputs['key'];

if (mapData && typeof mapData === 'object' && key != null && key !== "") {
    delete mapData[key];
}

outputs['map_out'] = mapData;
outputs['exec_out'] = true;
return;`
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'map', label: 'Map', dataType: 'map', color: '#FF8A65' },
          { id: 'key', label: 'Key', dataType: 'string', color: '#F48FB1' }
        ], 
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { id: 'map_out', label: 'Map', dataType: 'map', color: '#FF8A65' }
        ]
      } 
    },
    { 
      type: 'map_has', 
      label: 'Map Has', 
      description: 'Checks whether a specified key exists inside the Map.',
      icon: CheckSquare,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Has Key', headerColor: '#FF8A65', category: 'Map' },
        data: { 
          values: { key: "" },
          code: `const mapData = inputs['map'];
const key = inputs['key'];

if (mapData && typeof mapData === 'object' && key != null && key !== "") {
    outputs['result'] = Object.prototype.hasOwnProperty.call(mapData, key);
} else {
    outputs['result'] = false;
}
return;`
        },
        inputs: [
          { id: 'map', label: 'Map', dataType: 'map', color: '#FF8A65' },
          { id: 'key', label: 'Key', dataType: 'string', color: '#F48FB1' }
        ], 
        outputs: [
          { id: 'result', label: 'Exists', dataType: 'boolean', color: '#E57373' }
        ]
      } 
    },
    { 
      type: 'map_merge', 
      label: 'Map Merge', 
      description: 'Merges two Maps into a new single Map (keys in Map B overwrite matching keys in Map A).',
      icon: Combine,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Merge', headerColor: '#FF8A65', category: 'Map' },
        data: {
          code: `const mapA = inputs['map_a'] || {};
const mapB = inputs['map_b'] || {};

if (typeof mapA === 'object' && typeof mapB === 'object') {
    outputs['result_map'] = { ...mapA, ...mapB };
} else {
    outputs['result_map'] = null;
}
return;`
        },
        inputs: [
          { id: 'map_a', label: 'Map A', dataType: 'map', color: '#FF8A65' },
          { id: 'map_b', label: 'Map B', dataType: 'map', color: '#FF8A65' }
        ], 
        outputs: [
          { id: 'result_map', label: 'New Map', dataType: 'map', color: '#FF8A65' }
        ]
      } 
    },
    { 
      type: 'map_keys', 
      label: 'Map Keys', 
      description: 'Returns a List containing all the keys found inside the Map.',
      icon: Key,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Keys', headerColor: '#FF8A65', category: 'Map' },
        data: {
          code: `const mapData = inputs['map'];

if (mapData && typeof mapData === 'object') {
    outputs['keys_list'] = Object.keys(mapData);
} else {
    outputs['keys_list'] = [];
}
return;`
        },
        inputs: [
          { id: 'map', label: 'Map', dataType: 'map', color: '#FF8A65' }
        ], 
        outputs: [
          { id: 'keys_list', label: 'Keys Array', dataType: 'list', color: '#4DD0E1' }
        ]
      } 
    },
    { 
      type: 'map_values', 
      label: 'Map Values', 
      description: 'Returns a List containing all the values found inside the Map.',
      icon: List,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Values', headerColor: '#FF8A65', category: 'Map' },
        data: {
          code: `const mapData = inputs['map'];

if (mapData && typeof mapData === 'object') {
    outputs['values_list'] = Object.values(mapData);
} else {
    outputs['values_list'] = [];
}
return;`
        },
        inputs: [
          { id: 'map', label: 'Map', dataType: 'map', color: '#FF8A65' }
        ], 
        outputs: [
          { id: 'values_list', label: 'Values Array', dataType: 'list', color: '#4DD0E1' }
        ]
      } 
    },
    { 
      type: 'map_size', 
      label: 'Map Size', 
      description: 'Counts the total number of key-value pairs stored in the Map.',
      icon: Hash,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Size', headerColor: '#FF8A65', category: 'Map' },
        data: {
          code: `const mapData = inputs['map'];

if (mapData && typeof mapData === 'object') {
    outputs['size'] = Object.keys(mapData).length;
} else {
    outputs['size'] = 0;
}
return;`
        },
        inputs: [
          { id: 'map', label: 'Map', dataType: 'map', color: '#FF8A65' }
        ], 
        outputs: [
          { id: 'size', label: 'Size', dataType: 'number', color: '#64B5F6' }
        ]
      } 
    }
  ]
};