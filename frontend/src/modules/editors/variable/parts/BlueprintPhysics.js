import { MoveRight, Zap, Gauge, Layers, Activity, Footprints } from 'lucide-vue-next';

export const BlueprintPhysics = {
  _id: 'game_physics',
  label: 'Physics',
  color: '#7C4DFF',
  icon: Activity,
  items: [
  { 
      type: 'get_physics', 
      label: 'Get Physics', 
      description: 'Get specific physics properties like velocity, grounded state, or movement state', 
      icon: Gauge,
      allowDynamicInputs: false,
      allowDynamicOutputs: true, 
      defaultData: { 
        settings: { 
          headerTitle: 'Get Physics', 
          headerColor: '#5E35B1', 
          category: 'Physics' 
        },
        data: {
          propertyOptions: [
            { value: 'velocityX', label: 'Velocity X', type: 'number', color: '#69F0AE' },
            { value: 'velocityY', label: 'Velocity Y', type: 'number', color: '#69F0AE' },
            { value: 'isGrounded', label: 'Is Grounded?', type: 'boolean', color: '#B2FF59' },
            { value: 'movementState', label: 'Movement State', type: 'string', color: '#FFEE58' }, 
            { value: 'facingDirection', label: 'Facing Direction', type: 'string', color: '#FF4081' },
            { value: 'mass', label: 'Mass', type: 'number', color: '#FFB74D' },
            { value: 'gravityScale', label: 'Gravity Scale', type: 'number', color: '#40C4FF' },
            { value: 'drag', label: 'Drag', type: 'number', color: '#FF8A65' },
            { value: 'enabled', label: 'Is Enabled?', type: 'boolean', color: '#ffffff' }
          ]
        },
        inputs: [
          { _id: 'in_target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' }
        ], 
        outputs: [] 
      } 
    },

    { 
      type: 'set_physics', 
      label: 'Set Physics', 
      description: 'Modify specific physics properties of Self or Target', 
      icon: MoveRight,
      allowDynamicInputs: true, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { 
          headerTitle: 'Set Physics', 
          headerColor: '#5E35B1', 
          category: 'Physics' 
        },
        data: {
          propertyOptions: [
            { value: 'velocityX', label: 'Velocity X', type: 'number', color: '#69F0AE' },
            { value: 'velocityY', label: 'Velocity Y', type: 'number', color: '#69F0AE' },
            { value: 'mass', label: 'Mass', type: 'number', color: '#FFB74D' },
            { value: 'gravityScale', label: 'Gravity Scale', type: 'number', color: '#40C4FF' },
            { value: 'drag', label: 'Drag', type: 'number', color: '#FF8A65' },
            { value: 'enabled', label: 'Enabled?', type: 'boolean', color: '#ffffff' }
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
      type: 'apply_impulse', 
      label: 'Apply Impulse', 
      description: 'Add instant force (useful for jumping or explosions)', 
      icon: Zap,
      allowDynamicInputs: false, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { 
          headerTitle: 'Apply Impulse', 
          headerColor: '#D500F9', 
          category: 'Physics' 
        },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'in_target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' },
          { _id: 'forceX', label: 'Force X', dataType: 'number', color: '#69F0AE', value: 0 },
          { _id: 'forceY', label: 'Force Y', dataType: 'number', color: '#69F0AE', value: 0 }
        ],
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ]
      } 
    }
  ]
};