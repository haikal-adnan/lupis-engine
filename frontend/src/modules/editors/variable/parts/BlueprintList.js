import { 
  List, 
  Plus, 
  Layers, 
  Search, 
  Edit, 
  PaintBucket,
  Trash, 
  X, 
  ArrowDownUp, 
  Shuffle, 
  RefreshCw, 
  Hash, 
  CheckSquare,
  Filter,
  Dices
} from 'lucide-vue-next';

export const BlueprintList = {
  _id: 'list_manipulation',
  label: 'List Operations',
  color: '#8E24AA', 
  icon: List,
  items: [
    { 
      type: 'list_push', 
      label: 'List Push', 
      description: 'Appends a new item to the end of the List.',
      icon: Plus,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Push', headerColor: '#8E24AA', category: 'List' },
        data: { values: { value: "" } },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'list', label: 'List', dataType: 'list', color: '#8E24AA' },
          { _id: 'value', label: 'Value', dataType: 'any', color: '#FFFFFF' }
        ], 
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'list_out', label: 'List', dataType: 'list', color: '#8E24AA' }
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
        settings: { headerTitle: 'Insert', headerColor: '#8E24AA', category: 'List' },
        data: { values: { index: 0, value: "" } },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'list', label: 'List', dataType: 'list', color: '#8E24AA' },
          { _id: 'index', label: 'Index', dataType: 'number', color: '#00BCD4' },
          { _id: 'value', label: 'Value', dataType: 'any', color: '#FFFFFF' }
        ], 
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'list_out', label: 'List', dataType: 'list', color: '#8E24AA' }
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
        settings: { headerTitle: 'Concat', headerColor: '#8E24AA', category: 'List' },
        data: {},
        inputs: [
          { _id: 'list_a', label: 'List A', dataType: 'list', color: '#8E24AA' },
          { _id: 'list_b', label: 'List B', dataType: 'list', color: '#8E24AA' }
        ], 
        outputs: [
          { _id: 'result_list', label: 'New List', dataType: 'list', color: '#8E24AA' }
        ]
      } 
    },
    { 
      type: 'list_get', 
      label: 'List Get', 
      description: 'Retrieves an item from the List by its index.',
      icon: Search,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Get Item', headerColor: '#8E24AA', category: 'List' },
        data: { values: { index: 0 } },
        inputs: [
          { _id: 'list', label: 'List', dataType: 'list', color: '#8E24AA' },
          { _id: 'index', label: 'Index', dataType: 'number', color: '#00BCD4' }
        ], 
        outputs: [
          { _id: 'item', label: 'Item', dataType: 'any', color: '#FFFFFF' }
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
        settings: { headerTitle: 'IndexOf', headerColor: '#8E24AA', category: 'List' },
        data: { values: { value: "" } },
        inputs: [
          { _id: 'list', label: 'List', dataType: 'list', color: '#8E24AA' },
          { _id: 'value', label: 'Value', dataType: 'any', color: '#FFFFFF' }
        ], 
        outputs: [
          { _id: 'index', label: 'Index', dataType: 'number', color: '#00BCD4' }
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
        settings: { headerTitle: 'Set Item', headerColor: '#8E24AA', category: 'List' },
        data: { values: { index: 0, value: "" } },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'list', label: 'List', dataType: 'list', color: '#8E24AA' },
          { _id: 'index', label: 'Index', dataType: 'number', color: '#00BCD4' },
          { _id: 'value', label: 'New Value', dataType: 'any', color: '#FFFFFF' }
        ], 
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'list_out', label: 'List', dataType: 'list', color: '#8E24AA' }
        ]
      } 
    },
    { 
      type: 'list_fill', 
      label: 'List Fill', 
      description: 'Fills the List with a specific value from a Start index up to an End index.',
      icon: PaintBucket,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Fill', headerColor: '#8E24AA', category: 'List' },
        data: { values: { value: "", start: 0, end: 0 } }, 
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'list', label: 'List', dataType: 'list', color: '#8E24AA' },
          { _id: 'value', label: 'Value', dataType: 'any', color: '#FFFFFF' },
          { _id: 'start', label: 'Start Index', dataType: 'number', color: '#00BCD4' },
          { _id: 'end', label: 'End Index', dataType: 'number', color: '#00BCD4' }
        ], 
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'list_out', label: 'List', dataType: 'list', color: '#8E24AA' }
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
        settings: { headerTitle: 'Remove At', headerColor: '#8E24AA', category: 'List' },
        data: { values: { index: 0 } },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'list', label: 'List', dataType: 'list', color: '#8E24AA' },
          { _id: 'index', label: 'Index', dataType: 'number', color: '#00BCD4' }
        ], 
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'list_out', label: 'List', dataType: 'list', color: '#8E24AA' }
        ]
      } 
    },
    { 
      type: 'list_remove_value', 
      label: 'List Remove Value', 
      description: 'Finds and removes the first matching value within the List.',
      icon: Trash,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Remove Value', headerColor: '#8E24AA', category: 'List' },
        data: { values: { value: "" } },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'list', label: 'List', dataType: 'list', color: '#8E24AA' },
          { _id: 'value', label: 'Value', dataType: 'any', color: '#FFFFFF' }
        ], 
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'list_out', label: 'List', dataType: 'list', color: '#8E24AA' }
        ]
      } 
    },
    { 
      type: 'list_clear', 
      label: 'List Clear', 
      description: 'Removes all items from the List, resetting it to an empty array.',
      icon: X,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Clear', headerColor: '#8E24AA', category: 'List' },
        data: {},
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'list', label: 'List', dataType: 'list', color: '#8E24AA' }
        ], 
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'list_out', label: 'List', dataType: 'list', color: '#8E24AA' }
        ]
      } 
    },
    { 
      type: 'list_sort', 
      label: 'List Sort', 
      description: 'Sorts the elements within the List in ascending or alphabetical order.',
      icon: ArrowDownUp,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Sort', headerColor: '#8E24AA', category: 'List' },
        data: {},
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'list', label: 'List', dataType: 'list', color: '#8E24AA' }
        ], 
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'list_out', label: 'List', dataType: 'list', color: '#8E24AA' }
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
        settings: { headerTitle: 'Shuffle', headerColor: '#8E24AA', category: 'List' },
        data: {},
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'list', label: 'List', dataType: 'list', color: '#8E24AA' }
        ], 
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'list_out', label: 'List', dataType: 'list', color: '#8E24AA' }
        ]
      } 
    },
    { 
      type: 'list_reverse', 
      label: 'List Reverse', 
      description: 'Reverses the chronological order of elements inside the List.',
      icon: RefreshCw,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Reverse', headerColor: '#8E24AA', category: 'List' },
        data: {},
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'list', label: 'List', dataType: 'list', color: '#8E24AA' }
        ], 
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'list_out', label: 'List', dataType: 'list', color: '#8E24AA' }
        ]
      } 
    },
    { 
      type: 'list_length', 
      label: 'List Length', 
      description: 'Returns the total number of items currently contained in the List.',
      icon: Hash,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Length', headerColor: '#8E24AA', category: 'List' },
        data: {},
        inputs: [
          { _id: 'list', label: 'List', dataType: 'list', color: '#8E24AA' }
        ], 
        outputs: [
          { _id: 'length', label: 'Length', dataType: 'number', color: '#00BCD4' }
        ]
      } 
    },
    { 
      type: 'list_contains', 
      label: 'List Contains', 
      description: 'Checks whether a specified value exists anywhere inside the List.',
      icon: CheckSquare,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Contains', headerColor: '#8E24AA', category: 'List' },
        data: { values: { value: "" } },
        inputs: [
          { _id: 'list', label: 'List', dataType: 'list', color: '#8E24AA' },
          { _id: 'value', label: 'Value', dataType: 'any', color: '#FFFFFF' }
        ], 
        outputs: [
          { _id: 'result', label: 'Exists', dataType: 'boolean', color: '#4CAF50' }
        ]
      } 
    },
    { 
      type: 'list_filter', 
      label: 'List Filter', 
      description: 'Creates a new List based on search criteria. If Property is left empty, the filter matches values directly.',
      icon: Filter,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Filter', headerColor: '#8E24AA', category: 'List' },
        data: { values: { property: "", value: "" } },
        inputs: [
          { _id: 'list', label: 'List', dataType: 'list', color: '#8E24AA' },
          { _id: 'property', label: 'Property (Obj)', dataType: 'string', color: '#FFB74D' },
          { _id: 'value', label: 'Value', dataType: 'any', color: '#FFFFFF' }
        ], 
        outputs: [
          { _id: 'filtered_list', label: 'Filtered', dataType: 'list', color: '#8E24AA' }
        ]
      } 
    },
    { 
      type: 'list_get_random', 
      label: 'List Get Random', 
      description: 'Retrieves a single random item from within the List.',
      icon: Dices,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Get Random', headerColor: '#8E24AA', category: 'List' },
        data: {},
        inputs: [
          { _id: 'list', label: 'List', dataType: 'list', color: '#8E24AA' }
        ], 
        outputs: [
          { _id: 'item', label: 'Random Item', dataType: 'any', color: '#FFFFFF' }
        ]
      } 
    }
  ]
};