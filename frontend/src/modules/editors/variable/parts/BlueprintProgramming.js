import { GitBranch, Repeat, RefreshCcw, Timer,GitPullRequest, GitMerge  } from 'lucide-vue-next';

export const BlueprintProgramming = {
  _id: 'basic_programming',
  label: 'Programming',
  color: '#FF9800',
  icon: GitBranch,
  items: [
{ 
      type: 'logic_branch', 
      label: 'Branch (If/Else)', 
      description: 'Split execution flow based on multiple conditions',
      icon: GitBranch,
      allowDynamicInputs: true,
      allowDynamicOutputs: true,
      defaultData: { 
        settings: { headerTitle: 'Branch', headerColor: '#E65100', category: 'Programming' },
        data: {
          branches: [] // Array kosong berarti hanya ada 1 If dan 1 False bawaan
        }, 
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'cond_0', label: 'If Condition', dataType: 'boolean', color: '#4CAF50' }
        ], 
        outputs: [
          { _id: 'out_0', label: 'If True', dataType: 'execution', color: '#4CAF50' },
          { _id: 'out_false', label: 'False', dataType: 'execution', color: '#F44336' }
        ]
      } 
    },
    { 
      type: 'logic_switch', 
      label: 'Switch', 
      description: 'Mengarahkan eksekusi ke jalur spesifik berdasarkan tipe data dan nilainya.',
      icon: GitPullRequest, 
      allowDynamicInputs: false,
      allowDynamicOutputs: true,
      defaultData: { 
        settings: { headerTitle: 'Switch', headerColor: '#E65100', category: 'Programming' },
        data: {
          dataType: 'string', // Default tipe data
          cases: ['right', 'left'] 
        }, 
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'value', label: 'Value', dataType: 'string', color: '#03A9F4' } // Akan kita ubah warna/tipenya dinamis di inspector
        ], 
        outputs: [
          { _id: 'out_case_0', label: 'Case "right"', dataType: 'execution', color: '#FFB300' },
          { _id: 'out_case_1', label: 'Case "left"', dataType: 'execution', color: '#FFB300' },
          { _id: 'out_default', label: 'Default', dataType: 'execution', color: '#9E9E9E' }
        ]
      } 
    },
    { 
      type: 'logic_flow_merge', 
      label: 'Merge Flow', 
      description: 'Menggabungkan banyak jalur eksekusi ke dalam satu output tunggal.',
      icon: GitMerge, 
      allowDynamicInputs: true,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Merge', headerColor: '#455A64', category: 'Programming' },
        inputs: [
          { _id: 'in_0', label: 'In 1', dataType: 'execution', color: '#ffffff' },
          { _id: 'in_1', label: 'In 2', dataType: 'execution', color: '#ffffff' }
        ], 
        outputs: [
          { _id: 'out', label: 'Out', dataType: 'execution', color: '#ffffff' }
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