import { Dices } from 'lucide-vue-next';

export const BlueprintRandom = {
  id: 'random_operations',
  label: 'Random Operations',
  color: '#FF5722',
  icon: Dices,
  items: [
    {
      type: 'random_smart',
      label: 'Random Number',
      description: 'Generates a random number. Outputs an integer if inputs are integers, or a float if inputs are decimals.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Random Number',
          headerColor: '#FF5722',
          category: 'Random Operations'
        },
        inputs: [
          { id: 'min', label: 'Min', dataType: 'number', color: '#64B5F6', defaultValue: 1 },
          { id: 'max', label: 'Max', dataType: 'number', color: '#64B5F6', defaultValue: 10 }
        ],
        outputs: [
          { id: 'result', label: 'Number', dataType: 'number', color: '#64B5F6' }
        ],
        data: {
          values: { min: 1, max: 10 },
          code: 
`const min = Number(inputs['Min'] ?? inputs['min'] ?? 1);
const max = Number(inputs['Max'] ?? inputs['max'] ?? 10);

let res = 0;
if (Number.isInteger(min) && Number.isInteger(max)) {
  res = Math.floor(Math.random() * (max - min + 1)) + min;
} else {
  res = Math.random() * (max - min) + min;
}

outputs['Number'] = res;
outputs['result'] = res;
return;`
        }
      }
    },
    {
      type: 'random_boolean',
      label: 'Random Boolean',
      description: 'Generates a random true or false value (50:50 chance).',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Random Bool',
          headerColor: '#FF5722',
          category: 'Random Operations'
        },
        inputs: [],
        outputs: [
          { id: 'result', label: 'Boolean', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          code: 
`const res = Math.random() < 0.5;
outputs['Boolean'] = res;
outputs['result'] = res;
return;`
        }
      }
    },
    {
      type: 'random_from_list',
      label: 'List Get Random',
      description: 'Retrieves a single random item from within the provided List or Array.',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Random From List',
          headerColor: '#FF5722',
          category: 'Random Operations'
        },
        inputs: [
          { id: 'list', label: 'List', dataType: 'list', color: '#4DD0E1' }
        ],
        outputs: [
          { id: 'item', label: 'Item', dataType: 'any', color: '#B0BEC5' }
        ],
        data: {
          code: 
`const list = inputs['List'] ?? inputs['list'];
const item = Array.isArray(list) && list.length > 0 
  ? list[Math.floor(Math.random() * list.length)] 
  : null;

outputs['Item'] = item;
outputs['item'] = item;
return;`
        }
      }
    },
    {
      type: 'random_chance',
      label: 'Random Chance',
      description: 'Outputs true (Success) or false (Failure) based on a specified probability percentage (0 - 100).',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Random Chance',
          headerColor: '#FF5722',
          category: 'Random Operations'
        },
        inputs: [
          { id: 'chance', label: 'Chance (%)', dataType: 'number', color: '#64B5F6', defaultValue: 25 }
        ],
        outputs: [
          { id: 'result', label: 'Boolean', dataType: 'boolean', color: '#E57373' }
        ],
        data: {
          values: { chance: 25 },
          code: 
`const chance = Number(inputs['Chance (%)'] ?? inputs['chance'] ?? 25);
const res = (Math.random() * 100) < chance;

outputs['Boolean'] = res;
outputs['result'] = res;
return;`
        }
      }
    },
    {
      type: 'random_color',
      label: 'Random Color',
      description: 'Generates a random color formatted as a Hex string (e.g., #A3F10C).',
      dynamicMode: 'none',
      defaultData: {
        settings: {
          headerTitle: 'Random Color',
          headerColor: '#FF5722',
          category: 'Random Operations'
        },
        inputs: [],
        outputs: [
          { id: 'color', label: 'Color (Hex)', dataType: 'string', color: '#F48FB1' }
        ],
        data: {
          code: 
`const hexColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
outputs['Color (Hex)'] = hexColor;
outputs['color'] = hexColor;
return;`
        }
      }
    }
  ]
};