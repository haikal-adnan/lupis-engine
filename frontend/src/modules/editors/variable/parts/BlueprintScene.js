import { Clapperboard, RefreshCw } from 'lucide-vue-next';

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
        data: {
          propertyOptions: [
            { value: 'sceneName', label: 'Scene Name', type: 'string', color: '#FFF' } 
          ]
        },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'sceneName', label: 'Scene Name', dataType: 'string', color: '#E040FB' } 
        ], 
        outputs: [{ _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }]
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
        data: {
          propertyOptions: []
        },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' }
        ], 
        outputs: [{ _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }]
      } 
    }
  ]
};