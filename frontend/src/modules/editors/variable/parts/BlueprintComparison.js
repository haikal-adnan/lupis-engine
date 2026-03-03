import { Scale, ArrowRightLeft } from 'lucide-vue-next'; 

export const BlueprintComparison = {
  _id: 'comparison',
  label: 'Comparison',
  color: '#3F51B5', 
  icon: Scale,
  items: [
    { 
      type: 'logic_compare', 
      label: 'Compare', 
      description: 'Compare two values (A vs B)', 
      icon: ArrowRightLeft,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { 
            headerTitle: 'Compare', 
            headerColor: '#283593', 
            category: 'Logic' 
        },
        data: {
            op: 'equal',
            values: { a: 0, b: 0 } // <-- TAMBAHKAN INI
        }, 
        inputs: [
          { _id: 'a', label: 'A', dataType: 'any', color: '#ffffff' },
          { _id: 'b', label: 'B', dataType: 'any', color: '#ffffff' }
        ], 
        outputs: [
          { _id: 'res', label: 'Result', dataType: 'boolean', color: '#4CAF50' }
        ]
      } 
    },
  ]
};