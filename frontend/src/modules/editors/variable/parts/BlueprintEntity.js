import { 
  Box, 
  Trash2, 
  Copy, 
  Network
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
      description: 'Menciptakan instance baru dari prefab. Jika Custom Script ID diisi, sistem akan mencobanya jika belum dipakai.',
      icon: Box,
      defaultData: { 
        settings: { headerTitle: 'Spawn Prefab', headerColor: '#00BCD4', category: 'Entity' },
        data: { values: { prefabName: "", pos_x: 0, pos_y: 0, layer_id: "", zindex: 0, custom_id: "" } },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'prefab', label: 'Prefab Name', dataType: 'string', color: '#FFC107' },
          { _id: 'pos_x', label: 'Position X', dataType: 'number', color: '#4CAF50' },
          { _id: 'pos_y', label: 'Position Y', dataType: 'number', color: '#4CAF50' },
          { _id: 'layer_id', label: 'Layer (Script ID)', dataType: 'string', color: '#9C27B0' },
          { _id: 'zindex', label: 'Z-Index', dataType: 'number', color: '#FF9800' },
          { _id: 'custom_id', label: 'Custom ID (Opt)', dataType: 'string', color: '#00BCD4' }
        ], 
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
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
          { _id: 'entity', label: 'Target (Script ID)', dataType: 'string', color: '#FFC107' }
        ], 
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' }
        ]
      } 
    },
    { 
      type: 'entity_destroy_with_parent', 
      label: 'Destroy With Parent', 
      description: 'Menghapus entity beserta parent-nya (dan seluruh saudaranya) dari scene secara permanen.',
      icon: Trash2,
      defaultData: { 
        settings: { headerTitle: 'Destroy W/ Parent', headerColor: '#D32F2F', category: 'Entity' },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
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
          { _id: 'entity', label: 'Source (Script ID)', dataType: 'string', color: '#FFC107' }
        ], 
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'clone', label: 'Clone (Script ID)', dataType: 'string', color: '#FFC107' }
        ]
      } 
    },
    { 
      type: 'entity_get_children', 
      label: 'Get Children', 
      description: 'Mengambil array seluruh child dari parent. Jika Index diisi, output Child ID akan mengeluarkan Script ID pada urutan tersebut.',
      icon: Network,
      defaultData: { 
        settings: { headerTitle: 'Get Children', headerColor: '#00BCD4', category: 'Entity' },
        data: { values: { index: 0 } }, 
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'parent', label: 'Parent (Script ID)', dataType: 'string', color: '#FFC107' },
          { _id: 'index', label: 'Index', dataType: 'number', color: '#4CAF50' }
        ], 
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'children', label: 'Children IDs (Array)', dataType: 'array', color: '#E91E63' },
          { _id: 'child_id', label: 'Child ID (String)', dataType: 'string', color: '#FFC107' }
        ]
      } 
    },
    { 
      type: 'entity_get_parent', 
      label: 'Get Parent', 
      description: 'Mendapatkan Script ID dari parent entity ini. Jika tidak memiliki parent, output akan kosong.',
      icon: Network, 
      defaultData: { 
        settings: { headerTitle: 'Get Parent', headerColor: '#00BCD4', category: 'Entity' },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'entity', label: 'Entity (Script ID)', dataType: 'string', color: '#FFC107' }
        ], 
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#FFFFFF' },
          { _id: 'parent_id', label: 'Parent ID (String)', dataType: 'string', color: '#FFC107' }
        ]
      } 
    }
  ]
};