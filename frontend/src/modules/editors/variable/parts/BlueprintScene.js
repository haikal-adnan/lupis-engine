import { 
  Clapperboard, 
  RefreshCw, 
  MapPin // Icon yang cocok untuk menandakan posisi scene saat ini
} from 'lucide-vue-next';

export const BlueprintScene = {
  _id: 'game_scene',
  label: 'Scene Management',
  color: '#9C27B0', 
  icon: Clapperboard,
  items: [
    { 
      type: 'change_scene', 
      label: 'Change Scene', 
      description: 'Pindah ke scene lain menggunakan Nama Scene', 
      icon: Clapperboard,
      allowDynamicInputs: false, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Change Scene', headerColor: '#8E24AA', category: 'Scene' },
        data: { sceneName: '' },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'sceneName', label: 'Scene Name', dataType: 'string', color: '#E040FB' } 
        ], 
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ]
      } 
    },
    { 
      type: 'restart_scene', 
      label: 'Restart Scene', 
      description: 'Memuat ulang scene yang sedang aktif', 
      icon: RefreshCw,
      allowDynamicInputs: false, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Restart Scene', headerColor: '#8E24AA', category: 'Scene' },
        data: {},
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' }
        ], 
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ]
      } 
    },
    { 
      type: 'get_current_scene', 
      label: 'Get Current Scene', 
      description: 'Mendapatkan nama scene yang sedang aktif saat ini', 
      icon: MapPin, 
      allowDynamicInputs: false, 
      allowDynamicOutputs: false, // Output sudah pasti (fix), jadi false
      defaultData: { 
        settings: { headerTitle: 'Get Current Scene', headerColor: '#8E24AA', category: 'Scene' },
        data: {},
        // Tidak butuh input exec_in dan target, karena ini data konstan global
        inputs: [], 
        outputs: [
          // Tidak butuh exec_out, langsung return nilai string
          { _id: 'sceneName', label: 'Scene Name', dataType: 'string', color: '#E040FB' }
        ]
      } 
    }
  ]
};