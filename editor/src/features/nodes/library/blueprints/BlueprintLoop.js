import { Repeat } from 'lucide-vue-next';

export const BlueprintLoop = {
  id: 'control_loop',
  label: 'Loops',
  color: '#4CAF50',
  icon: Repeat,
  items: [
    {
      type: 'logic_loop',
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
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'start', label: 'Start', dataType: 'number', color: '#64B5F6', defaultValue: 0 },
          { id: 'end', label: 'End', dataType: 'number', color: '#64B5F6', defaultValue: 10 },
          { id: 'step', label: 'Step', dataType: 'number', color: '#64B5F6', defaultValue: 1 }
        ],
        outputs: [
          { id: 'loop_body', label: 'Loop Body', dataType: 'execution', color: '#FFFFFF' },
          { id: 'index', label: 'Index', dataType: 'number', color: '#64B5F6' },
          { id: 'completed', label: 'On Completed', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          values: { start: 0, end: 10, step: 1 },
          code: 
`const startInput = inputs['Start'] ?? inputs['start'];
const endInput = inputs['End'] ?? inputs['end'];
const stepInput = inputs['Step'] ?? inputs['step'];

const start = startInput !== undefined && startInput !== null ? Number(startInput) : 0;
const end = endInput !== undefined && endInput !== null ? Number(endInput) : 0;
let step = stepInput !== undefined && stepInput !== null ? Number(stepInput) : 1;

if (step === 0) step = 1;

if (step > 0) {
  for (let i = start; i <= end; i += step) {
    context.node._tempLoopIndex = i;
    outputs['Loop Body'] = true;
    outputs['loop_body'] = true;
  }
} else {
  for (let i = start; i >= end; i += step) {
    context.node._tempLoopIndex = i;
    outputs['Loop Body'] = true;
    outputs['loop_body'] = true;
  }
}

const finalIdx = context.node._tempLoopIndex || 0;
outputs['Index'] = finalIdx;
outputs['index'] = finalIdx;
outputs['On Completed'] = true;
outputs['completed'] = true;
return;`
        }
      }
    },
    {
      type: 'logic_for_each',
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
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'list', label: 'List', dataType: 'list', color: '#4DD0E1' }
        ],
        outputs: [
          { id: 'loop_body', label: 'Loop Body', dataType: 'execution', color: '#FFFFFF' },
          { id: 'item', label: 'Item', dataType: 'any', color: '#B0BEC5' },
          { id: 'index', label: 'Index', dataType: 'number', color: '#64B5F6' },
          { id: 'completed', label: 'On Completed', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          code: 
`const list = inputs['List'] ?? inputs['list'];

if (Array.isArray(list)) {
  for (let i = 0; i < list.length; i++) {
    context.node._tempIndex = i;
    context.node._tempItem = list[i];
    outputs['Item'] = list[i];
    outputs['item'] = list[i];
    outputs['Index'] = i;
    outputs['index'] = i;
    outputs['Loop Body'] = true;
    outputs['loop_body'] = true;
  }
}

outputs['On Completed'] = true;
outputs['completed'] = true;
return;`
        }
      }
    },
    {
      type: 'logic_while',
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
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#FFFFFF' },
          { id: 'condition', label: 'Condition', dataType: 'boolean', color: '#E57373', defaultValue: false }
        ],
        outputs: [
          { id: 'loop_body', label: 'Loop Body', dataType: 'execution', color: '#FFFFFF' },
          { id: 'completed', label: 'On Completed', dataType: 'execution', color: '#FFFFFF' }
        ],
        data: {
          code: 
`let iterations = 0;
const LIMIT = 5000;
const cond = inputs['Condition'] ?? inputs['condition'];

while (cond === true) {
  iterations++;
  if (iterations > LIMIT) {
    break;
  }
  outputs['Loop Body'] = true;
  outputs['loop_body'] = true;
}

outputs['On Completed'] = true;
outputs['completed'] = true;
return;`
        }
      }
    }
  ]
};

