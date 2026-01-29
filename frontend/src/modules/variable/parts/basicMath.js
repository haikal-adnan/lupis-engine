import { Calculator, Plus, Minus, X, Divide as DivideIcon, Shuffle } from 'lucide-vue-next';

export const basicMath = {
  _id: 'math',
  label: 'Math',
  color: '#009688', 
  icon: Calculator,
  items: [
    { 
      type: 'math_add', 
      label: 'Add', 
      description: 'A + B', 
      icon: Plus,
      allowDynamicInputs: false, 
      allowDynamicOutputs: false, 
      defaultData: { 
        settings: { headerTitle: 'Add', headerColor: '#00796B', category: 'Math' },
        inputs: [
          { _id: 'in', label: 'In', dataType: 'execution', color: '#fff' },
          { _id: 'a', label: 'A', dataType: 'number', color: '#B2FF59' },
          { _id: 'b', label: 'B', dataType: 'number', color: '#B2FF59' }
        ],
        outputs: [
          { _id: 'out', label: 'Trigger', dataType: 'execution', color: '#fff' },
          { _id: 'res', label: 'Result', dataType: 'number', color: '#B2FF59' }
        ]
      } 
    },
    { 
      type: 'math_subtract', 
      label: 'Subtract', 
      description: 'A - B', 
      icon: Minus, // Added Icon
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Subtract', headerColor: '#00796B', category: 'Math' },
        inputs: [
          { _id: 'in', label: 'In', dataType: 'execution', color: '#fff' },
          { _id: 'a', label: 'A', dataType: 'number', color: '#B2FF59' },
          { _id: 'b', label: 'B', dataType: 'number', color: '#B2FF59' }
        ],
        outputs: [
          { _id: 'out', label: 'Trigger', dataType: 'execution', color: '#fff' },
          { _id: 'res', label: 'Result', dataType: 'number', color: '#B2FF59' }
        ]
      } 
    },
    { 
      type: 'math_multiply', 
      label: 'Multiply', 
      description: 'A × B', 
      icon: X, 
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Multiply', headerColor: '#00796B', category: 'Math' },
        inputs: [
          { _id: 'in', label: 'In', dataType: 'execution', color: '#fff' },
          { _id: 'a', label: 'A', dataType: 'number', color: '#B2FF59' },
          { _id: 'b', label: 'B', dataType: 'number', color: '#B2FF59' }
        ],
        outputs: [
          { _id: 'out', label: 'Trigger', dataType: 'execution', color: '#fff' },
          { _id: 'res', label: 'Result', dataType: 'number', color: '#B2FF59' }
        ]
      } 
    },
    { 
      type: 'math_divide', 
      label: 'Divide', 
      description: 'A / B', 
      icon: DivideIcon, // Added Icon
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Divide', headerColor: '#00796B', category: 'Math' },
        inputs: [
          { _id: 'in', label: 'In', dataType: 'execution', color: '#fff' },
          { _id: 'a', label: 'A', dataType: 'number', color: '#B2FF59' },
          { _id: 'b', label: 'B', dataType: 'number', color: '#B2FF59' }
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
      description: 'Random number between min/max', 
      icon: Shuffle, 
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Random', headerColor: '#00695C', category: 'Math' },
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
      description: 'Pembalikan nilai (-A)', 
      icon: Minus, 
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Negate', headerColor: '#00796B', category: 'Math' },
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