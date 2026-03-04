import { Calculator, Shuffle, ArrowRightLeft } from 'lucide-vue-next';

export const BlueprintMath = {
  _id: 'math',
  label: 'Math',
  color: '#009688', 
  icon: Calculator,
  items: [
    { 
      type: 'math_chain', 
      label: 'Calculate', 
      description: 'Chain multiple math operations', 
      icon: Calculator,
      allowDynamicInputs: true,  
      allowDynamicOutputs: false, 
      defaultData: { 
        settings: { 
            headerTitle: 'Calculate', 
            headerColor: '#00796B', 
            category: 'Math' 
        },
        data: {
          ops: ['add'],
          values: { v0: 0, v1: 0 } 
        },
        inputs: [
          { _id: 'in', label: 'In', dataType: 'execution', color: '#fff' },
          { _id: 'v0', label: 'Val 1', dataType: 'number', color: '#B2FF59' }, 
          { _id: 'v1', label: 'Val 2', dataType: 'number', color: '#B2FF59' }  
        ],
        outputs: [
          { _id: 'out', label: 'Trigger', dataType: 'execution', color: '#fff' },
          { _id: 'res', label: 'Result', dataType: 'number', color: '#B2FF59' }
        ]
      } 
    },

    { 
      type: 'math_random', 
      label: 'Random Range', 
      description: 'Random min/max', 
      icon: Shuffle,  
      allowDynamicInputs: false, 
      defaultData: { 
        settings: { headerTitle: 'Random', headerColor: '#00695C', category: 'Math' },
        data: {
          values: { min: 0, max: 1 } 
        },
        inputs: [
            { _id: 'in', label: 'In', dataType: 'execution', color: '#fff' },
            { _id: 'min', label: 'Min', dataType: 'number', color: '#B2FF59' },
            { _id: 'max', label: 'Max', dataType: 'number', color: '#B2FF59' }
        ],
        outputs: [
            { _id: 'out', label: 'Trigger', dataType: 'execution', color: '#fff' },
            { _id: 'res', label: 'Result', dataType: 'number', color: '#B2FF59' }
        ]
      } 
    },

    { 
      type: 'math_negate', 
      label: 'Negate', 
      description: 'Invert (-A)', 
      icon: ArrowRightLeft, 
      allowDynamicInputs: false, 
      defaultData: { 
        settings: { headerTitle: 'Negate', headerColor: '#00796B', category: 'Math' },
        data: {
          values: { a: 0 } 
        },
        inputs: [
            { _id: 'in', label: 'In', dataType: 'execution', color: '#fff' },
            { _id: 'a', label: 'A', dataType: 'number', color: '#B2FF59' }
        ],
        outputs: [
            { _id: 'out', label: 'Trigger', dataType: 'execution', color: '#fff' },
            { _id: 'res', label: 'Result', dataType: 'number', color: '#B2FF59' }
        ]
      } 
    },
  ]
};