import { FileText, Type, Hash, Plus, ArrowRightLeft } from 'lucide-vue-next';

export const BlueprintString = {
  _id: 'basic_string',
  label: 'String Utils',
  color: '#FF9800', 
  icon: FileText,
  items: [
    { 
      type: 'string_format', 
      label: 'Format String', 
      description: 'Combine text using placeholders like {0}, {1}', 
      icon: FileText,
      allowDynamicInputs: true,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Format String', headerColor: '#F57C00', category: 'String' },
        data: { format: 'Score: {0} / {1}' },
        inputs: [
          { _id: '0', label: '{0}', dataType: 'any', color: '#ffffff' },
          { _id: '1', label: '{1}', dataType: 'any', color: '#ffffff' },
        ],
        outputs: [
          { _id: 'res', label: 'Result', dataType: 'string', color: '#FFB74D' }
        ]
      } 
    },

    { 
      type: 'string_join', 
      label: 'Join Strings', 
      description: 'Join multiple strings with a separator', 
      icon: Plus,
      allowDynamicInputs: true, 
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Join Strings', headerColor: '#F57C00', category: 'String' },
        data: { separator: ', ' },
        inputs: [
          { _id: 'a', label: 'A', dataType: 'string', color: '#FFB74D' },
          { _id: 'b', label: 'B', dataType: 'string', color: '#FFB74D' },
        ],
        outputs: [
          { _id: 'res', label: 'Result', dataType: 'string', color: '#FFB74D' }
        ]
      } 
    },

    { 
      type: 'string_length', 
      label: 'String Length', 
      description: 'Get the number of characters in a string', 
      icon: Hash,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { headerTitle: 'Length', headerColor: '#F57C00', category: 'String' },
        data: {}, 
        inputs: [
          { _id: 'str_in', label: 'String', dataType: 'string', color: '#FFB74D' }
        ],
        outputs: [
          { _id: 'len_out', label: 'Length', dataType: 'number', color: '#B2FF59' }
        ]
      } 
    },

    { 
      type: 'number_to_string', 
      label: 'Number To String', 
      description: 'Convert a number to string with optional decimals', 
      icon: ArrowRightLeft,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { 
          headerTitle: 'Num > Str', 
          headerColor: '#F57C00', 
          category: 'String' 
        },
        data: { 
            propertyOptions: [
                { value: 'decimals', label: 'Decimals', type: 'number', color: '#FFCC80' }
            ]
        }, 
        inputs: [
          { _id: 'in_val', label: 'Number', dataType: 'number', color: '#B2FF59' }
        ],
        outputs: [
          { _id: 'res', label: 'String', dataType: 'string', color: '#FFB74D' }
        ]
      } 
    }
  ]
};