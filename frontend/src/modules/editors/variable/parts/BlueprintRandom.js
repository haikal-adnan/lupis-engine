import { 
  Dices, 
  ToggleLeft, 
  Percent, 
  Shuffle,
  Palette
} from 'lucide-vue-next';

export const BlueprintRandom = {
  _id: 'random_operations',
  label: 'Random Operations',
  color: '#FF5722', 
  icon: Dices,
  items: [
    { 
      type: 'random_smart', 
      label: 'Random Number', 
      description: 'Menghasilkan angka acak. Bulat jika input bulat, desimal jika input desimal.',
      icon: Dices,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Random Number', headerColor: '#FF5722', category: 'Random' },
        data: { values: { min: 1, max: 10 } },
        inputs: [
          { _id: 'min', label: 'Min', dataType: 'number', color: '#00BCD4' },
          { _id: 'max', label: 'Max', dataType: 'number', color: '#00BCD4' }
        ], 
        outputs: [
          { _id: 'result', label: 'Number', dataType: 'number', color: '#00BCD4' }
        ]
      } 
    },
    { 
      type: 'random_boolean', 
      label: 'Random Boolean', 
      description: 'Menghasilkan nilai true atau false secara acak (50:50).',
      icon: ToggleLeft,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Random Bool', headerColor: '#FF5722', category: 'Random' },
        data: {}, 
        inputs: [], 
        outputs: [
          { _id: 'result', label: 'Boolean', dataType: 'boolean', color: '#4CAF50' }
        ]
      } 
    },
    { 
      type: 'random_from_list', 
      label: 'List Get Random', 
      description: 'Mengambil satu item secara acak dari dalam List/Array.',
      icon: Shuffle,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Random From List', headerColor: '#FF5722', category: 'Random' },
        data: {},
        inputs: [
          { _id: 'list', label: 'List', dataType: 'list', color: '#8E24AA' }
        ], 
        outputs: [
          { _id: 'item', label: 'Item', dataType: 'any', color: '#FFFFFF' }
        ]
      } 
    },
    { 
      type: 'random_chance', 
      label: 'Random Chance', 
      description: 'Menghasilkan true (Berhasil) atau false (Gagal) berdasarkan persentase (0 - 100).',
      icon: Percent,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Random Chance', headerColor: '#FF5722', category: 'Random' },
        data: { values: { chance: 25 } }, 
        inputs: [
          { _id: 'chance', label: 'Chance (%)', dataType: 'number', color: '#00BCD4' }
        ], 
        outputs: [
          { _id: 'result', label: 'Boolean', dataType: 'boolean', color: '#4CAF50' }
        ]
      } 
    },
    { 
      type: 'random_color', 
      label: 'Random Color', 
      description: 'Menghasilkan warna acak dalam format Hex String (contoh: #A3F10C).',
      icon: Palette,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Random Color', headerColor: '#FF5722', category: 'Random' },
        data: {},
        inputs: [], 
        outputs: [
          { _id: 'color', label: 'Color (Hex)', dataType: 'string', color: '#FFFFFF' }
        ]
      } 
    }
  ]
};