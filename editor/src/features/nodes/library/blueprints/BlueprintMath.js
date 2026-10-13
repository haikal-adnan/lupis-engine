import { Calculator } from 'lucide-vue-next';

/**
 * ============================================================================
 * BLUEPRINT: MATH
 * ============================================================================
 */
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
      dynamicMode: 'sequential', 
      defaultData: { 
        settings: { 
          headerTitle: 'Add', 
          headerColor: '#00796B', 
          category: 'Math' 
        },
        inputs: [
          { id: 'v0', label: 'Val 1', dataType: 'number', color: '#64B5F6' }, 
          { id: 'v1', label: 'Val 2', dataType: 'number', color: '#64B5F6' }  
        ],
        outputs: [
          { id: 'res', label: 'Result', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: { v0: 0, v1: 0 },
          code: 
`const numbers = Object.values(inputs).map(v => Number(v) || 0);
const sum = numbers.reduce((acc, curr) => acc + curr, 0);
outputs['Result'] = sum;
outputs['res'] = sum;
return;`
        }
      } 
    },
    { 
      type: 'math_subtract', 
      label: 'Subtract (-)', 
      description: 'Subtract numbers (Val 1 - Val 2 - ...)', 
      dynamicMode: 'sequential', 
      defaultData: { 
        settings: { 
          headerTitle: 'Subtract', 
          headerColor: '#00796B', 
          category: 'Math' 
        },
        inputs: [
          { id: 'v0', label: 'Val 1', dataType: 'number', color: '#64B5F6' }, 
          { id: 'v1', label: 'Val 2', dataType: 'number', color: '#64B5F6' }  
        ],
        outputs: [
          { id: 'res', label: 'Result', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: { v0: 0, v1: 0 },
          code: 
`const numbers = Object.values(inputs).map(v => Number(v) || 0);
const diff = numbers.reduce((acc, curr, idx) => idx === 0 ? curr : acc - curr, 0);
outputs['Result'] = diff;
outputs['res'] = diff;
return;`
        }
      } 
    },
    { 
      type: 'math_multiply', 
      label: 'Multiply (*)', 
      description: 'Multiply numbers together (Val 1 * Val 2 * ...)', 
      dynamicMode: 'sequential', 
      defaultData: { 
        settings: { 
          headerTitle: 'Multiply', 
          headerColor: '#00796B', 
          category: 'Math' 
        },
        inputs: [
          { id: 'v0', label: 'Val 1', dataType: 'number', color: '#64B5F6' }, 
          { id: 'v1', label: 'Val 2', dataType: 'number', color: '#64B5F6' }  
        ],
        outputs: [
          { id: 'res', label: 'Result', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: { v0: 1, v1: 1 },
          code: 
`const numbers = Object.values(inputs).map(v => Number(v) || 1);
const product = numbers.reduce((acc, curr) => acc * curr, 1);
outputs['Result'] = product;
outputs['res'] = product;
return;`
        }
      } 
    },
    { 
      type: 'math_divide', 
      label: 'Divide (/)', 
      description: 'Divide numbers (Val 1 / Val 2 / ...)', 
      dynamicMode: 'sequential', 
      defaultData: { 
        settings: { 
          headerTitle: 'Divide', 
          headerColor: '#00796B', 
          category: 'Math' 
        },
        inputs: [
          { id: 'v0', label: 'Val 1', dataType: 'number', color: '#64B5F6' }, 
          { id: 'v1', label: 'Val 2', dataType: 'number', color: '#64B5F6' }  
        ],
        outputs: [
          { id: 'res', label: 'Result', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: { v0: 0, v1: 1 },
          code: 
`const numbers = Object.values(inputs).map(v => Number(v) || 0);
const quotient = numbers.reduce((acc, curr, idx) => {
  if (idx === 0) return curr;
  return curr !== 0 ? acc / curr : 0;
}, 0);
outputs['Result'] = quotient;
outputs['res'] = quotient;
return;`
        }
      } 
    },
    { 
      type: 'math_negate', 
      label: 'Negate', 
      description: 'Invert (-A)', 
      dynamicMode: 'none', 
      defaultData: { 
        settings: { 
          headerTitle: 'Negate', 
          headerColor: '#00796B', 
          category: 'Math' 
        },
        inputs: [
          { id: 'a', label: 'A', dataType: 'number', color: '#64B5F6' }
        ],
        outputs: [
          { id: 'res', label: 'Result', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: { a: 0 },
          code: 
`const val = Number(inputs['A'] ?? inputs['a'] ?? 0);
const inverted = -val;
outputs['Result'] = inverted;
outputs['res'] = inverted;
return;`
        }
      } 
    },
    { 
      type: 'math_round', 
      label: 'Rounding (Floor/Ceil)', 
      description: 'Round, floor, or ceil a number', 
      dynamicMode: 'none', 
      defaultData: { 
        settings: { 
          headerTitle: 'Rounding', 
          headerColor: '#00796B', 
          category: 'Math' 
        },
        inputs: [
          { id: 'val', label: 'Value', dataType: 'number', color: '#64B5F6' }
        ],
        outputs: [
          { id: 'res', label: 'Result', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          method: 'floor',
          code: 
`const val = Number(inputs['Value'] ?? inputs['val'] ?? 0);
const method = node.data?.method || 'floor';
const result = typeof Math[method] === 'function' ? Math[method](val) : Math.floor(val);

outputs['Result'] = result;
outputs['res'] = result;
return;`
        }
      } 
    },
    { 
      type: 'math_distance_2d', 
      label: 'Distance 2D', 
      description: 'Calculate distance between two 2D points', 
      dynamicMode: 'none',
      defaultData: { 
        settings: { 
          headerTitle: 'Distance 2D', 
          headerColor: '#00796B', 
          category: 'Math' 
        },
        inputs: [
          { id: 'x1', label: 'X1', dataType: 'number', color: '#64B5F6' },
          { id: 'y1', label: 'Y1', dataType: 'number', color: '#64B5F6' },
          { id: 'x2', label: 'X2', dataType: 'number', color: '#64B5F6' },
          { id: 'y2', label: 'Y2', dataType: 'number', color: '#64B5F6' }
        ], 
        outputs: [
          { id: 'res', label: 'Distance', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: { x1: 0, y1: 0, x2: 0, y2: 0 },
          code: 
`const x1 = Number(inputs['X1'] ?? inputs['x1'] ?? 0);
const y1 = Number(inputs['Y1'] ?? inputs['y1'] ?? 0);
const x2 = Number(inputs['X2'] ?? inputs['x2'] ?? 0);
const y2 = Number(inputs['Y2'] ?? inputs['y2'] ?? 0);

const dist = Math.hypot(x2 - x1, y2 - y1);
outputs['Distance'] = dist;
outputs['res'] = dist;
return;`
        }
      } 
    },
    { 
      type: 'math_direction_2d', 
      label: 'Direction 2D', 
      description: 'Get normalized direction vector and angle from A to B', 
      dynamicMode: 'none',
      defaultData: { 
        settings: { 
          headerTitle: 'Direction 2D', 
          headerColor: '#00796B', 
          category: 'Math' 
        },
        inputs: [
          { id: 'from_x', label: 'From X', dataType: 'number', color: '#64B5F6' },
          { id: 'from_y', label: 'From Y', dataType: 'number', color: '#64B5F6' },
          { id: 'to_x', label: 'To X', dataType: 'number', color: '#64B5F6' },
          { id: 'to_y', label: 'To Y', dataType: 'number', color: '#64B5F6' }
        ], 
        outputs: [
          { id: 'dir_x', label: 'Dir X (-1 to 1)', dataType: 'number', color: '#64B5F6' },
          { id: 'dir_y', label: 'Dir Y (-1 to 1)', dataType: 'number', color: '#64B5F6' },
          { id: 'angle', label: 'Angle (Deg)', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: { from_x: 0, from_y: 0, to_x: 0, to_y: 0 },
          code: 
`const fromX = Number(inputs['From X'] ?? inputs['from_x'] ?? 0);
const fromY = Number(inputs['From Y'] ?? inputs['from_y'] ?? 0);
const toX = Number(inputs['To X'] ?? inputs['to_x'] ?? 0);
const toY = Number(inputs['To Y'] ?? inputs['to_y'] ?? 0);

const dx = toX - fromX;
const dy = toY - fromY;
const dist = Math.hypot(dx, dy);

const deg = Math.atan2(dy, dx) * (180 / Math.PI);
const dirX = dist > 0 ? dx / dist : 0;
const dirY = dist > 0 ? dy / dist : 0;

outputs['Angle (Deg)'] = deg;
outputs['angle'] = deg;
outputs['Dir X (-1 to 1)'] = dirX;
outputs['dir_x'] = dirX;
outputs['Dir Y (-1 to 1)'] = dirY;
outputs['dir_y'] = dirY;
return;`
        }
      } 
    }
  ]
};

