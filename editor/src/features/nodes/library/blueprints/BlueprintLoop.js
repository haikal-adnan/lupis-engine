import { Repeat } from 'lucide-vue-next';

export const BlueprintLoop = {
  id: 'control_loop',
  label: 'Loops',
  color: '#4CAF50',
  icon: Repeat,
  items: [
    {
      type: 'logicLoop',
      label: 'For Loop',
      description: 'Repeats execution from a Start value to an End value, incrementing by the specified Step.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'For Loop',
          headerColor: '#4CAF50',
          category: 'Loops'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'start', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'end', dataType: 'number', color: '#64B5F6', defaultValue: 10 },
          { id: 'step', dataType: 'number', color: '#64B5F6', defaultValue: 1 }
        ],
        outputs: [
          { id: 'loopBody', dataType: 'execution', color: '#FFFFFF' },
          { id: 'index', dataType: 'number', color: '#64B5F6' },
          { id: 'completed', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: { start: 0, end: 10, step: 1 },
          code: 
`const start = inputs.start;
const end = inputs.end;
let step = inputs.step;

if (step === 0) step = 1;

if (step > 0) {
  for (let i = start; i <= end; i += step) {
    outputs.index = i;
    outputs.loopBody = true;
  }
} else {
  for (let i = start; i >= end; i += step) {
    outputs.index = i;
    outputs.loopBody = true;
  }
}

outputs.completed = true;
return;`
        }
      }
    },
    {
      type: 'logicForEach',
      label: 'For Each',
      description: 'Repeats execution for each individual item contained within the List.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'For Each',
          headerColor: '#4CAF50',
          category: 'Loops'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'list', dataType: 'list', color: '#4DD0E1' }
        ],
        outputs: [
          { id: 'loopBody', dataType: 'execution', color: '#FFFFFF' },
          { id: 'item', dataType: 'any', color: '#B0BEC5' },
          { id: 'index', dataType: 'number', color: '#64B5F6' },
          { id: 'completed', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          code: 
`const list = inputs.list;

for (let i = 0; i < list.length; i++) {
  outputs.item = list[i];
  outputs.index = i;
  outputs.loopBody = true;
}

outputs.completed = true;
return;`
        }
      }
    },
    {
      type: 'logicWhile',
      label: 'While Loop',
      description: 'Continuously loops execution as long as the input condition remains true.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'While Loop',
          headerColor: '#4CAF50',
          category: 'Loops'
        },
        inputs: [
          { id: 'execIn', dataType: 'execution', color: '#FFFFFF' },
          { id: 'condition', dataType: 'boolean', color: '#E57373', defaultValue: false }
        ],
        outputs: [
          { id: 'loopBody', dataType: 'execution', color: '#FFFFFF' },
          { id: 'completed', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: {
            condition: false
          },
          code: 
`let iterations = 0;
const LIMIT = 5000;
const cond = inputs.condition;

while (cond) {
  iterations++;
  if (iterations > LIMIT) {
    break;
  }
  outputs.loopBody = true;
}

outputs.completed = true;
return;`
        }
      }
    }
  ]
};
