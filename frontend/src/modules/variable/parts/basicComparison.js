import { Equal, EqualNot, ChevronRight, ChevronLeft, ListFilter } from 'lucide-vue-next';

export const basicComparison = {
  _id: 'comparison',
  label: 'Comparison',
  color: '#3F51B5',
  icon: Equal,
  items: [
    { 
      type: 'compare_equal', 
      label: 'Equal (==)', 
      description: 'Check if A is equal to B', 
      icon: Equal,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Equal', headerColor: '#283593', category: 'Comparison' },
        data: [], 
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
      type: 'compare_not_equal', 
      label: 'Not Equal (!=)', 
      description: 'Check if A is not equal to B', 
      icon: EqualNot,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Not Equal', headerColor: '#283593', category: 'Comparison' },
        data: [], 
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
      type: 'compare_greater', 
      label: 'Greater Than (>)', 
      description: 'Check if A is strictly greater than B', 
      icon: ChevronRight,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Greater Than', headerColor: '#283593', category: 'Comparison' },
        data: [], 
        inputs: [
          { _id: 'a', label: 'A', dataType: 'number', color: '#B2FF59' },
          { _id: 'b', label: 'B', dataType: 'number', color: '#B2FF59' }
        ], 
        outputs: [
          { _id: 'res', label: 'Result', dataType: 'boolean', color: '#4CAF50' }
        ]
      } 
    },

    { 
      type: 'compare_less', 
      label: 'Less Than (<)', 
      description: 'Check if A is strictly less than B', 
      icon: ChevronLeft,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Less Than', headerColor: '#283593', category: 'Comparison' },
        data: [], 
        inputs: [
          { _id: 'a', label: 'A', dataType: 'number', color: '#B2FF59' },
          { _id: 'b', label: 'B', dataType: 'number', color: '#B2FF59' }
        ], 
        outputs: [
          { _id: 'res', label: 'Result', dataType: 'boolean', color: '#4CAF50' }
        ]
      } 
    },

    {
      type: 'compare_switch',
      label: 'Switch (Value)',
      description: 'Compare input value against multiple cases',
      icon: ListFilter,
      allowDynamicInputs: false,
      allowDynamicOutputs: true,
      defaultData: {
        settings: { headerTitle: 'Switch', headerColor: '#283593', category: 'Comparison' },
        data: [
          { _id: 'case_1', operator: '==', compareValue: 10 },
          { _id: 'case_2', operator: '>', compareValue: 50 }
        ],
        inputs: [
          { _id: 'exec_in', label: 'In', dataType: 'execution', color: '#ffffff' },
          { _id: 'input_val', label: 'Value', dataType: 'any', color: '#ffffff' }
        ],
        outputs: [
          { _id: 'case_1', label: 'Value == 10', dataType: 'execution', color: '#ffffff' },
          { _id: 'case_2', label: 'Value > 50', dataType: 'execution', color: '#ffffff' },
          { _id: 'default', label: 'Default', dataType: 'execution', color: '#ffffff' }
        ]
      }
    }
  ]
};