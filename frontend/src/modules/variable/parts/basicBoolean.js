import { ShieldCheck, CircleSlash, Rows, Columns, GitFork } from 'lucide-vue-next';

export const basicBoolean = {
  _id: 'boolean_logic',
  label: 'Boolean Logic',
  color: '#4CAF50',
  icon: ShieldCheck,
  items: [
    { 
      type: 'logic_and', 
      label: 'And', 
      description: 'True if both A and B are true',
      icon: Rows,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'And', headerColor: '#2E7D32', category: 'Boolean Logic' },
        data: [], 
        inputs: [
          { _id: 'a', label: 'A', dataType: 'boolean', color: '#4CAF50' },
          { _id: 'b', label: 'B', dataType: 'boolean', color: '#4CAF50' }
        ], 
        outputs: [
          { _id: 'result', label: 'Result', dataType: 'boolean', color: '#4CAF50' }
        ]
      } 
    },

    { 
      type: 'logic_or', 
      label: 'Or', 
      description: 'True if at least one input is true',
      icon: Columns,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Or', headerColor: '#2E7D32', category: 'Boolean Logic' },
        data: [], 
        inputs: [
          { _id: 'a', label: 'A', dataType: 'boolean', color: '#4CAF50' },
          { _id: 'b', label: 'B', dataType: 'boolean', color: '#4CAF50' }
        ], 
        outputs: [
          { _id: 'result', label: 'Result', dataType: 'boolean', color: '#4CAF50' }
        ]
      } 
    },

    { 
      type: 'logic_not', 
      label: 'Not', 
      description: 'Inverts the boolean value',
      icon: CircleSlash,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Not', headerColor: '#2E7D32', category: 'Boolean Logic' },
        data: [], 
        inputs: [
          { _id: 'in_val', label: 'In', dataType: 'boolean', color: '#4CAF50' }
        ], 
        outputs: [
          { _id: 'result', label: 'Out', dataType: 'boolean', color: '#4CAF50' }
        ]
      } 
    },

    { 
      type: 'logic_branch', 
      label: 'Branch', 
      description: 'Directs flow based on a boolean condition',
      icon: GitFork,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Branch', headerColor: '#2E7D32', category: 'Boolean Logic' },
        data: [], 
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'condition', label: 'Condition', dataType: 'boolean', color: '#4CAF50' }
        ], 
        outputs: [
          { _id: 'true_branch', label: 'True', dataType: 'execution', color: '#4CAF50' },
          { _id: 'false_branch', label: 'False', dataType: 'execution', color: '#F44336' }
        ]
      } 
    }
  ]
};