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
      description: 'Menambahkan item baru ke akhir List',
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
      description: 'Menyisipkan item ke List pada index tertentu',
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
      description: 'Menggabungkan dua List menjadi satu List baru',
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
      description: 'Mengambil item dari List berdasarkan index',
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
      description: 'Mencari index dari sebuah value di dalam List. Me-return -1 jika tidak ada.',
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
      description: 'Mengubah nilai item pada index tertentu',
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
      description: 'Mengisi List dengan sebuah value dari index Start sampai End',
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
      description: 'Menghapus item dari List berdasarkan index',
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
      description: 'Mencari dan menghapus value pertama yang cocok di dalam List',
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
      description: 'Menghapus semua isi List (mengosongkan array)',
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
      description: 'Mengurutkan elemen di dalam List (alfabetik / ascending)',
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
      description: 'Mengacak urutan elemen di dalam List secara random',
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
      description: 'Membalikkan urutan elemen di dalam List',
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
      description: 'Mengembalikan jumlah item di dalam List',
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
      description: 'Mengecek apakah suatu value ada di dalam List',
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
      description: 'Membuat List baru berdasarkan nilai pencarian. Jika Property dikosongkan, filter mencocokkan value langsung.',
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
      description: 'Mengambil satu item acak dari dalam List',
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