import { 
  Repeat, 
  RefreshCcw,
  RotateCcw
} from 'lucide-vue-next';

export const BlueprintLoop = {
  _id: 'control_loop',
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
        data: { values: { start: 0, end: 10, step: 1 } }, 
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'start', label: 'Start', dataType: 'number', color: '#B2FF59' },
          { _id: 'end', label: 'End', dataType: 'number', color: '#B2FF59' },
          { _id: 'step', label: 'Step', dataType: 'number', color: '#B2FF59' }
        ], 
        outputs: [
          { _id: 'loop_body', label: 'Loop Body', dataType: 'execution', color: '#ffffff' },
          { _id: 'index', label: 'Index', dataType: 'number', color: '#B2FF59' },
          { _id: 'completed', label: 'On Completed', dataType: 'execution', color: '#ffffff' }
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
        data: {}, 
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'list', label: 'List', dataType: 'list', color: '#8E24AA' }
        ], 
        outputs: [
          { _id: 'loop_body', label: 'Loop Body', dataType: 'execution', color: '#ffffff' },
          { _id: 'item', label: 'Item', dataType: 'any', color: '#ffffff' },
          { _id: 'index', label: 'Index', dataType: 'number', color: '#B2FF59' },
          { _id: 'completed', label: 'On Completed', dataType: 'execution', color: '#ffffff' }
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
        data: {}, 
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'condition', label: 'Condition', dataType: 'boolean', color: '#4CAF50' }
        ], 
        outputs: [
          { _id: 'loop_body', label: 'Loop Body', dataType: 'execution', color: '#ffffff' },
          { _id: 'completed', label: 'On Completed', dataType: 'execution', color: '#ffffff' }
        ]
      } 
    }
  ]
};