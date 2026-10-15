import { Braces } from 'lucide-vue-next';

export const BlueprintMap = {
  id: 'map_manipulation',
  label: 'Map Operations',
  color: '#FF8A65',
  icon: Braces,
  items: [
    {
      type: 'mapGet',
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
          { id: 'map', dataType: 'map', color: '#FF8A65' },
          { id: 'key', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'value', dataType: 'any', color: '#B0BEC5' }
        ],
        data: {
          values: { key: '' },
          code: 
`const mapData = inputs.map;
const key = inputs.key;

outputs.value = mapData[key];
return;`
        }
      }
    },
    {
      type: 'mapSet',
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
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'map', dataType: 'map', color: '#FF8A65' },
          { id: 'key', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'value', dataType: 'any', color: '#B0BEC5' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'mapOut', dataType: 'map', color: '#FF8A65' }
        ],
        data: {
          values: { key: '', value: '' },
          code: 
`const mapData = inputs.map;
const key = inputs.key;
const value = inputs.value;

mapData[key] = value;

outputs.mapOut = mapData;
outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'mapRemove',
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
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'map', dataType: 'map', color: '#FF8A65' },
          { id: 'key', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'mapOut', dataType: 'map', color: '#FF8A65' }
        ],
        data: {
          values: { key: '' },
          code: 
`const mapData = inputs.map;
const key = inputs.key;

delete mapData[key];

outputs.mapOut = mapData;
outputs.execOut = true;
return;`
        }
      }
    },
    {
      type: 'mapHas',
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
          { id: 'map', dataType: 'map', color: '#FF8A65' },
          { id: 'key', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'result', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: { key: '' },
          code: 
`const mapData = inputs.map;
const key = inputs.key;

outputs.result = Object.prototype.hasOwnProperty.call(mapData, key);
return;`
        }
      }
    },
    {
      type: 'mapMerge',
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
          { id: 'mapA', dataType: 'map', color: '#FF8A65' },
          { id: 'mapB', dataType: 'map', color: '#FF8A65' }
        ],
        outputs: [
          { id: 'result', dataType: 'map', color: '#FF8A65' }
        ],
        data: {
          code: 
`const mapA = inputs.mapA;
const mapB = inputs.mapB;

outputs.result = { ...mapA, ...mapB };
return;`
        }
      }
    },
    {
      type: 'mapKeys',
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
          { id: 'map', dataType: 'map', color: '#FF8A65' }
        ],
        outputs: [
          { id: 'keysList', dataType: 'list', color: '#4DD0E1' }
        ],
        data: {
          code: 
`const mapData = inputs.map;
outputs.keysList = Object.keys(mapData);
return;`
        }
      }
    },
    {
      type: 'mapValues',
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
          { id: 'map', dataType: 'map', color: '#FF8A65' }
        ],
        outputs: [
          { id: 'valuesList', dataType: 'list', color: '#4DD0E1' }
        ],
        data: {
          code: 
`const mapData = inputs.map;
outputs.valuesList = Object.values(mapData);
return;`
        }
      }
    },
    {
      type: 'mapSize',
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
          { id: 'map', dataType: 'map', color: '#FF8A65' }
        ],
        outputs: [
          { id: 'size', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          code: 
`const mapData = inputs.map;
outputs.size = Object.keys(mapData).length;
return;`
        }
      }
    }
  ]
};