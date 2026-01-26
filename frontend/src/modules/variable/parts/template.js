import { HelpCircle } from 'lucide-vue-next';

export const newCategoryTemplate = {
  id: 'category_id',
  label: 'Category Name',
  color: '#9C27B0',
  icon: HelpCircle,
  items: [
    {
      type: 'node_unique_type',
      label: 'Node Display Name',
      description: 'Brief explanation of what this node does',
      icon: HelpCircle,
      defaultData: {
        allowDynamicInputs: false,
        settings: {
          headerTitle: 'Header Label',
          headerColor: '#7B1FA2',
          category: 'Category Name'
        },
        data: {
          myInternalValue: 'default_text',
          someOption: 10
        },
        inputs: [
          { _id: 'in', label: 'In', dataType: 'execution', color: '#fff' },
          { _id: 'input_1', label: 'Input A', dataType: 'string', color: '#E040FB' },
          { _id: 'input_2', label: 'Input B', dataType: 'number', color: '#B2FF59' }
        ],
        outputs: [
          { _id: 'out', label: 'Out', dataType: 'execution', color: '#fff' },
          { _id: 'res', label: 'Result', dataType: 'boolean', color: '#4CAF50' }
        ]
      }
    }
  ]
};
