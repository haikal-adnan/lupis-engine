import { Calculator, Shuffle, ArrowRightLeft } from 'lucide-vue-next';

export const BlueprintMath = {
  _id: 'math',
  label: 'Math',
  color: '#009688', 
  icon: Calculator,
  items: [
    // --- NODE 1: CHAINED MATH ---
    { 
      type: 'math_chain', 
      label: 'Calculate', 
      description: 'Chain multiple math operations', 
      icon: Calculator,
      allowDynamicInputs: true,  // Wajib true
      allowDynamicOutputs: false, 
      defaultData: { 
        settings: { 
            headerTitle: 'Calculate', 
            headerColor: '#00796B', 
            category: 'Math' 
        },
        data: {
          // Array operator. Panjangnya harus selalu = (Jumlah Input Value - 1)
          // Default awal: v0 [add] v1
          ops: ['add'] 
        },
        inputs: [
          { _id: 'in', label: 'In', dataType: 'execution', color: '#fff' },
          // Input awal (Min 2 value agar ada 1 operator di tengah)
          { _id: 'v0', label: 'Val 1', dataType: 'number', color: '#B2FF59', value: 0 },
          { _id: 'v1', label: 'Val 2', dataType: 'number', color: '#B2FF59', value: 0 }
        ],
        outputs: [
          { _id: 'out', label: 'Trigger', dataType: 'execution', color: '#fff' },
          { _id: 'res', label: 'Result', dataType: 'number', color: '#B2FF59' }
        ]
      } 
    },

    // --- NODE 2: RANDOM (Sama) ---
    { 
      type: 'math_random', 
      label: 'Random Range', 
      description: 'Random min/max', 
      icon: Shuffle,  
      allowDynamicInputs: false, 
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

    // --- NODE 3: NEGATE (Sama) ---
    { 
      type: 'math_negate', 
      label: 'Negate', 
      description: 'Invert (-A)', 
      icon: ArrowRightLeft, 
      allowDynamicInputs: false, 
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