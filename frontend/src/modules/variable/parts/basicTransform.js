import { Move } from 'lucide-vue-next';

export const basicTransform = {
  id: 'game_transform',
  label: 'Transform',
  color: '#4CAF50',
  icon: Move,
  items: [
    { 
      type: 'get_transform', 
      label: 'Get Transform', 
      description: 'Get transform of Self or Target ID', 
      defaultData: { 
        settings: { headerTitle: 'Get Transform', headerColor: '#2E7D32', category: 'Game Object' },
        inputs: [
          { _id: 'target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' }
        ], 
        outputs: [
          { _id: 'x', label: 'X', dataType: 'number', color: '#69F0AE' },
          { _id: 'y', label: 'Y', dataType: 'number', color: '#69F0AE' },
          { _id: 'rotation', label: 'Rotation', dataType: 'number', color: '#B2FF59' },
          { _id: 'width', label: 'Width', dataType: 'number', color: '#40C4FF' },
          { _id: 'height', label: 'Height', dataType: 'number', color: '#40C4FF' },
          { _id: 'pivotX', label: 'Pivot X', dataType: 'number', color: '#FFB74D' },
          { _id: 'pivotY', label: 'Pivot Y', dataType: 'number', color: '#FFB74D' }
        ]
      } 
    },

    { 
      type: 'set_transform', 
      label: 'Set Transform', 
      description: 'Set transform of Self or Target ID', 
      defaultData: { 
        settings: { 
          headerTitle: 'Set Transform', 
          headerColor: '#2E7D32', 
          category: 'Game Object' 
        },
        inputs: [
          { _id: 'in', label: 'In', dataType: 'execution', color: '#fff' },
          { _id: 'target', label: 'Target ID (Self)', dataType: 'string', color: '#E040FB' },
          
          { _id: 'x', label: 'X', dataType: 'number', color: '#69F0AE' },
          { _id: 'y', label: 'Y', dataType: 'number', color: '#69F0AE' },
          { _id: 'rotation', label: 'Rotation', dataType: 'number', color: '#B2FF59' },
          { _id: 'width', label: 'Width', dataType: 'number', color: '#40C4FF' },
          { _id: 'height', label: 'Height', dataType: 'number', color: '#40C4FF' },
          { _id: 'pivotX', label: 'Pivot X', dataType: 'number', color: '#FFB74D' },
          { _id: 'pivotY', label: 'Pivot Y', dataType: 'number', color: '#FFB74D' }
        ],
        outputs: [
          { _id: 'out', label: 'Out', dataType: 'execution', color: '#fff' },
          
          { _id: 'x', label: 'X', dataType: 'number', color: '#69F0AE' },
          { _id: 'y', label: 'Y', dataType: 'number', color: '#69F0AE' },
          { _id: 'rotation', label: 'Rotation', dataType: 'number', color: '#B2FF59' },
          { _id: 'width', label: 'Width', dataType: 'number', color: '#40C4FF' },
          { _id: 'height', label: 'Height', dataType: 'number', color: '#40C4FF' },
          { _id: 'pivotX', label: 'Pivot X', dataType: 'number', color: '#FFB74D' },
          { _id: 'pivotY', label: 'Pivot Y', dataType: 'number', color: '#FFB74D' }
        ]
      } 
    },
  ]
};