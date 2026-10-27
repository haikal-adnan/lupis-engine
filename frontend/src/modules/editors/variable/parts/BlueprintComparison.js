import { 
  Scale, 
  ArrowRightLeft, 
  GitBranch, 
  GitPullRequest
} from 'lucide-vue-next';

export const BlueprintComparison = {
  _id: 'comparison',
  label: 'Logic & Compare',
  color: '#3F51B5', 
  icon: Scale,
  items: [
    { 
      type: 'logic_compare', 
      label: 'Compare', 
      description: 'Compares two values (A vs B).', 
      icon: ArrowRightLeft,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Compare', headerColor: '#3F51B5', category: 'Logic' },
        data: { op: 'equal', values: { a: 0, b: 0 } }, 
        inputs: [
          { _id: 'a', label: 'A', dataType: 'any', color: '#ffffff' },
          { _id: 'b', label: 'B', dataType: 'any', color: '#ffffff' }
        ], 
        outputs: [
          { _id: 'res', label: 'Result', dataType: 'boolean', color: '#4CAF50' }
        ]
      } 
    },
    { 
      type: 'logic_branch', 
      label: 'Branch (If/Else)', 
      description: 'Splits the execution path based on a boolean condition.',
      icon: GitBranch,
      allowDynamicInputs: true,
      allowDynamicOutputs: true,
      defaultData: { 
        settings: { headerTitle: 'Branch', headerColor: '#3F51B5', category: 'Logic' },
        data: { branches: [] }, 
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
      description: 'Directs execution to a specific path based on the data type and its value.',
      icon: GitPullRequest, 
      allowDynamicInputs: false,
      allowDynamicOutputs: true,
      defaultData: { 
        settings: { headerTitle: 'Switch', headerColor: '#3F51B5', category: 'Logic' },
        data: { dataType: 'string', cases: ['right', 'left'] }, 
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'value', label: 'Value', dataType: 'string', color: '#03A9F4' } 
        ], 
        outputs: [
          { _id: 'out_case_0', label: 'Case "right"', dataType: 'execution', color: '#FFB300' },
          { _id: 'out_case_1', label: 'Case "left"', dataType: 'execution', color: '#FFB300' },
          { _id: 'out_default', label: 'Default', dataType: 'execution', color: '#9E9E9E' }
        ]
      } 
    }
  ]
};