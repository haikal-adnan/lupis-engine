import { 
  Repeat, 
  RefreshCcw,
  RotateCcw
} from 'lucide-vue-next';

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
      icon: Repeat,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'For Loop', headerColor: '#4CAF50', category: 'Loop' },
        data: { 
          values: { start: 0, end: 10, step: 1 },
          code: `const startInput = inputs['Start'];
const endInput = inputs['End'];
const stepInput = inputs['Step'];

const start = startInput !== undefined && startInput !== null ? Number(startInput) : 0;
const end = endInput !== undefined && endInput !== null ? Number(endInput) : 0;
let step = stepInput !== undefined && stepInput !== null ? Number(stepInput) : 1;

if (step === 0) step = 1;

if (step > 0) {
    for (let i = start; i <= end; i += step) {
        context.node._tempLoopIndex = i;
        outputs['Loop Body'] = true;
    }
} else {
    for (let i = start; i >= end; i += step) {
        context.node._tempLoopIndex = i;
        outputs['Loop Body'] = true;
    }
}

outputs['Index'] = context.node._tempLoopIndex || 0;
outputs['On Completed'] = true;
return;`
        }, 
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'start', label: 'Start', dataType: 'number', color: '#B2FF59', defaultValue: 0 },
          { id: 'end', label: 'End', dataType: 'number', color: '#B2FF59', defaultValue: 10 },
          { id: 'step', label: 'Step', dataType: 'number', color: '#B2FF59', defaultValue: 1 }
        ], 
        outputs: [
          { id: 'loop_body', label: 'Loop Body', dataType: 'execution', color: '#ffffff' },
          { id: 'index', label: 'Index', dataType: 'number', color: '#B2FF59' },
          { id: 'completed', label: 'On Completed', dataType: 'execution', color: '#ffffff' }
        ]
      } 
    },
    { 
      type: 'logic_for_each', 
      label: 'For Each', 
      description: 'Repeats execution for each individual item contained within the List.',
      icon: RotateCcw,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'For Each', headerColor: '#4CAF50', category: 'Loop' },
        data: {
          code: `const list = inputs['List'];

if (Array.isArray(list)) {
    for (let i = 0; i < list.length; i++) {
        context.node._tempIndex = i;
        context.node._tempItem = list[i];
        outputs['Item'] = list[i];
        outputs['Index'] = i;
        outputs['Loop Body'] = true;
    }
}

outputs['On Completed'] = true;
return;`
        }, 
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'list', label: 'List', dataType: 'list', color: '#8E24AA' }
        ], 
        outputs: [
          { id: 'loop_body', label: 'Loop Body', dataType: 'execution', color: '#ffffff' },
          { id: 'item', label: 'Item', dataType: 'any', color: '#ffffff' },
          { id: 'index', label: 'Index', dataType: 'number', color: '#B2FF59' },
          { id: 'completed', label: 'On Completed', dataType: 'execution', color: '#ffffff' }
        ]
      } 
    },
    { 
      type: 'logic_while', 
      label: 'While Loop', 
      description: 'Continuously loops execution as long as the input condition remains true.',
      icon: RefreshCcw,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'While Loop', headerColor: '#4CAF50', category: 'Loop' },
        data: {
          code: `let iterations = 0;
const LIMIT = 5000;

while (inputs['Condition'] === true) {
    iterations++;
    if (iterations > LIMIT) {
        console.error('[LupisEngine] Infinite Loop Terdeteksi pada Node While! Dihentikan paksa.');
        break;
    }
    outputs['Loop Body'] = true;
}

outputs['On Completed'] = true;
return;`
        }, 
        inputs: [
          { id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { id: 'condition', label: 'Condition', dataType: 'boolean', color: '#4CAF50' }
        ], 
        outputs: [
          { id: 'loop_body', label: 'Loop Body', dataType: 'execution', color: '#ffffff' },
          { id: 'completed', label: 'On Completed', dataType: 'execution', color: '#ffffff' }
        ]
      } 
    }
  ]
};