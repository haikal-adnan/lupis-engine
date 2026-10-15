import { Boxes } from 'lucide-vue-next';

export const BlueprintVariable = {
  id: 'category_variable',
  label: 'Variable',
  color: '#8B5CF6',
  icon: Boxes,

  items: [
    {
      type: 'variableGet',
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
            id: 'value',
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
`outputs.value = null;
return;`
        }
      }
    },

    {
      type: 'variableSet',
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
            id: 'execIn',
            dataType: 'execution',
            color: '#FFFFFF'
          },
          {
            id: 'value',
            dataType: 'any',
            color: '#B0BEC5'
          }
        ],

        outputs: [
          {
            id: 'execOut',
            dataType: 'execution',
            color: '#FFFFFF'
          },
          {
            id: 'valueOut',
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
`const val = inputs.value;
outputs.valueOut = val;
outputs.execOut = true;
return;`
        }
      }
    }
  ]
};