import { Calculator } from 'lucide-vue-next';

export const BlueprintMath = {
  id: 'math',
  label: 'Math',
  color: '#009688', 
  icon: Calculator,
  items: [
    { 
      type: 'mathAdd', 
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
          { id: 'v0', dataType: 'number', color: '#64B5F6' }, 
          { id: 'v1', dataType: 'number', color: '#64B5F6' }  
        ],
        outputs: [
          { id: 'result', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: { v0: 0, v1: 0 },
          code: 
`const numbers = Object.values(inputs);
const sum = numbers.reduce((acc, curr) => acc + curr, 0);
outputs.result = sum;
return;`
        }
      } 
    },
    { 
      type: 'mathSubtract', 
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
          { id: 'v0', dataType: 'number', color: '#64B5F6' }, 
          { id: 'v1', dataType: 'number', color: '#64B5F6' }  
        ],
        outputs: [
          { id: 'result', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: { v0: 0, v1: 0 },
          code: 
`const numbers = Object.values(inputs);
const diff = numbers.reduce((acc, curr, idx) => idx === 0 ? curr : acc - curr, 0);
outputs.result = diff;
return;`
        }
      } 
    },
    { 
      type: 'mathMultiply', 
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
          { id: 'v0', dataType: 'number', color: '#64B5F6' }, 
          { id: 'v1', dataType: 'number', color: '#64B5F6' }  
        ],
        outputs: [
          { id: 'result', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: { v0: 1, v1: 1 },
          code: 
`const numbers = Object.values(inputs);
const product = numbers.reduce((acc, curr) => acc * curr, 1);
outputs.result = product;
return;`
        }
      } 
    },
    { 
      type: 'mathDivide', 
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
          { id: 'v0', dataType: 'number', color: '#64B5F6' }, 
          { id: 'v1', dataType: 'number', color: '#64B5F6' }  
        ],
        outputs: [
          { id: 'result', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: { v0: 0, v1: 1 },
          code: 
`const numbers = Object.values(inputs);
const quotient = numbers.reduce((acc, curr, idx) => {
  if (idx === 0) return curr;
  return curr !== 0 ? acc / curr : 0;
}, 0);
outputs.result = quotient;
return;`
        }
      } 
    },
    { 
      type: 'mathNegate', 
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
          { id: 'a', dataType: 'number', color: '#64B5F6', defaultValue: 0 }
        ],
        outputs: [
          { id: 'result', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: { a: 0 },
          code: 
`const val = inputs.a;
const inverted = -val;
outputs.result = inverted;
return;`
        }
      } 
    },
    { 
      type: 'mathRound', 
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
          { id: 'value', dataType: 'number', color: '#64B5F6', defaultValue: 0 }
        ],
        outputs: [
          { id: 'result', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: { value: 0 },
          method: 'floor',
          code: 
`const val = inputs.value;
const method = node.data.method;
const result = typeof Math[method] === 'function' ? Math[method](val) : Math.floor(val);

outputs.result = result;
return;`
        }
      } 
    },
    { 
      type: 'mathDistance2d', 
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
          { id: 'x1', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'y1', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'x2', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'y2', dataType: 'number', color: '#64B5F6', defaultValue: 0 }
        ], 
        outputs: [
          { id: 'result', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: { x1: 0, y1: 0, x2: 0, y2: 0 },
          code: 
`const x1 = inputs.x1;
const y1 = inputs.y1;
const x2 = inputs.x2;
const y2 = inputs.y2;

outputs.result = Math.hypot(x2 - x1, y2 - y1);
return;`
        }
      } 
    },
    { 
      type: 'mathDirection2d', 
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
          { id: 'fromX', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'fromY', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'toX', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'toY', dataType: 'number', color: '#64B5F6', defaultValue: 0 }
        ], 
        outputs: [
          { id: 'directionX', dataType: 'number', color: '#64B5F6' },
          { id: 'directionY', dataType: 'number', color: '#64B5F6' },
          { id: 'angle', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: { fromX: 0, fromY: 0, toX: 0, toY: 0 },
          code: 
`const fromX = inputs.fromX;
const fromY = inputs.fromY;
const toX = inputs.toX;
const toY = inputs.toY;

const dx = toX - fromX;
const dy = toY - fromY;
const dist = Math.hypot(dx, dy);

const deg = Math.atan2(dy, dx) * (180 / Math.PI);
const dirX = dist > 0 ? dx / dist : 0;
const dirY = dist > 0 ? dy / dist : 0;

outputs.angle = deg;
outputs.directionX = dirX;
outputs.directionY = dirY;
return;`
        }
      } 
    }
  ]
};
