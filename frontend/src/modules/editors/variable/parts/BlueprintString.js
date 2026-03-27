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
      description: 'Hub for multiple text formats using {variables}', 
      icon: FileText,
      allowDynamicInputs: true,
      allowDynamicOutputs: true,
      defaultData: { 
        settings: { headerTitle: 'Format String', headerColor: '#F57C00', category: 'String' },
        data: { formats: ['Score: {score} / {max}'] },
        inputs: [
          { _id: 'score', label: 'score', dataType: 'any', color: '#ffffff' },
          { _id: 'max', label: 'max', dataType: 'any', color: '#ffffff' },
        ],
        outputs: [
          { _id: 'res_0', label: 'Format 1', dataType: 'any', color: '#FFB74D' }
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
      type: 'any_to_string', 
      label: 'Any To String', 
      description: 'Convert any data type (including List & Map) to a readable string', 
      icon: ArrowRightLeft,
      allowDynamicInputs: false,
      allowDynamicOutputs: false,
      defaultData: { 
        settings: { 
          headerTitle: 'Any > Str', 
          headerColor: '#F57C00', 
          category: 'String' 
        },
        data: {
          pretty: true 
        }, 
        inputs: [
          { _id: 'in_val', label: 'Input', dataType: 'any', color: '#ffffff' }
        ],
        outputs: [
          { _id: 'res', label: 'String', dataType: 'string', color: '#FFB74D' }
        ]
      } 
    },
    
  ]
};