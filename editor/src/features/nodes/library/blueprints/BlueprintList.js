import { 
  List, 
  Plus, 
  Layers, 
  Search, 
  Edit, 
  Trash, 
  Shuffle, 
  Hash, 
  CheckSquare,
} from 'lucide-vue-next';

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
      icon: Search,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Get Item', headerColor: '#4DD0E1', category: 'List' },
        data: { 
          values: { index: 0 },
          code: `const list = inputs['list'];
const index = inputs['index'];

if (Array.isArray(list) && index !== undefined && index >= 0 && index < list.length) {
    outputs['item'] = list[index];
} else {
    outputs['item'] = null;
}
return;`
        },
        inputs: [
          { id: 'list', label: 'List', dataType: 'list', color: '#4DD0E1' },
          { id: 'index', label: 'Index', dataType: 'number', color: '#64B5F6' }
        ], 
        outputs: [
          { id: 'item', label: 'Item', dataType: 'any', color: '#E0E0E0' }
        ]
      } 
    },
    { 
      type: 'list_set', 
      label: 'List Set', 
      description: 'Updates the value of an item at a specified index.',
      icon: Edit,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Set Item', headerColor: '#4DD0E1', category: 'List' },
        data: { 
          values: { index: 0, value: "" },
          code: `const list = inputs['list'];
const index = inputs['index'];
const value = inputs['value'];

if (Array.isArray(list) && index !== undefined && index >= 0 && index < list.length) {
    list[index] = value;
}

outputs['list_out'] = list;
outputs['exec_out'] = true;
return;`
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'list', label: 'List', dataType: 'list', color: '#4DD0E1' },
          { id: 'index', label: 'Index', dataType: 'number', color: '#64B5F6' },
          { id: 'value', label: 'New Value', dataType: 'any', color: '#E0E0E0' }
        ], 
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { id: 'list_out', label: 'List', dataType: 'list', color: '#4DD0E1' }
        ]
      } 
    },
    { 
      type: 'list_push', 
      label: 'List Push', 
      description: 'Appends a new item to the end of the List.',
      icon: Plus,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Push', headerColor: '#4DD0E1', category: 'List' },
        data: { 
          values: { value: "" },
          code: `const list = inputs['list'];
const value = inputs['value'];

if (Array.isArray(list)) {
    list.push(value);
}

outputs['list_out'] = list;
outputs['exec_out'] = true;
return;`
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'list', label: 'List', dataType: 'list', color: '#4DD0E1' },
          { id: 'value', label: 'Value', dataType: 'any', color: '#E0E0E0' }
        ], 
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { id: 'list_out', label: 'List', dataType: 'list', color: '#4DD0E1' }
        ]
      } 
    },
    { 
      type: 'list_insert', 
      label: 'List Insert', 
      description: 'Inserts an item into the List at a specified index.',
      icon: Plus,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Insert', headerColor: '#4DD0E1', category: 'List' },
        data: { 
          values: { index: 0, value: "" },
          code: `const list = inputs['list'];
const index = inputs['index'];
const value = inputs['value'];

if (Array.isArray(list) && index !== undefined && index >= 0 && index <= list.length) {
    list.splice(index, 0, value);
}

outputs['list_out'] = list;
outputs['exec_out'] = true;
return;`
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'list', label: 'List', dataType: 'list', color: '#4DD0E1' },
          { id: 'index', label: 'Index', dataType: 'number', color: '#64B5F6' },
          { id: 'value', label: 'Value', dataType: 'any', color: '#E0E0E0' }
        ], 
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { id: 'list_out', label: 'List', dataType: 'list', color: '#4DD0E1' }
        ]
      } 
    },
    { 
      type: 'list_remove_at', 
      label: 'List Remove At', 
      description: 'Removes an item from the List at a specified index.',
      icon: Trash,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Remove At', headerColor: '#4DD0E1', category: 'List' },
        data: { 
          values: { index: 0 },
          code: `const list = inputs['list'];
const index = inputs['index'];

if (Array.isArray(list) && index !== undefined && index >= 0 && index < list.length) {
    list.splice(index, 1);
}

outputs['list_out'] = list;
outputs['exec_out'] = true;
return;`
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'list', label: 'List', dataType: 'list', color: '#4DD0E1' },
          { id: 'index', label: 'Index', dataType: 'number', color: '#64B5F6' }
        ], 
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { id: 'list_out', label: 'List', dataType: 'list', color: '#4DD0E1' }
        ]
      } 
    },
    { 
      type: 'list_length', 
      label: 'List Length', 
      description: 'Returns the total number of items contained in the List.',
      icon: Hash,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Length', headerColor: '#4DD0E1', category: 'List' },
        data: {
          code: `const list = inputs['list'];
outputs['length'] = Array.isArray(list) ? list.length : 0;
return;`
        },
        inputs: [
          { id: 'list', label: 'List', dataType: 'list', color: '#4DD0E1' }
        ], 
        outputs: [
          { id: 'length', label: 'Length', dataType: 'number', color: '#64B5F6' }
        ]
      } 
    },
    { 
      type: 'list_contains', 
      label: 'List Contains', 
      description: 'Checks whether a specified value exists inside the List.',
      icon: CheckSquare,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Contains', headerColor: '#4DD0E1', category: 'List' },
        data: { 
          values: { value: "" },
          code: `const list = inputs['list'];
const value = inputs['value'];

outputs['result'] = Array.isArray(list) ? list.includes(value) : false;
return;`
        },
        inputs: [
          { id: 'list', label: 'List', dataType: 'list', color: '#4DD0E1' },
          { id: 'value', label: 'Value', dataType: 'any', color: '#E0E0E0' }
        ], 
        outputs: [
          { id: 'result', label: 'Exists', dataType: 'boolean', color: '#E57373' }
        ]
      } 
    },
    { 
      type: 'list_index_of', 
      label: 'List IndexOf', 
      description: 'Finds the index of a specified value within the List. Returns -1 if not found.',
      icon: Search,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'IndexOf', headerColor: '#4DD0E1', category: 'List' },
        data: { 
          values: { value: "" },
          code: `const list = inputs['list'];
const value = inputs['value'];

outputs['index'] = Array.isArray(list) ? list.indexOf(value) : -1;
return;`
        },
        inputs: [
          { id: 'list', label: 'List', dataType: 'list', color: '#4DD0E1' },
          { id: 'value', label: 'Value', dataType: 'any', color: '#E0E0E0' }
        ], 
        outputs: [
          { id: 'index', label: 'Index', dataType: 'number', color: '#64B5F6' }
        ]
      } 
    },
    { 
      type: 'list_concat', 
      label: 'List Concat', 
      description: 'Merges two Lists together into a single new List.',
      icon: Layers,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Concat', headerColor: '#4DD0E1', category: 'List' },
        data: {
          code: `const listA = inputs['list_a'] || [];
const listB = inputs['list_b'] || [];

if (Array.isArray(listA) && Array.isArray(listB)) {
    outputs['result_list'] = listA.concat(listB);
} else {
    outputs['result_list'] = [];
}
return;`
        },
        inputs: [
          { id: 'list_a', label: 'List A', dataType: 'list', color: '#4DD0E1' },
          { id: 'list_b', label: 'List B', dataType: 'list', color: '#4DD0E1' }
        ], 
        outputs: [
          { id: 'result_list', label: 'New List', dataType: 'list', color: '#4DD0E1' }
        ]
      } 
    },
    { 
      type: 'list_shuffle', 
      label: 'List Shuffle', 
      description: 'Randomly shuffles the order of elements within the List.',
      icon: Shuffle,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Shuffle', headerColor: '#4DD0E1', category: 'List' },
        data: {
          code: `const list = inputs['list'];

if (Array.isArray(list)) {
    for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
    }
}

outputs['list_out'] = list;
outputs['exec_out'] = true;
return;`
        },
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'list', label: 'List', dataType: 'list', color: '#4DD0E1' }
        ], 
        outputs: [
          { id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { id: 'list_out', label: 'List', dataType: 'list', color: '#4DD0E1' }
        ]
      } 
    }
  ]
};