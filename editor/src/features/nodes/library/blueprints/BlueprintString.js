import { FileText } from 'lucide-vue-next';

export const BlueprintString = {
  id: 'basic_string',
  label: 'String Utils',
  color: '#FF9800', 
  icon: FileText,
  items: [
    { 
      type: 'stringFormat', 
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
          { id: 'format', dataType: 'string', color: '#F48FB1', defaultValue: 'Score: {v0} / {v1}' },
          { id: 'v0', dataType: 'any', color: '#B0BEC5' },
          { id: 'v1', dataType: 'any', color: '#B0BEC5' }
        ],
        outputs: [
          { id: 'result', dataType: 'string', color: '#F48FB1' }
        ],
        data: { 
          values: {
            format: 'Score: {v0} / {v1}'
          },
          code: 
`const formatStr = inputs.format;

const formatted = formatStr.replace(/{([^{}]+)}/g, (_, path) => {
  const parts = path.split('.');
  const rootKey = parts[0].trim();
  let val = inputs[rootKey];

  for (let i = 1; i < parts.length; i++) {
    val = val[parts[i].trim()];
  }

  return typeof val === 'object' ? JSON.stringify(val) : String(val);
});

outputs.result = formatted;
return;`
        }
      } 
    },

    { 
      type: 'stringJoin', 
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
          { id: 'separator', dataType: 'string', color: '#F48FB1', defaultValue: ', ' },
          { id: 'v0', dataType: 'string', color: '#F48FB1' },
          { id: 'v1', dataType: 'string', color: '#F48FB1' }
        ],
        outputs: [
          { id: 'result', dataType: 'string', color: '#F48FB1' }
        ],
        data: { 
          values: {
            separator: ', ',
            v0: '',
            v1: ''
          },
          code: 
`const sep = inputs.separator;

const collection = Object.entries(inputs)
  .filter(([key]) => key !== 'separator')
  .map(([, val]) => val);

outputs.result = collection.join(sep);
return;`
        }
      } 
    },

    { 
      type: 'stringLength', 
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
          { id: 'value', dataType: 'string', color: '#F48FB1' }
        ],
        outputs: [
          { id: 'length', dataType: 'number', color: '#64B5F6' }
        ],
        data: { 
          values: {
            value: ''
          },
          code: 
`const val = inputs.value;
outputs.length = val.length;
return;`
        }
      } 
    },

    { 
      type: 'anyToString', 
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
          { id: 'value', dataType: 'any', color: '#B0BEC5' },
          { id: 'pretty', dataType: 'boolean', color: '#E57373', defaultValue: true }
        ],
        outputs: [
          { id: 'result', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          values: {
            value: '',
            pretty: true
          },
          code: 
`const val = inputs.value;
const isPretty = inputs.pretty;

const formatted = typeof val === 'object' ? JSON.stringify(val, null, isPretty ? 2 : 0) : String(val);

outputs.result = formatted;
return;`
        }
      } 
    }
  ]
};