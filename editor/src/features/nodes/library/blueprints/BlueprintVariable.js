import { Boxes } from 'lucide-vue-next';

export const BlueprintVariable = {
  // 🏷️ 1. METADATA KATEGORI
  id: 'category_variable',
  label: 'Variable',
  color: '#8B5CF6',
  icon: Boxes,

  // 📦 2. DAFTAR NODE DALAM KATEGORI
  items: [
    // ------------------------------------------------------------------------
    // TIPE A: VARIABLE GET (Membaca Nilai Variabel)
    // ------------------------------------------------------------------------
    {
      type: 'variable_get',
      label: 'Get Variable',
      description: 'Membaca nilai dari variabel lokal atau global.',
      dynamicMode: 'none',
      dynamicData: null,

      defaultData: {
        settings: {
          headerTitle: 'Get Variable',
          headerColor: '#B0BEC5',
          category: 'Variable'
        },

        inputs: [],

        outputs: [
          {
            id: 'out_0',
            label: 'Variable',
            dataType: 'any',
            color: '#B0BEC5'
          }
        ],

        data: {
          scope: 'Local',
          variableId: null,
          items: [
            {
              variableId: null,
              value: null,
              dataType: 'any'
            }
          ],
          code: 
`outputs['out_0'] = null;
return;`
        }
      }
    },

    // ------------------------------------------------------------------------
    // TIPE B: VARIABLE SET (Menulis / Menetapkan Nilai Variabel)
    // ------------------------------------------------------------------------
    {
      type: 'variable_set',
      label: 'Set Variable',
      description: 'Menetapkan nilai ke variabel lokal atau global.',
      dynamicMode: 'none',
      dynamicData: null,

      defaultData: {
        settings: {
          headerTitle: 'Set Variable',
          headerColor: '#B0BEC5',
          category: 'Variable'
        },

        inputs: [
          {
            id: 'exec_in',
            label: 'In',
            dataType: 'execution',
            color: '#FFFFFF'
          },
          {
            id: 'val_0',
            label: 'Variable',
            dataType: 'any',
            color: '#B0BEC5'
          }
        ],

        outputs: [
          {
            id: 'exec_out',
            label: 'Out',
            dataType: 'execution',
            color: '#FFFFFF'
          },
          {
            id: 'out_0',
            label: 'Variable',
            dataType: 'any',
            color: '#B0BEC5'
          }
        ],

        data: {
          scope: 'Local',
          variableId: null,
          items: [
            {
              variableId: null,
              value: null,
              dataType: 'any'
            }
          ],
          code: 
`const val = inputs['val_0'] ?? inputs['Variable'];
outputs['out_0'] = val;
outputs['exec_out'] = true;
return;`
        }
      }
    }
  ]
};