import { Move, Axis3d } from 'lucide-vue-next';

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
        settings: { headerTitle: 'Get Transform', headerColor: '#2E7D32', category: 'Transform' },
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
          ],
          values: { target_in: '' }
        },
        inputs: [{ _id: 'target_in', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' }], 
        outputs: [] 
      } 
    },
    { 
      type: 'set_transform', 
      label: 'Set Transform', 
      description: 'Teleport or modify absolute transform properties', 
      icon: Axis3d,
      allowDynamicInputs: true, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Set Transform', headerColor: '#2E7D32', category: 'Transform' },
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
          ],
          values: { target_in: '' }
        },
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'target_in', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' }
        ],
        outputs: [{ _id: 'exec_out', label: 'Out', dataType: 'execution', color: '#ffffff' }]
      } 
    }
  ]
};