import { Calculator, Equal, EqualNot, ChevronRight, ChevronLeft } from 'lucide-vue-next';

export const basicMath = {
  id: 'math',
  label: 'Math',
  color: '#009688', // Teal
  icon: Calculator,
  items: [
    { 
      type: 'math_add', 
      label: 'Add', 
      description: 'A + B', 
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
      type: 'math_multiply', 
      label: 'Multiply', 
      description: 'A × B', 
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
      type: 'math_random', 
      label: 'Random Range', 
      description: 'Random number between min/max', 
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
  ]
};