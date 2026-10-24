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
      description: 'Adds multiple numeric inputs together sequentially.', 
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
`const v0 = inputs.v0;
const v1 = inputs.v1;
const numbers = Object.values(inputs);
const sum = numbers.reduce((acc, curr) => acc + curr, 0);
outputs.result = sum;
return;`
        }
      } 
    },
{ 
      type: 'mathSubtract', 
      label: 'Subtract (-)', 
      description: 'Subtracts subsequent numeric inputs from the first input value.', 
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
`const v0 = inputs.v0;
const v1 = inputs.v1;
const numbers = Object.values(inputs);
const diff = numbers.reduce((acc, curr, idx) => idx === 0 ? curr : acc - curr, 0);
outputs.result = diff;
return;`
        }
      } 
    },
{ 
      type: 'mathMultiply', 
      label: 'Multiply (*)', 
      description: 'Multiplies multiple numeric inputs together sequentially.', 
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
`const v0 = inputs.v0;
const v1 = inputs.v1;
const numbers = Object.values(inputs);
const product = numbers.reduce((acc, curr) => acc * curr, 1);
outputs.result = product;
return;`
        }
      } 
    },
{ 
      type: 'mathDivide', 
      label: 'Divide (/)', 
      description: 'Divides the first numeric input by subsequent input values.', 
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
`const v0 = inputs.v0;
const v1 = inputs.v1;
const numbers = Object.values(inputs);
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
      description: 'Inverts the sign of a numeric input (multiplies by -1).', 
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
      description: 'Rounds a number to the nearest integer using round, floor, or ceil mode.', 
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
      description: 'Checks whether a number falls within an inclusive minimum and maximum range.', 
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
      description: 'Clamps a number between specified minimum and maximum bounds.', 
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
      description: 'Calculates the Euclidean distance between two 2D points.', 
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
      description: 'Calculates the normalized direction vector and angle in degrees from point A to B.', 
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
      description: 'Generates a random number within a range, matching integer or float input precision.',
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
      description: 'Evaluates a random probability check based on a percentage chance (0–100%).',
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
      description: 'Picks a random item and its index from a provided list.',
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
      description: 'Generates a random hex color string (e.g. #A3F10C).',
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
    },
    {
      type: 'snapValue',
      label: 'Snap Value',
      description: 'Snaps a number to the nearest step increment with optional min/max clamping.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Snap Value',
          headerColor: '#00796B',
          category: 'Math & Random'
        },
        inputs: [
          { id: 'value', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'step', dataType: 'number', color: '#64B5F6', defaultValue: 10 },
          { id: 'min', dataType: 'number', color: '#64B5F6' },
          { id: 'max', dataType: 'number', color: '#64B5F6' }
        ],
        outputs: [
          { id: 'result', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: { value: 0, step: 10 },
          code:
`const val = Number(inputs.value) || 0;
const step = Math.abs(Number(inputs.step)) || 1;
let res = Math.round(val / step) * step;
const min = Number(inputs.min);
const max = Number(inputs.max);
if (!isNaN(min)) res = Math.max(min, res);
if (!isNaN(max)) res = Math.min(max, res);
outputs.result = Number(res.toFixed(6));
return;`
        }
      }
    },
    {
      type: 'mathChain',
      label: 'Math Chain',
      description: 'Executes a configurable multi-step arithmetic calculation pipeline.',
      dynamicMode: 'sequential',
      defaultData: {
        settings: {
          headerTitle: 'Math Chain',
          headerColor: '#009688',
          category: 'Math & Random'
        },
        inputs: [
          { id: 'v0', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'v1', dataType: 'number', color: '#64B5F6', defaultValue: 0 }
        ],
        outputs: [
          { id: 'result', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          ops: ['add'],
          values: { v0: 0, v1: 0 },
          code:
`let res = Number(inputs.v0) || 0;
res = res + (Number(inputs.v1) || 0);
outputs.result = Number(res.toFixed(6));
return;`
        }
      }
    }
  ]
};
