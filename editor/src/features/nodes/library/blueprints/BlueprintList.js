import { List } from 'lucide-vue-next';

export const BlueprintList = {
  id: 'list_manipulation',
  label: 'List Operations',
  color: '#4DD0E1',
  icon: List,
  items: [
    {
      type: 'list_get',
      label: 'List Get',
      description: 'Retrieves an item from the List by its index.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Get Item',
          headerColor: '#4DD0E1',
          category: 'List Operations'
        },
        inputs: [
          { id: 'list', label: 'List', dataType: 'list', color: '#4DD0E1' },
          { id: 'index', label: 'Index', dataType: 'number', color: '#64B5F6', defaultValue: 0 }
        ],
        outputs: [
          { id: 'item', label: 'Item', dataType: 'any', color: '#B0BEC5' }
        ],
        data: {
          values: { index: 0 },
          code: 
`const list = inputs['List'] ?? inputs['list'];
const index = inputs['Index'] ?? inputs['index'];

let result = null;
if (Array.isArray(list) && index !== undefined && index >= 0 && index < list.length) {
  result = list[index];
}

outputs['Item'] = result;
outputs['item'] = result;
return;`
        }
      }
    },
    {
      type: 'list_set',
      label: 'List Set',
      description: 'Updates the value of an item at a specified index.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Set Item',
          headerColor: '#4DD0E1',
          category: 'List Operations'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'list', label: 'List', dataType: 'list', color: '#4DD0E1' },
          { id: 'index', label: 'Index', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'value', label: 'New Value', dataType: 'any', color: '#B0BEC5' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { id: 'list_out', label: 'List', dataType: 'list', color: '#4DD0E1' }
        ],
        data: {
          values: { index: 0, value: '' },
          code: 
`const list = inputs['List'] ?? inputs['list'];
const index = inputs['Index'] ?? inputs['index'];
const value = inputs['New Value'] ?? inputs['value'];

if (Array.isArray(list) && index !== undefined && index >= 0 && index < list.length) {
  list[index] = value;
}

outputs['List'] = list;
outputs['list_out'] = list;
outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    },
    {
      type: 'list_push',
      label: 'List Push',
      description: 'Appends a new item to the end of the List.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Push',
          headerColor: '#4DD0E1',
          category: 'List Operations'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'list', label: 'List', dataType: 'list', color: '#4DD0E1' },
          { id: 'value', label: 'Value', dataType: 'any', color: '#B0BEC5' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { id: 'list_out', label: 'List', dataType: 'list', color: '#4DD0E1' }
        ],
        data: {
          values: { value: '' },
          code: 
`const list = inputs['List'] ?? inputs['list'];
const value = inputs['Value'] ?? inputs['value'];

if (Array.isArray(list)) {
  list.push(value);
}

outputs['List'] = list;
outputs['list_out'] = list;
outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    },
    {
      type: 'list_insert',
      label: 'List Insert',
      description: 'Inserts an item into the List at a specified index.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Insert',
          headerColor: '#4DD0E1',
          category: 'List Operations'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'list', label: 'List', dataType: 'list', color: '#4DD0E1' },
          { id: 'index', label: 'Index', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'value', label: 'Value', dataType: 'any', color: '#B0BEC5' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { id: 'list_out', label: 'List', dataType: 'list', color: '#4DD0E1' }
        ],
        data: {
          values: { index: 0, value: '' },
          code: 
`const list = inputs['List'] ?? inputs['list'];
const index = inputs['Index'] ?? inputs['index'];
const value = inputs['Value'] ?? inputs['value'];

if (Array.isArray(list) && index !== undefined && index >= 0 && index <= list.length) {
  list.splice(index, 0, value);
}

outputs['List'] = list;
outputs['list_out'] = list;
outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    },
    {
      type: 'list_remove_at',
      label: 'List Remove At',
      description: 'Removes an item from the List at a specified index.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Remove At',
          headerColor: '#4DD0E1',
          category: 'List Operations'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'list', label: 'List', dataType: 'list', color: '#4DD0E1' },
          { id: 'index', label: 'Index', dataType: 'number', color: '#64B5F6', defaultValue: 0 }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { id: 'list_out', label: 'List', dataType: 'list', color: '#4DD0E1' }
        ],
        data: {
          values: { index: 0 },
          code: 
`const list = inputs['List'] ?? inputs['list'];
const index = inputs['Index'] ?? inputs['index'];

if (Array.isArray(list) && index !== undefined && index >= 0 && index < list.length) {
  list.splice(index, 1);
}

outputs['List'] = list;
outputs['list_out'] = list;
outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    },
    {
      type: 'list_length',
      label: 'List Length',
      description: 'Returns the total number of items contained in the List.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Length',
          headerColor: '#4DD0E1',
          category: 'List Operations'
        },
        inputs: [
          { id: 'list', label: 'List', dataType: 'list', color: '#4DD0E1' }
        ],
        outputs: [
          { id: 'length', label: 'Length', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          code: 
`const list = inputs['List'] ?? inputs['list'];
const len = Array.isArray(list) ? list.length : 0;

outputs['Length'] = len;
outputs['length'] = len;
return;`
        }
      }
    },
    {
      type: 'list_contains',
      label: 'List Contains',
      description: 'Checks whether a specified value exists inside the List.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Contains',
          headerColor: '#4DD0E1',
          category: 'List Operations'
        },
        inputs: [
          { id: 'list', label: 'List', dataType: 'list', color: '#4DD0E1' },
          { id: 'value', label: 'Value', dataType: 'any', color: '#B0BEC5' }
        ],
        outputs: [
          { id: 'result', label: 'Exists', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: { value: '' },
          code: 
`const list = inputs['List'] ?? inputs['list'];
const value = inputs['Value'] ?? inputs['value'];
const exists = Array.isArray(list) ? list.includes(value) : false;

outputs['Exists'] = exists;
outputs['result'] = exists;
return;`
        }
      }
    },
    {
      type: 'list_index_of',
      label: 'List IndexOf',
      description: 'Finds the index of a specified value within the List. Returns -1 if not found.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'IndexOf',
          headerColor: '#4DD0E1',
          category: 'List Operations'
        },
        inputs: [
          { id: 'list', label: 'List', dataType: 'list', color: '#4DD0E1' },
          { id: 'value', label: 'Value', dataType: 'any', color: '#B0BEC5' }
        ],
        outputs: [
          { id: 'index', label: 'Index', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: { value: '' },
          code: 
`const list = inputs['List'] ?? inputs['list'];
const value = inputs['Value'] ?? inputs['value'];
const idx = Array.isArray(list) ? list.indexOf(value) : -1;

outputs['Index'] = idx;
outputs['index'] = idx;
return;`
        }
      }
    },
    {
      type: 'list_concat',
      label: 'List Concat',
      description: 'Merges two Lists together into a single new List.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Concat',
          headerColor: '#4DD0E1',
          category: 'List Operations'
        },
        inputs: [
          { id: 'list_a', label: 'List A', dataType: 'list', color: '#4DD0E1' },
          { id: 'list_b', label: 'List B', dataType: 'list', color: '#4DD0E1' }
        ],
        outputs: [
          { id: 'result_list', label: 'New List', dataType: 'list', color: '#4DD0E1' }
        ],
        data: {
          code: 
`const listA = inputs['List A'] ?? inputs['list_a'] ?? [];
const listB = inputs['List B'] ?? inputs['list_b'] ?? [];

let combined = [];
if (Array.isArray(listA) && Array.isArray(listB)) {
  combined = listA.concat(listB);
}

outputs['New List'] = combined;
outputs['result_list'] = combined;
return;`
        }
      }
    },
    {
      type: 'list_shuffle',
      label: 'List Shuffle',
      description: 'Randomly shuffles the order of elements within the List.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Shuffle',
          headerColor: '#4DD0E1',
          category: 'List Operations'
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'list', label: 'List', dataType: 'list', color: '#4DD0E1' }
        ],
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { id: 'list_out', label: 'List', dataType: 'list', color: '#4DD0E1' }
        ],
        data: {
          code: 
`const list = inputs['List'] ?? inputs['list'];

if (Array.isArray(list)) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
}

outputs['List'] = list;
outputs['list_out'] = list;
outputs['Out'] = true;
outputs['exec_out'] = true;
return;`
        }
      }
    }
  ]
};

