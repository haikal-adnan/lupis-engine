import { Calculator } from 'lucide-vue-next';

export const BlueprintMath = {
  id: 'math_operations',
  label: 'Math & Random',
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
          category: 'Math & Random' 
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
          category: 'Math & Random' 
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
          category: 'Math & Random' 
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
          category: 'Math & Random' 
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
          category: 'Math & Random' 
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
          category: 'Math & Random' 
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
      type: 'mathInRange', 
      label: 'In Range', 
      description: 'Check if a number is within a min and max range (min <= value <= max)', 
      dynamicMode: 'none', 
      defaultData: { 
        settings: { 
          headerTitle: 'In Range', 
          headerColor: '#00796B', 
          category: 'Math & Random' 
        },
        inputs: [
          { id: 'value', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'min', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'max', dataType: 'number', color: '#64B5F6', defaultValue: 100 }
        ],
        outputs: [
          { id: 'result', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: { value: 0, min: 0, max: 100 },
          code: 
`const val = inputs.value;
const min = inputs.min;
const max = inputs.max;

outputs.result = val >= min && val <= max;
return;`
        }
      } 
    },
    { 
      type: 'mathClamp', 
      label: 'Clamp', 
      description: 'Clamp a number between a minimum and maximum limit', 
      dynamicMode: 'none', 
      defaultData: { 
        settings: { 
          headerTitle: 'Clamp', 
          headerColor: '#00796B', 
          category: 'Math & Random' 
        },
        inputs: [
          { id: 'value', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'min', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'max', dataType: 'number', color: '#64B5F6', defaultValue: 100 }
        ],
        outputs: [
          { id: 'result', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: { value: 0, min: 0, max: 100 },
          code: 
`const val = inputs.value;
const min = inputs.min;
const max = inputs.max;

outputs.result = Math.min(Math.max(val, min), max);
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
          category: 'Math & Random' 
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
          category: 'Math & Random' 
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
    },
{
      type: 'randomSmart',
      label: 'Random Number',
      description: 'Generates a random number. Outputs an integer if inputs are integers, or a float if inputs are decimals.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Random Number',
          headerColor: '#FF5722',
          category: 'Math & Random'
        },
        inputs: [
          { id: 'min', dataType: 'number', color: '#64B5F6', defaultValue: 1 },
          { id: 'max', dataType: 'number', color: '#64B5F6', defaultValue: 10 }
        ],
        outputs: [
          { id: 'result', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: { min: 1, max: 10 },
          code: 
`const min = inputs.min;
const max = inputs.max;

let res = 0;
if (Number.isInteger(min) && Number.isInteger(max)) {
  res = Math.floor(Math.random() * (max - min + 1)) + min;
} else {
  res = Math.random() * (max - min) + min;
}

outputs.result = res;
return;`
        }
      }
    },
{
      type: 'randomChance',
      label: 'Random Chance',
      description: 'Outputs true (Success) or false (Failure) based on a specified probability percentage (0 - 100).',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Random Chance',
          headerColor: '#FF5722',
          category: 'Math & Random'
        },
        inputs: [
          { id: 'chance', dataType: 'number', color: '#64B5F6', defaultValue: 25 }
        ],
        outputs: [
          { id: 'result', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: { chance: 25 },
          code: 
`outputs.result = (Math.random() * 100) < inputs.chance;
return;`
        }
      }
    },
{
      type: 'randomFromList',
      label: 'List Get Random',
      description: 'Retrieves a single random item from within the provided List or Array.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Random From List',
          headerColor: '#FF5722',
          category: 'Math & Random'
        },
        inputs: [
          { id: 'list', dataType: 'list', color: '#4DD0E1' }
        ],
        outputs: [
          { id: 'item', dataType: 'any', color: '#B0BEC5' }
        ],
        data: {
          code: 
`const list = inputs.list;
outputs.item = list[Math.floor(Math.random() * list.length)];
return;`
        }
      }
    },
{
      type: 'randomColor',
      label: 'Random Color',
      description: 'Generates a random color formatted as a Hex string (e.g., #A3F10C).',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Random Color',
          headerColor: '#FF5722',
          category: 'Math & Random'
        },
        inputs: [],
        outputs: [
          { id: 'color', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          code: 
`outputs.color = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
return;`
        }
      }
    }
  ]
};
