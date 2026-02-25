import { Boxes } from 'lucide-vue-next';

export const universalCategoryTemplate = {
  _id: 'unique_category_id',
  label: 'Category Display Name',
  color: '#HEX_COLOR',
  icon: Boxes,
  items: [
    {
      type: 'unique_node_type',
      label: 'Node Name',
      description: 'Human readable description',
      icon: Boxes,
      
      allowDynamicInputs: false,
      allowDynamicOutputs: true,
      
      defaultData: {
        settings: {
          headerTitle: 'Display Title',
          headerColor: '#HEX_COLOR',
          category: 'Category Name'
        },

        data: [
          { 
            _id: 'row_1',
            field_A: 'value_1',
            field_B: 100
          },
          { 
            _id: 'row_2',
            field_A: 'value_2',
            field_B: 100
          },
        ],

        inputs: [
          { 
            _id: 'main_exec',
            label: 'In',
            dataType: 'execution',
            color: '#ffffff'
          }
        ],

        outputs: [
          { 
            _id: 'row_1',
            label: 'Output 1',
            dataType: 'execution',
            color: '#ffffff'
          }
        ]
      }
    }
  ]
};
