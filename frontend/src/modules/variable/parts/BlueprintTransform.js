import { Move, Axis3d, Footprints } from 'lucide-vue-next';

export const BlueprintTransform = {
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
            { value: 'pivotY', label: 'Pivot Y', type: 'number', color: '#FFB74D' },
            { value: 'flipX', label: 'Flip Horizontal', type: 'boolean', color: '#FF5252' },
            { value: 'flipY', label: 'Flip Vertical', type: 'boolean', color: '#FF5252' }
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
      label: 'Translate / Move', 
      description: 'Move object using Physics Velocity or Direct Translation.', 
      icon: Footprints, 
      allowDynamicInputs: false, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { 
          headerTitle: 'Translate', 
          headerColor: '#2E7D32', 
          category: 'Physics' 
        },
        data: {
            vel_x: 0,
            vel_y: 0,
            use_physics: false,
            sweep: true
        },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'in_target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' },
          
          { _id: 'vel_x', label: 'Velocity X', dataType: 'number', color: '#69F0AE', value: 0 },
          { _id: 'vel_y', label: 'Velocity Y', dataType: 'number', color: '#69F0AE', value: 0 },
        ],
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ]
      } 
    },
  ]
};