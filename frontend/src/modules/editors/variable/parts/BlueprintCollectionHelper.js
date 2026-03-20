import { 
  ListTree, 
  Network, 
  Copy, 
  BoxSelect 
} from 'lucide-vue-next';

export const BlueprintCollectionHelper = {
  _id: 'helper_list_map',
  label: 'Collection Helpers',
  color: '#673AB7', // Warna ungu tua, memadukan List dan Map
  icon: Network,
  items: [
    { 
      type: 'get_from_path', 
      label: 'Get From Path', 
      description: 'Mengambil data bersarang (nested) menggunakan path string (misal: players[0].stats.hp).',
      icon: ListTree,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Get Path', headerColor: '#673AB7', category: 'Helper' },
        data: {
          values: { path: "" }
        },
        inputs: [
          { _id: 'collection', label: 'Collection (List/Map)', dataType: 'any', color: '#673AB7' },
          { _id: 'path_in', label: 'Path String', dataType: 'string', color: '#FFB74D' }
        ], 
        outputs: [
          { _id: 'result', label: 'Value', dataType: 'any', color: '#FFFFFF' }
        ]
      } 
    },
    { 
      type: 'set_from_path', 
      label: 'Set From Path', 
      description: 'Memperbarui data bersarang menggunakan path. Jika path tidak ada, akan otomatis dibuat.',
      icon: Network,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Set Path', headerColor: '#673AB7', category: 'Helper' },
        data: {
          values: { path: "", value: "" }
        },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'collection', label: 'Collection (List/Map)', dataType: 'any', color: '#673AB7' },
          { _id: 'path_in', label: 'Path String', dataType: 'string', color: '#FFB74D' },
          { _id: 'value', label: 'New Value', dataType: 'any', color: '#FFFFFF' }
        ], 
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'collection_out', label: 'Collection', dataType: 'any', color: '#673AB7' },
          { _id: 'value_out', label: 'Value', dataType: 'any', color: '#FFFFFF' }
        ]
      } 
    },
    { 
      type: 'clone_collection', 
      label: 'Clone Collection', 
      description: 'Menduplikasi (Deep Copy) List atau Map agar referensi aslinya tidak ikut berubah saat dimodifikasi.',
      icon: Copy,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Clone Data', headerColor: '#673AB7', category: 'Helper' },
        data: {},
        inputs: [
          { _id: 'collection', label: 'Input Collection', dataType: 'any', color: '#673AB7' }
        ], 
        outputs: [
          { _id: 'cloned', label: 'Cloned Collection', dataType: 'any', color: '#673AB7' }
        ]
      } 
    },
    { 
      type: 'is_collection_empty', 
      label: 'Is Empty', 
      description: 'Mengecek apakah sebuah List kosong (panjang 0) atau Map kosong (tidak punya key).',
      icon: BoxSelect,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Is Empty', headerColor: '#673AB7', category: 'Helper' },
        data: {},
        inputs: [
          { _id: 'collection', label: 'Collection', dataType: 'any', color: '#673AB7' }
        ], 
        outputs: [
          { _id: 'result', label: 'Is Empty', dataType: 'boolean', color: '#4CAF50' }
        ]
      } 
    }
  ]
};