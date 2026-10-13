import { ShieldCheck, CircleSlash, Rows, Columns } from 'lucide-vue-next';

export const BlueprintBoolean = {
  id: 'boolean_logic',
  label: 'Boolean Logic',
  color: '#4CAF50',
  icon: ShieldCheck,
  items: [
    /**
     * =========================================================================
     * 1. LOGIC: AND (Logical Conjunction)
     * =========================================================================
     * 
     * CARA PENGGUNAAN:
     * - Hubungkan nilai-nilai boolean ke port input 'Val 1', 'Val 2' (dan input tambahan jika ada).
     * - Ambil output boolean pada port 'Result'.
     * 
     * CARA KERJA & EKSEKUSI:
     * - Memeriksa seluruh masukan boolean.
     * - Mengembalikan `true` HANYA jika semua masukan bernilai true.
     */
    { 
      type: 'logic_and', 
      label: 'And', 
      description: 'True if all dynamic inputs are true',
      icon: Rows,
      allowDynamicInputs: true,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'And', headerColor: '#2E7D32', category: 'Boolean Logic' },
        inputs: [
          { id: 'v0', label: 'Val 1', dataType: 'boolean', color: '#f472b6', defaultValue: false },
          { id: 'v1', label: 'Val 2', dataType: 'boolean', color: '#f472b6', defaultValue: false }
        ], 
        outputs: [
          { id: 'result', label: 'Result', dataType: 'boolean', color: '#f472b6' }
        ],
        data: {
          values: {
            v0: false,
            v1: false
          },
          code: `const val1 = inputs.v0;
const val2 = inputs.v1;

outputs.result = [val1, val2].every(Boolean);
return;`
        }
      } 
    },

    /**
     * =========================================================================
     * 2. LOGIC: OR (Logical Disjunction)
     * =========================================================================
     * 
     * CARA PENGGUNAAN:
     * - Hubungkan nilai-nilai boolean ke port input 'Val 1', 'Val 2' (dan input tambahan jika ada).
     * - Ambil output boolean pada port 'Result'.
     * 
     * CARA KERJA & EKSEKUSI:
     * - Memeriksa seluruh masukan boolean.
     * - Mengembalikan `true` jika minimal SATU masukan bernilai true.
     */
    { 
      type: 'logic_or', 
      label: 'Or', 
      description: 'True if at least one input is true',
      icon: Columns,
      allowDynamicInputs: true,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Or', headerColor: '#2E7D32', category: 'Boolean Logic' },
        inputs: [
          { id: 'v0', label: 'Val 1', dataType: 'boolean', color: '#f472b6', defaultValue: false },
          { id: 'v1', label: 'Val 2', dataType: 'boolean', color: '#f472b6', defaultValue: false }
        ], 
        outputs: [
          { id: 'result', label: 'Result', dataType: 'boolean', color: '#f472b6' }
        ],
        data: {
          values: {
            v0: false,
            v1: false
          },
          code: `const val1 = inputs.v0;
const val2 = inputs.v1;

outputs.result = [val1, val2].some(Boolean);
return;`
        }
      } 
    },

    /**
     * =========================================================================
     * 3. LOGIC: NOT (Logical Inversion)
     * =========================================================================
     * 
     * CARA PENGGUNAAN:
     * - Hubungkan nilai boolean yang ingin dibalik pada port input 'In'.
     * - Ambil nilai kebalikan boolean pada port output 'Out'.
     * 
     * CARA KERJA & EKSEKUSI:
     * - Membalik nilai masukan boolean (`true` menjadi `false`, `false` menjadi `true`).
     */
    { 
      type: 'logic_not', 
      label: 'Not', 
      description: 'Inverts the boolean value',
      icon: CircleSlash,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Not', headerColor: '#2E7D32', category: 'Boolean Logic' },
        inputs: [
          { id: 'in_val', label: 'In', dataType: 'boolean', color: '#f472b6', defaultValue: false }
        ], 
        outputs: [
          { id: 'result', label: 'Out', dataType: 'boolean', color: '#f472b6' }
        ],
        data: {
          values: {
            in_val: false
          },
          code: `const inVal = inputs.in_val;

outputs.result = !inVal;
return;`
        }
      } 
    }
  ]
};