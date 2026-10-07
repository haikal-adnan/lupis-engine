import { FileText, Plus, Hash, ArrowRightLeft } from 'lucide-vue-next';

export const BlueprintString = {
  id: 'basic_string',
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
        settings: { headerTitle: 'Format String', headerColor: '#F57C00', category: 'String Utils' },
        inputs: [
          { id: 'format', label: 'Format', dataType: 'string', color: '#FFB74D', defaultValue: 'Score: {score} / {max}' },
          { id: 'score', label: 'score', dataType: 'any', color: '#ffffff' },
          { id: 'max', label: 'max', dataType: 'any', color: '#ffffff' },
        ],
        outputs: [
          { id: 'res_0', label: 'Format 1', dataType: 'any', color: '#FFB74D' }
        ],
        data: { 
          code: `const formatStr = inputs['Format'];

outputs['Format 1'] = formatStr.replace(/{([^{}]+)}/g, (_, path) => {
  const parts = path.split('.');
  let val = inputs[parts[0].trim()];

  for (let i = 1; i < parts.length; i++) {
    val = val[parts[i].trim()];
  }

  return typeof val === 'object' ? JSON.stringify(val) : val;
});
return;`
        }
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
        settings: { headerTitle: 'Join Strings', headerColor: '#F57C00', category: 'String Utils' },
        inputs: [
          { id: 'separator', label: 'Separator', dataType: 'string', color: '#FFB74D', defaultValue: ', ' },
          { id: 'v0', label: 'Val 1', dataType: 'string', color: '#FFB74D' },
          { id: 'v1', label: 'Val 2', dataType: 'string', color: '#FFB74D' },
        ],
        outputs: [
          { id: 'res', label: 'Result', dataType: 'string', color: '#FFB74D' }
        ],
        data: { 
          code: `const separator = inputs['Separator'];
const val1 = inputs['Val 1'];
const val2 = inputs['Val 2'];

const collection = [val1, val2];

outputs['Result'] = collection.join(separator);
return;`
        }
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
        settings: { headerTitle: 'Length', headerColor: '#F57C00', category: 'String Utils' },
        inputs: [
          { id: 'str_in', label: 'String', dataType: 'string', color: '#FFB74D' }
        ],
        outputs: [
          { id: 'len_out', label: 'Length', dataType: 'number', color: '#B2FF59' }
        ],
        data: { 
          code: `const val = inputs['String'];
outputs['Length'] = val.length;
return;`
        }
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
        category: 'String Utils' 
      },
      inputs: [
        { id: 'in_val', label: 'Input', dataType: 'any', color: '#ffffff' },
        { id: 'pretty', label: 'Pretty', dataType: 'boolean', color: '#f472b6', defaultValue: true }
      ],
      outputs: [
        { id: 'res', label: 'String', dataType: 'string', color: '#FFB74D' }
      ],
      data: {
        code: `const val = inputs['Input'];
  const isPretty = inputs['Pretty'];

  outputs['String'] = typeof val === 'object' && val !== null ? JSON.stringify(val, null, isPretty ? 2 : 0) : String(val ?? '');
  return;`
      }
    } 
  }
  ]
};