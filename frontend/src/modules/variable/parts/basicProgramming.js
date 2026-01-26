import { GitBranch, Repeat, RefreshCcw } from 'lucide-vue-next';

export const basicProgramming = {
  id: 'basic_programming',
  label: 'Programming',
  color: '#FF9800',
  icon: GitBranch,
  items: [
    { 
      type: 'logic_branch', 
      label: 'Branch (If)', 
      description: 'Split execution based on condition',
      defaultData: { 
        settings: { headerTitle: 'Branch', headerColor: '#E65100', category: 'Programming' },
        inputs: [
          { _id: 'in', label: 'In', dataType: 'execution', color: '#fff' },
          { _id: 'condition', label: 'Condition', dataType: 'boolean', color: '#4CAF50' }
        ], 
        outputs: [
          { _id: 'true', label: 'True', dataType: 'execution', color: '#fff' },
          { _id: 'false', label: 'False', dataType: 'execution', color: '#fff' }
        ]
      } 
    },
    { 
      type: 'logic_loop', 
      label: 'For Loop', 
      description: 'Repeat execution for a range',
      icon: Repeat,
      defaultData: { 
        settings: { headerTitle: 'For Loop', headerColor: '#E65100', category: 'Programming' },
        inputs: [
          { _id: 'in', label: 'In', dataType: 'execution', color: '#fff' },
          { _id: 'start', label: 'Start', dataType: 'number', color: '#B2FF59' },
          { _id: 'end', label: 'End', dataType: 'number', color: '#B2FF59' }
        ], 
        outputs: [
          { _id: 'loop', label: 'Loop Body', dataType: 'execution', color: '#fff' },
          { _id: 'index', label: 'Index', dataType: 'number', color: '#B2FF59' },
          { _id: 'completed', label: 'Completed', dataType: 'execution', color: '#fff' }
        ]
      } 
    },
    { 
      type: 'logic_while', 
      label: 'While Loop', 
      description: 'Repeat while condition is true',
      icon: RefreshCcw,
      defaultData: { 
        settings: { headerTitle: 'While Loop', headerColor: '#E65100', category: 'Programming' },
        inputs: [
          { _id: 'in', label: 'In', dataType: 'execution', color: '#fff' },
          { _id: 'condition', label: 'Condition', dataType: 'boolean', color: '#4CAF50' }
        ], 
        outputs: [
          { _id: 'loop', label: 'Loop Body', dataType: 'execution', color: '#fff' },
          { _id: 'completed', label: 'Completed', dataType: 'execution', color: '#fff' }
        ]
      } 
    },

  ]
};