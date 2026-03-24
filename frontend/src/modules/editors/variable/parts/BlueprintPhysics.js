import { MoveRight, Gauge, Activity, Footprints } from 'lucide-vue-next';

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
      type: 'set_face_direction',
      label: 'Set Face Direction',
      description: 'Atur arah hadap karakter (4-Way, 8-Way, atau per sumbu)',
      icon: Footprints,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: {
        settings: {
          headerTitle: 'Face Direction',
          headerColor: '#FF4081',
          category: 'Physics'
        },
        data: {
          values: {
            axisX: 0,
            axisY: 0,
            mode: '4-way'
          },
          options: {
            mode: [
              { label: 'Horizontal Only', value: 'horizontal' },
              { label: 'Vertical Only', value: 'vertical' },
              { label: '4-Direction (Top/Side)', value: '4-way' },
              { label: '8-Direction (Diagonal)', value: '8-way' }
            ]
          }
        },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'in_target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' },
          { _id: 'axisX', label: 'Axis X', dataType: 'number', color: '#69F0AE' },
          { _id: 'axisY', label: 'Axis Y', dataType: 'number', color: '#69F0AE' },
          { _id: 'mode', label: 'Mode', dataType: 'string', color: '#FFEE58' }
        ],
        outputs: [
          { _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }
        ]
      }
    }
  ]
};