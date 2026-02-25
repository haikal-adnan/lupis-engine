import { GitBranch, Repeat, RefreshCcw, Timer } from 'lucide-vue-next';

export const BlueprintProgramming = {
  _id: 'basic_programming',
  label: 'Programming',
  color: '#FF9800',
  icon: GitBranch,
  items: [
    { 
      type: 'logic_branch', 
      label: 'Branch (If)', 
      description: 'Split execution flow based on a boolean condition',
      icon: GitBranch,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Branch', headerColor: '#E65100', category: 'Programming' },
        data: [], 
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'condition', label: 'Condition', dataType: 'boolean', color: '#4CAF50' }
        ], 
        outputs: [
          { _id: 'true', label: 'True', dataType: 'execution', color: '#4CAF50' },
          { _id: 'false', label: 'False', dataType: 'execution', color: '#F44336' }
        ]
      } 
    },

    { 
      type: 'logic_loop', 
      label: 'For Loop', 
      description: 'Repeat execution for a specific range of numbers',
      icon: Repeat,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'For Loop', headerColor: '#E65100', category: 'Programming' },
        data: [], 
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'start', label: 'Start', dataType: 'number', color: '#B2FF59' },
          { _id: 'end', label: 'End', dataType: 'number', color: '#B2FF59' }
        ], 
        outputs: [
          { _id: 'loop_body', label: 'Loop Body', dataType: 'execution', color: '#ffffff' },
          { _id: 'index', label: 'Index', dataType: 'number', color: '#B2FF59' },
          { _id: 'completed', label: 'On Completed', dataType: 'execution', color: '#ffffff' }
        ]
      } 
    },

    { 
      type: 'logic_while', 
      label: 'While Loop', 
      description: 'Repeat execution while a condition remains true',
      icon: RefreshCcw,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'While Loop', headerColor: '#E65100', category: 'Programming' },
        data: [], 
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'condition', label: 'Condition', dataType: 'boolean', color: '#4CAF50' }
        ], 
        outputs: [
          { _id: 'loop_body', label: 'Loop Body', dataType: 'execution', color: '#ffffff' },
          { _id: 'completed', label: 'On Completed', dataType: 'execution', color: '#ffffff' }
        ]
      } 
    },

    { 
      type: 'logic_delay', 
      label: 'Delay', 
      description: 'Wait for a specific amount of time',
      icon: Timer,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Delay', headerColor: '#E65100', category: 'Programming' },
        data: [
          { _id: 'duration_cfg', duration: 1.0 }
        ], 
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'duration', label: 'Duration (s)', dataType: 'number', color: '#B2FF59' }
        ], 
        outputs: [
          { _id: 'out', label: 'Completed', dataType: 'execution', color: '#ffffff' }
        ]
      } 
    }
  ]
};