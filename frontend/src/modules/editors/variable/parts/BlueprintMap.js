import { 
  Braces, 
  PlusSquare, 
  Combine, 
  HelpCircle, 
  Search, 
  CheckSquare, 
  Trash2, 
  XSquare, 
  Key, 
  List, 
  Hash 
} from 'lucide-vue-next';

export const BlueprintMap = {
  _id: 'map_manipulation',
  label: 'Map Operations',
  color: '#D81B60', 
  icon: Braces,
  items: [
    { 
      type: 'map_set', 
      label: 'Map Set', 
      description: 'Menambah atau memperbarui nilai pada key tertentu di dalam Map',
      icon: PlusSquare,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Set', headerColor: '#D81B60', category: 'Map' },
        data: { values: { key: "", value: "" } },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'map', label: 'Map', dataType: 'map', color: '#D81B60' },
          { _id: 'key', label: 'Key', dataType: 'string', color: '#FFC107' },
          { _id: 'value', label: 'Value', dataType: 'any', color: '#FFFFFF' }
        ], 
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'map_out', label: 'Map', dataType: 'map', color: '#D81B60' }
        ]
      } 
    },
    { 
      type: 'map_merge', 
      label: 'Map Merge', 
      description: 'Menggabungkan dua Map menjadi satu Map baru (Map B akan menimpa key yang sama di Map A)',
      icon: Combine,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Merge', headerColor: '#D81B60', category: 'Map' },
        data: {},
        inputs: [
          { _id: 'map_a', label: 'Map A', dataType: 'map', color: '#D81B60' },
          { _id: 'map_b', label: 'Map B', dataType: 'map', color: '#D81B60' }
        ], 
        outputs: [
          { _id: 'result_map', label: 'New Map', dataType: 'map', color: '#D81B60' }
        ]
      } 
    },
    { 
      type: 'map_put_if_absent', 
      label: 'Map PutIfAbsent', 
      description: 'Menambahkan key-value baru hanya jika key tersebut belum ada di dalam Map',
      icon: HelpCircle,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Put If Absent', headerColor: '#D81B60', category: 'Map' },
        data: { values: { key: "", value: "" } },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'map', label: 'Map', dataType: 'map', color: '#D81B60' },
          { _id: 'key', label: 'Key', dataType: 'string', color: '#FFC107' },
          { _id: 'value', label: 'Value', dataType: 'any', color: '#FFFFFF' }
        ], 
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'was_added', label: 'Was Added', dataType: 'boolean', color: '#4CAF50' },
          { _id: 'map_out', label: 'Map', dataType: 'map', color: '#D81B60' }
        ]
      } 
    },
    { 
      type: 'map_get', 
      label: 'Map Get', 
      description: 'Mengambil nilai dari Map berdasarkan key',
      icon: Search,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Get', headerColor: '#D81B60', category: 'Map' },
        data: { values: { key: "" } },
        inputs: [
          { _id: 'map', label: 'Map', dataType: 'map', color: '#D81B60' },
          { _id: 'key', label: 'Key', dataType: 'string', color: '#FFC107' }
        ], 
        outputs: [
          { _id: 'value', label: 'Value', dataType: 'any', color: '#FFFFFF' }
        ]
      } 
    },
    { 
      type: 'map_has', 
      label: 'Map Has', 
      description: 'Mengecek apakah suatu key ada di dalam Map',
      icon: CheckSquare,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Has Key', headerColor: '#D81B60', category: 'Map' },
        data: { values: { key: "" } },
        inputs: [
          { _id: 'map', label: 'Map', dataType: 'map', color: '#D81B60' },
          { _id: 'key', label: 'Key', dataType: 'string', color: '#FFC107' }
        ], 
        outputs: [
          { _id: 'result', label: 'Exists', dataType: 'boolean', color: '#4CAF50' }
        ]
      } 
    },
    { 
      type: 'map_remove', 
      label: 'Map Remove', 
      description: 'Menghapus key beserta nilainya dari Map',
      icon: Trash2,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Remove', headerColor: '#D81B60', category: 'Map' },
        data: { values: { key: "" } },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'map', label: 'Map', dataType: 'map', color: '#D81B60' },
          { _id: 'key', label: 'Key', dataType: 'string', color: '#FFC107' }
        ], 
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'map_out', label: 'Map', dataType: 'map', color: '#D81B60' }
        ]
      } 
    },
    { 
      type: 'map_clear', 
      label: 'Map Clear', 
      description: 'Menghapus seluruh isi Map (mengosongkan object)',
      icon: XSquare,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Clear', headerColor: '#D81B60', category: 'Map' },
        data: {},
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'map', label: 'Map', dataType: 'map', color: '#D81B60' }
        ], 
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'map_out', label: 'Map', dataType: 'map', color: '#D81B60' }
        ]
      } 
    },
    { 
      type: 'map_keys', 
      label: 'Map Keys', 
      description: 'Mengembalikan List yang berisi semua key dari dalam Map',
      icon: Key,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Keys', headerColor: '#D81B60', category: 'Map' },
        data: {},
        inputs: [
          { _id: 'map', label: 'Map', dataType: 'map', color: '#D81B60' }
        ], 
        outputs: [
          { _id: 'keys_list', label: 'Keys Array', dataType: 'list', color: '#8E24AA' }
        ]
      } 
    },
    { 
      type: 'map_values', 
      label: 'Map Values', 
      description: 'Mengembalikan List yang berisi semua nilai dari dalam Map',
      icon: List,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Values', headerColor: '#D81B60', category: 'Map' },
        data: {},
        inputs: [
          { _id: 'map', label: 'Map', dataType: 'map', color: '#D81B60' }
        ], 
        outputs: [
          { _id: 'values_list', label: 'Values Array', dataType: 'list', color: '#8E24AA' }
        ]
      } 
    },
    { 
      type: 'map_size', 
      label: 'Map Size', 
      description: 'Menghitung total jumlah pasangan key-value di dalam Map',
      icon: Hash,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Size', headerColor: '#D81B60', category: 'Map' },
        data: {},
        inputs: [
          { _id: 'map', label: 'Map', dataType: 'map', color: '#D81B60' }
        ], 
        outputs: [
          { _id: 'size', label: 'Size', dataType: 'number', color: '#00BCD4' }
        ]
      } 
    },
    { 
      type: 'map_get_or_default', 
      label: 'Map GetOrDefault', 
      description: 'Mengambil nilai dari Map, jika key tidak ditemukan maka akan mengembalikan Default Value',
      icon: Search,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Get Or Default', headerColor: '#D81B60', category: 'Map' },
        data: { values: { key: "", defaultVal: "" } },
        inputs: [
          { _id: 'map', label: 'Map', dataType: 'map', color: '#D81B60' },
          { _id: 'key', label: 'Key', dataType: 'string', color: '#FFC107' },
          { _id: 'defaultVal', label: 'Default', dataType: 'any', color: '#FFFFFF' }
        ], 
        outputs: [
          { _id: 'value', label: 'Value', dataType: 'any', color: '#FFFFFF' }
        ]
      } 
    }
  ]
};