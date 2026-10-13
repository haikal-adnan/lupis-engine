import { FileText } from 'lucide-vue-next';

/**
 * ============================================================================
 * BLUEPRINT: STRING UTILS
 * ============================================================================
 */
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
      dynamicMode: 'sequential',
      defaultData: { 
        settings: { 
          headerTitle: 'Format String', 
          headerColor: '#F57C00', 
          category: 'String Utils' 
        },
        inputs: [
          { id: 'format', label: 'Format', dataType: 'string', color: '#F48FB1', defaultValue: 'Score: {score} / {max}' },
          { id: 'score', label: 'score', dataType: 'any', color: '#B0BEC5' },
          { id: 'max', label: 'max', dataType: 'any', color: '#B0BEC5' }
        ],
        outputs: [
          { id: 'res_0', label: 'Format 1', dataType: 'string', color: '#F48FB1' }
        ],
        data: { 
          values: {
            format: 'Score: {score} / {max}'
          },
          code: 
`const formatStr = String(inputs['Format'] ?? inputs['format'] ?? '');

const formatted = formatStr.replace(/{([^{}]+)}/g, (_, path) => {
  const parts = path.split('.');
  const rootKey = parts[0].trim();
  let val = inputs[rootKey];

  for (let i = 1; i < parts.length; i++) {
    if (val !== undefined && val !== null) {
      val = val[parts[i].trim()];
    }
  }

  if (val === undefined || val === null) return '';
  return typeof val === 'object' ? JSON.stringify(val) : String(val);
});

outputs['Format 1'] = formatted;
outputs['res_0'] = formatted;
return;`
        }
      } 
    },

    { 
      type: 'string_join', 
      label: 'Join Strings', 
      description: 'Join multiple strings with a separator', 
      dynamicMode: 'sequential', 
      defaultData: { 
        settings: { 
          headerTitle: 'Join Strings', 
          headerColor: '#F57C00', 
          category: 'String Utils' 
        },
        inputs: [
          { id: 'separator', label: 'Separator', dataType: 'string', color: '#F48FB1', defaultValue: ', ' },
          { id: 'v0', label: 'Val 1', dataType: 'string', color: '#F48FB1' },
          { id: 'v1', label: 'Val 2', dataType: 'string', color: '#F48FB1' }
        ],
        outputs: [
          { id: 'res', label: 'Result', dataType: 'string', color: '#F48FB1' }
        ],
        data: { 
          values: {
            separator: ', ',
            v0: '',
            v1: ''
          },
          code: 
`const sep = inputs['Separator'] ?? inputs['separator'] ?? '';

const collection = Object.entries(inputs)
  .filter(([key]) => key !== 'Separator' && key !== 'separator')
  .map(([, val]) => String(val ?? ''));

const result = collection.join(sep);
outputs['Result'] = result;
outputs['res'] = result;
return;`
        }
      } 
    },

    { 
      type: 'string_length', 
      label: 'String Length', 
      description: 'Get the number of characters in a string', 
      dynamicMode: 'none',
      defaultData: { 
        settings: { 
          headerTitle: 'Length', 
          headerColor: '#F57C00', 
          category: 'String Utils' 
        },
        inputs: [
          { id: 'str_in', label: 'String', dataType: 'string', color: '#F48FB1' }
        ],
        outputs: [
          { id: 'len_out', label: 'Length', dataType: 'number', color: '#64B5F6' }
        ],
        data: { 
          values: {
            str_in: ''
          },
          code: 
`const val = String(inputs['String'] ?? inputs['str_in'] ?? '');
const len = val.length;

outputs['Length'] = len;
outputs['len_out'] = len;
return;`
        }
      } 
    },

    { 
      type: 'any_to_string', 
      label: 'Any To String', 
      description: 'Convert any data type (including List & Map) to a readable string', 
      dynamicMode: 'none',
      defaultData: { 
        settings: { 
          headerTitle: 'Any > Str', 
          headerColor: '#F57C00', 
          category: 'String Utils' 
        },
        inputs: [
          { id: 'in_val', label: 'Input', dataType: 'any', color: '#B0BEC5' },
          { id: 'pretty', label: 'Pretty', dataType: 'boolean', color: '#E57373', defaultValue: true }
        ],
        outputs: [
          { id: 'res', label: 'String', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: {
            in_val: null,
            pretty: true
          },
          code: 
`const val = inputs['Input'] ?? inputs['in_val'];
const isPretty = Boolean(inputs['Pretty'] ?? inputs['pretty'] ?? true);

let formatted = '';
if (typeof val === 'object' && val !== null) {
  formatted = JSON.stringify(val, null, isPretty ? 2 : 0);
} else {
  formatted = String(val ?? '');
}

outputs['String'] = formatted;
outputs['res'] = formatted;
return;`
        }
      } 
    }
  ]
};