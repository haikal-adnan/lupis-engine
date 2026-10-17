import { Database } from 'lucide-vue-next';

export const BlueprintCollections = {
  id: 'data_collections',
  label: 'Collections & Data',
  color: '#FF8A65',
  icon: Database,
  items: [
{
      type: 'listGet',
      label: 'List Get',
      description: 'Retrieves an item from the List by its index.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Get Item',
          headerColor: '#4DD0E1',
          category: 'Collections & Data'
        },
        inputs: [
          { id: 'list', dataType: 'list', color: '#4DD0E1' },
          { id: 'index', dataType: 'number', color: '#64B5F6', defaultValue: 0 }
        ],
        outputs: [
          { id: 'item', dataType: 'any', color: '#B0BEC5' }
        ],
        data: {
          values: { index: 0 },
          code: 
`const list = inputs.list;
const index = inputs.index;

outputs.item = list[index];
return;`
        }
      }
    },
{
      type: 'listSet',
      label: 'List Set',
      description: 'Updates the value of an item at a specified index.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Set Item',
          headerColor: '#4DD0E1',
          category: 'Collections & Data'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'list', dataType: 'list', color: '#4DD0E1' },
          { id: 'index', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'value', dataType: 'any', color: '#B0BEC5' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'listOut', dataType: 'list', color: '#4DD0E1' }
        ],
        data: {
          values: { index: 0, value: '' },
          code: 
`const list = inputs.list;
const index = inputs.index;
const value = inputs.value;

list[index] = value;

outputs.listOut = list;
outputs.execOut = true;
return;`
        }
      }
    },
{
      type: 'listPush',
      label: 'List Push',
      description: 'Appends a new item to the end of the List.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Push',
          headerColor: '#4DD0E1',
          category: 'Collections & Data'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'list', dataType: 'list', color: '#4DD0E1' },
          { id: 'value', dataType: 'any', color: '#B0BEC5' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'listOut', dataType: 'list', color: '#4DD0E1' }
        ],
        data: {
          values: { value: '' },
          code: 
`const list = inputs.list;
const value = inputs.value;

list.push(value);

outputs.listOut = list;
outputs.execOut = true;
return;`
        }
      }
    },
{
      type: 'listInsert',
      label: 'List Insert',
      description: 'Inserts an item into the List at a specified index.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Insert',
          headerColor: '#4DD0E1',
          category: 'Collections & Data'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'list', dataType: 'list', color: '#4DD0E1' },
          { id: 'index', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'value', dataType: 'any', color: '#B0BEC5' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'listOut', dataType: 'list', color: '#4DD0E1' }
        ],
        data: {
          values: { index: 0, value: '' },
          code: 
`const list = inputs.list;
const index = inputs.index;
const value = inputs.value;

list.splice(index, 0, value);

outputs.listOut = list;
outputs.execOut = true;
return;`
        }
      }
    },
{
      type: 'listRemoveAt',
      label: 'List Remove At',
      description: 'Removes an item from the List at a specified index.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Remove At',
          headerColor: '#4DD0E1',
          category: 'Collections & Data'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'list', dataType: 'list', color: '#4DD0E1' },
          { id: 'index', dataType: 'number', color: '#64B5F6', defaultValue: 0 }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'listOut', dataType: 'list', color: '#4DD0E1' }
        ],
        data: {
          values: { index: 0 },
          code: 
`const list = inputs.list;
const index = inputs.index;

list.splice(index, 1);

outputs.listOut = list;
outputs.execOut = true;
return;`
        }
      }
    },
{
      type: 'listLength',
      label: 'List Length',
      description: 'Returns the total number of items contained in the List.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Length',
          headerColor: '#4DD0E1',
          category: 'Collections & Data'
        },
        inputs: [
          { id: 'list', dataType: 'list', color: '#4DD0E1' }
        ],
        outputs: [
          { id: 'length', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          code: 
`const list = inputs.list;
outputs.length = list.length;
return;`
        }
      }
    },
{
      type: 'listContains',
      label: 'List Contains',
      description: 'Checks whether a specified value exists inside the List.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Contains',
          headerColor: '#4DD0E1',
          category: 'Collections & Data'
        },
        inputs: [
          { id: 'list', dataType: 'list', color: '#4DD0E1' },
          { id: 'value', dataType: 'any', color: '#B0BEC5' }
        ],
        outputs: [
          { id: 'result', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: { value: '' },
          code: 
`const list = inputs.list;
const value = inputs.value;

outputs.result = list.includes(value);
return;`
        }
      }
    },
{
      type: 'listIndexOf',
      label: 'List IndexOf',
      description: 'Finds the index of a specified value within the List. Returns -1 if not found.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'IndexOf',
          headerColor: '#4DD0E1',
          category: 'Collections & Data'
        },
        inputs: [
          { id: 'list', dataType: 'list', color: '#4DD0E1' },
          { id: 'value', dataType: 'any', color: '#B0BEC5' }
        ],
        outputs: [
          { id: 'index', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: { value: '' },
          code: 
`const list = inputs.list;
const value = inputs.value;

outputs.index = list.indexOf(value);
return;`
        }
      }
    },
{
      type: 'listConcat',
      label: 'List Concat',
      description: 'Merges two Lists together into a single new List.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Concat',
          headerColor: '#4DD0E1',
          category: 'Collections & Data'
        },
        inputs: [
          { id: 'listA', dataType: 'list', color: '#4DD0E1' },
          { id: 'listB', dataType: 'list', color: '#4DD0E1' }
        ],
        outputs: [
          { id: 'result', dataType: 'list', color: '#4DD0E1' }
        ],
        data: {
          code: 
`const listA = inputs.listA;
const listB = inputs.listB;

outputs.result = listA.concat(listB);
return;`
        }
      }
    },
{
      type: 'listShuffle',
      label: 'List Shuffle',
      description: 'Randomly shuffles the order of elements within the List.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Shuffle',
          headerColor: '#4DD0E1',
          category: 'Collections & Data'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'list', dataType: 'list', color: '#4DD0E1' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'listOut', dataType: 'list', color: '#4DD0E1' }
        ],
        data: {
          code: 
`const list = inputs.list;

for (let i = list.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [list[i], list[j]] = [list[j], list[i]];
}

outputs.listOut = list;
outputs.execOut = true;
return;`
        }
      }
    },
{
      type: 'mapGet',
      label: 'Map Get',
      description: 'Retrieves a value from the Map based on its key.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Get',
          headerColor: '#FF8A65',
          category: 'Collections & Data'
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
          category: 'Collections & Data'
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
          category: 'Collections & Data'
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
          category: 'Collections & Data'
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
          category: 'Collections & Data'
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
          category: 'Collections & Data'
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
          category: 'Collections & Data'
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
          category: 'Collections & Data'
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
    },
{
      type: 'getFromPath',
      label: 'Get Value by Path',
      description: 'Membaca nilai spesifik di dalam List atau Map menggunakan path string (cth: "users.0.name" atau "items[1].id").',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Get from Path',
          headerColor: '#0891B2',
          category: 'Collections & Data'
        },
        inputs: [
          { id: 'collection', dataType: 'any', color: '#B0BEC5' },
          { id: 'path', dataType: 'string', color: '#F48FB1', defaultValue: '' }
        ],
        outputs: [
          { id: 'value', dataType: 'any', color: '#B0BEC5' },
          { id: 'found', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: {
            path: ''
          },
          code: 
`const col = inputs.collection;
const pathString = inputs.path;

const parts = pathString.split(/[.\\[\\]]+/).filter(p => p !== '');
let current = col;
let isFound = true;

for (let i = 0; i < parts.length; i++) {
  const part = parts[i];
  if (current && typeof current === 'object' && part in current) {
    current = current[part];
  } else {
    isFound = false;
    current = null;
    break;
  }
}

outputs.value = current;
outputs.found = isFound;
return;`
        }
      }
    },
{
      type: 'setFromPath',
      label: 'Set Value by Path',
      description: 'Menetapkan atau memperbarui nilai di dalam List atau Map bersarang (nested) menggunakan path string.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Set by Path',
          headerColor: '#0891B2',
          category: 'Collections & Data'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'collection', dataType: 'any', color: '#B0BEC5' },
          { id: 'path', dataType: 'string', color: '#F48FB1', defaultValue: '' },
          { id: 'value', dataType: 'any', color: '#B0BEC5' }
        ],
        outputs: [
          { id: 'execOut', dataType: 'execution', color: '#FFFFFF' },
          { id: 'collectionOut', dataType: 'any', color: '#B0BEC5' },
          { id: 'valueOut', dataType: 'any', color: '#B0BEC5' }
        ],
        data: {
          values: {
            path: ''
          },
          code: 
`const targetCol = context.assert.exists(inputs.collection, 'Target collection must not be null or undefined');
const pathString = inputs.path;
const newVal = inputs.value;

const cloned = Array.isArray(targetCol) ? [...targetCol] : { ...targetCol };
const parts = pathString.split(/[.\\[\\]]+/).filter(p => p !== '');
let current = cloned;

for (let i = 0; i < parts.length - 1; i++) {
  const part = parts[i];
  const nextPart = parts[i + 1];
  const isNextIndex = /^\d+$/.test(nextPart);

  if (!current[part]) {
    current[part] = isNextIndex ? [] : {};
  }
  current = current[part];
}

if (parts.length > 0) {
  const lastPart = parts[parts.length - 1];
  current[lastPart] = newVal;
}

outputs.collectionOut = cloned;
outputs.valueOut = newVal;
outputs.execOut = true;
return;`
        }
      }
    }
  ]
};
