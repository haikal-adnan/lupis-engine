import { Calculator, Shuffle, ArrowRightLeft, Ruler, Compass } from 'lucide-vue-next';

export const BlueprintMath = {
  _id: 'math',
  label: 'Math',
  color: '#009688', 
  icon: Calculator,
  items: [
    { 
      type: 'math_chain', 
      label: 'Calculate', 
      description: 'Chain multiple math operations', 
      icon: Calculator,
      allowDynamicInputs: true,  
      allowDynamicOutputs: false, 
      defaultData: { 
        settings: { 
            headerTitle: 'Calculate', 
            headerColor: '#00796B', 
            category: 'Math' 
        },
        data: {
          ops: ['add'],
          values: { v0: 0, v1: 0 } 
        },
        inputs: [
          { _id: 'in', label: 'In', dataType: 'execution', color: '#fff' },
          { _id: 'v0', label: 'Val 1', dataType: 'number', color: '#B2FF59' }, 
          { _id: 'v1', label: 'Val 2', dataType: 'number', color: '#B2FF59' }  
        ],
        outputs: [
          { _id: 'out', label: 'Trigger', dataType: 'execution', color: '#fff' },
          { _id: 'res', label: 'Result', dataType: 'number', color: '#B2FF59' }
        ]
      } 
    },
    { 
      type: 'math_negate', 
      label: 'Negate', 
      description: 'Invert (-A)', 
      icon: ArrowRightLeft, 
      allowDynamicInputs: false, 
      defaultData: { 
        settings: { headerTitle: 'Negate', headerColor: '#00796B', category: 'Math' },
        data: {
          values: { a: 0 } 
        },
        inputs: [
            { _id: 'in', label: 'In', dataType: 'execution', color: '#fff' },
            { _id: 'a', label: 'A', dataType: 'number', color: '#B2FF59' }
        ],
        outputs: [
            { _id: 'out', label: 'Trigger', dataType: 'execution', color: '#fff' },
            { _id: 'res', label: 'Result', dataType: 'number', color: '#B2FF59' }
        ]
      } 
    },
    { 
      type: 'math_distance_2d', 
      label: 'Distance 2D', 
      description: 'Calculate distance between two 2D points', 
      icon: Ruler,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Distance 2D', headerColor: '#00796B', category: 'Math' },
        inputs: [
          { _id: 'x1', label: 'X1', dataType: 'number', color: '#B2FF59' },
          { _id: 'y1', label: 'Y1', dataType: 'number', color: '#B2FF59' },
          { _id: 'x2', label: 'X2', dataType: 'number', color: '#B2FF59' },
          { _id: 'y2', label: 'Y2', dataType: 'number', color: '#B2FF59' }
        ], 
        outputs: [
          // Tidak ada execution pin, karena ini adalah fungsi "Pure"
          { _id: 'res', label: 'Distance', dataType: 'number', color: '#B2FF59' }
        ]
      } 
    },
    { 
      type: 'math_direction_2d', 
      label: 'Direction 2D', 
      description: 'Get normalized direction vector and angle from A to B', 
      icon: Compass,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Direction 2D', headerColor: '#00796B', category: 'Math' },
        inputs: [
          { _id: 'from_x', label: 'From X', dataType: 'number', color: '#B2FF59' },
          { _id: 'from_y', label: 'From Y', dataType: 'number', color: '#B2FF59' },
          { _id: 'to_x', label: 'To X', dataType: 'number', color: '#B2FF59' },
          { _id: 'to_y', label: 'To Y', dataType: 'number', color: '#B2FF59' }
        ], 
        outputs: [
          // Tidak ada execution pin
          { _id: 'dir_x', label: 'Dir X (-1 to 1)', dataType: 'number', color: '#B2FF59' },
          { _id: 'dir_y', label: 'Dir Y (-1 to 1)', dataType: 'number', color: '#B2FF59' },
          { _id: 'angle', label: 'Angle (Deg)', dataType: 'number', color: '#B2FF59' }
        ]
      } 
    }
  ]
};