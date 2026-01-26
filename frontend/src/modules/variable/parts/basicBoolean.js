import { ShieldCheck, CircleSlash, Rows, Columns } from 'lucide-vue-next';

export const basicBoolean = {
  id: 'boolean_logic',
  label: 'Boolean Logic',
  color: '#4CAF50',
  icon: ShieldCheck,
  items: [
    /**
     * AND (Semua harus True)
     */
    { 
      type: 'logic_and', 
      label: 'And', 
      description: 'True if both A and B are true',
      icon: Rows, // Visualisasi dua baris yang harus terpenuhi
      defaultData: { 
        settings: { headerTitle: 'And', headerColor: '#2E7D32', category: 'Boolean' },
        inputs: [
          { _id: 'a', label: 'A', dataType: 'boolean', color: '#4CAF50' },
          { _id: 'b', label: 'B', dataType: 'boolean', color: '#4CAF50' }
        ], 
        outputs: [
          { _id: 'result', label: 'Result', dataType: 'boolean', color: '#4CAF50' }
        ]
      } 
    },

    /**
     * OR (Salah satu saja True)
     */
    { 
      type: 'logic_or', 
      label: 'Or', 
      description: 'True if at least one input is true',
      icon: Columns, // Visualisasi pilihan kolom
      defaultData: { 
        settings: { headerTitle: 'Or', headerColor: '#2E7D32', category: 'Boolean' },
        inputs: [
          { _id: 'a', label: 'A', dataType: 'boolean', color: '#4CAF50' },
          { _id: 'b', label: 'B', dataType: 'boolean', color: '#4CAF50' }
        ], 
        outputs: [
          { _id: 'result', label: 'Result', dataType: 'boolean', color: '#4CAF50' }
        ]
      } 
    },

    /**
     * NOT (Kebalikan)
     */
    { 
      type: 'logic_not', 
      label: 'Not', 
      description: 'Inverts the boolean value',
      icon: CircleSlash,
      defaultData: { 
        settings: { headerTitle: 'Not', headerColor: '#2E7D32', category: 'Boolean' },
        inputs: [
          { _id: 'a', label: 'In', dataType: 'boolean', color: '#4CAF50' }
        ], 
        outputs: [
          { _id: 'result', label: 'Out', dataType: 'boolean', color: '#4CAF50' }
        ]
      } 
    }
  ]
};