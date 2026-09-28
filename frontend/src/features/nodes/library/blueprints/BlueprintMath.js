import { 
  Calculator, 
  ArrowRightLeft, 
  Ruler, 
  Compass, 
  Plus, 
  Minus, 
  X, 
  Divide 
} from 'lucide-vue-next';

export const BlueprintMath = {
  id: 'math',
  label: 'Math',
  color: '#009688', 
  icon: Calculator,
  items: [
    { 
      type: 'math_add', 
      label: 'Add (+)', 
      description: 'Add numbers together (Val 1 + Val 2 + ...)', 
      icon: Plus,
      allowDynamicInputs: true,  
      allowDynamicOutputs: false, 
      defaultData: { 
        settings: { 
          headerTitle: 'Add', 
          headerColor: '#00796B', 
          category: 'Math' 
        },
        inputs: [
          { id: 'v0', label: 'Val 1', dataType: 'number', color: '#B2FF59' }, 
          { id: 'v1', label: 'Val 2', dataType: 'number', color: '#B2FF59' }  
        ],
        outputs: [
          { id: 'res', label: 'Result', dataType: 'number', color: '#B2FF59' }
        ],
        data: {
          values: { v0: 0, v1: 0 },
          code: `const val1 = inputs['Val 1'];
const val2 = inputs['Val 2'];

const collection = [val1, val2];

outputs['res'] = collection.reduce((acc, curr) => acc + curr, 0);
return;`
        }
      } 
    },
    { 
      type: 'math_subtract', 
      label: 'Subtract (-)', 
      description: 'Subtract numbers (Val 1 - Val 2 - ...)', 
      icon: Minus,
      allowDynamicInputs: true,  
      allowDynamicOutputs: false, 
      defaultData: { 
        settings: { 
          headerTitle: 'Subtract', 
          headerColor: '#00796B', 
          category: 'Math' 
        },
        inputs: [
          { id: 'v0', label: 'Val 1', dataType: 'number', color: '#B2FF59' }, 
          { id: 'v1', label: 'Val 2', dataType: 'number', color: '#B2FF59' }  
        ],
        outputs: [
          { id: 'res', label: 'Result', dataType: 'number', color: '#B2FF59' }
        ],
        data: {
          values: { v0: 0, v1: 0 },
          code: `const val1 = inputs['Val 1'];
const val2 = inputs['Val 2'];

const collection = [val1, val2];

outputs['res'] = collection.reduce((acc, curr, idx) => idx === 0 ? curr : acc - curr, 0);
return;`
        }
      } 
    },
    { 
      type: 'math_multiply', 
      label: 'Multiply (*)', 
      description: 'Multiply numbers together (Val 1 * Val 2 * ...)', 
      icon: X,
      allowDynamicInputs: true,  
      allowDynamicOutputs: false, 
      defaultData: { 
        settings: { 
          headerTitle: 'Multiply', 
          headerColor: '#00796B', 
          category: 'Math' 
        },
        inputs: [
          { id: 'v0', label: 'Val 1', dataType: 'number', color: '#B2FF59' }, 
          { id: 'v1', label: 'Val 2', dataType: 'number', color: '#B2FF59' }  
        ],
        outputs: [
          { id: 'res', label: 'Result', dataType: 'number', color: '#B2FF59' }
        ],
        data: {
          values: { v0: 1, v1: 1 },
          code: `const val1 = inputs['Val 1'];
const val2 = inputs['Val 2'];

const collection = [val1, val2];

outputs['res'] = collection.reduce((acc, curr) => acc * curr, 1);
return;`
        }
      } 
    },
    { 
      type: 'math_divide', 
      label: 'Divide (/)', 
      description: 'Divide numbers (Val 1 / Val 2 / ...)', 
      icon: Divide,
      allowDynamicInputs: true,  
      allowDynamicOutputs: false, 
      defaultData: { 
        settings: { 
          headerTitle: 'Divide', 
          headerColor: '#00796B', 
          category: 'Math' 
        },
        inputs: [
          { id: 'v0', label: 'Val 1', dataType: 'number', color: '#B2FF59' }, 
          { id: 'v1', label: 'Val 2', dataType: 'number', color: '#B2FF59' }  
        ],
        outputs: [
          { id: 'res', label: 'Result', dataType: 'number', color: '#B2FF59' }
        ],
        data: {
          values: { v0: 0, v1: 1 },
          code: `const val1 = inputs['Val 1'];
const val2 = inputs['Val 2'];

const collection = [val1, val2];

outputs['res'] = collection.reduce((acc, curr, idx) => idx === 0 ? curr : acc / curr);
return;`
        }
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
        inputs: [
          { id: 'a', label: 'A', dataType: 'number', color: '#B2FF59' }
        ],
        outputs: [
          { id: 'res', label: 'Result', dataType: 'number', color: '#B2FF59' }
        ],
        data: {
          values: { a: 0 },
          code: `outputs['res'] = -inputs['A'];
return;`
        }
      } 
    },
    { 
      type: 'math_round', 
      label: 'Rounding (Floor/Ceil)', 
      description: 'Round, floor, or ceil a number', 
      icon: Calculator, 
      allowDynamicInputs: false, 
      defaultData: { 
        settings: { headerTitle: 'Rounding', headerColor: '#00796B', category: 'Math' },
        inputs: [
          { id: 'val', label: 'Value', dataType: 'number', color: '#B2FF59' }
        ],
        outputs: [
          { id: 'res', label: 'Result', dataType: 'number', color: '#B2FF59' }
        ],
        data: {
          method: 'floor',
          code: `const val = inputs['Value'];
const method = context.node.data?.method;

outputs['res'] = Math[method](val);
return;`
        }
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
          { id: 'x1', label: 'X1', dataType: 'number', color: '#B2FF59' },
          { id: 'y1', label: 'Y1', dataType: 'number', color: '#B2FF59' },
          { id: 'x2', label: 'X2', dataType: 'number', color: '#B2FF59' },
          { id: 'y2', label: 'Y2', dataType: 'number', color: '#B2FF59' }
        ], 
        outputs: [
          { id: 'res', label: 'Distance', dataType: 'number', color: '#B2FF59' }
        ],
        data: {
          code: `const dx = inputs['X2'] - inputs['X1'];
const dy = inputs['Y2'] - inputs['Y1'];
outputs['res'] = Math.hypot(dx, dy);
return;`
        }
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
          { id: 'from_x', label: 'From X', dataType: 'number', color: '#B2FF59' },
          { id: 'from_y', label: 'From Y', dataType: 'number', color: '#B2FF59' },
          { id: 'to_x', label: 'To X', dataType: 'number', color: '#B2FF59' },
          { id: 'to_y', label: 'To Y', dataType: 'number', color: '#B2FF59' }
        ], 
        outputs: [
          { id: 'dir_x', label: 'Dir X (-1 to 1)', dataType: 'number', color: '#B2FF59' },
          { id: 'dir_y', label: 'Dir Y (-1 to 1)', dataType: 'number', color: '#B2FF59' },
          { id: 'angle', label: 'Angle (Deg)', dataType: 'number', color: '#B2FF59' }
        ],
        data: {
          code: `const dx = inputs['To X'] - inputs['From X'];
const dy = inputs['To Y'] - inputs['From Y'];
const dist = Math.hypot(dx, dy);

outputs['angle'] = Math.atan2(dy, dx) * (180 / Math.PI);
outputs['dir_x'] = dx / dist;
outputs['dir_y'] = dy / dist;
return;`
        }
      } 
    }
  ]
};