import { Equal, EqualNot, ChevronRight, ChevronLeft } from 'lucide-vue-next';

export const basicComparison = {
  id: 'comparison',
  label: 'Comparison',
  color: '#3F51B5', // Indigo
  icon: Equal,
  items: [
    { 
      type: 'compare_equal', 
      label: 'Equal (==)', 
      description: 'Check if A is equal to B (supports String, Number, etc.)', 
      icon: Equal,
      defaultData: { 
        settings: { headerTitle: 'Equal', headerColor: '#283593', category: 'Comparison' },
        inputs: [
          { _id: 'a', label: 'A', dataType: 'any', color: '#fff' },
          { _id: 'b', label: 'B', dataType: 'any', color: '#fff' }
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
      defaultData: { 
        settings: { headerTitle: 'Not Equal', headerColor: '#283593', category: 'Comparison' },
        inputs: [
          { _id: 'a', label: 'A', dataType: 'any', color: '#fff' },
          { _id: 'b', label: 'B', dataType: 'any', color: '#fff' }
        ], 
        outputs: [
          { _id: 'res', label: 'Result', dataType: 'boolean', color: '#4CAF50' }
        ]
      } 
    },
    { 
      type: 'compare_greater', 
      label: 'Greater Than (>)', 
      description: 'Returns true if A is strictly greater than B', 
      icon: ChevronRight,
      defaultData: { 
        settings: { headerTitle: 'Greater', headerColor: '#283593', category: 'Comparison' },
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
      description: 'Returns true if A is strictly less than B', 
      icon: ChevronLeft,
      defaultData: { 
        settings: { headerTitle: 'Less', headerColor: '#283593', category: 'Comparison' },
        inputs: [
          { _id: 'a', label: 'A', dataType: 'number', color: '#B2FF59' },
          { _id: 'b', label: 'B', dataType: 'number', color: '#B2FF59' }
        ], 
        outputs: [
          { _id: 'res', label: 'Result', dataType: 'boolean', color: '#4CAF50' }
        ]
      } 
    }
  ]
};