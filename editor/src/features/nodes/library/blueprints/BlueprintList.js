import { List } from 'lucide-vue-next';

export const BlueprintList = {
  id: 'list_manipulation',
  label: 'List Operations',
  color: '#4DD0E1',
  icon: List,
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
          category: 'List Operations'
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
          category: 'List Operations'
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
          category: 'List Operations'
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
          category: 'List Operations'
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
          category: 'List Operations'
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
          category: 'List Operations'
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
          category: 'List Operations'
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
          category: 'List Operations'
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
          category: 'List Operations'
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
          category: 'List Operations'
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
    }
  ]
};
