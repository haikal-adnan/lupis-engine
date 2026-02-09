import { Move, Axis3d, Footprints } from 'lucide-vue-next'; // Tambahkan Footprints jika ada, atau pakai Move

export const basicTransform = {
  _id: 'game_transform',
  label: 'Transform',
  color: '#4CAF50',
  icon: Move,
  items: [
    { 
      type: 'get_transform', 
      label: 'Get Transform', 
      description: 'Get specific transform properties of Self or Target', 
      icon: Move,
      allowDynamicInputs: false,
      allowDynamicOutputs: true, 
      defaultData: { 
        settings: { 
          headerTitle: 'Get Transform', 
          headerColor: '#2E7D32', 
          category: 'Transform' 
        },
        data: {
          propertyOptions: [
            { value: 'x', label: 'Position X', type: 'number', color: '#69F0AE' },
            { value: 'y', label: 'Position Y', type: 'number', color: '#69F0AE' },
            { value: 'rotation', label: 'Rotation', type: 'number', color: '#B2FF59' },
            { value: 'scaleX', label: 'Scale X', type: 'number', color: '#40C4FF' },
            { value: 'scaleY', label: 'Scale Y', type: 'number', color: '#40C4FF' },
            { value: 'width', label: 'Width', type: 'number', color: '#FFB74D' },
            { value: 'height', label: 'Height', type: 'number', color: '#FFB74D' },
            { value: 'pivotX', label: 'Pivot X', type: 'number', color: '#FFB74D' },
            { value: 'pivotY', label: 'Pivot Y', type: 'number', color: '#FFB74D' }
          ]
        },
        inputs: [
          { _id: 'in_target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' }
        ], 
        outputs: [] 
      } 
    },

    { 
      type: 'set_transform', 
      label: 'Set Transform', 
      description: 'Modify specific transform properties of Self or Target', 
      icon: Axis3d,
      allowDynamicInputs: true, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { 
          headerTitle: 'Set Transform', 
          headerColor: '#2E7D32', 
          category: 'Transform' 
        },
        data: {
          propertyOptions: [
            { value: 'x', label: 'Position X', type: 'number', color: '#69F0AE' },
            { value: 'y', label: 'Position Y', type: 'number', color: '#69F0AE' },
            { value: 'rotation', label: 'Rotation', type: 'number', color: '#B2FF59' },
            { value: 'scaleX', label: 'Scale X', type: 'number', color: '#40C4FF' },
            { value: 'scaleY', label: 'Scale Y', type: 'number', color: '#40C4FF' },
            { value: 'width', label: 'Width', type: 'number', color: '#FFB74D' },
            { value: 'height', label: 'Height', type: 'number', color: '#FFB74D' },
            { value: 'pivotX', label: 'Pivot X', type: 'number', color: '#FFB74D' },
            { value: 'pivotY', label: 'Pivot Y', type: 'number', color: '#FFB74D' }
          ]
        },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'in_target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' }
        ],
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ]
      } 
    },
    { 
      type: 'translate', 
      label: 'Translate', 
      description: 'Move object relative (Delta) with optional collision.', 
      icon: Footprints, 
      allowDynamicInputs: false, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { 
          headerTitle: 'Translate', 
          headerColor: '#2E7D32', 
          category: 'Transform' 
        },
        // DATA UNTUK INSPECTOR & DEFAULT VALUES
        data: {
            dx: 0,
            dy: 0,
            sweep: true
        },
        // PORT DEFINITION
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'in_target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' },
          
          // Port input untuk variabel eksternal
          // Inspector akan mensinkronkan 'value' disini dengan 'data.dx/dy'
          { _id: 'dx', label: 'Speed X', dataType: 'number', color: '#69F0AE', value: 0 },
          { _id: 'dy', label: 'Speed Y', dataType: 'number', color: '#69F0AE', value: 0 },
          { _id: 'sweep', label: 'Solid Collision?', dataType: 'boolean', color: '#FF5252', value: true }
        ],
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ]
      } 
    },
  ]
};