import { 
  Box, 
  Trash2, 
  Copy, 
} from 'lucide-vue-next';

export const BlueprintEntity = {
  _id: 'entity_management',
  label: 'Entity',
  color: '#00BCD4', 
  icon: Box,
  items: [
    { 
      type: 'entity_spawn', 
      label: 'Spawn From Prefab', 
      description: 'Menciptakan instance baru dari prefab dengan posisi, layer (via Script ID), dan z-index spesifik.',
      icon: Box,
      defaultData: { 
        settings: { headerTitle: 'Spawn Prefab', headerColor: '#00BCD4', category: 'Entity' },
        data: { values: { prefabPath: "", pos_x: 0, pos_y: 0, layer: "", zindex: 0 } },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'prefab', label: 'Prefab Name', dataType: 'string', color: '#FFC107' },
          { _id: 'pos_x', label: 'Position X', dataType: 'number', color: '#4CAF50' },
          { _id: 'pos_y', label: 'Position Y', dataType: 'number', color: '#4CAF50' },
          { _id: 'layer', label: 'Layer (Script ID)', dataType: 'string', color: '#9C27B0' },
          { _id: 'zindex', label: 'Z-Index', dataType: 'number', color: '#FF9800' }
        ], 
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          // Diubah: dataType menjadi 'string'
          { _id: 'entity', label: 'Entity (Script ID)', dataType: 'string', color: '#FFC107' } 
        ]
      } 
    },
    { 
      type: 'entity_destroy', 
      label: 'Destroy Entity', 
      description: 'Menghapus entity dari scene secara permanen berdasarkan Script ID.',
      icon: Trash2,
      defaultData: { 
        settings: { headerTitle: 'Destroy', headerColor: '#F44336', category: 'Entity' },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          // Diubah: dataType menjadi 'string'
          { _id: 'entity', label: 'Target (Script ID)', dataType: 'string', color: '#FFC107' }
        ], 
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ]
      } 
    },
    { 
      type: 'entity_clone', 
      label: 'Clone Entity', 
      description: 'Menduplikasi entity yang sudah ada di scene berdasarkan Script ID.',
      icon: Copy,
      defaultData: { 
        settings: { headerTitle: 'Clone', headerColor: '#00BCD4', category: 'Entity' },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          // Diubah: dataType menjadi 'string'
          { _id: 'entity', label: 'Source (Script ID)', dataType: 'string', color: '#FFC107' }
        ], 
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          // Diubah: dataType menjadi 'string'
          { _id: 'clone', label: 'Clone (Script ID)', dataType: 'string', color: '#FFC107' }
        ]
      } 
    },
  ]
};